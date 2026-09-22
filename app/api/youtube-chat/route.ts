import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { videoId, messages } = body;

        if (!videoId) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        // Fetch transcript
        let transcriptItems;
        try {
            transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        } catch (error) {
            console.error('Error fetching transcript:', error);
            return NextResponse.json({ error: 'Could not fetch subtitles for this video. Make sure it has closed captions.' }, { status: 400 });
        }

        const fullTranscript = transcriptItems.map(item => item.text).join(' ');

        // Truncate to avoid blowing up Groq's free tier token limits (e.g. max 6000 TPM)
        const truncatedTranscript = fullTranscript.length > 15000 ? fullTranscript.substring(0, 15000) + '...' : fullTranscript;

        const systemPrompt = `You are an AI assistant specialized in analyzing a specific YouTube video. 
You will be provided with the transcript (or a large portion) of the video. Use this transcript to answer the user's questions.
If the answer is not in the transcript, acknowledge that the video doesn't provide enough information, but you can try to infer based on general knowledge if helpful.

Video Transcript:
${truncatedTranscript}
`;

        const formattedMessages = messages.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : msg.role, // Translate 'model' to 'assistant' for OpenAI schema
            content: msg.content,
        }));

        // Ignore leading assistant messages to ensure valid conversational start if necessary, 
        // though standard OpenAI supports starting anywhere, we will leave it as is or omit leading assistant.
        let history = formattedMessages;
        while (history.length > 0 && history[0].role === 'assistant') {
            history.shift();
        }

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...history
        ];

        const apiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Groq API key is missing' }, { status: 500 });
        }

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
         body: JSON.stringify({
    model: 'openai/gpt-oss-20b',
    messages: apiMessages,
    temperature: 0.7,
}),
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error('Groq Error:', errorText);
            return NextResponse.json({ error: 'Error generating content from Groq: ' + errorText }, { status: 500 });
        }

        const data = await groqResponse.json();
        const text = data.choices[0]?.message?.content || '';

        return NextResponse.json({ reply: text });
    } catch (error: any) {
        console.error('Error in youtube-chat api:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

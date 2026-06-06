export const AI_PROMPTS = {
  generateSyllabus: (topic: string) => `
You are an expert curriculum designer. Generate a structured, comprehensive curriculum for: "${topic}".
Output a JSON object matching this structure:
{
  "title": "Course Title",
  "description": "Short summary of what this course covers",
  "chapters": [
    {
      "title": "Chapter Title",
      "topics": [
        {
          "title": "Topic Title",
          "videoQuery": "Specific search query to find a tutorial on YouTube"
        }
      ]
    }
  ]
}
Provide exactly 3-4 chapters, with 2-3 topics per chapter. Make sure the video queries are highly targeted (e.g. "React Native Navigation tutorial crash course").
Return ONLY the raw JSON output.
`,
  generateTopicContent: (topicTitle: string, courseTitle: string) => `
You are a senior technical instructor teaching a course on "${courseTitle}".
Create an in-depth, engaging, and premium markdown tutorial page for the topic: "${topicTitle}".
Provide clear code blocks if applicable, subheadings, bullet points, and key takeaways.
Return ONLY raw Markdown without wrapping it in a json object.
`,
  generateQuiz: (topicTitle: string) => `
Generate 3-5 multiple-choice questions for the topic: "${topicTitle}".
Output a JSON array matching this structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Detailed explanation of why the correct option is right and the others are wrong."
  }
]
Return ONLY raw JSON.
`,
};

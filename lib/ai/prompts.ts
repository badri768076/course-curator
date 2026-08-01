// lib/ai/prompts.ts

export const COURSE_GENERATION_PROMPT = `
You are an expert curriculum designer and educator with 20+ years of experience. Generate a comprehensive, well-structured course outline for the following topic.

IMPORTANT: Each course must be UNIQUE and SPECIFIC to the given topic. Do NOT use generic templates. Customize all content based on the actual topic.

Return ONLY valid JSON in this exact structure, no markdown, no additional text:
{
  "course": {
    "title": "string - engaging, descriptive course title specific to the topic",
    "description": "string - 2-3 sentence course overview that hooks learners, specific to the topic",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedHours": number - total estimated hours to complete,
    "chapters": [
      {
        "title": "string - clear chapter title specific to the topic",
        "description": "string - brief chapter overview specific to the topic",
        "topics": [
          {
            "title": "string - specific, actionable topic title that includes the main topic name",
            "description": "string - 2-3 sentence topic description specific to this topic",
            "videoQuery": "string - specific YouTube search query for this topic (e.g., 'machine learning basics tutorial')",
            "estimatedDuration": number - estimated minutes for this topic,
            "prerequisites": ["string"] - prerequisite topics if any
          }
        ]
      }
    ]
  }
}

Guidelines:
- Generate 3-6 chapters depending on topic complexity
- Each chapter should have 2-5 topics
- Topics MUST be specific to the given topic - include the topic name in titles where appropriate
- videoQuery MUST be a specific search phrase that will find good educational content on YouTube
- Ensure logical progression from fundamentals to advanced concepts
- Total course should take 3-8 hours to complete
- Make titles engaging but clear
- Include practical applications specific to the topic
- AVOID generic topics like "Introduction" - make them topic-specific like "Introduction to React Hooks"
- Customize chapter titles to reflect the actual subject matter
`;

export function buildCoursePrompt(
  topic: string, 
  options?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: number;
    additionalInstructions?: string;
  }
): string {
  let prompt = COURSE_GENERATION_PROMPT;
  
  let instructions = `\n\nTopic: ${topic}`;
  
  if (options?.difficulty) {
    instructions += `\nDifficulty Level: ${options.difficulty}`;
  }
  
  if (options?.duration) {
    instructions += `\nTarget Duration: ${options.duration} hours`;
  }
  
  if (options?.additionalInstructions) {
    instructions += `\nAdditional Requirements: ${options.additionalInstructions}`;
  }
  
  instructions += `\n\nRemember: Return ONLY valid JSON, no markdown, no additional text.`;
  
  return prompt + instructions;
}
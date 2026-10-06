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
- Generate 5-8 distinct, progressive chapters spanning fundamentals, core mechanics, real-world implementations, edge cases, advanced optimization, and deployment
- Each chapter MUST contain 3-5 unique, focused topics (aim for 15-25 total topics across the entire course)
- Topics MUST be specific and granular to the given topic (e.g. 'Backpropagation Calculus in Neural Networks', not just 'Math')
- videoQuery MUST be a uniquely targeted YouTube search phrase for that exact topic (e.g., 'backpropagation calculus neural networks 3blue1brown tutorial')
- Ensure logical progression from absolute beginner fundamentals to advanced production patterns
- Total course should represent 8-20 hours of comprehensive learning
- AVOID shallow or generic chapters; make every module deep, practical, and highly engaging
- Customize chapter titles and topic titles to reflect the true depth of the subject matter
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
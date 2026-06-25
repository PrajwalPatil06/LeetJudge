import { BaseAnalyzerStrategy } from './base.strategy.js';
import logger from '../../../utils/logger.js';

export class GeminiAnalyzerStrategy extends BaseAnalyzerStrategy {
    async analyze(code, problem, verdict) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment variables");
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `
You are an expert programming judge and code reviewer.
I have a submission for a problem. I need you to analyze the code and return a review.

Problem Title: ${problem.title}
Problem Description: 
${problem.description}

User Code:
\`\`\`
${code}
\`\`\`

Submission Verdict: ${verdict}

Analyze the user's code and provide:
1. Time Complexity (e.g. O(N), O(N^2))
2. Space Complexity (e.g. O(1), O(N))
3. Review: 
   - If the verdict is ACCEPTED (or similar), provide a short review of the code (is it optimal? is there a better approach?).
   - If the verdict is WRONG_ANSWER, TIME_LIMIT_EXCEEDED, or similar, provide a short review explaining what is likely wrong or inefficient. Do not give the direct solution, just hints.

Respond strictly in valid JSON format with the following keys:
{
  "timeComplexity": "...",
  "spaceComplexity": "...",
  "review": "..."
}
`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                logger.error('GeminiStrategy', `Error from Gemini API: ${errText}`);
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!jsonText) {
                throw new Error("Unexpected response structure from Gemini");
            }
            
            return JSON.parse(jsonText);
            
        } catch (error) {
            logger.error('GeminiStrategy', `Failed to analyze code: ${error.message}`);
            throw error;
        }
    }
}

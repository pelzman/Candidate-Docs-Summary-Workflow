import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

import {
    CandidateSummaryInput,
    CandidateSummaryResult,
    SummarizationProvider,
} from './summarization-provider.interface';

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
    private readonly logger = new Logger(GeminiSummarizationProvider.name);
    private readonly ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

    }

    async generateCandidateSummary(
        input: CandidateSummaryInput,
    ): Promise<CandidateSummaryResult> {
        const docCount = input.documents.length;
        this.logger.log(`Generating summary for candidate ${input.candidateId} with ${docCount} documents.`);

        const combinedDocuments = input.documents
            .map((doc, index) => `--- Document ${index + 1} ---\n${doc}\n`)
            .join('\n');

        const prompt = `You are an expert HR recruiter assistant evaluating a candidate.
You are given the extracted text of the candidate's documents (e.g., resume, cover letter).

Your task is to analyze these documents and provide a structured JSON response evaluating the candidate. 

Candidate Documents:
${combinedDocuments}

Respond ONLY with valid JSON matching this schema:
{
  "score": number (0-100 overall rating based on the provided documents),
  "strengths": string[] (List of key strengths),
  "concerns": string[] (List of concerns or missing information),
  "summary": string (A concise 2-3 sentence summary of the candidate's profile),
  "recommendedDecision": string (Must be exactly one of: "advance", "hold", "reject")
}
`;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                },
            });

            const responseText = response.text;
            if (!responseText) {
                throw new Error('Empty response from Gemini API');
            }

            const result = JSON.parse(responseText);

            // Basic validation
            if (!['advance', 'hold', 'reject'].includes(result.recommendedDecision)) {
                result.recommendedDecision = 'hold'; // Fallback
            }

            return {
                score: typeof result.score === 'number' ? result.score : 0,
                strengths: Array.isArray(result.strengths) ? result.strengths : [],
                concerns: Array.isArray(result.concerns) ? result.concerns : [],
                summary: typeof result.summary === 'string' ? result.summary : 'No summary provided',
                recommendedDecision: result.recommendedDecision,
            };
        } catch (error: any) {
            this.logger.error(`Error generating summary from Gemini: ${error.message}`, error.stack);
            throw error;
        }
    }
}

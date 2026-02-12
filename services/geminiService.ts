
import { GoogleGenAI, Type } from "@google/genai";
import { Concept } from "../types";

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!API_KEY) {
    return null;
  }
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return _ai;
}

export async function generateQuizQuestions(concept: Concept) {
  const ai = getAI();
  if (!ai) {
    // Return fallback quiz questions when no API key is configured
    return [
      {
        question: `What is the core concept behind "${concept.title}"?`,
        options: [concept.description, "None of the above", "All of the above", "Not enough information"],
        correctAnswerIndex: 0,
        explanation: concept.description
      },
      {
        question: `"${concept.title}" belongs to which subject?`,
        options: [concept.subject, "Art", "Music", "Sports"],
        correctAnswerIndex: 0,
        explanation: `${concept.title} is a topic in ${concept.subject}.`
      },
      {
        question: `What is the difficulty level of "${concept.title}"?`,
        options: [concept.difficulty, "Impossible", "Trivial", "Unknown"],
        correctAnswerIndex: 0,
        explanation: `This concept is rated as ${concept.difficulty}.`
      }
    ];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 3 high-quality multiple choice questions to test the understanding of the following academic concept:
      Title: ${concept.title}
      Subject: ${concept.subject}
      Description: ${concept.description}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

export async function analyzeRetention(concepts: Concept[]) {
  const ai = getAI();
  if (!ai) {
    return "Consistent daily reviews are the key to building long-term memory structures. Focus on your weakest concepts first!";
  }

  const summary = concepts.map(c => `${c.title} (${c.retentionScore}%)`).join(", ");
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following academic concept retention scores and provide a brief (2-sentence) coaching insight for the student: ${summary}`,
  });

  return response.text || "Keep reviewing your concepts regularly to maintain retention!";
}


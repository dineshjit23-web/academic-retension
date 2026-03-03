
import { Concept } from "../types";

const API_BASE_URL = '/api';

export async function generateQuizQuestions(concept: Concept, token?: string | null) {
  const apiKey = localStorage.getItem('gemini_api_key');
  const authToken = token || localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/ai/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'x-gemini-api-key': apiKey }),
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify({ concept })
    });

    if (!response.ok) {
      throw new Error('Failed to generate quiz');
    }

    return await response.json();
  } catch (err) {
    console.error("AI Quiz error:", err);
    return [
      {
        question: `What is the core concept behind "${concept.title}"? (1 Mark)`,
        options: [concept.description, "None of the above", "All of the above", "Not enough information"],
        correctAnswerIndex: 0,
        explanation: concept.description
      },
    ];
  }
}

export async function analyzeRetention(concepts: Concept[], token?: string | null) {
  const apiKey = localStorage.getItem('gemini_api_key');
  const authToken = token || localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'x-gemini-api-key': apiKey }),
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify({ concepts })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze retention');
    }

    const data = await response.json();
    return data.insight;
  } catch (err) {
    console.error("AI Analysis error:", err);
    return "Consistent daily reviews are the key to building long-term memory structures. Focus on your weakest concepts first!";
  }
}

export async function generateFlashcard(concept: Concept, token?: string | null) {
  const apiKey = localStorage.getItem('gemini_api_key');
  const authToken = token || localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE_URL}/ai/flashcard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'x-gemini-api-key': apiKey }),
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify({ concept })
    });

    if (!response.ok) throw new Error('Failed to generate flashcard');
    return await response.json();
  } catch (err) {
    console.error("Flashcard error:", err);
    return {
      question: `What is ${concept.title}?`,
      answer: concept.description
    };
  }
}

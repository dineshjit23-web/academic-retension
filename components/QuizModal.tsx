
import React, { useState, useEffect } from 'react';
import { Concept } from '../types';
import { generateQuizQuestions } from '../services/geminiService';

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizModalProps {
  concept: Concept;
  onClose: () => void;
  onComplete: (score: number) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ concept, onClose, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await generateQuizQuestions(concept);
        setQuestions(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [concept]);

  const handleNext = () => {
    if (selectedOption === questions[currentIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  const currentScorePct = Math.round(((score + (selectedOption === questions[currentIndex]?.correctAnswerIndex ? 1 : 0)) / questions.length) * 100);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold">Neural Core: Generating 10 Hard-Level Analysis Questions...</p>
          <p className="text-xs text-slate-400 mt-2">Targeting concept: {concept.title}</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Complete!</h2>
          <p className="text-slate-500 mb-6">You've successfully tested your retention for "{concept.title}".</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl mb-8 border border-slate-100 dark:border-slate-700">
            <span className="block text-4xl font-black text-indigo-600 mb-1">{currentScorePct}%</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Retention Score Update</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => onComplete(Math.max(0, currentScorePct - 20))}
              className="flex flex-col items-center p-4 rounded-xl border-2 border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all"
            >
              <span className="text-lg mb-1">😫</span>
              <span className="text-[10px] font-bold uppercase">Hard</span>
            </button>
            <button
              onClick={() => onComplete(currentScorePct)}
              className="flex flex-col items-center p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
            >
              <span className="text-lg mb-1">😐</span>
              <span className="text-[10px] font-bold uppercase">Good</span>
            </button>
            <button
              onClick={() => onComplete(Math.min(100, currentScorePct + 10))}
              className="flex flex-col items-center p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
            >
              <span className="text-lg mb-1">😎</span>
              <span className="text-[10px] font-bold uppercase">Easy</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Choose how you felt about this review</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border border-white/10">
        <div className="h-2 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                Hard Mode
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-8">{currentQ.question}</h3>

          <div className="space-y-3 mb-8">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                disabled={showExplanation}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${selectedOption === idx
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-300'
                  : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  } ${showExplanation && idx === currentQ.correctAnswerIndex ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''} ${showExplanation && selectedOption === idx && idx !== currentQ.correctAnswerIndex ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : ''}`}
              >
                <span className="font-bold">{option}</span>
                {showExplanation && idx === currentQ.correctAnswerIndex && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-8 animate-fadeIn border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Explanation</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          <div className="flex gap-4">
            {!showExplanation ? (
              <button
                disabled={selectedOption === null}
                onClick={() => setShowExplanation(true)}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;

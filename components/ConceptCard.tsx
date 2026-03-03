
import React, { useState } from 'react';
import { Concept, Difficulty } from '../types';
import { generateFlashcard } from '../services/geminiService';

interface ConceptCardProps {
  concept: Concept;
  onReview: (concept: Concept) => void;
  onDelete: (id: string) => void;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, onReview, onDelete }) => {
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [flashcard, setFlashcard] = useState<{ question: string, answer: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlashcardClick = async () => {
    if (!flashcard) {
      setIsGenerating(true);
      const data = await generateFlashcard(concept);
      setFlashcard(data);
      setIsGenerating(false);
    }
    setShowFlashcard(true);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Mastered': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: 'check-circle' };
      case 'Reviewing': return { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: 'refresh' };
      case 'Fading': return { color: 'bg-amber-50 text-amber-700 border-amber-100', icon: 'exclamation' };
      case 'New': return { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: 'plus' };
      default: return { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: 'plus' };
    }
  };

  const getMasteryColor = (mastery?: string) => {
    switch (mastery) {
      case 'Advanced': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'Intermediate': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'Beginner': return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
      default: return 'text-slate-400 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  const status = getStatusInfo(concept.status);

  return (
    <div className="relative group bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Flashcard Overlay */}
      {showFlashcard && (
        <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-sm p-6 flex flex-col justify-center animate-fadeIn">
          <button
            onClick={() => { setShowFlashcard(false); setIsFlipped(false); }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >✕</button>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer h-48 flex flex-col items-center justify-center text-center p-4"
          >
            {!isFlipped ? (
              <div className="animate-enter-up">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-2 block">Question</span>
                <p className="text-lg font-bold text-white mb-4 leading-tight">{flashcard?.question}</p>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Click to reveal answer</span>
              </div>
            ) : (
              <div className="animate-enter-up">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 mb-2 block">Answer</span>
                <p className="text-base font-medium text-slate-200">{flashcard?.answer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-[0.1em] px-2 py-1 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg w-fit">{concept.subject}</span>
          {concept.mastery && (
            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md w-fit ${getMasteryColor(concept.mastery)}`}>
              {concept.mastery} Level
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
            {concept.status}
          </span>
          {concept.retentionScore < 50 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase animate-pulse">
              <i className="fa-solid fa-triangle-exclamation"></i>
              Weak Concept
            </span>
          )}
        </div>
      </div>

      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={handleFlashcardClick}
          className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
          title="Quick Flashcard"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(concept.id); }}
          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{concept.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-2 h-10">{concept.description}</p>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Retention Rate</span>
            <span className={`text-sm font-extrabold ${concept.retentionScore > 75 ? 'text-emerald-500' : concept.retentionScore > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
              {concept.retentionScore}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-50 dark:bg-slate-700 rounded-full overflow-hidden p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${concept.retentionScore > 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                concept.retentionScore > 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                  'bg-gradient-to-r from-rose-400 to-rose-500'
                }`}
              style={{ width: `${concept.retentionScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-700">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-300 dark:text-slate-500 uppercase font-black tracking-tighter">Next Cycle</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{concept.nextReviewDate}</span>
        </div>
        <button
          onClick={() => onReview(concept)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white text-xs font-bold rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-lg transition-all duration-300"
        >
          Review
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ConceptCard;

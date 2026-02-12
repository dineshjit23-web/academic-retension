
import React from 'react';
import { Concept, Difficulty } from '../types';

interface ConceptCardProps {
  concept: Concept;
  onReview: (concept: Concept) => void;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, onReview }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Mastered': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: 'check-circle' };
      case 'Reviewing': return { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: 'refresh' };
      case 'Fading': return { color: 'bg-amber-50 text-amber-700 border-amber-100', icon: 'exclamation' };
      case 'New': return { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: 'plus' };
      default: return { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: 'plus' };
    }
  };

  const status = getStatusInfo(concept.status);

  return (
    <div className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-[0.1em] px-2 py-1 bg-indigo-50/50 rounded-lg">{concept.subject}</span>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
          {concept.status}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{concept.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2 h-10">{concept.description}</p>
      
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Retention Rate</span>
            <span className={`text-sm font-extrabold ${concept.retentionScore > 75 ? 'text-emerald-500' : concept.retentionScore > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
              {concept.retentionScore}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden p-[1px]">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                concept.retentionScore > 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 
                concept.retentionScore > 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                'bg-gradient-to-r from-rose-400 to-rose-500'
              }`} 
              style={{ width: `${concept.retentionScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-50">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-300 uppercase font-black tracking-tighter">Next Cycle</span>
          <span className="text-sm font-bold text-slate-700">{concept.nextReviewDate}</span>
        </div>
        <button 
          onClick={() => onReview(concept)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300"
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

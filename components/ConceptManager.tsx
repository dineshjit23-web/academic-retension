import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { SUBJECTS } from '../constants';

interface Question {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

interface Concept {
    id: string;
    title: string;
    description: string;
    subject: string;
    difficulty: Difficulty;
    is_official?: number;
}

interface ConceptManagerProps {
    token: string;
}

const ConceptManager: React.FC<ConceptManagerProps> = ({ token }) => {
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showQuestions, setShowQuestions] = useState(false);
    const [manualQuestions, setManualQuestions] = useState<Question[]>(Array(5).fill({
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        explanation: ''
    }));

    const fetchConcepts = async () => {
        try {
            const resp = await fetch('/api/official-concepts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            setConcepts(data);
        } catch (err) {
            console.error('Failed to fetch official concepts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConcepts(); }, []);

    const handleAddConcept = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            id: Date.now().toString(),
            title: formData.get('title') as string,
            subject: formData.get('subject') as string,
            description: formData.get('description') as string,
            difficulty: formData.get('difficulty') as Difficulty,
            questions: showQuestions ? manualQuestions.filter(q => q.question.trim() !== '') : []
        };

        try {
            const resp = await fetch('/api/official-concepts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (resp.ok) {
                fetchConcepts();
                setIsAdding(false);
                setShowQuestions(false);
            }
        } catch (err) {
            console.error('Failed to add concept', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanent deletion of this conceptual node?')) return;
        try {
            const resp = await fetch(`/api/official-concepts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) fetchConcepts();
        } catch (err) {
            console.error('Failed to delete concept', err);
        }
    };

    if (loading) return <div className="p-10 text-slate-500 font-bold animate-pulse">Scanning Concept Repository...</div>;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">Concept <span className="text-indigo-500">Repository</span></h3>
                    <p className="text-xs font-bold text-slate-400">Manage official curriculum nodes and assessment logic</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                    Initialize New Node
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {concepts.map(c => (
                    <div key={c.id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:border-indigo-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-lg mb-2 inline-block">
                                    {c.subject}
                                </span>
                                <h4 className="text-lg font-black text-white">{c.title}</h4>
                            </div>
                            <button
                                onClick={() => handleDelete(c.id)}
                                className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-slate-400 mb-6 line-clamp-2">{c.description}</p>
                        <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${c.difficulty === Difficulty.HARD ? 'bg-rose-500/10 text-rose-500' :
                                    c.difficulty === Difficulty.MEDIUM ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                {c.difficulty} Complexity
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
                    <div className="bg-[#0f172a] border border-white/10 rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-fadeIn">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Node <span className="text-indigo-500">Initialization</span></h3>
                                <button onClick={() => setIsAdding(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleAddConcept} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Core Identity (Title)</label>
                                        <input
                                            name="title"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white font-bold transition-all"
                                            placeholder="e.g. Advanced Thermodynamics"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Domain (Subject)</label>
                                            <select name="subject" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white font-bold appearance-none cursor-pointer leading-tight">
                                                {SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Intensity (Difficulty)</label>
                                            <select name="difficulty" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white font-bold appearance-none cursor-pointer leading-tight">
                                                <option value={Difficulty.EASY} className="bg-slate-900">Beginner</option>
                                                <option value={Difficulty.MEDIUM} className="bg-slate-900">Intermediate</option>
                                                <option value={Difficulty.HARD} className="bg-slate-900">Advanced</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Conceptual Blueprint (Description)</label>
                                        <textarea
                                            name="description"
                                            required
                                            rows={4}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white font-bold transition-all"
                                            placeholder="Define the core logic and scope of this node..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuestions(!showQuestions)}
                                        className={`w-full py-4 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-3 ${showQuestions ? 'border-rose-500/50 bg-rose-500/10 text-rose-500' : 'border-white/5 bg-white/5 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-400'
                                            }`}
                                    >
                                        {showQuestions ? 'Discard Assessment Logic' : 'Inject Assessment Logic (Questions)'}
                                    </button>
                                </div>

                                {showQuestions && (
                                    <div className="space-y-6 pt-6">
                                        {manualQuestions.map((q, idx) => (
                                            <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase">Assessment Node {idx + 1}</p>
                                                <input
                                                    placeholder="The query..."
                                                    className="w-full bg-transparent border-b border-white/10 py-2 outline-none text-white font-bold"
                                                    value={q.question}
                                                    onChange={(e) => {
                                                        const newQ = [...manualQuestions];
                                                        newQ[idx].question = e.target.value;
                                                        setManualQuestions(newQ);
                                                    }}
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    {q.options.map((opt, oIdx) => (
                                                        <input
                                                            key={oIdx}
                                                            placeholder={`Option ${oIdx + 1}`}
                                                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newQ = [...manualQuestions];
                                                                newQ[idx].options[oIdx] = e.target.value;
                                                                setManualQuestions(newQ);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Valid Index</label>
                                                        <select
                                                            value={q.correctAnswerIndex}
                                                            onChange={(e) => {
                                                                const newQ = [...manualQuestions];
                                                                newQ[idx].correctAnswerIndex = parseInt(e.target.value);
                                                                setManualQuestions(newQ);
                                                            }}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none"
                                                        >
                                                            {[0, 1, 2, 3].map(i => <option key={i} value={i} className="bg-slate-900">Index {i + 1}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex-[2]">
                                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Correction Logic (Explanation)</label>
                                                        <input
                                                            placeholder="Why?"
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                                            value={q.explanation}
                                                            onChange={(e) => {
                                                                const newQ = [...manualQuestions];
                                                                newQ[idx].explanation = e.target.value;
                                                                setManualQuestions(newQ);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                                    Finalize Node Deployment
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConceptManager;

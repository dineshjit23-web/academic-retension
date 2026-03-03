import React, { useState, useEffect } from 'react';

interface Recommendation {
    id: string;
    title: string;
    subject: string;
    retentionScore: number;
    reason?: string;
}

interface StudyPlan {
    urgentRevision: Recommendation[];
    recommendedPractice: Recommendation[];
    summary: string;
}

interface AdaptiveStudyPlanProps {
    token: string;
    onStartReview: (conceptId: string) => void;
}

const AdaptiveStudyPlan: React.FC<AdaptiveStudyPlanProps> = ({ token, onStartReview }) => {
    const [plan, setPlan] = useState<StudyPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const resp = await fetch('/api/adaptive/study-plan', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setPlan(data);
                }
            } catch (err) {
                console.error("Failed to fetch study plan", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [token]);

    if (loading) {
        return (
            <div className="animate-pulse bg-white/5 border border-white/10 rounded-[2.5rem] p-8 h-64 flex items-center justify-center">
                <div className="text-slate-500 font-bold">Scanning cognitive map...</div>
            </div>
        );
    }

    if (!plan || (plan.urgentRevision.length === 0 && plan.recommendedPractice.length === 0)) {
        return (
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 rounded-[2.5rem] p-10 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-white mb-2">Neural Link Optimal</h3>
                <p className="text-slate-400">All concepts are within retention thresholds. Keep up the high-intensity recall!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Summary Header */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Adaptive Guidance</h3>
                    <p className="text-2xl font-black text-white leading-tight">{plan.summary}</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-[80px]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Urgent Revision */}
                {plan.urgentRevision.length > 0 && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <h4 className="text-lg font-bold text-white uppercase tracking-tight">Critical Decay</h4>
                        </div>
                        <div className="space-y-4">
                            {plan.urgentRevision.map(item => (
                                <div key={item.id} className="group p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-rose-400 uppercase">{item.subject}</span>
                                            <span className="text-[10px] font-bold text-slate-500">• {item.reason}</span>
                                        </div>
                                        <h5 className="font-bold text-white group-hover:text-rose-400 transition-colors">{item.title}</h5>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-xs font-mono text-rose-500 font-bold">{item.retentionScore}%</div>
                                        <button
                                            onClick={() => onStartReview(item.id)}
                                            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all active:scale-95 shadow-lg shadow-rose-900/20"
                                        >
                                            Recall Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommended Practice */}
                {plan.recommendedPractice.length > 0 && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <i className="fa-solid fa-brain"></i>
                            </div>
                            <h4 className="text-lg font-bold text-white uppercase tracking-tight">Optimization Nodes</h4>
                        </div>
                        <div className="space-y-4">
                            {plan.recommendedPractice.map(item => (
                                <div key={item.id} className="group p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase">{item.subject}</span>
                                            <span className="text-[10px] font-bold text-slate-500">• Reinforce Mastery</span>
                                        </div>
                                        <h5 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{item.title}</h5>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-xs font-mono text-indigo-500 font-bold">{item.retentionScore}%</div>
                                        <button
                                            onClick={() => onStartReview(item.id)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
                                        >
                                            Practice
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdaptiveStudyPlan;

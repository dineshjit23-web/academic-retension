import React, { useState, useEffect } from 'react';
import ConceptManager from './ConceptManager';
import ConceptPerformanceChart from './ConceptPerformanceChart';

interface Student {
    id: string;
    username: string;
    email: string;
}

interface FacultyHubProps {
    token: string;
}

const FacultyHub: React.FC<FacultyHubProps> = ({ token }) => {
    const [activeSection, setActiveSection] = useState<'students' | 'concepts'>('students');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [atRisk, setAtRisk] = useState<any[]>([]);
    const [conceptPerformance, setConceptPerformance] = useState<any[]>([]);

    const fetchStudents = async () => {
        try {
            const resp = await fetch('/api/faculty/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            setStudents(data);

            const riskResp = await fetch('/api/analytics/at-risk', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (riskResp.ok) {
                const riskData = await riskResp.json();
                setAtRisk(riskData);
            }
        } catch (err) {
            console.error('Failed to fetch students/analytics', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformance = async (userId: string) => {
        try {
            const resp = await fetch(`/api/performance/summary/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            setPerformance(data);
            setSelectedStudent(userId);
        } catch (err) {
            console.error('Failed to fetch performance', err);
        }
    };

    const fetchConceptPerformance = async () => {
        try {
            const resp = await fetch('/api/analytics/concepts/performance', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setConceptPerformance(data);
            }
        } catch (err) {
            console.error('Failed to fetch concept performance', err);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchConceptPerformance();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-xl font-bold text-slate-500 animate-pulse tracking-widest uppercase">Initializing Faculty Control Grid...</div>
        </div>
    );

    return (
        <div className="space-y-10 animate-fadeIn">
            {/* Header Navigation */}
            <div className="flex border-b border-white/5 pb-6 gap-8">
                <button
                    onClick={() => setActiveSection('students')}
                    className={`text-sm font-black uppercase tracking-[0.2em] transition-all pb-2 relative ${activeSection === 'students' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Student Roster
                    {activeSection === 'students' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveSection('concepts')}
                    className={`text-sm font-black uppercase tracking-[0.2em] transition-all pb-2 relative ${activeSection === 'concepts' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Concept Strategy
                    {activeSection === 'concepts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 rounded-full" />}
                </button>
            </div>

            {activeSection === 'students' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-black mb-6 uppercase tracking-wider">Operative <span className="text-indigo-500">Roster</span></h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {students.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => fetchPerformance(s.id)}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all ${selectedStudent === s.id
                                        ? 'bg-indigo-600 border-indigo-400 shadow-lg'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <p className="font-black">{s.username}</p>
                                    <p className="text-xs text-slate-400">{s.email}</p>
                                </button>
                            ))}
                        </div>

                        {atRisk.length > 0 && (
                            <div className="mt-10 p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20">
                                <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                    Predictive Risk Alert
                                </h4>
                                <div className="space-y-3">
                                    {atRisk.map(s => (
                                        <div key={s.id} className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold">{s.username}</p>
                                                <p className="text-[10px] text-rose-400">{s.riskLevel} Risk • {s.weakConcepts} Weak Nodes</p>
                                            </div>
                                            <span className="text-xs font-black text-rose-400">{s.avgRetention}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        {performance ? (
                            <div className="space-y-8 animate-fadeIn">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-wider">Neural <span className="text-indigo-500">Metrics</span></h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                        <p className="text-xs font-black text-slate-500 uppercase mb-1">Attendance Rate</p>
                                        <p className="text-4xl font-black">{Math.round(performance.attendanceRate)}%</p>
                                    </div>
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                        <p className="text-xs font-black text-slate-500 uppercase mb-1">Assignment Avg</p>
                                        <p className="text-4xl font-black">{Math.round(performance.assignmentAverage)}/100</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                                    <h4 className="font-black mb-4 uppercase text-sm text-indigo-400">Semester Trajectory</h4>
                                    <div className="space-y-4">
                                        {performance.semesterComparison.map((s: any) => (
                                            <div key={s.semester} className="flex items-center gap-4">
                                                <p className="text-xs font-bold w-24">{s.semester}</p>
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${s.avg_marks}%` }} />
                                                </div>
                                                <p className="text-xs font-black">{Math.round(s.avg_marks)}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 font-bold opacity-50 space-y-4 border-2 border-dashed border-white/5 rounded-[3rem] p-20">
                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                </svg>
                                <p className="text-center">Select a student node to scan metrics</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-12 animate-fadeIn">
                    <ConceptPerformanceChart data={conceptPerformance} />
                    <ConceptManager token={token} />
                </div>
            )}
        </div>
    );
};

export default FacultyHub;

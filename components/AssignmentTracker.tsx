
import React, { useState } from 'react';
import { Assignment } from '../types';

interface AssignmentTrackerProps {
    assignments: Assignment[];
    onAdd: (assignment: Partial<Assignment>) => void;
    onUpdate: (id: string, status: 'Submitted', marks: number) => void;
    isDarkMode: boolean;
}

const AssignmentTracker: React.FC<AssignmentTrackerProps> = ({ assignments, onAdd, onUpdate, isDarkMode }) => {
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} flex flex-col sm:flex-row items-center justify-between gap-6`}>
                <div>
                    <h3 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Assignment Vault</h3>
                    <p className="text-slate-400 font-medium">Track your academic projects and marks.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-extrabold flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                    New Assignment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {assignments.map(assignment => (
                    <div key={assignment.id} className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} relative overflow-hidden group`}>
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">{assignment.subject}</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${assignment.status === 'Submitted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {assignment.status}
                            </span>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">{assignment.title}</h4>
                        <p className="text-sm font-medium text-slate-400 mb-6">Due: {assignment.due_date}</p>

                        {assignment.status === 'Submitted' ? (
                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Marks Received</span>
                                <span className="text-2xl font-black text-emerald-500">{assignment.marks}/100</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    const marks = prompt('Enter marks obtained (0-100):');
                                    if (marks !== null) onUpdate(assignment.id, 'Submitted', parseInt(marks));
                                }}
                                className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-sm hover:scale-[1.02] transition-all active:scale-95"
                            >
                                Submit & Log Marks
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-xl w-full p-10 border border-white/5 animate-fadeIn">
                        <h3 className={`text-3xl font-black tracking-tight mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>New Project</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            onAdd({
                                title: formData.get('title') as string,
                                subject: formData.get('subject') as string,
                                due_date: formData.get('due_date') as string,
                                semester: 'Spring 2026'
                            });
                            setIsAdding(false);
                        }} className="space-y-6">
                            <input name="title" required placeholder="Assignment Title" className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none font-bold" />
                            <input name="subject" required placeholder="Subject (e.g. Physics)" className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none font-bold" />
                            <input name="due_date" type="date" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none font-bold" />
                            <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95">Register Assignment</button>
                            <button type="button" onClick={() => setIsAdding(false)} className="w-full py-4 text-slate-400 font-bold">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentTracker;

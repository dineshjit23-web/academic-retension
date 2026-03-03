
import React, { useState } from 'react';
import { Attendance } from '../types';

interface AttendanceTrackerProps {
    attendance: Attendance[];
    onAdd: (status: 'Present' | 'Absent') => void;
    isDarkMode: boolean;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ attendance, onAdd, isDarkMode }) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendance.find(a => a.date === today);

    const stats = {
        present: attendance.filter(a => a.status === 'Present').length,
        absent: attendance.filter(a => a.status === 'Absent').length,
        rate: attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100) : 0
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} flex flex-col sm:flex-row items-center justify-between gap-6`}>
                <div>
                    <h3 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Daily Attendance</h3>
                    <p className="text-slate-400 font-medium">Log your synaptic presence today.</p>
                </div>
                {!todayRecord ? (
                    <div className="flex gap-4">
                        <button
                            onClick={() => onAdd('Present')}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-extrabold flex items-center gap-3 hover:bg-emerald-700 shadow-lg shadow-emerald-200/20 transition-all active:scale-95"
                        >
                            Mark Present
                        </button>
                        <button
                            onClick={() => onAdd('Absent')}
                            className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-extrabold flex items-center gap-3 hover:bg-rose-700 shadow-lg shadow-rose-200/20 transition-all active:scale-95"
                        >
                            Mark Absent
                        </button>
                    </div>
                ) : (
                    <div className={`px-8 py-4 rounded-2xl font-black ${todayRecord.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        Today: {todayRecord.status}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Days Present', value: stats.present, color: 'text-emerald-500' },
                    { label: 'Days Absent', value: stats.absent, color: 'text-rose-500' },
                    { label: 'Presence Rate', value: `${stats.rate}%`, color: 'text-indigo-600' }
                ].map((stat, idx) => (
                    <div key={idx} className={`p-8 rounded-[2rem] border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                        <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className={`rounded-[2.5rem] border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                <table className="w-full text-left">
                    <thead className={isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}>
                        <tr>
                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Semester</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {attendance.slice().reverse().map(record => (
                            <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-8 py-5 font-bold text-slate-600 dark:text-slate-300">{record.date}</td>
                                <td className="px-8 py-5">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 font-medium text-slate-400">{record.semester}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceTracker;

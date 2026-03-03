import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient }) => (
    <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-6 group hover:shadow-lg transition-all duration-300">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:rotate-6 transition-transform`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
    </div>
);

export default StatCard;

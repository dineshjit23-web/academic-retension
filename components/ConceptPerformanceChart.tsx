import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConceptPerformance {
    title: string;
    avg_retention: number;
}

interface ConceptPerformanceChartProps {
    data: ConceptPerformance[];
}

const ConceptPerformanceChart: React.FC<ConceptPerformanceChartProps> = ({ data }) => {
    return (
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">Concept <span className="text-indigo-500">Mastery Heatmap</span></h3>
                        <p className="text-xs font-bold text-slate-400">Average retention across the student population</p>
                    </div>
                </div>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff10" />
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis
                                dataKey="title"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={120}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderRadius: '16px',
                                    border: '1px solid #ffffff10',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    color: '#fff'
                                }}
                            />
                            <Bar dataKey="avg_retention" radius={[0, 10, 10, 0]} barSize={20}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.avg_retention > 80 ? '#10b981' : entry.avg_retention > 50 ? '#6366f1' : '#f43f5e'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {/* Decorative background pulse */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        </div>
    );
};

export default ConceptPerformanceChart;

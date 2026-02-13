
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import { Concept, Difficulty } from './types';
import { INITIAL_CONCEPTS, SUBJECTS } from './constants';
import ConceptCard from './components/ConceptCard';
import QuizModal from './components/QuizModal';
import { analyzeRetention } from './services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  // Persistence logic
  const [concepts, setConcepts] = useState<Concept[]>(() => {
    const saved = localStorage.getItem('concepts');
    return saved ? JSON.parse(saved) : INITIAL_CONCEPTS;
  });

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [reviewingConcept, setReviewingConcept] = useState<Concept | null>(null);
  const [insight, setInsight] = useState<string>('Crunching the numbers on your learning journey...');
  const [isAddingConcept, setIsAddingConcept] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('concepts', JSON.stringify(concepts));
  }, [concepts]);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    // Optional: Store username if needed
    localStorage.setItem('username', username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    setIsSettingsOpen(false); // Close settings on logout
  };

  // Stats calculation
  const stats = useMemo(() => {
    const avg = concepts.reduce((acc, c) => acc + c.retentionScore, 0) / concepts.length;
    return {
      total: concepts.length,
      avgRetention: Math.round(avg),
      dueToday: concepts.filter(c => new Date(c.nextReviewDate) <= new Date()).length,
      streak: 7
    };
  }, [concepts]);

  useEffect(() => {
    if (!isLoggedIn) return; // Don't fetch insights if not logged in

    const fetchInsight = async () => {
      try {
        const text = await analyzeRetention(concepts);
        setInsight(text);
      } catch (err) {
        setInsight("Consistent daily reviews are the key to building long-term memory structures. Focus on Biology today!");
      }
    };
    fetchInsight();
  }, [concepts.length, isLoggedIn]);

  const handleReviewComplete = (score: number) => {
    if (!reviewingConcept) return;

    const updatedConcepts = concepts.map(c => {
      if (c.id === reviewingConcept.id) {
        const newScore = Math.min(100, Math.round((c.retentionScore + score) / 2));
        const today = new Date();
        const nextDate = new Date();
        const interval = score > 80 ? 14 : score > 50 ? 7 : 2;
        nextDate.setDate(today.getDate() + interval);

        return {
          ...c,
          retentionScore: newScore,
          lastReviewed: today.toISOString().split('T')[0],
          nextReviewDate: nextDate.toISOString().split('T')[0],
          status: newScore > 80 ? 'Mastered' : 'Reviewing' as any,
          reviews: [...c.reviews, { id: Date.now().toString(), date: today.toISOString().split('T')[0], score, timeSpent: 10 }]
        };
      }
      return c;
    });

    setConcepts(updatedConcepts);
    setReviewingConcept(null);
  };

  const handleAddConcept = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newConcept: Concept = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
      difficulty: formData.get('difficulty') as Difficulty,
      lastReviewed: '-',
      nextReviewDate: new Date().toISOString().split('T')[0],
      retentionScore: 0,
      reviews: [],
      status: 'New'
    };
    setConcepts([...concepts, newConcept]);
    setIsAddingConcept(false);
  };

  const handleDeleteConcept = (id: string) => {
    if (confirm('Are you sure you want to delete this concept?')) {
      setConcepts(concepts.filter(c => c.id !== id));
    }
  };

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let dayScore = 0;
      let count = 0;

      concepts.forEach(c => {
        const reviewsOnDate = c.reviews.filter(r => r.date === dateStr);
        if (reviewsOnDate.length > 0) {
          const avgForConcept = reviewsOnDate.reduce((acc, r) => acc + r.score, 0) / reviewsOnDate.length;
          dayScore += avgForConcept;
          count++;
        }
      });

      data.push({
        name: i === 0 ? 'Today' : days[date.getDay()],
        score: count > 0 ? Math.round(dayScore / count) : 0
      });
    }
    return data;
  }, [concepts]);

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onSettingsClick={() => setIsSettingsOpen(true)}>
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Concepts Active" value={stats.total} icon="📚" gradient="from-indigo-500 to-indigo-600" />
            <StatCard label="Avg Retention" value={`${stats.avgRetention}%`} icon="🧠" gradient="from-emerald-500 to-teal-600" />
            <StatCard label="Tasks Due" value={stats.dueToday} icon="⏰" gradient="from-rose-500 to-pink-600" />
            <StatCard label="Daily Streak" value={stats.streak} icon="🔥" gradient="from-amber-500 to-orange-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Knowledge Growth</h3>
                  <p className="text-sm font-medium text-slate-400">Memory retention trend for the last week</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-slate-500">Active Retention</span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  <span className="font-black tracking-widest uppercase text-[10px] text-indigo-400">Smart Analysis</span>
                </div>
                <h4 className="text-2xl font-bold mb-4 leading-tight">Advisor Insight</h4>
                <p className="text-base text-slate-300 mb-8 leading-relaxed font-medium">
                  "{insight}"
                </p>
                <div className="mt-auto">
                  <button
                    onClick={() => setActiveTab('concepts')}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-500 transition-all shadow-[0_10px_20px_rgba(79,70,229,0.3)] active:scale-95"
                  >
                    Optimize My Study Path
                  </button>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
              <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-purple-500/10 rounded-full blur-[60px]" />
            </div>
          </div>

          {/* Critical Concepts List */}
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Need Attention</h3>
                <p className="text-sm font-medium text-slate-400">Concepts with retention dropping below 80%</p>
              </div>
              <button
                onClick={() => setActiveTab('concepts')}
                className="text-indigo-600 text-sm font-bold hover:underline"
              >
                View All Concepts
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {concepts
                .filter(c => c.retentionScore < 80)
                .sort((a, b) => a.retentionScore - b.retentionScore)
                .slice(0, 3)
                .map(concept => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    onReview={setReviewingConcept}
                    onDelete={handleDeleteConcept}
                  />
                ))
              }
            </div>
          </div>
        </div>
      )}

      {activeTab === 'concepts' && (
        <div className="animate-fadeIn space-y-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Knowledge Base</h3>
              <p className="text-slate-400 font-medium">Your personal digital textbook organized for recall.</p>
            </div>
            <button
              onClick={() => setIsAddingConcept(true)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-extrabold flex items-center gap-3 hover:bg-indigo-700 shadow-[0_10px_30px_rgba(99,102,241,0.25)] transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              New Concept
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {concepts.map(concept => (
              <ConceptCard
                key={concept.id}
                concept={concept}
                onReview={setReviewingConcept}
                onDelete={handleDeleteConcept}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="animate-fadeIn space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-extrabold mb-8 tracking-tight">Cognitive Load Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={concepts.reduce((acc: any[], c) => {
                    const existing = acc.find(item => item.subject === c.subject);
                    if (existing) existing.count += 1;
                    else acc.push({ subject: c.subject, count: 1 });
                    return acc;
                  }, [])}>
                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc', radius: 12 }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                    />
                    <Bar dataKey="count" radius={[12, 12, 12, 12]} barSize={40}>
                      {concepts.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-extrabold mb-8 tracking-tight">Mastery Leaderboard</h3>
              <div className="space-y-8 max-h-80 overflow-y-auto custom-scrollbar pr-4">
                {concepts.sort((a, b) => b.retentionScore - a.retentionScore).map((c, idx) => (
                  <div key={c.id} className="group">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-300 w-4">0{idx + 1}</span>
                        <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{c.title}</span>
                      </div>
                      <span className="text-sm font-black text-indigo-600">{c.retentionScore}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-in-out"
                        style={{ width: `${c.retentionScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {reviewingConcept && (
        <QuizModal
          concept={reviewingConcept}
          onClose={() => setReviewingConcept(null)}
          onComplete={handleReviewComplete}
        />
      )}

      {isAddingConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden animate-fadeIn">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Expand Library</h3>
                <button onClick={() => setIsAddingConcept(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddConcept} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Concept Name</label>
                  <input
                    name="title"
                    required
                    placeholder="e.g. Heapsort Algorithm"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                    <select name="subject" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold appearance-none">
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Complexity</label>
                    <select name="difficulty" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold appearance-none">
                      <option value={Difficulty.EASY}>Beginner</option>
                      <option value={Difficulty.MEDIUM}>Intermediate</option>
                      <option value={Difficulty.HARD}>Advanced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Knowledge Summary</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    placeholder="The core definition or logic of this concept..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold"
                  />
                </div>
                <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 mt-6 transition-all active:scale-95">
                  Register Concept
                </button>
              </form>
            </div>
          </div>
        </div>
      )}


      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Gemini API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API Key..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700"
                  />
                  <p className="text-xs text-slate-400 mt-3 font-medium">
                    Your key is stored locally in your browser. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-500 hover:underline">Google AI Studio</a>.
                  </p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 mb-4">
                  Save Settings
                </button>
                <button onClick={handleLogout} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 hover:text-red-500 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                  <i className="fa-solid fa-right-from-bracket group-hover:text-red-500 transition-colors"></i>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, value: string | number, icon: string, gradient: string }> = ({ label, value, icon, gradient }) => (
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

export default App;

import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import ConceptCard from './components/ConceptCard';
import QuizModal from './components/QuizModal';
import StatCard from './components/StatCard';
import KnowledgeChart from './components/KnowledgeChart';
import SearchFilter from './components/SearchFilter';
import AttendanceTracker from './components/AttendanceTracker';
import AssignmentTracker from './components/AssignmentTracker';
import { analyzeRetention } from './services/geminiService';
import { Concept, Difficulty, Attendance, Assignment } from './types';
import { SUBJECTS } from './constants';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminPanel from './components/AdminPanel';
import FacultyHub from './components/FacultyHub';
import AdaptiveStudyPlan from './components/AdaptiveStudyPlan';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ id: string, username: string, role: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [reviewingConcept, setReviewingConcept] = useState<Concept | null>(null);
  const [insight, setInsight] = useState<string>('Refining your knowledge roadmap...');
  const [isAddingConcept, setIsAddingConcept] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [showQuestionsForm, setShowQuestionsForm] = useState(false);
  const [manualQuestions, setManualQuestions] = useState(Array(10).fill({
    question: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: ''
  }));
  const [officialConcepts, setOfficialConcepts] = useState<Concept[]>([]);

  // Load user from localStorage on init
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setToken(savedToken);
      setIsLoggedIn(true);
      fetchConcepts(parsedUser.id, savedToken);
      fetchAttendance(parsedUser.id, savedToken);
      fetchAssignments(parsedUser.id, savedToken);
      fetchOfficialConcepts(savedToken);
    }
  }, []);

  const fetchConcepts = async (userId: string, authToken = token) => {
    if (!authToken) return;
    try {
      const response = await fetch(`/api/concepts/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend retention_score to retentionScore
        setConcepts(data.map((c: any) => ({
          ...c,
          retentionScore: c.retention_score,
          mastery: c.mastery,
          reviews: c.reviews.map((r: any) => ({ ...r, timeSpent: r.time_spent }))
        })));
      }
    } catch (err) {
      console.error("Failed to fetch concepts", err);
    }
  };

  const fetchAttendance = async (userId: string, authToken = token) => {
    if (!authToken) return;
    try {
      const response = await fetch(`/api/attendance/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    }
  };

  const fetchAssignments = async (userId: string, authToken = token) => {
    if (!authToken) return;
    try {
      const response = await fetch(`/api/assignments/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    }
  };

  const fetchOfficialConcepts = async (authToken = token) => {
    if (!authToken) return;
    try {
      const resp = await fetch('/api/official-concepts', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setOfficialConcepts(data);
      }
    } catch (err) {
      console.error('Failed to fetch official concepts', err);
    }
  };

  const handleLogin = (userData: any, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    fetchConcepts(userData.id, authToken);
    fetchAttendance(userData.id, authToken);
    fetchAssignments(userData.id, authToken);
    fetchOfficialConcepts(authToken);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    setConcepts([]);
    setAttendance([]);
    setAssignments([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsSettingsOpen(false);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = concepts.length;
    const avg = total > 0 ? concepts.reduce((acc, c) => acc + c.retentionScore, 0) / total : 0;
    const mastered = concepts.filter(c => c.retentionScore >= 80).length;
    const level = Math.min(10, Math.floor(mastered / 2) + Math.floor(avg / 20) + 1);
    const progressToNextLevel = (mastered % 2 === 0 ? (avg % 20) * 5 : 50 + (avg % 20) * 2.5);

    return {
      total,
      avgRetention: Math.round(avg),
      dueToday: concepts.filter(c => new Date(c.nextReviewDate) <= new Date()).length,
      streak: 7,
      level,
      levelProgress: Math.min(100, Math.round(progressToNextLevel))
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

  const handleReviewComplete = async (score: number) => {
    if (!reviewingConcept || !user) return;

    const today = new Date();
    const nextDate = new Date();
    const interval = score > 80 ? 14 : score > 50 ? 7 : 2;
    nextDate.setDate(today.getDate() + interval);
    const newRetentionScore = Math.min(100, Math.round((reviewingConcept.retentionScore + score) / 2));

    const reviewData = {
      id: Date.now().toString(),
      concept_id: reviewingConcept.id,
      date: today.toISOString().split('T')[0],
      score,
      timeSpent: 10
    };

    const updatedConcept = {
      retentionScore: newRetentionScore,
      lastReviewed: today.toISOString().split('T')[0],
      nextReviewDate: nextDate.toISOString().split('T')[0],
      status: newRetentionScore > 80 ? 'Mastered' : 'Reviewing' as any
    };

    try {
      await fetch(`/api/concepts/${reviewingConcept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConcept)
      });

      await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      fetchConcepts(user.id);
      setReviewingConcept(null);
    } catch (err) {
      console.error("Failed to update review", err);
    }
  };

  const handleAddConcept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const newConcept = {
      id: Date.now().toString(),
      user_id: user.id,
      title: formData.get('title') as string,
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
      difficulty: formData.get('difficulty') as Difficulty,
      lastReviewed: '-',
      nextReviewDate: new Date().toISOString().split('T')[0],
      retentionScore: 0,
      status: 'New'
    };

    const conceptData = {
      ...newConcept,
      questions: showQuestionsForm ? manualQuestions.filter(q => q.question.trim() !== '') : []
    };

    try {
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(conceptData)
      });
      if (response.ok) {
        fetchConcepts(user.id);
        setIsAddingConcept(false);
        setShowQuestionsForm(false);
        setManualQuestions(Array(10).fill({
          question: '',
          options: ['', '', '', ''],
          correctAnswerIndex: 0,
          explanation: ''
        }));
      }
    } catch (err) {
      console.error("Failed to add concept", err);
    }
  };

  const handleMarkAttendance = async (status: 'Present' | 'Absent') => {
    if (!user) return;
    const record: Attendance = {
      id: Date.now().toString(),
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      status,
      semester: 'Spring 2026'
    };
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(record)
      });
      if (response.ok) {
        setAttendance([...attendance, record]);
      }
    } catch (err) {
      console.error('Mark attendance error:', err);
    }
  };

  const handleAddAssignment = async (assignment: Partial<Assignment>) => {
    if (!user) return;
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      user_id: user.id,
      title: assignment.title || '',
      subject: assignment.subject || '',
      due_date: assignment.due_date || '',
      status: 'Pending',
      semester: assignment.semester || 'Spring 2026'
    };
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAssignment)
      });
      if (response.ok) {
        setAssignments([...assignments, newAssignment]);
      }
    } catch (err) {
      console.error('Add assignment error:', err);
    }
  };

  const handleUpdateAssignment = async (id: string, status: 'Submitted', marks: number) => {
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, marks })
      });
      if (response.ok) {
        setAssignments(assignments.map(a => a.id === id ? { ...a, status, marks } : a));
      }
    } catch (err) {
      console.error('Update assignment error:', err);
    }
  };

  const handleDeleteConcept = async (id: string) => {
    if (confirm('Are you sure you want to delete this concept?')) {
      try {
        const response = await fetch(`/api/concepts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok && user) {
          fetchConcepts(user.id);
        }
      } catch (err) {
        console.error("Failed to delete concept", err);
      }
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

  const filteredConcepts = useMemo(() => {
    return concepts.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'All Subjects' || c.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [concepts, searchQuery, selectedSubject]);

  const adoptConcept = async (concept: Concept) => {
    if (!user) return;
    const newConcept = {
      ...concept,
      id: Date.now().toString(),
      user_id: user.id,
      is_official: 0,
      status: 'New',
      retentionScore: 0,
      lastReviewed: '-',
      nextReviewDate: new Date().toISOString().split('T')[0],
      reviews: []
    };

    try {
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newConcept)
      });
      if (response.ok) {
        fetchConcepts(user.id);
      }
    } catch (err) {
      console.error("Failed to adopt concept", err);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onSettingsClick={() => setIsSettingsOpen(true)}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      username={user?.username || 'Scholar'}
      level={stats.level}
      levelProgress={stats.levelProgress}
    >
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
            <KnowledgeChart data={chartData} />

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

          {/* Adaptive Study Plan */}
          <AdaptiveStudyPlan
            token={token!}
            onStartReview={(conceptId) => {
              const concept = concepts.find(c => c.id === conceptId);
              if (concept) setReviewingConcept(concept);
            }}
          />

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-amber-400">🗺️</span> Mastery Roadmap
            </h3>
            <div className="space-y-4 relative z-10">
              {concepts.length > 0 ? (
                concepts.slice(0, 4).map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-4 group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${c.retentionScore > 80 ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      {c.retentionScore > 80 ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold group-hover:text-amber-400 transition-colors">{c.title}</div>
                      <div className={`text-[10px] uppercase tracking-wider font-black ${c.retentionScore > 80 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {c.retentionScore > 80 ? 'Mastered' : 'In Progress'}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-400">{c.retentionScore}%</div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm italic">Add concepts to generate your roadmap...</p>
              )}
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
          </div>
        </div>
      )}

      {activeTab === 'concepts' && (
        <div className="animate-fadeIn space-y-10">
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-[2rem] border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div>
              <h3 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Knowledge Base</h3>
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

          <SearchFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            subjects={SUBJECTS}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredConcepts.length > 0 ? (
              filteredConcepts.map(concept => (
                <ConceptCard
                  key={concept.id}
                  concept={concept}
                  onReview={setReviewingConcept}
                  onDelete={handleDeleteConcept}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="text-6xl mb-6">🔍</div>
                <h4 className="text-2xl font-bold text-slate-400 mb-2">No matching concepts found</h4>
                <p className="text-slate-500 font-medium">Try adjusting your search or subject filter.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedSubject('All Subjects'); }}
                  className="mt-8 px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Official Concepts Discovery */}
          {officialConcepts.length > 0 && (
            <div className="space-y-6 pt-10 border-t border-white/5">
              <h3 className="text-xl font-black text-indigo-400 uppercase tracking-widest">Official Curriculum Nodes</h3>
              <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
                {officialConcepts.filter(oc => !concepts.some(c => c.title === oc.title)).map(oc => (
                  <div key={oc.id} className="min-w-[300px] p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-3xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase">{oc.subject}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase">{oc.difficulty}</span>
                      </div>
                      <h4 className="font-bold text-lg mb-2 text-white">{oc.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">{oc.description}</p>
                    </div>
                    <button
                      onClick={() => adoptConcept(oc)}
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95"
                    >
                      Initialize Tracking
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
      }

      {
        activeTab === 'analytics' && (
          <div className="animate-fadeIn space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className={`text-xl font-extrabold mb-8 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Performance Overview</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Attendance Rate</span>
                    <span className="text-2xl font-black text-indigo-600">
                      {attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Assignment Avg</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {assignments.filter(a => a.marks !== undefined).length > 0
                        ? Math.round(assignments.filter(a => a.marks !== undefined).reduce((acc, a) => acc + (a.marks || 0), 0) / assignments.filter(a => a.marks !== undefined).length)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className={`text-xl font-extrabold mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Knowledge Analysis</h3>
                <div className="h-64">
                  <KnowledgeChart data={chartData} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm mt-10">
              <h3 className={`text-xl font-extrabold mb-8 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Scholar Achievements</h3>
              <div className="flex flex-wrap gap-8">
                {SUBJECTS.map(subject => {
                  const subjectConcepts = concepts.filter(c => c.subject === subject);
                  if (subjectConcepts.length === 0) return null;
                  const avg = subjectConcepts.reduce((acc, c) => acc + c.retentionScore, 0) / subjectConcepts.length;
                  const isMastered = avg >= 90;
                  const isCompetent = avg >= 70;

                  return (
                    <div key={subject} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all ${isMastered ? 'bg-indigo-50/50 border-indigo-200' : isCompetent ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 opacity-40 grayscale border-slate-200'}`}>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-inner ${isMastered ? 'bg-indigo-600 text-white' : isCompetent ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {subject === 'Physics' ? '⚛️' : subject === 'Biology' ? '🧬' : subject === 'Computer Science' ? '💻' : subject === 'Mathematics' ? '📐' : '📖'}
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-widest text-center ${isMastered ? 'text-indigo-600' : isCompetent ? 'text-emerald-600' : 'text-slate-400'}`}>{subject}</p>
                        <p className="text-[10px] font-bold text-slate-400 text-center uppercase">{isMastered ? 'Master' : isCompetent ? 'Scholar' : 'Novice'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      }

      {
        activeTab === 'performance' && (
          <div className="space-y-12 animate-fadeIn">
            <AttendanceTracker
              attendance={attendance}
              onAdd={handleMarkAttendance}
              isDarkMode={isDarkMode}
            />
            <AssignmentTracker
              assignments={assignments}
              onAdd={handleAddAssignment}
              onUpdate={handleUpdateAssignment}
              isDarkMode={isDarkMode}
            />
          </div>
        )
      }

      {
        activeTab === 'admin-panel' && user && user.role === 'admin' && (
          <AdminPanel token={token!} />
        )
      }

      {
        activeTab === 'faculty-hub' && user && (user.role === 'faculty' || user.role === 'admin') && (
          <FacultyHub token={token!} />
        )
      }

      {/* Modals */}
      {
        reviewingConcept && (
          <QuizModal
            concept={reviewingConcept}
            onClose={() => setReviewingConcept(null)}
            onComplete={handleReviewComplete}
          />
        )
      }

      {
        isAddingConcept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden animate-fadeIn border border-white/5">
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Expand Library</h3>
                  <button onClick={() => setIsAddingConcept(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
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
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                      <select name="subject" className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none font-bold appearance-none text-slate-700 dark:text-slate-200 cursor-pointer">
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Complexity</label>
                      <select name="difficulty" className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none font-bold appearance-none text-slate-700 dark:text-slate-200 cursor-pointer">
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
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setShowQuestionsForm(!showQuestionsForm)}
                      className={`w-full py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-bold ${showQuestionsForm ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-500 hover:text-indigo-600'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {showQuestionsForm ? 'Discard Custom Quiz' : 'Add 10 Custom Quiz Questions'}
                    </button>
                  </div>

                  {showQuestionsForm && (
                    <div className="space-y-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar border-t border-slate-100 dark:border-slate-800 pt-6">
                      <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">Quiz Architecture (10 Questions)</p>
                      {manualQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                          <p className="text-[10px] font-black uppercase text-slate-400">Node {qIdx + 1}</p>
                          <input
                            placeholder={`Question ${qIdx + 1}`}
                            className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-2 outline-none font-bold text-sm"
                            value={q.question}
                            onChange={(e) => {
                              const newQs = [...manualQuestions];
                              newQs[qIdx] = { ...q, question: e.target.value };
                              setManualQuestions(newQs);
                            }}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            {q.options.map((opt, oIdx) => (
                              <input
                                key={oIdx}
                                placeholder={`Option ${oIdx + 1}`}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                                value={opt}
                                onChange={(e) => {
                                  const newQs = [...manualQuestions];
                                  const newOpts = [...q.options];
                                  newOpts[oIdx] = e.target.value;
                                  newQs[qIdx] = { ...q, options: newOpts };
                                  setManualQuestions(newQs);
                                }}
                              />
                            ))}
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Correct Option</label>
                              <select
                                value={q.correctAnswerIndex}
                                onChange={(e) => {
                                  const newQs = [...manualQuestions];
                                  newQs[qIdx] = { ...q, correctAnswerIndex: parseInt(e.target.value) };
                                  setManualQuestions(newQs);
                                }}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                              >
                                {[0, 1, 2, 3].map(i => <option key={i} value={i}>Option {i + 1}</option>)}
                              </select>
                            </div>
                            <div className="flex-[2]">
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Explanation</label>
                              <input
                                placeholder="Why is this correct?"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs outline-none"
                                value={q.explanation}
                                onChange={(e) => {
                                  const newQs = [...manualQuestions];
                                  newQs[qIdx] = { ...q, explanation: e.target.value };
                                  setManualQuestions(newQs);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none mt-6 transition-all active:scale-95">
                    Register Concept
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {
        isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn border border-white/5">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Settings</h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
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
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700 dark:text-slate-200"
                    />
                    <p className="text-xs text-slate-400 mt-3 font-medium">
                      Your key is stored locally in your browser. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-500 hover:underline">Google AI Studio</a>.
                    </p>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 mb-4">
                    Save Settings
                  </button>
                  <button onClick={handleLogout} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                    <i className="fa-solid fa-right-from-bracket group-hover:text-red-500 transition-colors"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </Layout >
  );
};

export default App;

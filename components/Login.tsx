import React, { useState } from 'react';

interface LoginProps {
    onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for realistic feel
        setTimeout(() => {
            if (!username || !password) {
                setError('Please enter both username and password.');
                setLoading(false);
                return;
            }

            // Mock authentication - accept any non-empty credentials for demo
            onLogin(username);
            setLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#f8fafc]">
            {/* Dynamic Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 p-10 animate-fadeIn">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <i className="fa-solid fa-graduation-cap text-2xl text-white"></i>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-slate-500 font-medium">ConceptRetain Academic Monitor</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Username</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <i className="fa-regular fa-user"></i>
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Password</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <i className="fa-regular fa-lock"></i>
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 animate-fadeIn">
                                <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                                <p className="text-sm font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <i className="fa-solid fa-arrow-right"></i>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center space-y-4">
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Demo Credentials</p>
                            <div className="flex justify-center gap-4 text-sm font-bold text-indigo-900">
                                <span>User: <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-100">demo</span></span>
                                <span>Pass: <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-100">demo</span></span>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400">
                            By continuing, you verify that you are an authorized academic user.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

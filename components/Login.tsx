import React, { useState } from 'react';

interface LoginProps {
    onLogin: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin
            ? { username, password }
            : { username, email, password, role };

        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await resp.json();

            if (resp.ok) {
                if (isLogin) {
                    onLogin(data.user, data.token);
                } else {
                    setIsLogin(true);
                    setError('Registration successful! Please login.');
                }
            } else {
                setError(data.error || 'Connection unstable.');
            }
        } catch (err) {
            setError('Neural link failure.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const resp = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await resp.json();
            if (resp.ok) {
                setError(`Reset token: ${data.token} (Check console)`);
                setShowForgot(false);
                setResetToken(data.token);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Reset request failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const resp = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, newPassword })
            });
            if (resp.ok) {
                setError('Password reset successful! Logging in...');
                setResetToken('');
                setIsLogin(true);
            } else {
                const data = await resp.json();
                setError(data.error);
            }
        } catch (err) {
            setError('Password reset failed.');
        } finally {
            setLoading(false);
        }
    };

    if (resetToken) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#020617] text-white font-['Outfit']">
                <div className="w-full max-w-md p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
                    <h2 className="text-4xl font-black mb-6 tracking-tight">Reset <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Security</span></h2>
                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">New Synaptic Key</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <button className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/20">Update Key</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex bg-[#020617] text-white font-['Outfit'] overflow-hidden">
            {/* Visual Section - Left Side on Desktop */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110" style={{ backgroundImage: "url('/login-bg.png')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-[#020617]/20 to-transparent"></div>

                <div className="relative z-10 p-20 flex flex-col justify-end h-full max-w-2xl">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/40 border border-white/20">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a10.003 10.003 0 00-4.082-9.13l-.088-.054" />
                        </svg>
                    </div>
                    <h1 className="text-7xl font-black leading-[1.1] tracking-tighter mb-6">
                        Master the <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Digital Frontier</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg mb-10">
                        ConceptRetain empowers scholars with neural-enhanced retention monitoring and adaptive learning paths.
                    </p>

                    <div className="flex gap-8 items-center border-t border-white/10 pt-10">
                        <div>
                            <div className="text-3xl font-black text-white">98%</div>
                            <div className="text-xs font-black uppercase tracking-widest text-indigo-400">Retention Rate</div>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div>
                            <div className="text-3xl font-black text-white">12k+</div>
                            <div className="text-xs font-black uppercase tracking-widest text-indigo-400">Scholars Active</div>
                        </div>
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-20 right-20 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-40 right-40 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            {/* Form Section - Right Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
                {/* Mobile Background Elements */}
                <div className="absolute inset-0 lg:hidden pointer-events-none opacity-30">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 blur-[120px] rounded-full" />
                </div>

                <div className="w-full max-w-md relative z-10">
                    <div className="mb-12">
                        <div className="lg:hidden w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a10.003 10.003 0 00-4.082-9.13l-.088-.054" />
                            </svg>
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter mb-3">
                            {showForgot ? 'Recall Key' : isLogin ? 'Neural Link' : 'Register Signature'}
                        </h2>
                        <p className="text-slate-400 text-lg font-medium">
                            {showForgot ? 'Reset your credential link' : isLogin ? 'Access your academic vault' : 'Create a new synaptic profile'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm font-bold flex items-center gap-3 animate-fadeIn">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            {error}
                        </div>
                    )}

                    {showForgot ? (
                        <form onSubmit={handleForgot} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">Signature Email</label>
                                <input
                                    type="email"
                                    placeholder="operative@nexus.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                    required
                                />
                            </div>
                            <button className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/20">Send Recall Link</button>
                            <button type="button" onClick={() => setShowForgot(false)} className="w-full text-slate-500 font-bold hover:text-white transition-colors">Abort Access</button>
                        </form>
                    ) : (
                        <form onSubmit={handleAuth} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">Operative Name</label>
                                <input
                                    type="text"
                                    placeholder="Codename..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all border-b-2"
                                    required
                                />
                            </div>

                            {!isLogin && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">Signature Email</label>
                                        <input
                                            type="email"
                                            placeholder="operative@nexus.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">Access Tier</label>
                                        <div className="relative">
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="student">Student Representative</option>
                                                <option value="faculty">Academic Faculty</option>
                                                <option value="admin">System Administrator</option>
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Synaptic Password</label>
                                    {isLogin && (
                                        <button type="button" onClick={() => setShowForgot(true)} className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 hover:text-slate-300 transition-colors">
                                            Key Lost?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                    required
                                />
                            </div>

                            <button
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl font-black text-xl shadow-2xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 overflow-hidden relative group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <span className="relative z-10">
                                    {loading ? 'Processing...' : isLogin ? 'Initialize Link' : 'Create Profile'}
                                </span>
                            </button>

                            <div className="text-center mt-10">
                                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-slate-400 font-bold hover:text-white transition-all">
                                    {isLogin ? (
                                        <>Don't have a profile? <span className="text-indigo-400">Join the Registry</span></>
                                    ) : (
                                        <>Already registered? <span className="text-indigo-400">Sync Now</span></>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Subtle footer */}
                <div className="absolute bottom-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                    Neural Compliance System v4.0.2
                </div>
            </div>
        </div>
    );
};

export default Login;


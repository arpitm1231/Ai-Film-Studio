import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Clapperboard, Mail, Lock, ArrowRight, Film, Sparkles, Video, Music, BarChart3 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = isLogin ? await signIn(email, password) : await signUp(email, password);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  const features = [
    { icon: Film, title: 'AI Screenplay', desc: 'GPT-4o writes your script' },
    { icon: Video, title: 'Scene Visuals', desc: 'Stability AI storyboards' },
    { icon: Music, title: 'Voice & Score', desc: 'ElevenLabs narration' },
    { icon: BarChart3, title: 'Analytics', desc: 'Budget & market prediction' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col lg:flex-row film-grain scan-lines relative">
      {/* Left panel - Cinematic branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-10 xl:p-14">
        {/* Deep cinema background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#020617] to-[#0a0f1e]" />

        {/* Projector beam effect */}
        <div className="absolute inset-0 projector-beam" />

        {/* Film strip borders on left and right */}
        <div className="absolute left-0 top-0 bottom-0 w-[28px] border-r border-amber-500/[0.06] z-10"
          style={{
            background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(245,158,11,0.04) 6px, rgba(245,158,11,0.04) 10px, transparent 10px, transparent 20px)`,
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-[28px] border-l border-amber-500/[0.06] z-10"
          style={{
            background: `repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(245,158,11,0.04) 6px, rgba(245,158,11,0.04) 10px, transparent 10px, transparent 20px)`,
          }}
        />

        {/* Ambient light leaks */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[120px] animate-projector" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-amber-600/[0.03] rounded-full blur-[100px]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-cyan-500/[0.02] rounded-full blur-[80px]" />

        {/* Top content - Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-glow">
              <Clapperboard className="w-7 h-7 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AI Film Studio</h1>
              <p className="text-[11px] text-amber-400/60 uppercase tracking-[0.2em] font-medium">Production Pipeline</p>
            </div>
          </div>
        </div>

        {/* Center content - Hero */}
        <div className="relative z-10 space-y-8 pl-2">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-gradient-to-r from-amber-500/40 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400/50 font-medium">Now Showing</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight">
              Transform ideas<br />
              into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                cinema
              </span>
            </h2>
            <p className="text-slate-400/80 mt-5 text-base leading-relaxed max-w-md">
              The complete AI-powered film production pipeline. From story concept to finished trailer, all in one platform.
            </p>
          </div>

          {/* Feature grid - styled like film frames */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="cinema-card lens-flare p-4 hover:border-amber-500/20 transition-all duration-300 group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="relative z-10">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-colors">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom - Tech credits */}
        <div className="relative z-10 pl-2">
          <div className="clapperboard-divider" />
          <div className="flex items-center gap-2 text-[10px] text-slate-600 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-500/40" />
            <span>Powered by GPT-4o / Stability AI / ElevenLabs</span>
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12 relative">
        {/* Mobile background effects */}
        <div className="lg:hidden fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/[0.04] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 mb-3 shadow-lg shadow-amber-500/20 animate-glow">
              <Clapperboard className="w-7 h-7 text-slate-900" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Film Studio</h1>
            <p className="text-slate-400 text-sm mt-1">Transform stories into cinema</p>
          </div>

          {/* Form card - cinema styled */}
          <div className="cinema-card lens-flare p-6 sm:p-8">
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-white mb-1">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                {isLogin ? 'Sign in to continue your production' : 'Start your AI film production journey'}
              </p>

              {/* Tab switcher - styled like film format selector */}
              <div className="flex mb-6 bg-slate-800/50 rounded-lg p-1 border border-slate-700/30">
                <button
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isLogin ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    !isLogin ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 animate-scale-in">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Mobile features hint */}
          <div className="lg:hidden mt-6 grid grid-cols-2 gap-2">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-center gap-2 cinema-card px-3 py-2">
                  <Icon className="w-3.5 h-3.5 text-amber-400/60" />
                  <span className="text-[11px] text-slate-500">{f.title}</span>
                </div>
              );
            })}
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-6 uppercase tracking-wider">
            AI-powered film production
          </p>
        </div>
      </div>
    </div>
  );
}

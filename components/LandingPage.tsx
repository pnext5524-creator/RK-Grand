
import React, { useState } from 'react';
import { LogIn, ShieldCheck, Factory, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, users }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      const user = users.find(u => u.login === login && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Неверный логин или пароль. Попробуйте admin / admin');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen mesh-gradient-bg flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Organic Pulsating Decorative Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-mesh-blob"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-mesh-blob [animation-delay:2s]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Branding */}
        <div className="text-white space-y-8 animate-in slide-in-from-left-10 duration-1000">
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-xl">
            <Factory className="text-blue-400" size={24} />
            <span className="text-sm font-black tracking-[0.2em] uppercase text-blue-100">RK-GRAND ECOSYSTEM</span>
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-black leading-[1.1] tracking-tighter">
            Цифровое <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 animate-pulse-slow">будущее</span> <br />
            завода
          </h1>
          
          <p className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium">
            Централизованная интеллектуальная платформа ООО «РК-ГРАНД». Синергия промышленного опыта и передовых ИТ-решений.
          </p>

          <div className="flex flex-wrap gap-4 pt-6">
             <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default group">
               <ShieldCheck className="text-emerald-400 group-hover:scale-110 transition-transform" size={20} />
               <span className="text-xs font-black uppercase tracking-widest text-slate-200">Безопасность SSL</span>
             </div>
             <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default group">
               <ShieldCheck className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
               <span className="text-xs font-black uppercase tracking-widest text-slate-200">Gemini Pro AI</span>
             </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="flex justify-center lg:justify-end animate-in slide-in-from-right-10 duration-1000">
          <div className="bg-white rounded-[48px] shadow-2xl p-12 w-full max-w-md border border-slate-200 relative overflow-hidden">
            {/* Subtle card internal decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full opacity-50"></div>
            
            <div className="relative z-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Вход в систему</h2>
                <p className="text-slate-500 font-medium">Введите учетные данные для доступа к модулям предприятия</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Идентификатор</label>
                  <input 
                    type="text" 
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-800 font-bold"
                    placeholder="admin"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Пароль доступа</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-800 font-bold"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-rose-50 text-rose-600 p-5 rounded-2xl text-sm font-bold border border-rose-100 animate-in shake duration-300">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-[24px] font-black text-lg shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      Авторизоваться
                      <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-sm font-medium">
                  Техническая поддержка: <br />
                  <span className="text-blue-600 font-black cursor-pointer hover:underline uppercase tracking-widest text-[11px] mt-1 block">it-support@rk-grand.ru</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-10 text-slate-500 text-[10px] tracking-[0.3em] font-black uppercase text-center opacity-50">
        Управление ресурсами предприятия ООО «РК-ГРАНД»
      </div>
    </div>
  );
};

export default LandingPage;


import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { ModuleType, User } from '../types';
import { X } from 'lucide-react';

interface SidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  currentUser: User;
  onLogout: () => void;
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onModuleChange, currentUser, onLogout, isOpen }) => {
  const visibleItems = NAVIGATION_ITEMS.filter(item => {
    if (item.adminOnly && currentUser.role !== 'ADMIN') return false;
    if (currentUser.role === 'ADMIN') return true;
    return currentUser.permissions[item.type as ModuleType];
  });

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 dark:border-slate-900 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-xl shadow-blue-900/40 shrink-0">РК</div>
            <div>
              <div className="font-black text-white tracking-tight text-base sm:text-lg uppercase">РК-ГРАНД</div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-600">EcoSystem v1.2</div>
            </div>
          </div>
          <button onClick={onLogout} className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors">
            {/* The close button is usually handled by the overlay in App.tsx, but having it here doesn't hurt */}
          </button>
        </div>

        <nav className="space-y-1 sm:space-y-1.5 flex-1">
          {visibleItems.map((item) => (
            <button
              key={item.type}
              onClick={() => onModuleChange(item.type)}
              className={`w-full flex items-center gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 group ${
                activeModule === item.type
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40'
                  : 'hover:bg-slate-800 dark:hover:bg-slate-900/50 hover:text-white'
              }`}
            >
              <div className={`transition-transform duration-300 group-hover:scale-110 ${activeModule === item.type ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>
                {item.icon}
              </div>
              <span className="font-bold text-xs sm:text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 space-y-4 sm:space-y-6">
          <div className="bg-slate-800/40 dark:bg-slate-900/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 dark:border-slate-900 shadow-inner">
            <div className="text-[8px] sm:text-[9px] uppercase font-black text-slate-600 mb-2 sm:mb-3 tracking-widest">Авторизован</div>
            <div className="text-xs sm:text-sm font-black text-white truncate tracking-tight">{currentUser.fullName}</div>
            <div className="flex items-center gap-2 mt-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <div className="text-[8px] sm:text-[9px] text-blue-400 font-black uppercase tracking-widest">{currentUser.role === 'ADMIN' ? 'Администратор' : 'Сотрудник'}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-3 sm:py-4 bg-slate-800 hover:bg-rose-900/40 hover:text-rose-400 text-slate-500 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 sm:gap-3 border border-slate-700/50 dark:border-slate-800"
          >
            Завершить сеанс
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

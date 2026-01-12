
import React from 'react';
import { Users, HardHat, TrendingUp, AlertTriangle, ArrowUpRight, ChevronRight } from 'lucide-react';
import { INITIAL_CONTRACTORS } from '../constants';
import { ModuleType } from '../types';

interface DashboardModuleProps {
  onNavigate?: (module: ModuleType) => void;
}

const StatCard = ({ title, value, sub, icon, color, darkColor }: any) => (
  <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 sm:p-3 rounded-xl ${color} ${darkColor}`}>
        {icon}
      </div>
      <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">{title}</span>
    </div>
    <div className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white leading-tight">{value}</div>
    <div className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{sub}</div>
  </div>
);

const DashboardModule: React.FC<DashboardModuleProps> = ({ onNavigate }) => {
  // Sort contractors by progress descending and take top 5
  const topContractors = [...INITIAL_CONTRACTORS]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-1">Обзор предприятия</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Добро пожаловать в систему управления ООО "РК-ГРАНД"</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Персонал" 
          value="452" 
          sub="+3 в этом месяце" 
          icon={<Users className="text-blue-600 dark:text-blue-400" size={20} />} 
          color="bg-blue-50" 
          darkColor="dark:bg-blue-900/20"
        />
        <StatCard 
          title="Подрядчики" 
          value={INITIAL_CONTRACTORS.length.toString()} 
          sub="38 активных пропусков" 
          icon={<HardHat className="text-amber-600 dark:text-amber-400" size={20} />} 
          color="bg-amber-50" 
          darkColor="dark:bg-amber-900/20"
        />
        <StatCard 
          title="План" 
          value="94.2%" 
          sub="Цель: 96%" 
          icon={<TrendingUp className="text-green-600 dark:text-green-400" size={20} />} 
          color="bg-green-50" 
          darkColor="dark:bg-green-900/20"
        />
        <StatCard 
          title="Риски (AI)" 
          value="2" 
          sub="Критически" 
          icon={<AlertTriangle className="text-rose-600 dark:text-rose-400" size={20} />} 
          color="bg-rose-50" 
          darkColor="dark:bg-rose-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-4 sm:mt-8">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase">Топ-5 подрядчиков</h3>
            <button 
              onClick={() => onNavigate?.(ModuleType.ENGINEERING)}
              className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 transition-all group"
            >
              Смотреть всех <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="space-y-6">
            {topContractors.map((contractor, idx) => (
              <div 
                key={contractor.id} 
                className="group cursor-pointer"
                onClick={() => onNavigate?.(ModuleType.ENGINEERING)}
              >
                <div className="flex justify-between text-xs sm:text-sm font-black mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 dark:text-slate-700 font-mono italic">0{idx + 1}</span>
                    <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{contractor.name}</span>
                  </div>
                  <span className="text-slate-900 dark:text-white">{contractor.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${contractor.progress > 70 ? 'bg-emerald-500' : contractor.progress > 40 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                    style={{ width: `${contractor.progress}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-[9px] text-slate-400 dark:text-slate-600 uppercase font-bold tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">
                  Объект: {contractor.object}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mb-8 tracking-tight uppercase">Лента событий</h3>
          <div className="space-y-5">
             {[
              { text: 'Новый сотрудник: Петров И.С.', date: '10:45', type: 'HR' },
              { text: 'Подрядчик сдал 1 этап работ', date: '09:30', type: 'ENG' },
              { text: 'Пропуск А123ВС аннулирован', date: 'Вчера', type: 'SEC' },
              { text: 'Отчет по выпарной станции готов', date: 'Вчера', type: 'ENG' },
              { text: 'Сформирован табель за ноябрь', date: 'Пн', type: 'TIME' },
             ].map((e, idx) => (
               <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:translate-x-1 transition-transform">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    e.type === 'HR' ? 'bg-blue-400' : 
                    e.type === 'ENG' ? 'bg-emerald-400' : 
                    e.type === 'SEC' ? 'bg-amber-400' : 'bg-slate-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold leading-tight truncate">{e.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-600 tracking-widest">{e.date}</span>
                      <span className="text-[9px] uppercase font-black text-slate-200 dark:text-slate-800 px-1.5 bg-slate-100 dark:bg-slate-800 rounded">{e.type}</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;

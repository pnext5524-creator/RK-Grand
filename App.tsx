
import React, { useState, useEffect } from 'react';
import { NAVIGATION_ITEMS, INITIAL_TASKS, INITIAL_ADMIN } from './constants';
import { ModuleType, AppNotification, Task, User } from './types';
import DashboardModule from './components/DashboardModule';
import HRModule from './components/HRModule';
import EngineeringModule from './components/EngineeringModule';
import TimeTrackingModule from './components/TimeTrackingModule';
import TaskModule from './components/TaskModule';
import ChatModule from './components/ChatModule';
import AdminSettingsModule from './components/AdminSettingsModule';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import { Bell, X, Sun, Moon, Menu } from 'lucide-react';

const TEST_USERS: User[] = [
  INITIAL_ADMIN,
  {
    id: 'emp-001',
    login: 'director',
    password: '123',
    fullName: 'Малышев Константин Сергеевич',
    role: 'ADMIN',
    permissions: {
      [ModuleType.DASHBOARD]: true,
      [ModuleType.HR]: true,
      [ModuleType.ENGINEERING]: true,
      [ModuleType.TIME_TRACKING]: true,
      [ModuleType.TASKS]: true,
      [ModuleType.CHAT]: true,
    }
  },
  {
    id: 'emp-002',
    login: 'zam',
    password: '123',
    fullName: 'Морозов Артем Викторович',
    role: 'USER',
    permissions: {
      [ModuleType.DASHBOARD]: true,
      [ModuleType.HR]: true,
      [ModuleType.ENGINEERING]: true,
      [ModuleType.TIME_TRACKING]: true,
      [ModuleType.TASKS]: true,
      [ModuleType.CHAT]: true,
    }
  },
  {
    id: 'emp-003',
    login: 'engineer',
    password: '123',
    fullName: 'Волков Сергей Александрович',
    role: 'USER',
    permissions: {
      [ModuleType.DASHBOARD]: true,
      [ModuleType.HR]: false,
      [ModuleType.ENGINEERING]: true,
      [ModuleType.TIME_TRACKING]: true,
      [ModuleType.TASKS]: true,
      [ModuleType.CHAT]: true,
    }
  },
  {
    id: 'emp-004',
    login: 'energy',
    password: '123',
    fullName: 'Зайцев Николай Михайлович',
    role: 'USER',
    permissions: {
      [ModuleType.DASHBOARD]: true,
      [ModuleType.HR]: false,
      [ModuleType.ENGINEERING]: true,
      [ModuleType.TIME_TRACKING]: false,
      [ModuleType.TASKS]: true,
      [ModuleType.CHAT]: true,
    }
  },
  {
    id: 'emp-005',
    login: 'accountant',
    password: '123',
    fullName: 'Лебедева Елена Николаевна',
    role: 'USER',
    permissions: {
      [ModuleType.DASHBOARD]: true,
      [ModuleType.HR]: false,
      [ModuleType.ENGINEERING]: false,
      [ModuleType.TIME_TRACKING]: true,
      [ModuleType.TASKS]: false,
      [ModuleType.CHAT]: true,
    }
  }
];

const App: React.FC = () => {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(TEST_USERS);

  // UI State
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addNotification = (title: string, message: string, type: AppNotification['type']) => {
    const newNotify: AppNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotify, ...prev]);
  };

  useEffect(() => {
    if (!currentUser) return;
    
    const checkDeadlines = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      tasks.forEach(task => {
        if (task.status === 'DONE' || task.status === 'CANCELLED') return;
        
        const deadline = new Date(task.deadline);
        deadline.setHours(0, 0, 0, 0);
        
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (task.reminderEnabled && diffDays > 0 && diffDays <= 2) {
          addNotification(
            'Напоминание о сроке',
            `Задача "${task.title}" должна быть выполнена через ${diffDays} дн.`,
            'ALERT'
          );
        }
      });
    };

    checkDeadlines();
  }, [currentUser, tasks]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleTaskCreated = (task: Task, assigneeName: string) => {
    setTasks(prev => [task, ...prev]);
    addNotification(
      'Новая задача',
      `Сотруднику ${assigneeName} назначена задача: ${task.title}`,
      'TASK'
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveModule(ModuleType.DASHBOARD);
    setIsSidebarOpen(false);
  };

  const handleModuleChange = (module: ModuleType) => {
    setActiveModule(module);
    setIsSidebarOpen(false);
  };

  const renderModule = () => {
    if (!currentUser) return null;

    const hasPermission = currentUser.role === 'ADMIN' || currentUser.permissions[activeModule];
    
    if (!hasPermission) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 p-6">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
             <Bell className="text-slate-300 dark:text-slate-700" size={32} />
          </div>
          <h3 className="text-xl font-bold dark:text-slate-300">Доступ ограничен</h3>
          <p className="max-w-xs text-center dark:text-slate-500">У вас нет прав для просмотра этого модуля. Обратитесь к администратору.</p>
        </div>
      );
    }

    switch (activeModule) {
      case ModuleType.DASHBOARD:
        return <DashboardModule onNavigate={handleModuleChange} />;
      case ModuleType.HR:
        return <HRModule />;
      case ModuleType.ENGINEERING:
        return <EngineeringModule />;
      case ModuleType.TIME_TRACKING:
        return <TimeTrackingModule />;
      case ModuleType.TASKS:
        return <TaskModule 
          tasks={tasks}
          onTasksUpdate={setTasks}
          onTaskCreated={handleTaskCreated} 
        />;
      case ModuleType.CHAT:
        return <ChatModule 
          currentUser={currentUser} 
          onTaskCreate={handleTaskCreated}
        />;
      case ModuleType.ADMIN_SETTINGS:
        return <AdminSettingsModule 
          users={users} 
          setUsers={setUsers} 
          currentUser={currentUser}
        />;
      default:
        return <DashboardModule onNavigate={handleModuleChange} />;
    }
  };

  if (!currentUser) {
    return <LandingPage onLogin={setCurrentUser} users={users} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeModule={activeModule} 
        onModuleChange={handleModuleChange} 
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header className="h-16 lg:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 lg:hidden text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[120px] sm:max-w-none">РК-ГРАНД</h1>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <span className="hidden sm:block text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-widest truncate">
              {NAVIGATION_ITEMS.find(i => i.type === activeModule)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl lg:rounded-2xl transition-all"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 sm:p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl lg:rounded-2xl transition-all relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-80 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 translate-x-2 sm:translate-x-0">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <span className="font-bold text-slate-800 dark:text-white tracking-tight text-sm sm:text-base">Уведомления</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest"
                        >
                          Все
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 sm:max-h-96 overflow-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                          {notifications.map(n => (
                            <div key={n.id} className={`p-4 sm:p-5 transition-colors relative group ${n.isRead ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/20 dark:bg-blue-900/10'}`}>
                              <div className="flex justify-between mb-1.5">
                                <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${n.isRead ? 'text-slate-400 dark:text-slate-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-slate-300 dark:text-slate-600 font-bold">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-snug pr-4">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-600 font-bold">Уведомлений нет</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 border-l border-slate-100 dark:border-slate-800 pl-2 sm:pl-6 sm:ml-2">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-black border border-white dark:border-slate-700 shadow-lg">
                {currentUser.fullName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-10 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { User, ModuleType, UserPermissions } from '../types';
import { UserPlus, Trash2, X, Check, Lock, Shield, Key, User as UserIcon, Edit2, Eye, EyeOff, Mail, Phone, Briefcase, Save, AlertCircle } from 'lucide-react';

interface AdminSettingsModuleProps {
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User;
}

const AdminSettingsModule: React.FC<AdminSettingsModuleProps> = ({ users, setUsers, currentUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'USER'>('USER');
  const [formPerms, setFormPerms] = useState<UserPermissions>({
    [ModuleType.DASHBOARD]: true,
    [ModuleType.HR]: false,
    [ModuleType.ENGINEERING]: false,
    [ModuleType.TIME_TRACKING]: false,
    [ModuleType.TASKS]: false,
    [ModuleType.CHAT]: true,
  });

  // Populate form when editing starts
  useEffect(() => {
    if (editingUser) {
      setFormName(editingUser.fullName);
      setFormLogin(editingUser.login);
      setFormPassword(editingUser.password || '');
      setFormPosition(editingUser.position || '');
      setFormPhone(editingUser.phone || '');
      setFormEmail(editingUser.email || '');
      setFormRole(editingUser.role);
      setFormPerms(editingUser.permissions);
    } else {
      resetForm();
    }
  }, [editingUser]);

  const resetForm = () => {
    setFormName(''); 
    setFormLogin(''); 
    setFormPassword(''); 
    setFormPosition('');
    setFormPhone('');
    setFormEmail('');
    setFormRole('USER');
    setFormPerms({
      [ModuleType.DASHBOARD]: true,
      [ModuleType.HR]: false,
      [ModuleType.ENGINEERING]: false,
      [ModuleType.TIME_TRACKING]: false,
      [ModuleType.TASKS]: false,
      [ModuleType.CHAT]: true,
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLogin || !formPassword || !formName) return;

    const userData: User = { 
      id: editingUser ? editingUser.id : Date.now().toString(), 
      login: formLogin, 
      password: formPassword, 
      fullName: formName, 
      role: formRole, 
      permissions: { ...formPerms },
      position: formPosition,
      phone: formPhone,
      email: formEmail
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? userData : u));
      setEditingUser(null);
    } else {
      setUsers([...users, userData]);
      setIsAdding(false);
    }
    resetForm();
  };

  const togglePermission = (userId: string, module: ModuleType) => {
    setUsers(users.map(u => {
      if (u.id === userId && u.role !== 'ADMIN') {
        return { ...u, permissions: { ...u.permissions, [module]: !u.permissions[module] } };
      }
      return u;
    }));
  };

  const deleteUser = (id: string) => { 
    if (confirm('Удалить этого пользователя?')) setUsers(users.filter(u => u.id !== id)); 
  };

  const openAddModal = () => {
    setEditingUser(null);
    setIsAdding(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative z-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Управление доступом</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Просмотр учетных данных и настройка прав доступа</p>
        </div>
        <button 
          onClick={openAddModal} 
          className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-xl active:scale-95 z-20"
        >
          <UserPlus size={18} /> Добавить аккаунт
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-600 tracking-widest">
                <th className="px-10 py-6">Сотрудник</th>
                <th className="px-6 py-6">Учетные данные</th>
                <th className="px-6 py-6">Разрешения</th>
                <th className="px-10 py-6 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 font-black border border-white dark:border-slate-700 shadow-sm shrink-0">{user.fullName.charAt(0)}</div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-800 dark:text-white tracking-tight truncate">{user.fullName}</span>
                        <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter mt-1 ${user.role === 'ADMIN' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {user.role === 'ADMIN' ? 'АДМИНИСТРАТОР' : 'ПОЛЬЗОВАТЕЛЬ'}
                        </span>
                        {user.position && <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{user.position}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2"><Shield size={12} className="text-slate-400"/><span className="font-black text-blue-600 dark:text-blue-400">{user.login}</span></div>
                      <div className="flex items-center gap-2"><Key size={12} className="text-slate-400"/><span className="font-bold">{showPasswords[user.id] ? user.password : '••••••••'}</span><button onClick={() => setShowPasswords(p => ({...p, [user.id]: !p[user.id]}))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400">{showPasswords[user.id] ? <EyeOff size={10}/> : <Eye size={10}/>}</button></div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-1.5">
                      {[ModuleType.HR, ModuleType.ENGINEERING, ModuleType.TIME_TRACKING, ModuleType.TASKS, ModuleType.CHAT].map(mod => (
                        <button key={mod} disabled={user.role === 'ADMIN'} onClick={() => togglePermission(user.id, mod)} className={`px-2 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase transition-all border ${user.permissions[mod] ? 'bg-blue-600 text-white border-blue-500' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'} ${user.role === 'ADMIN' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>{mod.slice(0, 4)}</button>
                      ))}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingUser({ ...user })} className="p-2.5 text-slate-400 hover:text-blue-500 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl" title="Редактировать"><Edit2 size={18} /></button>
                      {user.id !== currentUser.id && user.role !== 'ADMIN' && (<button onClick={() => deleteUser(user.id)} className="p-2.5 text-slate-400 hover:text-rose-500 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl" title="Удалить"><Trash2 size={18} /></button>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(isAdding || editingUser) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3 text-slate-800 dark:text-white">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingUser ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                  {editingUser ? <Edit2 size={20} /> : <UserPlus size={20} />}
                </div>
                <h3 className="font-black text-xl tracking-tight">{editingUser ? 'Редактирование профиля' : 'Новый аккаунт'}</h3>
              </div>
              <button onClick={() => { setIsAdding(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-8">
                {/* Personal Info */}
                <section className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center gap-2">
                     <UserIcon size={14} /> Личные данные
                   </h4>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">ФИО Сотрудника</label>
                        <input required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20" placeholder="Иванов Иван Иванович" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Должность</label>
                            <div className="relative">
                              <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input value={formPosition} onChange={(e) => setFormPosition(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20" placeholder="Инженер ПТО" />
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Телефон</label>
                            <div className="relative">
                              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20" placeholder="+7 (999) 000-00-00" />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Email (Корпоративный)</label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20" placeholder="user@rk-grand.ru" />
                          </div>
                      </div>
                   </div>
                </section>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                {/* Auth Info */}
                <section className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center gap-2">
                     <Shield size={14} /> Учетные данные
                   </h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Логин</label>
                        <input required value={formLogin} onChange={(e) => setFormLogin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20" placeholder="ivanov" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Пароль</label>
                        <input required value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20" placeholder="••••••••" />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1">Роль в системе</label>
                        <div className="grid grid-cols-2 gap-3">
                           <button type="button" onClick={() => setFormRole('USER')} className={`py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${formRole === 'USER' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>Пользователь</button>
                           <button type="button" onClick={() => setFormRole('ADMIN')} className={`py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${formRole === 'ADMIN' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>Администратор</button>
                        </div>
                        {formRole === 'ADMIN' && (
                          <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                            <AlertCircle size={16} />
                            <span>Администратор имеет полный доступ ко всем модулям.</span>
                          </div>
                        )}
                   </div>
                </section>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                {/* Permissions */}
                {formRole !== 'ADMIN' && (
                  <section className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest flex items-center gap-2">
                       <Lock size={14} /> Права доступа
                     </h4>
                     <div className="grid grid-cols-2 gap-2">
                        {[ModuleType.HR, ModuleType.ENGINEERING, ModuleType.TIME_TRACKING, ModuleType.TASKS, ModuleType.CHAT, ModuleType.DASHBOARD].map(mod => (
                          <button key={mod} type="button" onClick={() => setFormPerms({ ...formPerms, [mod]: !formPerms[mod] })} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${formPerms[mod] ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formPerms[mod] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{formPerms[mod] && <Check size={12} strokeWidth={3} />}</div>
                            <span className="text-[10px] font-black uppercase tracking-wider">{mod}</span>
                          </button>
                        ))}
                      </div>
                  </section>
                )}
              </div>
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4 sticky bottom-0">
                <button type="button" onClick={() => { setIsAdding(false); setEditingUser(null); }} className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Отмена</button>
                <button type="submit" className="flex-2 py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 dark:shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2">
                  <Save size={16} /> Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsModule;


import React, { useState, useEffect } from 'react';
import { INITIAL_EMPLOYEES } from '../constants';
import { Employee, HistoryEvent } from '../types';
import { Plus, Search, Trash2, FileText, Award, AlertCircle, Users, X, Calendar, Edit3, Save, Phone, MapPin, Mail, Briefcase, Building, TrendingUp, Circle, PlusCircle, Download, AlertTriangle } from 'lucide-react';

const HRModule: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDeleteId, setEmployeeToDeleteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Validation States
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [newPhoneError, setNewPhoneError] = useState<string | null>(null);

  // Edit Employee State
  const [editForm, setEditForm] = useState<Partial<Employee>>({});

  // New Employee Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPos, setNewEmpPos] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Технический отдел');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDate, setNewEmpDate] = useState(new Date().toISOString().split('T')[0]);

  // New History Event State
  const [historyEventDate, setHistoryEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyEventType, setHistoryEventType] = useState<HistoryEvent['type']>('AWARD');
  const [historyEventDesc, setHistoryEventDesc] = useState('');

  useEffect(() => {
    if (selectedEmployee) {
      setEditForm({ ...selectedEmployee });
      setIsEditing(false);
      setPhoneError(null);
    }
  }, [selectedEmployee]);

  const validatePhone = (phone: string): boolean => {
    // Regex for +7 (XXX) XXX-XX-XX format
    const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
    return phoneRegex.test(phone);
  };

  // Simple auto-formatter for phone input
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    
    let formatted = '+7';
    if (digits.length > 1) {
      const part1 = digits.substring(1, 4);
      const part2 = digits.substring(4, 7);
      const part3 = digits.substring(7, 9);
      const part4 = digits.substring(9, 11);

      if (digits.length > 1) formatted += ` (${part1}`;
      if (digits.length > 4) formatted += `) ${part2}`;
      if (digits.length > 7) formatted += `-${part3}`;
      if (digits.length > 9) formatted += `-${part4}`;
    }
    return formatted;
  };

  const handleDeleteClick = (id: string) => {
    setEmployeeToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDeleteId) {
      const updated = employees.filter(e => e.id !== employeeToDeleteId);
      setEmployees(updated);
      if (selectedEmployee?.id === employeeToDeleteId) setSelectedEmployee(null);
      setIsDeleteModalOpen(false);
      setEmployeeToDeleteId(null);
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newEmpPhone && !validatePhone(newEmpPhone)) {
      setNewPhoneError('Неверный формат. Ожидается +7 (XXX) XXX-XX-XX');
      return;
    }

    const newEmployee: Employee = {
      id: Date.now().toString(),
      fullName: newEmpName,
      position: newEmpPos,
      department: newEmpDept,
      phone: newEmpPhone,
      hireDate: newEmpDate,
      resumeUrl: '#',
      history: []
    };
    setEmployees([newEmployee, ...employees]);
    setIsModalOpen(false);
    setNewEmpName('');
    setNewEmpPos('');
    setNewEmpPhone('');
    setNewPhoneError(null);
  };

  const handleSaveEdit = () => {
    if (!selectedEmployee) return;

    if (editForm.phone && !validatePhone(editForm.phone)) {
      setPhoneError('Формат: +7 (XXX) XXX-XX-XX');
      return;
    }

    const updatedEmployees = employees.map(e => 
      e.id === selectedEmployee.id ? { ...e, ...editForm } as Employee : e
    );
    setEmployees(updatedEmployees);
    setSelectedEmployee({ ...selectedEmployee, ...editForm } as Employee);
    setIsEditing(false);
    setPhoneError(null);
  };

  const handleAddHistoryEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const newEvent: HistoryEvent = {
      id: Date.now().toString(),
      date: historyEventDate,
      type: historyEventType,
      description: historyEventDesc
    };

    const updatedEmployees = employees.map(e => {
      if (e.id === selectedEmployee.id) {
        return { ...e, history: [newEvent, ...e.history] };
      }
      return e;
    });

    setEmployees(updatedEmployees);
    setSelectedEmployee({ ...selectedEmployee, history: [newEvent, ...selectedEmployee.history] });
    setIsHistoryModalOpen(false);
    setHistoryEventDesc('');
    setHistoryEventType('AWARD');
  };

  const handleDeleteHistoryEvent = (eventId: string) => {
    if (!selectedEmployee || !confirm('Удалить это событие из истории?')) return;

    const updatedEmployees = employees.map(e => {
      if (e.id === selectedEmployee.id) {
        return { ...e, history: e.history.filter(h => h.id !== eventId) };
      }
      return e;
    });

    setEmployees(updatedEmployees);
    setSelectedEmployee({ ...selectedEmployee, history: selectedEmployee.history.filter(h => h.id !== eventId) });
  };

  const filteredEmployees = employees.filter(e => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const cleanIdTerm = term.startsWith('#') ? term.slice(1) : term;
    const formattedDate = new Date(e.hireDate).toLocaleDateString('ru-RU');
    
    return (
      e.fullName.toLowerCase().includes(term) ||
      e.position.toLowerCase().includes(term) ||
      e.id.toLowerCase().includes(cleanIdTerm) ||
      e.hireDate.includes(term) ||
      formattedDate.includes(term)
    );
  });

  const exportToCSV = () => {
    if (filteredEmployees.length === 0) return;

    const headers = ['ФИО', 'ID', 'Должность', 'Отдел', 'Телефон', 'Дата приема'];
    const rows = filteredEmployees.map(emp => [
      emp.fullName,
      emp.id,
      emp.position,
      emp.department,
      emp.phone || '',
      new Date(emp.hireDate).toLocaleDateString('ru-RU')
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'AWARD': return <Award size={14} />;
      case 'PROMOTION': return <TrendingUp size={14} />;
      case 'PENALTY': return <AlertCircle size={14} />;
      default: return <Circle size={14} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'AWARD': return 'bg-yellow-500 text-white shadow-yellow-500/30';
      case 'PROMOTION': return 'bg-emerald-500 text-white shadow-emerald-500/30';
      case 'PENALTY': return 'bg-rose-500 text-white shadow-rose-500/30';
      default: return 'bg-slate-400 text-white shadow-slate-400/30';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Управление персоналом</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Реестр личных карточек и трудовой истории</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
          >
            <Download size={18} />
            Экспорт в CSV
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-200 dark:shadow-none"
            onClick={() => {
              setIsModalOpen(true);
              setNewPhoneError(null);
            }}
          >
            <Plus size={18} />
            Добавить сотрудника
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Employee List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <Search className="text-slate-400 dark:text-slate-600" size={20} />
              <input 
                type="text" 
                placeholder="Поиск по ФИО, должности, ID (например: #1) или дате..." 
                className="bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase text-slate-400 dark:text-slate-600 font-bold bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4">ФИО / Должность</th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Отдел</th>
                    <th className="px-6 py-4">Принят</th>
                    <th className="px-6 py-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredEmployees.map((emp) => {
                    const isSearchById = searchTerm.trim().startsWith('#');
                    return (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group ${selectedEmployee?.id === emp.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        onClick={() => setSelectedEmployee(emp)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{emp.fullName}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">{emp.position}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md transition-colors ${isSearchById ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800'}`}>
                            #{emp.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{emp.department}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{new Date(emp.hireDate).toLocaleDateString('ru-RU')}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="p-2 text-slate-300 dark:text-slate-700 hover:text-red-500 transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(emp.id); }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredEmployees.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-slate-200 dark:text-slate-700" size={32} />
                  </div>
                  <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">Никого не нашли по вашему запросу</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile View */}
        <div className="lg:col-span-1">
          {selectedEmployee ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden sticky top-24 animate-in zoom-in-95 duration-300 transition-colors">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 flex justify-end p-4">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="h-10 w-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl flex items-center justify-center text-white transition-all shadow-sm"
                    title="Редактировать профиль"
                  >
                    <Edit3 size={18} />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-all shadow-md"
                      title="Сохранить"
                    >
                      <Save size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setPhoneError(null);
                      }}
                      className="h-10 w-10 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center transition-all shadow-md"
                      title="Отмена"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-8 -mt-12">
                <div className="flex justify-between items-end mb-6">
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-4 border-white dark:border-slate-900 flex items-center justify-center text-3xl font-black text-slate-400 dark:text-slate-600">
                    {selectedEmployee.fullName.charAt(0)}
                  </div>
                  <a href={selectedEmployee.resumeUrl} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-wider mb-2 transition-colors">
                    <FileText size={14} /> Резюме (PDF)
                  </a>
                </div>
                
                {isEditing ? (
                  <div className="space-y-4 mb-8">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ФИО Сотрудника</label>
                      <input 
                        type="text" 
                        value={editForm.fullName} 
                        onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Должность</label>
                        <input 
                          type="text" 
                          value={editForm.position} 
                          onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Отдел</label>
                        <input 
                          type="text" 
                          value={editForm.department} 
                          onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Телефон</label>
                      <input 
                        type="text" 
                        value={editForm.phone || ''} 
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setEditForm({...editForm, phone: formatted});
                          if (phoneError) setPhoneError(null);
                        }}
                        placeholder="+7 (000) 000-00-00"
                        className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-2 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 outline-none transition-all ${phoneError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-100 dark:border-slate-700 focus:ring-blue-500'}`}
                      />
                      {phoneError && <p className="text-[9px] font-bold text-rose-500 ml-1">{phoneError}</p>}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{selectedEmployee.fullName}</h3>
                      <span className="text-[10px] font-mono font-black text-slate-300 dark:text-slate-700">#{selectedEmployee.id}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-8">{selectedEmployee.position}</p>
                  </>
                )}

                <div className="space-y-8">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Контактная информация</h4>
                    
                    <div className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                      <Phone size={16} className="text-blue-500 mt-1" />
                      <div className="flex-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Телефон</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedEmployee.phone || 'Не указан'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                      <Mail size={16} className="text-blue-500 mt-1" />
                      <div className="flex-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Email</span>
                        {isEditing ? (
                          <input 
                            type="email" 
                            value={editForm.email || ''} 
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            placeholder="example@rk-grand.ru"
                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-0 outline-none"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedEmployee.email || 'Не указан'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isEditing && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest block mb-1">Дата приема</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(selectedEmployee.hireDate).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest block mb-1">Отдел</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">{selectedEmployee.department}</span>
                        </div>
                      </div>

                      {/* Timeline History */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6">Временная шкала истории</h4>
                        {selectedEmployee.history.length > 0 ? (
                          <div className="relative pl-6 space-y-8">
                            {/* Vertical Line */}
                            <div className="absolute left-[11px] top-1.5 bottom-1.5 w-[2px] bg-slate-100 dark:bg-slate-800"></div>
                            
                            {[...selectedEmployee.history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event, idx) => (
                              <div key={event.id} className="relative group/item animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Timeline Dot */}
                                <div className={`absolute left-[-21px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-white dark:border-slate-900 z-10 flex items-center justify-center transition-all group-hover/item:scale-125 ${getEventColor(event.type)}`}>
                                </div>
                                
                                <div className="flex flex-col">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">{new Date(event.date).toLocaleDateString('ru-RU')}</span>
                                      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                        event.type === 'AWARD' ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20' : 
                                        event.type === 'PROMOTION' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 
                                        event.type === 'PENALTY' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 
                                        'bg-slate-50 text-slate-600 dark:bg-slate-800'
                                      }`}>
                                        {event.type}
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteHistoryEvent(event.id)}
                                      className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                                      title="Удалить из истории"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all group-hover/item:border-slate-200 dark:group-hover/item:border-slate-700">
                                    <div className="flex items-start gap-3">
                                      <div className={`mt-0.5 shrink-0 ${
                                        event.type === 'AWARD' ? 'text-yellow-500' : 
                                        event.type === 'PROMOTION' ? 'text-emerald-500' : 
                                        event.type === 'PENALTY' ? 'text-rose-500' : 
                                        'text-slate-400'
                                      }`}>
                                        {getEventIcon(event.type)}
                                      </div>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{event.description}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest italic">Событий не зафиксировано</p>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="w-full py-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        <PlusCircle size={14} /> Добавить событие в историю
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/30 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] h-[600px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-700 p-12 text-center transition-colors">
              <Users size={64} className="mb-6 opacity-10" />
              <h3 className="text-2xl font-black text-slate-600 dark:text-slate-800 mb-2 tracking-tight">Профиль не выбран</h3>
              <p className="max-w-xs font-medium text-sm">Выберите сотрудника из реестра для детального просмотра и управления</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">Новый сотрудник</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-8 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">ФИО полностью</label>
                <input required value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none transition-all" placeholder="Иванов Пётр" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Должность</label>
                <input required value={newEmpPos} onChange={(e) => setNewEmpPos(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none transition-all" placeholder="Слесарь-ремонтник" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Отдел</label>
                <select value={newEmpDept} onChange={(e) => setNewEmpDept(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none transition-all">
                  <option>Технический отдел</option>
                  <option>Отдел кадров</option>
                  <option>Цех варки целлюлозы</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Телефон</label>
                <input 
                  value={newEmpPhone} 
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setNewEmpPhone(formatted);
                    if (newPhoneError) setNewPhoneError(null);
                  }} 
                  className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 outline-none transition-all text-slate-800 dark:text-white ${newPhoneError ? 'ring-4 ring-rose-500/20 border-rose-500' : 'focus:ring-blue-100 dark:focus:ring-blue-900/20'}`}
                  placeholder="+7 (900) 000-00-00" 
                />
                {newPhoneError && <p className="text-[9px] font-bold text-rose-500 ml-4">{newPhoneError}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Дата приема</label>
                <input type="date" required value={newEmpDate} onChange={(e) => setNewEmpDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none transition-all" />
              </div>
              <div className="pt-4 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-2 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Отмена</button>
                <button type="submit" className="flex-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-200 dark:shadow-none">Принять в штат</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add History Event Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-black text-xl text-slate-800 dark:text-white tracking-tight leading-none">Новое событие истории</h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddHistoryEvent} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Дата события</label>
                  <input type="date" required value={historyEventDate} onChange={(e) => setHistoryEventDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Тип события</label>
                  <select value={historyEventType} onChange={(e) => setHistoryEventType(e.target.value as HistoryEvent['type'])} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none transition-all">
                    <option value="AWARD">Награждение</option>
                    <option value="PROMOTION">Повышение</option>
                    <option value="PENALTY">Взыскание</option>
                    <option value="OTHER">Прочее</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Описание</label>
                <textarea 
                  required 
                  value={historyEventDesc} 
                  onChange={(e) => setHistoryEventDesc(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none transition-all min-h-[100px]" 
                  placeholder="Напр.: Награжден почетной грамотой за..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsHistoryModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Отмена</button>
                <button type="submit" className="flex-2 py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-200 dark:shadow-none">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-3">Удалить сотрудника?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                Это действие необратимо. Личная карточка и вся история трудовой деятельности будут полностью удалены из системы.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Отмена
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-900/20 active:scale-95"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRModule;

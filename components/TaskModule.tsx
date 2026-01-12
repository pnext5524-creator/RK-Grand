import React, { useState, useRef } from 'react';
import { 
  Plus, Search, Paperclip, MessageSquare, Clock, Folder, Send, X, FileText, CheckSquare, Sparkles, Loader2, Trash2, Download, BellRing, BellOff, AlertTriangle, Cpu, Layers, Zap, CalendarDays, Timer
} from 'lucide-react';
import { INITIAL_PROJECTS, INITIAL_EMPLOYEES } from '../constants';
import { Task, TaskProject, TaskStatus, TaskAttachment, TaskAIAnalysis } from '../types';
import { getWritingSuggestion, getTaskAnalysis } from '../services/geminiService';

const STATUS_MAP: Record<TaskStatus, { label: string, color: string, bg: string, darkBg: string }> = {
  'TODO': { label: 'Нужно сделать', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100', darkBg: 'dark:bg-slate-800' },
  'IN_PROGRESS': { label: 'В работе', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/20' },
  'DONE': { label: 'Выполнено', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20' },
  'CANCELLED': { label: 'Отменено', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50', darkBg: 'dark:bg-rose-900/20' },
};

interface TaskModuleProps {
  tasks: Task[];
  onTasksUpdate: (tasks: Task[]) => void;
  onTaskCreated?: (task: Task, assigneeName: string) => void;
}

const TaskModule: React.FC<TaskModuleProps> = ({ tasks, onTasksUpdate, onTaskCreated }) => {
  const [projects] = useState<TaskProject[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0].id);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskAnalysis, setTaskAnalysis] = useState<Record<string, TaskAIAnalysis>>({});
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(INITIAL_EMPLOYEES[0].id);
  const [newTaskDeadline, setNewTaskDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskAttachments, setNewTaskAttachments] = useState<TaskAttachment[]>([]);
  const [newTaskReminder, setNewTaskReminder] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const activeTask = tasks.find(t => t.id === selectedTaskId);
  const filteredTasks = tasks.filter(t => 
    (selectedProjectId ? t.projectId === selectedProjectId : true) &&
    (search ? t.title.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isForNewTask: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments: TaskAttachment[] = Array.from(files).map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      size: formatFileSize(file.size)
    }));
    if (isForNewTask) {
      setNewTaskAttachments(prev => [...prev, ...newAttachments]);
    } else if (selectedTaskId) {
      onTasksUpdate(tasks.map(t => t.id === selectedTaskId ? { ...t, attachments: [...t.attachments, ...newAttachments] } : t));
    }
    e.target.value = '';
  };

  const removeAttachment = (taskId: string | null, attachmentId: string, isForNewTask: boolean) => {
    if (isForNewTask) {
      setNewTaskAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } else if (taskId) {
      onTasksUpdate(tasks.map(t => t.id === taskId ? { ...t, attachments: t.attachments.filter(a => a.id !== attachmentId) } : t));
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDesc,
      assigneeId: newTaskAssignee,
      creatorId: 'admin',
      deadline: newTaskDeadline,
      status: 'TODO',
      projectId: selectedProjectId || projects[0].id,
      attachments: newTaskAttachments,
      comments: [],
      reminderEnabled: newTaskReminder
    };
    const assignee = INITIAL_EMPLOYEES.find(e => e.id === newTaskAssignee);
    if (onTaskCreated) onTaskCreated(newTask, assignee?.fullName || 'Сотрудник');
    else onTasksUpdate([newTask, ...tasks]);
    setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskAttachments([]); setNewTaskReminder(true); setIsCreating(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTaskId) return;
    const comment = { id: Date.now().toString(), authorId: 'admin', authorName: 'Администратор', text: newComment, createdAt: new Date().toISOString() };
    onTasksUpdate(tasks.map(t => t.id === selectedTaskId ? { ...t, comments: [...t.comments, comment] } : t));
    setNewComment('');
  };

  const changeStatus = (id: string, status: TaskStatus) => {
    onTasksUpdate(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  const toggleReminder = (id: string) => {
    onTasksUpdate(tasks.map(t => t.id === id ? { ...t, reminderEnabled: !t.reminderEnabled } : t));
  };

  const handleAnalyzeTask = async () => {
    if (!activeTask) return;
    setIsAnalyzing(true);
    try {
      const analysis = await getTaskAnalysis(activeTask, tasks);
      setTaskAnalysis(prev => ({ ...prev, [activeTask.id]: analysis }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetSuggestion = async (field: 'description' | 'comment') => {
    setIsSuggesting(true);
    try {
      const suggestion = await getWritingSuggestion(field, field === 'description' ? newTaskTitle : (activeTask?.title || ''), field === 'description' ? newTaskDesc : newComment);
      if (field === 'description') setNewTaskDesc(suggestion); else setNewComment(suggestion);
    } catch (err) { console.error(err); } finally { setIsSuggesting(false); }
  };

  const getIsDueSoon = (deadlineStr: string) => {
    const now = new Date(); now.setHours(0,0,0,0);
    const deadline = new Date(deadlineStr); deadline.setHours(0,0,0,0);
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  };

  const currentAnalysis = activeTask ? taskAnalysis[activeTask.id] : null;

  return (
    <div className="flex h-full gap-8 animate-in fade-in slide-in-from-right-10 duration-500 transition-colors">
      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e, true)} />
      <input type="file" multiple ref={editFileInputRef} className="hidden" onChange={(e) => handleFileChange(e, false)} />

      <div className="w-64 shrink-0 space-y-4 hidden md:block">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Проекты задач</h3>
          <button className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"><Plus size={16} /></button>
        </div>
        <div className="space-y-1">
          <button onClick={() => setSelectedProjectId(null)} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${selectedProjectId === null ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <Folder size={18} /> <span className="text-sm">Все задачи</span>
          </button>
          {projects.map(p => (
            <button key={p.id} onClick={() => setSelectedProjectId(p.id)} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${selectedProjectId === p.id ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Folder size={18} /> <span className="text-sm truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors">
          <Search className="text-slate-400 dark:text-slate-600" size={20} />
          <input type="text" placeholder="Поиск по задачам..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-slate-200" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-blue-900/10"><Plus size={16} /> Новая задача</button>
        </div>

        <div className="flex-1 overflow-auto pr-2 space-y-5">
          {filteredTasks.length > 0 ? filteredTasks.map(task => {
            const assignee = INITIAL_EMPLOYEES.find(e => e.id === task.assigneeId);
            
            // Deadline logic
            const now = new Date(); now.setHours(0,0,0,0);
            const deadline = new Date(task.deadline); deadline.setHours(0,0,0,0);
            const isOverdue = deadline < now && task.status !== 'DONE';
            const isDueToday = deadline.getTime() === now.getTime() && task.status !== 'DONE';
            const isDueSoon = getIsDueSoon(task.deadline) && task.status !== 'DONE' && !isOverdue && !isDueToday;

            // Highlight classes
            let highlightClasses = 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700';
            if (isOverdue) {
              highlightClasses = 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-900/10 shadow-lg shadow-rose-900/5 ring-1 ring-rose-500/20';
            } else if (isDueToday) {
              highlightClasses = 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/10 shadow-lg shadow-amber-900/5 ring-1 ring-amber-500/20';
            }
            
            // Override if selected
            if (selectedTaskId === task.id) {
               highlightClasses = 'border-blue-500 dark:border-blue-700 shadow-xl ring-4 ring-blue-500/5 bg-white dark:bg-slate-900';
            }

            return (
              <div key={task.id} onClick={() => setSelectedTaskId(task.id)} className={`bg-white dark:bg-slate-900 p-6 rounded-[32px] border transition-all cursor-pointer group relative ${highlightClasses}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_MAP[task.status].bg} ${STATUS_MAP[task.status].darkBg} ${STATUS_MAP[task.status].color}`}>
                      {STATUS_MAP[task.status].label}
                    </div>
                    {isOverdue && (
                      <div className="bg-rose-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse shadow-sm shadow-rose-900/20">
                        <Timer size={12} /> ПРОСРОЧЕНО
                      </div>
                    )}
                    {isDueToday && (
                      <div className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-amber-900/20">
                        <CalendarDays size={12} /> СЕГОДНЯ
                      </div>
                    )}
                    {isDueSoon && (
                      <div className="bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Срок
                      </div>
                    )}
                    {task.reminderEnabled && task.status !== 'DONE' && <div className="text-blue-500 dark:text-blue-400"><BellRing size={16} /></div>}
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${isOverdue ? 'text-rose-600' : isDueToday ? 'text-amber-600' : isDueSoon ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400 dark:text-slate-600'}`}>
                    <Clock size={16} /> {new Date(task.deadline).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <h4 className="font-black text-slate-800 dark:text-white mb-3 text-lg tracking-tight">{task.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">{task.description}</p>
                <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-800 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 dark:text-slate-400 border border-white dark:border-slate-700">{assignee?.fullName.charAt(0)}</div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{assignee?.fullName}</span>
                  </div>
                  <div className="flex gap-5">
                    <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700"><MessageSquare size={16} /><span className="text-xs font-black">{task.comments.length}</span></div>
                    <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700"><Paperclip size={16} /><span className="text-xs font-black">{task.attachments.length}</span></div>
                  </div>
                </div>
              </div>
            );
          }) : <div className="flex flex-col items-center justify-center h-64 text-slate-300 dark:text-slate-800"><CheckSquare size={64} className="mb-4 opacity-10" /><p className="font-black text-xs uppercase tracking-widest">Задач не найдено</p></div>}
        </div>
      </div>

      {selectedTaskId && activeTask && !isCreating && (
        <div className="w-[440px] shrink-0 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-500 transition-colors">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex flex-col">
              <h3 className="font-black text-xl text-slate-800 dark:text-white tracking-tight leading-none">Детали задачи</h3>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5"><Cpu size={12} /> AI Интеграция включена</span>
            </div>
            <button onClick={() => setSelectedTaskId(null)} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={24} className="text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-auto p-8 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Текущий статус</span>
                <select value={activeTask.status} onChange={(e) => changeStatus(activeTask.id, e.target.value as TaskStatus)} className={`text-[10px] font-black uppercase tracking-widest border-none rounded-xl px-4 py-2 focus:ring-0 cursor-pointer shadow-sm ${STATUS_MAP[activeTask.status].bg} ${STATUS_MAP[activeTask.status].darkBg} ${STATUS_MAP[activeTask.status].color}`}>
                  <option value="TODO">Нужно сделать</option><option value="IN_PROGRESS">В работе</option><option value="DONE">Выполнено</option><option value="CANCELLED">Отменено</option>
                </select>
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-4 tracking-tight leading-tight">{activeTask.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6">{activeTask.description}</p>
              
              <div className="flex gap-2">
                <button onClick={() => toggleReminder(activeTask.id)} className={`flex-1 flex items-center justify-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTask.reminderEnabled ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-700'}`}>
                  {activeTask.reminderEnabled ? <BellRing size={18} /> : <BellOff size={18} />} {activeTask.reminderEnabled ? 'Уведомления' : 'Без уведомлений'}
                </button>
                <button 
                  onClick={handleAnalyzeTask}
                  disabled={isAnalyzing}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                >
                  {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Анализ AI
                </button>
              </div>
            </section>

            {/* AI Analysis Result */}
            {currentAnalysis && (
              <section className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[32px] p-6 animate-in slide-in-from-top-4 duration-500">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm"><Sparkles size={18} /></div>
                    <h4 className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-[0.2em]">Инсайты Gemini AI</h4>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                       <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 mb-1"><Clock size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Оценка времени</span></div>
                       <div className="text-lg font-black text-slate-800 dark:text-white leading-none">{currentAnalysis.estimatedHours} ч.</div>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                       <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 mb-1"><Layers size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Сложность</span></div>
                       <div className={`text-lg font-black leading-none ${currentAnalysis.complexity === 'HIGH' ? 'text-rose-500' : currentAnalysis.complexity === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`}>{currentAnalysis.complexity}</div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={12} /> Предложения по улучшению</h5>
                       <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic pr-2">{currentAnalysis.improvements}</p>
                    </div>

                    {currentAnalysis.duplicates.length > 0 && (
                      <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/30">
                         <h5 className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={12} /> Возможные дубликаты</h5>
                         <ul className="space-y-1">
                            {currentAnalysis.duplicates.map((dup, idx) => (
                              <li key={idx} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                 <div className="w-1 h-1 rounded-full bg-rose-400"></div> {dup}
                              </li>
                            ))}
                         </ul>
                      </div>
                    )}
                 </div>
              </section>
            )}

            <section>
               <div className="flex items-center justify-between mb-6"><h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Вложения ({activeTask.attachments.length})</h4><button onClick={() => editFileInputRef.current?.click()} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline">+ Добавить</button></div>
               <div className="space-y-3">
                 {activeTask.attachments.map(att => (
                   <div key={att.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group shadow-sm">
                     <div className="flex items-center gap-4 overflow-hidden"><div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm shrink-0"><FileText size={18} /></div><div className="flex flex-col truncate"><span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{att.name}</span><span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase">{att.size}</span></div></div>
                     <div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); removeAttachment(activeTask.id, att.id, false); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 dark:text-slate-700 hover:text-rose-500 transition-all"><Trash2 size={16} /></button><a href={att.url} target="_blank" rel="noreferrer" className="p-2 text-slate-300 dark:text-slate-700 hover:text-blue-500"><Download size={16} /></a></div>
                   </div>
                 ))}
               </div>
            </section>
            
            <section>
               <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6">Рабочая дискуссия</h4>
               <div className="space-y-6">
                 {activeTask.comments.map(comment => (
                   <div key={comment.id} className="flex gap-4">
                     <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/30 shadow-sm">{comment.authorName.charAt(0)}</div>
                     <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-3xl rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex justify-between mb-1.5"><span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{comment.authorName}</span><span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{comment.text}</p>
                     </div>
                   </div>
                 ))}
                 {activeTask.comments.length === 0 && <div className="py-6 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl"><p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase font-black tracking-widest italic">Нет сообщений</p></div>}
               </div>
            </section>
          </div>
          <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-2 mb-4 px-2">
               <button type="button" onClick={() => handleGetSuggestion('comment')} disabled={isSuggesting} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-700 disabled:opacity-50">{isSuggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Gemini AI Помощь</button>
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Напишите ответ..." className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white transition-all outline-none" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
              <button onClick={handleAddComment} disabled={!newComment.trim()} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-900/20 active:scale-90"><Send size={20} /></button>
            </div>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">Новая задача</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateTask} className="p-8 space-y-6 overflow-auto">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Заголовок задачи</label>
                 <input required value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none" placeholder="Например: Проверить КИПиА на котле №2" />
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between items-center pr-2">
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Описание и инструкции</label>
                   <button type="button" onClick={() => handleGetSuggestion('description')} disabled={isSuggesting || !newTaskTitle} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-700 disabled:opacity-50">{isSuggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Gemini AI Подсказать</button>
                 </div>
                 <textarea required value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none min-h-[120px]" placeholder="Опишите детали задачи..." />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Исполнитель</label>
                    <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none">
                      {INITIAL_EMPLOYEES.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Крайний срок</label>
                    <input type="date" required value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white outline-none" />
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between pr-2">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Вложения</h4>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline">+ Загрузить файлы</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {newTaskAttachments.map(att => (
                      <div key={att.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                         <div className="flex items-center gap-3 overflow-hidden"><FileText size={14} className="text-blue-500 shrink-0" /><span className="text-xs font-bold truncate">{att.name}</span></div>
                         <button type="button" onClick={() => removeAttachment(null, att.id, true)} className="text-slate-300 hover:text-rose-500"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                  <input type="checkbox" id="reminder" checked={newTaskReminder} onChange={(e) => setNewTaskReminder(e.target.checked)} className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
                  <label htmlFor="reminder" className="text-xs font-bold text-blue-800 dark:text-blue-300">Включить автоматические напоминания за 2 дня до срока</label>
               </div>
               <div className="pt-4 flex gap-4">
                 <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Отмена</button>
                 <button type="submit" className="flex-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20">Поставить задачу</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskModule;


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { INITIAL_CHATS, INITIAL_EMPLOYEES } from '../constants';
import { User, Chat, ChatMessage, ChatAttachment, Task, ChatType } from '../types';
import { 
  Send, Plus, X, MessageSquare, 
  Info, Quote as QuoteIcon, Smile,
  Reply, Trash2, Paperclip, FileText, 
  ChevronLeft, Forward, Edit2, Check, Download,
  Cpu, Sparkles, Loader2, Mic, StopCircle, Play, Pause
} from 'lucide-react';
import { getAIChatResponse } from '../services/geminiService';

interface ChatModuleProps {
  currentUser: User;
  onTaskCreate: (task: Task, assigneeName: string) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '✅', '❌', '🔥', '🚀', '⭐', '🤝', '⚙️', '🏗️'];

const ChatModule: React.FC<ChatModuleProps> = ({ currentUser, onTaskCreate }) => {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [newChatName, setNewChatName] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isAILoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatMessageText = (text: string) => {
    if (!text) return '';
    let formatted = text.replace(/\*(.*?)\*/g, '<strong class="font-bold">$1</strong>');
    formatted = formatted.replace(/_(.*?)_/g, '<em class="italic">$1</em>');
    formatted = formatted.replace(/(@[а-яА-ЯёЁa-zA-Z\s]+)/g, '<span class="text-blue-500 font-bold bg-blue-500/10 px-1 rounded-sm">$1</span>');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        sendVoiceMessage(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Необходим доступ к микрофону для записи голосовых сообщений");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = null; // Prevent sending
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const sendVoiceMessage = (url: string) => {
    if (!activeChatId) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      voiceUrl: url,
      type: 'voice',
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id]
    };
    addMessageToChat(msg);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMessageId) {
      saveEditedMessage();
      return;
    }
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !activeChatId) return;

    const userMessageText = newMessage;
    const currentPendingFiles = [...pendingFiles];
    const currentPendingAttachments = [...pendingAttachments];

    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      text: userMessageText,
      attachments: currentPendingAttachments.length > 0 ? currentPendingAttachments : undefined,
      type: currentPendingAttachments.length > 0 ? 'file' : 'text',
      timestamp: new Date().toISOString(),
      replyToId: replyingTo?.id,
      readBy: [currentUser.id]
    };

    addMessageToChat(msg);
    setNewMessage('');
    setReplyingTo(null);

    if (activeChatId === 'chat-ai') {
      setIsAILoading(true);
      try {
        const history = activeChat?.messages || [];
        const aiAttachments = await Promise.all(
          currentPendingFiles.map(async (file) => ({
            data: await fileToBase64(file),
            mimeType: file.type
          }))
        );
        const aiResponse = await getAIChatResponse(history, userMessageText, aiAttachments);
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          senderId: 'ai-bot',
          senderName: 'RK-GrandGPT',
          text: aiResponse,
          type: 'text',
          timestamp: new Date().toISOString(),
          readBy: [currentUser.id, 'ai-bot']
        };
        addMessageToChat(aiMsg);
      } catch (err) {
        console.error("AI Service Error:", err);
      } finally {
        setIsAILoading(false);
      }
    }
  };

  const addMessageToChat = (msg: ChatMessage) => {
    setChats(prev => prev.map(c => 
      c.id === activeChatId 
        ? { 
            ...c, 
            messages: [...c.messages, msg], 
            lastMessage: msg.type === 'voice' ? '🎤 Голосовое сообщение' : (msg.text || 'Вложение'), 
            updatedAt: new Date().toISOString() 
          } 
        : c
    ));
    setPendingAttachments([]);
    setPendingFiles([]);
  };

  const saveEditedMessage = () => {
    if (!activeChatId || !editingMessageId) return;
    setChats(prev => prev.map(c => {
      if (c.id !== activeChatId) return c;
      const isLast = editingMessageId === c.messages[c.messages.length - 1]?.id;
      return {
        ...c,
        messages: c.messages.map(m => 
          m.id === editingMessageId ? { ...m, text: newMessage, isEdited: true } : m
        ),
        lastMessage: isLast ? newMessage : c.lastMessage
      };
    }));
    setEditingMessageId(null);
    setNewMessage('');
  };

  const handleDeleteMessage = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id !== activeChatId) return chat;
      
      const updatedMessages = chat.messages.filter(m => m.id !== messageId);
      const newLastMessage = updatedMessages.length > 0 
        ? (updatedMessages[updatedMessages.length - 1].text || 'Вложение')
        : 'Сообщений нет';
        
      return {
        ...chat,
        messages: updatedMessages,
        lastMessage: newLastMessage,
        updatedAt: new Date().toISOString()
      };
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String) resolve(base64String);
        else reject(new Error("Failed to convert file to base64"));
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatName.trim()) return;
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      name: newChatName,
      type: 'GROUP',
      creatorId: currentUser.id,
      participantIds: [...selectedParticipants, currentUser.id],
      updatedAt: new Date().toISOString(),
      messages: [],
      lastMessage: 'Чат создан',
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setIsModalOpen(false);
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const newAttachments: ChatAttachment[] = fileArray.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: `${(file.size / 1024).toFixed(1)} KB`
    }));
    setPendingAttachments(prev => [...prev, ...newAttachments]);
    setPendingFiles(prev => [...prev, ...fileArray]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0 lg:gap-8 animate-in slide-in-from-right-10 duration-500 overflow-hidden relative text-slate-800 dark:text-slate-100">
      <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

      {/* Sidebar: Chats List */}
      <div className={`w-full lg:w-80 shrink-0 flex flex-col gap-6 h-full ${activeChatId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-[10px]">Ваши диалоги</h3>
            <button onClick={() => setIsModalOpen(true)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all active:scale-95"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full p-6 flex gap-4 border-b border-slate-50 dark:border-slate-800 transition-all text-left group ${activeChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-sm ${chat.type === 'CHANNEL_NEWS' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {chat.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-black text-slate-800 dark:text-white truncate text-sm">{chat.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 truncate font-medium">{chat.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat View */}
      {activeChat ? (
        <div className={`flex-1 flex flex-col h-full bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden ${!activeChatId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveChatId(null)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600"><ChevronLeft size={24} /></button>
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                {activeChat.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-base tracking-tight leading-none mb-1.5">{activeChat.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{activeChat.participantIds.length} УЧАСТНИКОВ</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowInfoPanel(!showInfoPanel)} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><Info size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30 dark:bg-slate-950/20">
            {activeChat.messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.id;
              const isAI = msg.senderId === 'ai-bot';
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5 px-2">
                    {isMe ? 'ВЫ' : msg.senderName.toUpperCase()}
                  </span>
                  <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm border ${isAI ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                      {msg.senderName.charAt(0)}
                    </div>
                    
                    <div className="relative">
                      <div className={`p-4 rounded-[24px] shadow-sm relative transition-all ${
                        isMe ? 'bg-blue-600 text-white rounded-tr-none' : 
                        isAI ? 'bg-indigo-50 dark:bg-indigo-900/20 text-slate-800 dark:text-slate-200 border border-indigo-100 dark:border-indigo-900/30 rounded-tl-none' :
                        'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                      }`}>
                        {msg.replyToId && (
                          <div className="mb-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg border-l-4 border-white/30 text-[10px] font-medium italic truncate">
                             {activeChat.messages.find(m => m.id === msg.replyToId)?.text || 'Вложение'}
                          </div>
                        )}
                        
                        {msg.type === 'voice' && msg.voiceUrl && (
                          <div className="flex items-center gap-3 py-1">
                            <div className={`p-2 rounded-full ${isMe ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                              <Mic size={16} />
                            </div>
                            <audio src={msg.voiceUrl} controls className="h-8 max-w-[200px]" />
                          </div>
                        )}

                        {msg.text && (
                          <div className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                            {formatMessageText(msg.text)}
                          </div>
                        )}

                        {msg.attachments?.map(att => (
                          <div key={att.id} className="mt-3 p-3 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center gap-3 border border-black/5 dark:border-white/5">
                            {att.type === 'image' ? <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div> : <FileText size={20} />}
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold truncate">{att.name}</p>
                               <span className="text-[10px] opacity-60 font-bold">{att.size}</span>
                            </div>
                            <Download size={16} className="shrink-0 opacity-60 hover:opacity-100 transition-all cursor-pointer" />
                          </div>
                        ))}
                      </div>

                      <div className={`absolute top-0 flex items-center gap-1.5 p-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-all z-20 ${isMe ? '-left-20 translate-x-0' : '-right-20 translate-x-0'}`}>
                        <button onClick={() => setReplyingTo(msg)} className="p-2 text-slate-400 hover:text-blue-500"><Reply size={16} /></button>
                        {isMe && <button onClick={() => { setEditingMessageId(msg.id); setNewMessage(msg.text || ''); }} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 size={16} /></button>}
                        <button onClick={(e) => handleDeleteMessage(e, msg.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 dark:text-slate-700 mt-1 px-14">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.isEdited && ' • Изменено'}
                  </span>
                </div>
              );
            })}
            {isAILoading && (
              <div className="flex flex-col items-start animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-2 px-2">
                   <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Cpu size={14} /></div>
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">RK-GrandGPT Думает...</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-tl-none border border-indigo-100 dark:border-indigo-900/30 flex gap-1">
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-all">
            {replyingTo && (
              <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between border-l-4 border-blue-500 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <QuoteIcon size={16} className="text-blue-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ответ на {replyingTo.senderName}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">{replyingTo.text || 'Вложение'}</p>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X size={16} /></button>
              </div>
            )}
            
            {pendingAttachments.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-3">
                {pendingAttachments.map(att => (
                  <div key={att.id} className="relative group">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-2 pr-8">
                      <FileText size={16} className="text-blue-500" />
                      <span className="text-xs font-bold truncate max-w-[100px]">{att.name}</span>
                    </div>
                    <button onClick={() => setPendingAttachments(prev => prev.filter(p => p.id !== att.id))} className="absolute top-1 right-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-400 hover:text-rose-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            {isRecording ? (
              <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-900/10 p-4 rounded-[24px] border border-rose-100 dark:border-rose-900/30 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm tracking-widest uppercase">Запись: {formatTime(recordingTime)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={cancelRecording} className="p-3 text-slate-500 hover:text-rose-600 transition-colors"><X size={24} /></button>
                  <button onClick={stopRecording} className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-900/20 active:scale-90"><StopCircle size={24} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl transition-all"><Paperclip size={22} /></button>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl transition-all relative">
                    <Smile size={22} />
                    {showEmojiPicker && (
                      <div ref={emojiPickerRef} className="absolute bottom-full mb-4 left-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-4 rounded-[24px] z-50 w-64 grid grid-cols-7 gap-1">
                        {COMMON_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => addEmoji(emoji)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xl">{emoji}</button>
                        ))}
                      </div>
                    )}
                  </button>
                  <button onClick={startRecording} className="p-3.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-2xl transition-all"><Mic size={22} /></button>
                </div>
                
                <input 
                  type="text" 
                  placeholder={editingMessageId ? "Редактировать сообщение..." : (activeChatId === 'chat-ai' ? "Спросите RK-GrandGPT..." : "Ваше сообщение...")}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-[24px] px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-slate-800 dark:text-white transition-all outline-none" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                />

                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && pendingAttachments.length === 0}
                  className="p-4 bg-blue-600 text-white rounded-[24px] hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-900/20 active:scale-90 shrink-0"
                >
                  <Send size={22} />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 text-slate-400 transition-colors">
          <MessageSquare size={64} className="mb-6 opacity-10" />
          <h3 className="text-xl font-black text-slate-600 dark:text-slate-800 uppercase tracking-widest">Выберите чат для общения</h3>
        </div>
      )}
    </div>
  );
};

export default ChatModule;

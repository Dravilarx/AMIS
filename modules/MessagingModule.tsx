
import React, { useState, useMemo, useRef } from 'react';
import { 
  Mail, Inbox, Send, Trash2, Plus, Search, 
  Paperclip, Image, Link, X, MoreVertical, 
  ChevronRight, Reply, Star, Clock, User, 
  Download, FileText, SendHorizontal, Users,
  UploadCloud, CheckCircle, AlertCircle
} from 'lucide-react';
import { useMessaging } from '../hooks/useMessaging';
import { useEmployees } from '../hooks/useEmployees';
import { Message, MessageAttachment, Employee } from '../types';

const MessagingModule: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { messages, loading, sendMessage, markAsRead, deleteMessage, permanentDelete } = useMessaging();
  const { employees } = useEmployees();

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'trash'>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const matchFolder = m.folder === activeFolder;
      const matchSearch = m.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFolder && matchSearch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages, activeFolder, searchTerm]);

  const selectedMessage = useMemo(() => {
    return messages.find(m => m.id === selectedMessageId);
  }, [messages, selectedMessageId]);

  const unreadCount = messages.filter(m => m.folder === 'inbox' && !m.read).length;

  const handleMessageClick = (id: string) => {
    setSelectedMessageId(id);
    if (activeFolder === 'inbox') {
      markAsRead(id);
    }
  };

  const getUserName = (id: string) => {
    if (id === 'system-admin') return 'Admin AMIS';
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Staff Externo';
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700">
      
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 flex-shrink-0 flex flex-col gap-6">
        <button 
          onClick={() => setShowCompose(true)}
          className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" /> Nueva Comunicación
        </button>

        <div className={`p-6 rounded-[32px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <nav className="space-y-2">
            <FolderBtn active={activeFolder === 'inbox'} onClick={() => {setActiveFolder('inbox'); setSelectedMessageId(null);}} icon={<Inbox className="w-4 h-4" />} label="Bandeja Entrada" count={unreadCount > 0 ? unreadCount : undefined} />
            <FolderBtn active={activeFolder === 'sent'} onClick={() => {setActiveFolder('sent'); setSelectedMessageId(null);}} icon={<Send className="w-4 h-4" />} label="Enviados" />
            <FolderBtn active={activeFolder === 'trash'} onClick={() => {setActiveFolder('trash'); setSelectedMessageId(null);}} icon={<Trash2 className="w-4 h-4" />} label="Eliminados" />
          </nav>
        </div>

        {/* Group Quick Filters */}
        <div className={`flex-grow p-6 rounded-[32px] border overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 px-2">Grupos de Staff</h4>
          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3">
             <GroupTagItem label="Radiología" icon={<Users className="w-3 h-3"/>} count={employees.filter(e => e.department === 'Radiología').length} isDark={isDark} />
             <GroupTagItem label="Técnicos" icon={<Users className="w-3 h-3"/>} count={employees.filter(e => e.role === 'Técnico').length} isDark={isDark} />
             <GroupTagItem label="Administración" icon={<Users className="w-3 h-3"/>} count={employees.filter(e => e.role === 'Administrativo').length} isDark={isDark} />
          </div>
        </div>
      </aside>

      {/* Message List */}
      <div className={`lg:w-96 flex-shrink-0 flex flex-col rounded-[48px] border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
              <input 
                type="text" 
                placeholder="Filtrar por asunto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl outline-none border transition-all text-xs font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:bg-white'}`}
              />
           </div>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
           {filteredMessages.map(m => (
             <div 
              key={m.id} 
              onClick={() => handleMessageClick(m.id)}
              className={`p-6 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 relative
                ${selectedMessageId === m.id ? 'bg-blue-600/5 dark:bg-blue-600/10' : ''}
                ${!m.read && m.folder === 'inbox' ? 'border-l-4 border-l-blue-600' : ''}`}
             >
                <div className="flex justify-between items-start mb-1">
                   <span className={`text-[11px] font-black uppercase tracking-tight ${!m.read && m.folder === 'inbox' ? 'text-blue-600' : 'opacity-60'}`}>
                     {getUserName(m.senderId)}
                   </span>
                   <span className="text-[8px] font-black opacity-30 uppercase">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <h5 className="text-[12px] font-black uppercase tracking-tight mb-1 truncate">{m.subject}</h5>
                <p className="text-[11px] opacity-40 line-clamp-1 font-medium italic">{m.content}</p>
                {m.attachments.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 opacity-40">
                    <Paperclip className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase">{m.attachments.length} Archivos</span>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Reader Panel */}
      <main className={`flex-grow rounded-[48px] border overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        {selectedMessage ? (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex gap-2">
                   <button className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:scale-105 transition-all text-blue-600"><Reply className="w-4 h-4" /></button>
                   <button onClick={() => { deleteMessage(selectedMessage.id); setSelectedMessageId(null); }} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:scale-105 transition-all text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{new Date(selectedMessage.timestamp).toLocaleString()}</span>
                   <MoreVertical className="w-4 h-4 opacity-20" />
                </div>
             </div>

             <div className="flex-grow p-12 overflow-y-auto custom-scrollbar">
                <div className="mb-10">
                   <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 leading-tight">{selectedMessage.subject}</h2>
                   <div className="space-y-2">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black">
                           {getUserName(selectedMessage.senderId).substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-sm font-black uppercase tracking-tight">{getUserName(selectedMessage.senderId)}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                               <span className="text-[9px] font-black opacity-30 uppercase">Para:</span>
                               {selectedMessage.recipientIds.map(id => (
                                 <span key={id} className="text-[9px] font-black bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded-md">{getUserName(id)}</span>
                               ))}
                            </div>
                            {selectedMessage.ccIds && selectedMessage.ccIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                 <span className="text-[9px] font-black opacity-30 uppercase">CC:</span>
                                 {selectedMessage.ccIds.map(id => (
                                   <span key={id} className="text-[9px] font-black bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded-md">{getUserName(id)}</span>
                                 ))}
                              </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="prose dark:prose-invert max-w-none mb-12">
                   <p className="text-lg font-medium leading-relaxed opacity-80 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                {selectedMessage.attachments.length > 0 && (
                  <div className="space-y-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                     <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                       <Paperclip className="w-4 h-4" /> Material Adjunto
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedMessage.attachments.map(att => (
                          <div key={att.id} className={`p-4 rounded-2xl border flex items-center justify-between group transition-all hover:border-blue-500 ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
                                   {att.type === 'image' ? <Image className="w-5 h-5" /> : att.type === 'link' ? <Link className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                   <p className="text-[11px] font-black uppercase tracking-tight truncate">{att.name}</p>
                                   <p className="text-[8px] opacity-40 font-bold uppercase">{att.type} • {att.size ? (att.size/1024).toFixed(1) + 'KB' : 'Enlace'}</p>
                                </div>
                             </div>
                             <button className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all text-blue-600"><Download className="w-4 h-4" /></button>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-20 p-20 text-center">
             <Mail className="w-24 h-24 mb-6" />
             <h3 className="text-2xl font-black uppercase tracking-widest">Panel de Lectura</h3>
          </div>
        )}
      </main>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal 
          isDark={isDark} employees={employees} onClose={() => setShowCompose(false)} 
          onSend={async (data) => { await sendMessage({ ...data, senderId: 'system-admin' }); setShowCompose(false); }} 
        />
      )}
    </div>
  );
};

// Sub-components

const FolderBtn = ({ active, onClick, icon, label, count }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 hover:opacity-100'}`}>
    <div className="flex items-center gap-4">{icon} <span className="text-[10px] font-black uppercase tracking-widest">{label}</span></div>
    {count && <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${active ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>{count}</span>}
  </button>
);

const GroupTagItem = ({ label, icon, count, isDark }: any) => (
  <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer hover:border-blue-500 ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
     <div className="flex items-center gap-3">{icon} <span className="text-[10px] font-black uppercase tracking-tight">{label}</span></div>
     <span className="text-[9px] font-black opacity-30">{count}</span>
  </div>
);

const ComposeModal = ({ isDark, employees, onClose, onSend }: any) => {
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [ccIds, setCcIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Fixed: Explicitly cast the Array from FileList to File[] to resolve the 'unknown[]' type mismatch error.
    const files = Array.from(e.dataTransfer.files) as File[];
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fixed: Explicitly cast the Array from FileList to File[] to resolve the 'unknown[]' type mismatch error.
    const files = Array.from(e.target.files || []) as File[];
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          id: crypto.randomUUID(),
          type: file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name,
          url: reader.result as string,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGroupSelect = (tag: string) => {
    let filtered: string[] = [];
    if (tag === 'Radiólogos') filtered = employees.filter(e => e.role === 'Médico').map(e => e.id);
    else if (tag === 'Administrativos') filtered = employees.filter(e => e.role === 'Administrativo').map(e => e.id);
    else if (tag === 'Técnicos') filtered = employees.filter(e => e.role === 'Técnico').map(e => e.id);
    
    setRecipientIds(Array.from(new Set([...recipientIds, ...filtered])));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-5xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] custom-scrollbar ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        
        <div className="flex items-center justify-between mb-10">
           <h3 className="text-3xl font-black uppercase tracking-tighter">Nueva Comunicación Staff</h3>
           <button onClick={onClose} className="p-3 opacity-40 hover:opacity-100"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6">
           {/* Multi-Recipient Selection */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">Para: <span className="text-blue-500 lowercase font-normal italic">(Múltiple)</span></label>
                 <div className="flex flex-wrap gap-2 mb-3">
                   {recipientIds.map(id => (
                     <span key={id} className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                       {employees.find(e => e.id === id)?.lastName} <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setRecipientIds(recipientIds.filter(i => i !== id))} />
                     </span>
                   ))}
                 </div>
                 <div className="flex gap-2">
                   <select 
                    onChange={e => e.target.value && setRecipientIds(Array.from(new Set([...recipientIds, e.target.value])))}
                    className={`flex-grow p-4 rounded-xl border outline-none font-bold text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                   >
                      <option value="">Añadir Destinatario...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.role})</option>)}
                   </select>
                   <div className="flex gap-1">
                      {['Radiólogos', 'Técnicos'].map(g => (
                        <button key={g} onClick={() => handleGroupSelect(g)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[8px] font-black uppercase tracking-tight hover:bg-blue-600 hover:text-white transition-all">{g}</button>
                      ))}
                   </div>
                 </div>
              </div>

              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">CC (Copia):</label>
                 <div className="flex flex-wrap gap-2 mb-3">
                   {ccIds.map(id => (
                     <span key={id} className="bg-slate-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                       {employees.find(e => e.id === id)?.lastName} <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setCcIds(ccIds.filter(i => i !== id))} />
                     </span>
                   ))}
                 </div>
                 <select 
                  onChange={e => e.target.value && setCcIds(Array.from(new Set([...ccIds, e.target.value])))}
                  className={`w-full p-4 rounded-xl border outline-none font-bold text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                 >
                    <option value="">Añadir CC...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.role})</option>)}
                 </select>
              </div>
           </div>

           <input 
            type="text" value={subject} onChange={e => setSubject(e.target.value)} 
            placeholder="Asunto de la comunicación..." 
            className={`w-full p-5 rounded-2xl border outline-none font-black text-xl uppercase tracking-tighter ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500'}`} 
           />

           <div className="relative">
              <textarea 
                value={content} onChange={e => setContent(e.target.value)}
                placeholder="Escribe el mensaje aquí..."
                className={`w-full p-8 rounded-[40px] border outline-none font-medium h-64 resize-none leading-relaxed text-lg ${isDark ? 'bg-slate-800 border-slate-700 focus:bg-slate-800' : 'bg-slate-50 border-slate-100 focus:bg-white'}`}
              />
              
              {/* Drag and Drop Zone Overlay */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`absolute inset-0 rounded-[40px] transition-all flex flex-col items-center justify-center border-4 border-dashed
                  ${isDragging ? 'bg-blue-600/20 border-blue-600 opacity-100' : 'pointer-events-none opacity-0 border-transparent'}`}
              >
                 <UploadCloud className="w-16 h-16 text-blue-600 mb-4 animate-bounce" />
                 <p className="text-xl font-black uppercase text-blue-600">Suelta los archivos aquí</p>
              </div>
           </div>

           {/* Attachments & Files Footer */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                       <Paperclip className="w-4 h-4" /> Adjuntar Documento
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileInput} multiple className="hidden" />
                 </div>
                 <p className="text-[10px] font-black uppercase opacity-30 italic">O arrastra los archivos sobre el mensaje</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                 {attachments.map(att => (
                   <div key={att.id} className="flex items-center justify-between p-3 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-500/20 rounded-2xl group animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {att.type === 'image' ? <Image className="w-4 h-4 text-blue-600 flex-shrink-0" /> : <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                        <span className="text-[10px] font-black uppercase tracking-tight truncate">{att.name}</span>
                      </div>
                      <X className="w-4 h-4 cursor-pointer hover:text-red-500 opacity-40 group-hover:opacity-100" onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} />
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="mt-12 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 font-black text-xs uppercase opacity-40 hover:opacity-100">Cerrar</button>
          <button 
            disabled={recipientIds.length === 0 || !subject || !content}
            onClick={() => onSend({ recipientIds, ccIds, subject, content, attachments })}
            className="flex-[2] py-5 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-30"
          >
            Enviar a {recipientIds.length} Miembros del Staff
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingModule;


import React, { useState, useRef, useMemo } from 'react';
import { 
  Megaphone, Plus, Calendar, Clock, 
  User, Image as ImageIcon, Link as LinkIcon, 
  FileText, Play, X, Trash2, Globe, Paperclip,
  ExternalLink, MoreHorizontal, Camera, ArrowUpRight,
  Users, UserCheck, Shield, Settings, Info
} from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { useEmployees } from '../hooks/useEmployees';
import { NewsPost, NewsCategory, UserRole } from '../types';

interface Props {
  isDark: boolean;
  onManage?: () => void;
}

const DashboardNews: React.FC<Props> = ({ isDark, onManage }) => {
  const { news } = useNews();
  
  // En el Overview solo mostramos las últimas 4
  const latestNews = news.slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-blue-600" /> Comunicación Directa
          </h3>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Últimas actualizaciones del staff y la dirección.</p>
        </div>
        {onManage && (
          <button 
            onClick={onManage}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-blue-600 transition-all group"
          >
            Gestionar Todo <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {latestNews.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-20 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[48px]">
             <Globe className="w-16 h-16 mx-auto mb-4" />
             <p className="text-xs font-black uppercase tracking-widest">Sin publicaciones activas</p>
          </div>
        ) : (
          latestNews.map((post) => (
            <NewsCard key={post.id} post={post} isDark={isDark} />
          ))
        )}
      </div>
    </div>
  );
};

interface NewsCardProps {
  post: NewsPost;
  isDark: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ post, isDark }) => {
  const categoryStyles: Record<NewsCategory, string> = {
    'Noticia': 'bg-emerald-500/10 text-emerald-500',
    'Evento': 'bg-blue-600/10 text-blue-600',
    'Fecha Importante': 'bg-amber-500/10 text-amber-500',
    'Comunicado': 'bg-indigo-600/10 text-indigo-600'
  };

  const imageAttachment = post.attachments.find(a => a.type === 'image');
  const otherAttachments = post.attachments.filter(a => a.type !== 'image');

  return (
    <div className={`p-8 rounded-[48px] border flex flex-col group transition-all hover:border-blue-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-xs uppercase overflow-hidden">
             {post.authorPhoto ? <img src={post.authorPhoto} className="w-full h-full object-cover" /> : post.authorName.substring(0, 2)}
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight leading-none mb-1">{post.authorName}</p>
            <div className="flex items-center gap-3 opacity-40">
              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(post.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${categoryStyles[post.category]}`}>
             {post.category}
           </span>
        </div>
      </div>

      <div className="flex-grow space-y-6">
        <div>
           <h4 className="text-2xl font-black uppercase tracking-tighter leading-tight mb-4">{post.title}</h4>
           <p className="text-sm font-medium leading-relaxed opacity-70 whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.eventDate && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-600/5 border border-blue-500/10">
             <Calendar className="w-5 h-5 text-blue-600" />
             <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Fecha del Evento</p>
                <p className="text-xs font-black uppercase">{new Date(post.eventDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
             </div>
          </div>
        )}

        {imageAttachment && (
          <div className="rounded-[32px] overflow-hidden aspect-video border border-slate-100 dark:border-slate-800">
             <img src={imageAttachment.url} className="w-full h-full object-cover" alt="Post attachment" />
          </div>
        )}

        {otherAttachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {otherAttachments.map(att => (
               <div key={att.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group/att">
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className="p-2 bg-blue-600/10 text-blue-600 rounded-lg flex-shrink-0">
                        {att.type === 'video' ? <Play className="w-3.5 h-3.5" /> : att.type === 'link' ? <LinkIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-tight truncate">{att.name}</span>
                  </div>
                  <a href={att.url} target="_blank" rel="noreferrer" className="p-2 opacity-0 group-hover/att:opacity-100 text-blue-600 transition-opacity">
                     <ExternalLink className="w-3.5 h-3.5" />
                  </a>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ComposePostModal = ({ isDark, onClose, onPost }: any) => {
  const { employees } = useEmployees();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NewsCategory>('Noticia');
  const [eventDate, setEventDate] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  
  // Segmentación
  const [targetRoles, setTargetRoles] = useState<UserRole[]>(['Superuser', 'Jefatura', 'Médico', 'Técnico', 'Administrativo']); // Por defecto todos
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
  const [showRecipientConfig, setShowRecipientConfig] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          id: crypto.randomUUID(),
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
          name: file.name,
          url: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleRole = (role: UserRole) => {
    setTargetRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleUser = (id: string) => {
    setTargetUserIds(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const rolesList: {id: UserRole, label: string, icon: any}[] = [
    { id: 'Jefatura', label: 'Jefaturas / Dirección', icon: Shield },
    { id: 'Médico', label: 'Staff Médico', icon: UserCheck },
    { id: 'Técnico', label: 'Staff Tecnólogo/Técnico', icon: Settings },
    { id: 'Administrativo', label: 'Personal Administrativo', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-4xl p-10 rounded-[56px] border animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[95vh] custom-scrollbar shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-3xl font-black uppercase tracking-tighter">Crear Nuevo Comunicado</h3>
           <button onClick={onClose} className="p-3 opacity-40 hover:opacity-100 transition-all rounded-full hover:bg-slate-800"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-10">
           {/* Fila 1: Título y Categoría */}
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                 <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Título</label>
                 <input 
                  value={title} onChange={e => setTitle(e.target.value)} 
                  placeholder="EJ. RESULTADOS AUDITORÍA MENSUAL" 
                  className={`w-full p-6 rounded-2xl border outline-none font-black text-xl uppercase tracking-tighter transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} 
                 />
              </div>
              <div className="md:col-span-4">
                 <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Categoría</label>
                 <select 
                  value={category} onChange={e => setCategory(e.target.value as any)}
                  className={`w-full p-6 rounded-2xl border outline-none font-bold text-sm transition-all appearance-none cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`}
                 >
                    <option value="Noticia">Noticia</option>
                    <option value="Evento">Evento</option>
                    <option value="Fecha Importante">Fecha Importante</option>
                    <option value="Comunicado">Comunicado</option>
                 </select>
              </div>
           </div>

           {/* Configuración de Destinatarios (Añadido según solicitud) */}
           <div className={`p-8 rounded-[40px] border transition-all ${showRecipientConfig ? 'bg-blue-600/5 border-blue-500/30' : 'border-slate-800/50'}`}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowRecipientConfig(!showRecipientConfig)}>
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl">
                       <Users className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-widest">Destinatarios y Filtros</h4>
                       <p className="text-[9px] opacity-40 font-bold uppercase mt-0.5">
                          {targetRoles.length === 5 ? 'Público: Toda la Red' : `Segmentado: ${targetRoles.length} Grupos, ${targetUserIds.length} Individuos`}
                       </p>
                    </div>
                 </div>
                 <button className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2">
                    {showRecipientConfig ? 'Ocultar Ajustes' : 'Configurar Alcance'} <MoreHorizontal className="w-4 h-4" />
                 </button>
              </div>

              {showRecipientConfig && (
                <div className="mt-8 space-y-8 animate-in slide-in-from-top-4">
                   <div>
                      <label className="block text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-4 px-2">Segmentar por Grupos de Staff</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         {rolesList.map(r => (
                           <div 
                              key={r.id}
                              onClick={() => toggleRole(r.id)}
                              className={`p-4 rounded-3xl border cursor-pointer transition-all flex flex-col gap-3
                                 ${targetRoles.includes(r.id) ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-slate-800/40 border-slate-800 opacity-60 hover:opacity-100'}`}
                           >
                              <r.icon className="w-5 h-5" />
                              <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{r.label}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div>
                      <label className="block text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-4 px-2">Asignar Individuos Específicos (Excepción)</label>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                         {employees.map(e => (
                           <button 
                            key={e.id}
                            onClick={() => toggleUser(e.id)}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all flex items-center gap-2
                               ${targetUserIds.includes(e.id) ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 opacity-40'}`}
                           >
                             {e.firstName} {e.lastName} {targetUserIds.includes(e.id) && <X className="w-2.5 h-2.5" />}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              )}
           </div>

           {/* Mensaje */}
           <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Contenido del Mensaje</label>
              <textarea 
                value={content} onChange={e => setContent(e.target.value)}
                placeholder="Describa el anuncio detalladamente..."
                className={`w-full p-8 rounded-[40px] border outline-none font-medium h-56 resize-none leading-relaxed text-lg transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:bg-slate-800 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-600'}`}
              />
           </div>

           {category === 'Evento' && (
             <div className="animate-in slide-in-from-top-2">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Fecha del Evento</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={`w-full p-6 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
             </div>
           )}

           {/* Multimedia y Adjuntos */}
           <div className="space-y-6">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2 ml-2"><Paperclip className="w-3.5 h-3.5" /> Multimedia y Adjuntos</label>
              <div className="flex flex-wrap gap-6">
                 <button onClick={() => fileInputRef.current?.click()} className="w-40 h-32 bg-slate-800/40 rounded-[32px] border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 hover:border-blue-600 hover:bg-blue-600/5 transition-all group">
                    <Camera className="w-8 h-8 opacity-20 group-hover:opacity-100 group-hover:text-blue-600 transition-all" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Subir Foto</span>
                 </button>
                 <button onClick={() => fileInputRef.current?.click()} className="w-40 h-32 bg-slate-800/40 rounded-[32px] border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 hover:border-blue-600 hover:bg-blue-600/5 transition-all group">
                    <Paperclip className="w-8 h-8 opacity-20 group-hover:opacity-100 group-hover:text-blue-600 transition-all" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Archivo</span>
                 </button>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                 
                 <div className="flex-grow grid grid-cols-2 gap-4">
                   {attachments.map(att => (
                     <div key={att.id} className="p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-between animate-in zoom-in-95">
                        <div className="flex items-center gap-4 overflow-hidden">
                           {att.type === 'image' ? <ImageIcon className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
                           <span className="text-[10px] font-black uppercase tracking-widest truncate">{att.name}</span>
                        </div>
                        <X className="w-5 h-5 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} />
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-16 flex items-center justify-end gap-10">
          <button onClick={onClose} className="px-10 py-5 font-black text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Cancelar</button>
          <button 
            disabled={!title || !content}
            onClick={() => onPost({ 
              authorId: 'system-admin', 
              authorName: 'Administración AMIS', 
              title, content, category, eventDate, attachments,
              targetRoles, targetUserIds
            })}
            className="px-16 py-6 bg-blue-700 text-white rounded-[32px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-blue-900/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
          >
            Publicar en el Staff Feed
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardNews;

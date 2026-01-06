
import React, { useState } from 'react';
import { 
  Megaphone, Plus, Search, Filter, 
  Calendar, Bell, Clock, Trash2, 
  MoreVertical, Share2, Eye, MessageSquare,
  FileText, Image as ImageIcon, Link as LinkIcon, 
  PlayCircle, Globe, LayoutGrid, List,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { NewsPost, NewsCategory, UserSession } from '../types';
import DashboardNews, { ComposePostModal } from './DashboardNews';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const NewsModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { news, addPost, deletePost } = useNews();
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'Todos'>('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories: (NewsCategory | 'Todos')[] = ['Todos', 'Noticia', 'Evento', 'Fecha Importante', 'Comunicado'];

  const filteredNews = news.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Estilo AMIS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Megaphone className="w-6 h-6" />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Comunicaciones Staff</h2>
          </div>
          <p className="opacity-40 text-lg font-medium italic">Centro de difusión de noticias, hitos y eventos para la red AMIS.</p>
        </div>
        <button 
          onClick={() => setShowCompose(true)}
          className="px-8 py-5 bg-blue-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" /> Crear Publicación
        </button>
      </div>

      {/* Barra de Filtros y Controles */}
      <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 hidden xl:block" />
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
               <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}><LayoutGrid className="w-4 h-4"/></button>
               <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}><List className="w-4 h-4"/></button>
            </div>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input 
              type="text" 
              placeholder="Buscar en el historial de comunicados..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500'}`}
            />
          </div>
        </div>
      </div>

      {/* Grid de Contenido */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" : "space-y-6"}>
        {filteredNews.length === 0 ? (
          <div className="col-span-full py-32 text-center opacity-20 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[64px]">
             <Globe className="w-24 h-24 mx-auto mb-6" />
             <p className="text-xl font-black uppercase tracking-widest">No se encontraron publicaciones</p>
          </div>
        ) : (
          filteredNews.map(post => (
            <NewsManagementCard 
              key={post.id} 
              post={post} 
              isDark={isDark} 
              viewMode={viewMode}
              onDelete={deletePost}
            />
          ))
        )}
      </div>

      {showCompose && (
        <ComposePostModal 
          isDark={isDark} 
          onClose={() => setShowCompose(false)} 
          onPost={async (data: any) => {
            await addPost(data);
            setShowCompose(false);
          }} 
        />
      )}
    </div>
  );
};

// Fixed: Define NewsManagementCard as a React.FC and update onDelete type to support async functions, resolving the TypeScript assignment error.
const NewsManagementCard: React.FC<{ 
  post: NewsPost; 
  isDark: boolean; 
  viewMode: 'grid' | 'list'; 
  onDelete: (id: string) => void | Promise<void>; 
}> = ({ post, isDark, viewMode, onDelete }) => {
  const categoryStyles: Record<NewsCategory, string> = {
    'Noticia': 'bg-emerald-500/10 text-emerald-500',
    'Evento': 'bg-blue-500/10 text-blue-500',
    'Fecha Importante': 'bg-amber-500/10 text-amber-500',
    'Comunicado': 'bg-indigo-500/10 text-indigo-600'
  };

  const image = post.attachments.find(a => a.type === 'image');

  if (viewMode === 'list') {
    return (
      <div className={`p-6 rounded-[32px] border flex items-center justify-between group transition-all hover:border-blue-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-6 overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center font-black text-xs overflow-hidden">
            {post.authorPhoto ? <img src={post.authorPhoto} className="w-full h-full object-cover" /> : post.authorName.substring(0, 2)}
          </div>
          <div className="min-w-0">
             <div className="flex items-center gap-3 mb-1">
                <h4 className="text-sm font-black uppercase truncate">{post.title}</h4>
                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${categoryStyles[post.category]}`}>{post.category}</span>
             </div>
             <p className="text-[10px] opacity-40 font-bold uppercase truncate">{post.authorName} • {new Date(post.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
           <button onClick={() => onDelete(post.id)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
           <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"><ArrowRight className="w-5 h-5 opacity-40" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-[48px] border overflow-hidden transition-all group hover:border-blue-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      {image && (
        <div className="h-48 overflow-hidden relative">
           <img src={image.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="News" />
           <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl ${categoryStyles[post.category]} backdrop-blur-md bg-white/10`}>
             {post.category}
           </div>
        </div>
      )}
      
      <div className="p-8 flex-grow flex flex-col">
        {!image && (
          <div className={`mb-6 self-start px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${categoryStyles[post.category]}`}>
            {post.category}
          </div>
        )}
        
        <h4 className="text-2xl font-black uppercase tracking-tighter leading-tight mb-4 group-hover:text-blue-600 transition-colors">{post.title}</h4>
        <p className="text-sm font-medium opacity-60 line-clamp-3 leading-relaxed mb-8">{post.content}</p>
        
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px]">
                {post.authorName.substring(0, 2)}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-tight leading-none">{post.authorName}</p>
                <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest mt-1">{new Date(post.timestamp).toLocaleDateString()}</p>
              </div>
           </div>
           <div className="flex gap-1">
              <button onClick={() => onDelete(post.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              <button className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><MoreVertical className="w-4 h-4" /></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NewsModule;


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  PenTool, Plus, Search, FileText, 
  Send, Eye, CheckCircle2, Trash2, 
  Clock, X, Mail, User, ShieldCheck,
  ChevronRight, ArrowRight, MousePointer2,
  AlertCircle, History, Download, FileSignature,
  Eraser, Check, MoreVertical
} from 'lucide-react';
import { useSignatures } from '../hooks/useSignatures';
import { SignatureDocument, SignatureStatus, UserSession } from '../types';

// Define Props interface to include currentUser, fixing the type error reported in App.tsx
interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const SignatureModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { documents, createDocument, updateStatus, deleteDocument } = useSignatures();
  const [showCreate, setShowCreate] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SignatureStatus | 'Todos'>('Todos');

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.signerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeDoc = useMemo(() => 
    documents.find(d => d.id === activeDocId), 
  [documents, activeDocId]);

  // Stats
  const stats = useMemo(() => ({
    total: documents.length,
    signed: documents.filter(d => d.status === 'Firmado').length,
    pending: documents.filter(d => d.status !== 'Firmado').length
  }), [documents]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Estilo AMIS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <FileSignature className="w-6 h-6" />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Firma de Documentos</h2>
          </div>
          <p className="opacity-40 text-lg font-medium italic">Gestión de consentimientos y acuerdos internos mediante firma digital simple.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-indigo-500/30"
        >
          <Plus className="w-5 h-5" /> Nuevo Documento
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Documentos" val={stats.total} icon={<FileText className="text-blue-500" />} isDark={isDark} />
        <StatCard label="Por Firmar" val={stats.pending} icon={<Clock className="text-amber-500" />} isDark={isDark} />
        <StatCard label="Completados" val={stats.signed} icon={<CheckCircle2 className="text-emerald-500" />} isDark={isDark} />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Listado de Documentos */}
        <div className={`lg:col-span-4 p-8 rounded-[48px] border overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tighter">Bandeja Legal</h3>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
               {(['Todos', 'Pendiente', 'Firmado'] as const).map(s => (
                 <button 
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'opacity-40'}`}
                 >
                   {s}
                 </button>
               ))}
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input 
              type="text" 
              placeholder="Buscar por título o firmante..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'}`}
            />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredDocs.map(doc => (
              <div 
                key={doc.id}
                onClick={() => {
                  setActiveDocId(doc.id);
                  if (doc.status === 'Enviado') updateStatus(doc.id, 'Visto');
                }}
                className={`p-6 rounded-[32px] border transition-all cursor-pointer flex items-center justify-between group
                  ${activeDocId === doc.id ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-blue-500/50' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-black uppercase tracking-tight truncate">{doc.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={doc.status} />
                    <p className="text-[9px] opacity-40 font-bold uppercase truncate">{doc.signerName}</p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 transition-all ${activeDocId === doc.id ? 'opacity-100 text-indigo-500 translate-x-1' : 'opacity-0 group-hover:opacity-40'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Visualización y Firma */}
        <div className="lg:col-span-8">
           {activeDoc ? (
             <div className="space-y-6 animate-in zoom-in-95 duration-500 h-full flex flex-col">
                <div className={`p-10 rounded-[48px] border flex-grow flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                   
                   <div className="flex justify-between items-start mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">{activeDoc.title}</h3>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40">
                              <User className="w-3.5 h-3.5" /> {activeDoc.signerName} ({activeDoc.signerRole})
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40">
                              <Clock className="w-3.5 h-3.5" /> Creado: {new Date(activeDoc.createdAt).toLocaleDateString()}
                           </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {activeDoc.status === 'Firmado' && (
                          <button className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                             <Download className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => deleteDocument(activeDoc.id)} className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl hover:scale-105 transition-all">
                           <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                   </div>

                   <div className="flex-grow grid grid-cols-1 xl:grid-cols-12 gap-10">
                      {/* Document Content Simulation */}
                      <div className="xl:col-span-8 space-y-8">
                         <div className={`p-10 rounded-[40px] border min-h-[500px] relative overflow-hidden ${isDark ? 'bg-slate-800/20 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-blue-500" />
                            <h4 className="text-lg font-black uppercase mb-6 tracking-tight">Cuerpo del Documento</h4>
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{activeDoc.content}</p>
                            
                            {/* Signature Area at bottom of doc content */}
                            <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end">
                               <div className="text-left">
                                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Huella Digital AMIS</p>
                                  <p className="text-[8px] font-bold opacity-20 font-mono select-all">UUID-{activeDoc.id.split('-')[0]}-AUTH-GEN-2025</p>
                                </div>
                                <div className="text-center w-64 border-b border-slate-300 dark:border-slate-600 pb-4 relative h-24 flex flex-col items-center justify-center">
                                   {activeDoc.signatureData ? (
                                     <img src={activeDoc.signatureData} className="max-h-20 object-contain animate-in fade-in zoom-in duration-1000" alt="Firma" />
                                   ) : (
                                     <span className="text-[10px] font-black uppercase opacity-10 tracking-widest">Pendiente de Firma</span>
                                   )}
                                   <p className="absolute -bottom-6 text-[10px] font-black uppercase opacity-40">{activeDoc.signerName}</p>
                                </div>
                            </div>
                         </div>
                      </div>

                      {/* Audit & Action Sidebar */}
                      <div className="xl:col-span-4 space-y-6">
                         <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                            <h4 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                               <History className="w-4 h-4 text-indigo-500" /> Historial Auditoría
                            </h4>
                            <div className="space-y-6">
                               <AuditItem label="Generado" date={activeDoc.createdAt} active={true} />
                               <AuditItem label="Enviado/Notificado" date={activeDoc.createdAt} active={true} />
                               <AuditItem label="Visto por Firmante" date={activeDoc.viewedAt} active={!!activeDoc.viewedAt} />
                               <AuditItem label="Firma Certificada" date={activeDoc.signedAt} active={!!activeDoc.signedAt} isSuccess={true} />
                            </div>
                         </div>

                         {activeDoc.status !== 'Firmado' && (
                           <div className="p-8 rounded-[40px] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 animate-pulse">
                              <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><PenTool className="w-4 h-4" /> Acción Requerida</h4>
                              <p className="text-xs font-medium opacity-80 mb-6">El documento está listo para ser firmado por el responsable designado.</p>
                              <button 
                                onClick={() => updateStatus(activeDoc.id, 'Firmado')}
                                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-2"
                              >
                                <FileSignature className="w-4 h-4" /> Proceder a Firmar
                              </button>
                           </div>
                         )}

                         {activeDoc.status === 'Firmado' && (
                           <div className="p-8 rounded-[40px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
                              <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Documento Certificado</h4>
                              <p className="text-[10px] font-bold leading-relaxed">Este documento ha sido validado mediante firma digital simple de staff. Los registros de trazabilidad IP y marca de tiempo han sido adjuntados al archivo maestro.</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[64px] flex flex-col items-center justify-center p-24 text-center opacity-20">
                <FileSignature className="w-24 h-24 mb-8" />
                <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Módulo Legal AMIS</h3>
                <p className="text-sm font-black uppercase tracking-widest opacity-60 max-w-sm mx-auto">Seleccione un documento del staff o genere una nueva solicitud de consentimiento informado.</p>
             </div>
           )}
        </div>
      </div>

      {/* Signature Modal (Canvas) */}
      {documents.some(d => d.status === 'Firmado' && !d.signatureData) && (
        <SignatureCaptureModal 
          isDark={isDark} 
          onClose={() => {}} // Handle automatic logic
          onSave={(data: string) => {
            const docId = documents.find(d => d.status === 'Firmado' && !d.signatureData)?.id;
            if (docId) updateStatus(docId, 'Firmado', { signatureData: data });
          }} 
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateDocModal 
          isDark={isDark} 
          onClose={() => setShowCreate(false)}
          onSave={async (data: any) => {
            await createDocument(data);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
};

// Sub-Components

const StatCard = ({ label, val, icon, isDark }: any) => (
  <div className={`p-8 rounded-[40px] border transition-all hover:scale-105 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-6">
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">{icon}</div>
      <MoreVertical className="w-5 h-5 opacity-20" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
    <h3 className="text-4xl font-black tracking-tighter">{val}</h3>
  </div>
);

const StatusBadge = ({ status }: { status: SignatureStatus }) => {
  const styles = {
    'Pendiente': 'bg-slate-500/10 text-slate-500',
    'Enviado': 'bg-blue-500/10 text-blue-500',
    'Visto': 'bg-amber-500/10 text-amber-500',
    'Firmado': 'bg-emerald-500/10 text-emerald-500'
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
};

const AuditItem = ({ label, date, active, isSuccess }: any) => (
  <div className={`flex items-start gap-4 transition-opacity ${active ? 'opacity-100' : 'opacity-20'}`}>
     <div className={`mt-1.5 w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-indigo-500 shadow-lg shadow-indigo-500/50'}`} />
     <div>
        <p className="text-[10px] font-black uppercase tracking-tight">{label}</p>
        <p className="text-[9px] font-bold opacity-50 uppercase">{date ? new Date(date).toLocaleString() : 'Pendiente'}</p>
     </div>
  </div>
);

const CreateDocModal = ({ isDark, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    signerName: '',
    signerRole: '',
    signerEmail: ''
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-4xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">Nueva Solicitud de Firma</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
           <div className="col-span-full">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Título del Documento</label>
              <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej. Contrato de Prestación Servicios" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
           </div>

           <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Nombre del Firmante</label>
              <input value={formData.signerName} onChange={e => setFormData({...formData, signerName: e.target.value})} placeholder="Ej. Dr. Pedro Pascal" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
           </div>

           <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Correo Electrónico</label>
              <input value={formData.signerEmail} onChange={e => setFormData({...formData, signerEmail: e.target.value})} placeholder="email@dominio.cl" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
           </div>

           <div className="col-span-full">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Cuerpo del Acuerdo / Contrato</label>
              <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Escriba aquí los términos y condiciones..." className={`w-full p-8 rounded-[40px] border outline-none font-medium h-48 resize-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
           </div>
        </div>

        <div className="flex gap-4">
           <button onClick={onClose} className="flex-1 py-5 font-black text-xs uppercase opacity-40">Cancelar</button>
           <button 
            disabled={!formData.title || !formData.content || !formData.signerName}
            onClick={() => onSave(formData)}
            className="flex-1 py-5 bg-indigo-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all"
           >
             Generar & Notificar
           </button>
        </div>
      </div>
    </div>
  );
};

// --- CANVAS SIGNATURE PAD COMPONENT ---

const SignatureCaptureModal = ({ isDark, onSave }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      // Re-setup context after resize
      ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
    };

    window.addEventListener('resize', resize);
    resize();

    return () => window.removeEventListener('resize', resize);
  }, [isDark]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
       const ctx = canvas.getContext('2d');
       ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl">
      <div className="max-w-2xl w-full text-center space-y-10 animate-in zoom-in-95 duration-500">
        <div>
           <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-2 leading-none">Capture su Firma</h2>
           <p className="text-indigo-400 font-black text-xs uppercase tracking-widest">Utilice su ratón o dedo sobre el lienzo inferior</p>
        </div>

        <div className={`relative h-[400px] w-full rounded-[64px] border-4 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-white/5`}>
           <canvas 
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            className="w-full h-full cursor-crosshair touch-none"
           />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
              <PenTool className="w-64 h-64 text-white" />
           </div>
        </div>

        <div className="flex gap-4">
           <button onClick={handleClear} className="flex-1 py-6 bg-white/5 text-white border border-white/10 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Eraser className="w-4 h-4" /> Limpiar Lienzo
           </button>
           <button onClick={handleSave} className="flex-[2] py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Certificar Firma & Finalizar
           </button>
        </div>
        
        <p className="text-[10px] font-black uppercase opacity-20 text-white tracking-[0.3em]">Red de Inteligencia Radiológica AMIS SORAN</p>
      </div>
    </div>
  );
};

export default SignatureModule;

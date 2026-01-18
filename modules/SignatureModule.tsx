import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  PenTool, Plus, Search, FileText,
  Send, Eye, CheckCircle2, Trash2,
  Clock, X, Mail, User, ShieldCheck,
  ChevronRight, ArrowRight, MousePointer2,
  AlertCircle, History, Download, FileSignature,
  Eraser, Check, MoreVertical, Hash, Fingerprint
} from 'lucide-react';
import { useSignatures } from '../hooks/useSignatures';
import { SignatureDocument, SignatureStatus, UserSession } from '../types';

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
      (d.signers?.[0]?.name || d.signerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeDoc = useMemo(() =>
    documents.find(d => d.id === activeDocId),
    [documents, activeDocId]);

  // Stats - Calculate based on NEW structure
  const stats = useMemo(() => ({
    total: documents.length,
    signed: documents.filter(d => d.status === 'Firmado').length,
    pending: documents.filter(d => d.status !== 'Firmado').length // Simplification
  }), [documents]);

  const handleSign = (dataUrl: string) => {
    if (activeDocId) {
      updateStatus(activeDocId, 'Firmado', { signatureData: dataUrl });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Estilo AMIS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <FileSignature className="w-6 h-6" />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Firma Digital</h2>
          </div>
          <p className="opacity-40 text-lg font-medium italic">Gestión, trazabilidad y validación de documentos firmados.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-indigo-500/30"
        >
          <Plus className="w-5 h-5" /> Nueva Solicitud
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Documentos" val={stats.total} icon={<FileText className="text-blue-500" />} isDark={isDark} />
        <StatCard label="Por Firmar" val={stats.pending} icon={<Clock className="text-amber-500" />} isDark={isDark} />
        <StatCard label="Completados" val={stats.signed} icon={<CheckCircle2 className="text-emerald-500" />} isDark={isDark} />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">

        {/* Listado de Documentos */}
        <div className={`lg:col-span-4 p-8 rounded-[48px] border overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tighter">Bandeja</h3>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
              {(['Todos', 'Pendiente', 'Firmado'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'opacity-40'}`}
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
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'}`}
            />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredDocs.map(doc => {
              const signer = doc.signers?.[0] || { name: doc.signerName, role: doc.signerRole };
              return (
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
                      <p className="text-[9px] opacity-40 font-bold uppercase truncate">{signer.name}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-all ${activeDocId === doc.id ? 'opacity-100 text-indigo-500 translate-x-1' : 'opacity-0 group-hover:opacity-40'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Visualización */}
        <div className="lg:col-span-8">
          {activeDoc ? (
            <DocDetailPanel
              doc={activeDoc}
              isDark={isDark}
              onDelete={deleteDocument}
              onSignRequested={() => updateStatus(activeDoc.id, 'En Proceso')} // Mock trigger
              currentUser={currentUser}
            />
          ) : (
            <div className="h-full border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[64px] flex flex-col items-center justify-center p-24 text-center opacity-20">
              <FileSignature className="w-24 h-24 mb-8" />
              <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Seleccione un Documento</h3>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal Logic */}
      {/* 
         In a real scenario, this would be triggered by a specific 'Sign' action.
         Here we auto-show it if status is 'En Proceso' (simulating user clicking 'Sign').
         Or better, we let the DetailPanel trigger it.
      */}
      {activeDoc?.status === 'En Proceso' && (
        <SignatureCaptureModal
          isDark={isDark}
          onClose={() => { }}
          onSave={handleSign}
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

// --- Sub-Components ---

const DocDetailPanel = ({ doc, isDark, onDelete, onSignRequested, currentUser }: any) => {
  const signer = doc.signers?.[0] || { name: doc.signerName, role: doc.signerRole };
  const isSigned = doc.status === 'Firmado';
  // Use either the new signatureData on the signer or the legacy field
  const signatureImg = doc.signers?.[0]?.signatureData || doc.signatureData;

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500 h-full flex flex-col">
      <div className={`p-10 rounded-[48px] border flex-grow flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>

        <div className="flex justify-between items-start mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">{doc.title}</h3>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40">
                <User className="w-3.5 h-3.5" /> {signer.name} ({signer.role})
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40">
                <Fingerprint className="w-3.5 h-3.5" /> Hash: {doc.currentHash?.substring(0, 16)}...
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isSigned && (
              <button className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                <Download className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => onDelete(doc.id)} className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl hover:scale-105 transition-all">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-grow grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8 space-y-8">
            <div className={`p-10 rounded-[40px] border min-h-[500px] relative overflow-hidden ${isDark ? 'bg-slate-800/20 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-blue-500" />
              <h4 className="text-lg font-black uppercase mb-6 tracking-tight">Contenido ({doc.origin.replace('_', ' ')})</h4>

              {/* Content based on type */}
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap font-serif">
                {doc.content}
              </p>

              {/* Signature Footer */}
              <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end">
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Integridad Digital</p>
                  <p className="text-[8px] font-bold opacity-20 font-mono select-all">SHA256: {doc.currentHash}</p>
                </div>
                <div className="text-center w-64 border-b border-slate-300 dark:border-slate-600 pb-4 relative h-24 flex flex-col items-center justify-center">
                  {signatureImg ? (
                    <img src={signatureImg} className="max-h-20 object-contain animate-in fade-in zoom-in duration-1000" alt="Firma" />
                  ) : (
                    <span className="text-[10px] font-black uppercase opacity-10 tracking-widest">Espacio para Firma</span>
                  )}
                  <p className="absolute -bottom-6 text-[10px] font-black uppercase opacity-40">{signer.name}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            {/* Audit Log from Evidence */}
            <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <h4 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" /> Trazabilidad
              </h4>
              <div className="space-y-6">
                {doc.evidenceLog?.map((ev: any) => (
                  <AuditItem
                    key={ev.id}
                    label={ev.detail}
                    date={ev.timestamp}
                    active={true}
                    isSuccess={ev.event === 'signed'}
                  />
                ))}
                {(!doc.evidenceLog || doc.evidenceLog.length === 0) && (
                  <p className="text-xs opacity-40 italic">Sin registros de auditoría</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isSigned && (
              <div className="p-8 rounded-[40px] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 animate-pulse">
                <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><PenTool className="w-4 h-4" /> Acción Requerida</h4>
                <p className="text-xs font-medium opacity-80 mb-6">El documento requiere firma del usuario asignado.</p>
                <button
                  onClick={onSignRequested}
                  className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <FileSignature className="w-4 h-4" /> Firmar Ahora
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const styles: any = {
    'Pendiente': 'bg-slate-500/10 text-slate-500',
    'Enviado': 'bg-blue-500/10 text-blue-500',
    'Visto': 'bg-amber-500/10 text-amber-500',
    'En Proceso': 'bg-indigo-500/10 text-indigo-500',
    'Firmado': 'bg-emerald-500/10 text-emerald-500',
    'Rechazado': 'bg-red-500/10 text-red-500'
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${styles[status] || 'bg-slate-500/10'}`}>
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

const SignatureCaptureModal = ({ isDark, onSave }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const color = isDark ? '#ffffff' : '#000000';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const resize = () => {
      // Very simple resize logic to avoid clearing on simpler cases, but ideally should save data
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
    }
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [isDark]);

  const getCoords = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
    e.preventDefault(); // Prevent scrolling on touch
  }

  const draw = (e: any) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(x, y);
    ctx?.stroke();
    e.preventDefault();
  }

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  }

  const handleSave = () => {
    const data = canvasRef.current?.toDataURL('image/png');
    if (data) onSave(data);
  }

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    ctx?.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl">
      <div className="max-w-2xl w-full text-center space-y-10 animate-in zoom-in-95 duration-500">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-2 leading-none">Firmar Documento</h2>
          <p className="text-indigo-400 font-black text-xs uppercase tracking-widest">Dibuje su firma para validar el documento</p>
        </div>

        <div className={`relative h-[300px] w-full rounded-[64px] border-4 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-white/5`}>
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
        </div>

        <div className="flex gap-4">
          <button onClick={handleClear} className="flex-1 py-6 bg-white/5 text-white border border-white/10 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <Eraser className="w-4 h-4" /> Limpiar
          </button>
          <button onClick={handleSave} className="flex-[2] py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Check className="w-5 h-5" /> Confirmar Firma
          </button>
        </div>
      </div>
    </div>
  );
};

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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}>
      <div className={`relative w-full max-w-4xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`} onClick={e => e.stopPropagation()}>
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">Nuevo Documento</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="col-span-full">
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Título</label>
            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Firmante</label>
            <input value={formData.signerName} onChange={e => setFormData({ ...formData, signerName: e.target.value })} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Rol / Cargo</label>
            <input value={formData.signerRole} onChange={e => setFormData({ ...formData, signerRole: e.target.value })} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          </div>
          <div className="col-span-full">
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Contenido</label>
            <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className={`w-full p-8 rounded-[40px] border outline-none font-medium h-48 resize-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 font-black text-xs uppercase opacity-40">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-5 bg-indigo-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest">Crear Documento</button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModule;

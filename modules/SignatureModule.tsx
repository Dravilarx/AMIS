import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  PenTool, Plus, Search, FileText, Trash2,
  Clock, X, User, ArrowRight, History,
  Download, FileSignature, Eraser, Check,
  MoreVertical, Fingerprint, Send, Users,
  ChevronRight, AlertCircle, CheckCircle2,
  XCircle, Eye, Upload
} from 'lucide-react';
import { useSignatures, SignerInput, CreateDocumentInput } from '../hooks/useSignatures';
import { useEmployees } from '../hooks/useEmployees';
import { SignatureDocument, SignatureInstanceStatus, SignatureSigner, UserSession } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const SignatureModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const {
    documents, loading,
    createDocument, sendForSigning, applySignature,
    deleteDocument, rejectSignature
  } = useSignatures();

  const [view, setView] = useState<'list' | 'create' | 'detail' | 'sign'>('list');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SignatureInstanceStatus | 'Todos'>('Todos');

  const activeDoc = useMemo(() =>
    documents.find(d => d.id === activeDocId),
    [documents, activeDocId]);

  const filteredDocs = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = useMemo(() => ({
    total: documents.length,
    pending: documents.filter(d => ['Pendiente', 'EnProceso'].includes(d.status)).length,
    signed: documents.filter(d => d.status === 'Firmado').length,
    rejected: documents.filter(d => d.status === 'Rechazado').length
  }), [documents]);

  const handleCreateComplete = async (data: CreateDocumentInput) => {
    try {
      console.log('Creating document with data:', data);
      const doc = await createDocument(data);
      console.log('Document created:', doc);
      setActiveDocId(doc.id);
      setView('detail');
    } catch (err) {
      console.error('Error creating document:', err);
      alert('Error al crear el documento: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!activeDoc) return;
    const signer = activeDoc.signers.find(s => s.status === 'Pendiente');
    if (signer) {
      await applySignature(activeDoc.id, signer.id, signatureData, '192.168.1.1');
      setView('detail');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <FileSignature className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Firma Digital</h2>
          </div>
          <p className="opacity-40 text-base font-medium">Gestión y trazabilidad de documentos firmados</p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-indigo-500/30"
          >
            <Plus className="w-4 h-4" /> Nuevo Documento
          </button>
        )}
        {view !== 'list' && (
          <button
            onClick={() => { setView('list'); setActiveDocId(null); }}
            className="px-6 py-4 bg-slate-200 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Volver a Lista
          </button>
        )}
      </div>

      {/* Stats */}
      {view === 'list' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" val={stats.total} icon={<FileText className="text-blue-500" />} isDark={isDark} />
          <StatCard label="Pendientes" val={stats.pending} icon={<Clock className="text-amber-500" />} isDark={isDark} />
          <StatCard label="Firmados" val={stats.signed} icon={<CheckCircle2 className="text-emerald-500" />} isDark={isDark} />
          <StatCard label="Rechazados" val={stats.rejected} icon={<XCircle className="text-red-500" />} isDark={isDark} />
        </div>
      )}

      {/* Views */}
      {view === 'list' && (
        <DocumentsList
          documents={filteredDocs}
          isDark={isDark}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onSelect={(id) => { setActiveDocId(id); setView('detail'); }}
          onDelete={deleteDocument}
        />
      )}

      {view === 'create' && (
        <CreateWizard
          isDark={isDark}
          currentUser={currentUser}
          onComplete={handleCreateComplete}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'detail' && activeDoc && (
        <DocumentDetail
          doc={activeDoc}
          isDark={isDark}
          onSendForSigning={() => sendForSigning(activeDoc.id, currentUser.id)}
          onOpenSignPanel={() => setView('sign')}
          onDelete={() => { deleteDocument(activeDoc.id); setView('list'); }}
        />
      )}

      {view === 'sign' && activeDoc && (
        <SignPanel
          doc={activeDoc}
          isDark={isDark}
          onSign={handleSign}
          onReject={async (reason) => {
            const signer = activeDoc.signers.find(s => s.status === 'Pendiente');
            if (signer) {
              await rejectSignature(activeDoc.id, signer.id, reason);
              setView('detail');
            }
          }}
          onCancel={() => setView('detail')}
        />
      )}
    </div>
  );
};

// ============ SUB-COMPONENTS ============

const StatCard = ({ label, val, icon, isDark }: any) => (
  <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">{icon}</div>
    </div>
    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</p>
    <h3 className="text-3xl font-black">{val}</h3>
  </div>
);

const StatusBadge = ({ status }: { status: SignatureInstanceStatus }) => {
  const styles: Record<string, string> = {
    'Borrador': 'bg-slate-500/10 text-slate-500',
    'Pendiente': 'bg-amber-500/10 text-amber-500',
    'EnProceso': 'bg-blue-500/10 text-blue-500',
    'Firmado': 'bg-emerald-500/10 text-emerald-500',
    'Rechazado': 'bg-red-500/10 text-red-500',
    'Expirado': 'bg-gray-500/10 text-gray-500'
  };
  const labels: Record<string, string> = {
    'EnProceso': 'En Proceso'
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${styles[status] || 'bg-slate-500/10'}`}>
      {labels[status] || status}
    </span>
  );
};

// Documents List
const DocumentsList = ({ documents, isDark, searchTerm, onSearchChange, statusFilter, onStatusFilterChange, onSelect, onDelete }: any) => (
  <div className={`p-6 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <h3 className="text-lg font-black uppercase tracking-tight">Documentos</h3>
      <div className="flex gap-2">
        {(['Todos', 'Borrador', 'Pendiente', 'EnProceso', 'Firmado'] as const).map(s => (
          <button
            key={s}
            onClick={() => onStatusFilterChange(s)}
            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 opacity-60'}`}
          >
            {s === 'EnProceso' ? 'En Proc.' : s}
          </button>
        ))}
      </div>
    </div>

    <div className="relative mb-6">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
      <input
        type="text"
        placeholder="Buscar documento..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none text-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
      />
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-2 text-[9px] font-black uppercase opacity-40">Título</th>
            <th className="text-left py-3 px-2 text-[9px] font-black uppercase opacity-40">Origen</th>
            <th className="text-left py-3 px-2 text-[9px] font-black uppercase opacity-40">Firmantes</th>
            <th className="text-left py-3 px-2 text-[9px] font-black uppercase opacity-40">Estado</th>
            <th className="text-left py-3 px-2 text-[9px] font-black uppercase opacity-40">Fecha</th>
            <th className="py-3 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc: SignatureDocument) => (
            <tr
              key={doc.id}
              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              onClick={() => onSelect(doc.id)}
            >
              <td className="py-4 px-2 font-bold">{doc.title}</td>
              <td className="py-4 px-2 text-xs opacity-60">{doc.origin === 'Interno_RichText' ? 'Rich Text' : 'PDF'}</td>
              <td className="py-4 px-2">
                <span className="text-xs">{doc.completedSignatures}/{doc.requiredSignatures}</span>
              </td>
              <td className="py-4 px-2"><StatusBadge status={doc.status} /></td>
              <td className="py-4 px-2 text-xs opacity-60">{new Date(doc.createdAt).toLocaleDateString()}</td>
              <td className="py-4 px-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center opacity-40">No hay documentos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Create Wizard
const CreateWizard = ({ isDark, currentUser, onComplete, onCancel }: any) => {
  const { employees } = useEmployees();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    origin: 'Interno_RichText' as 'Interno_RichText' | 'Externo_PDF',
    content: '',
    fileUrl: '',
    isSequential: false
  });

  const [signers, setSigners] = useState<SignerInput[]>([]);
  const [newSigner, setNewSigner] = useState({ fullName: '', email: '', role: '', isManual: false });

  const addSignerFromEmployee = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    setSigners(prev => [...prev, {
      employeeId: emp.id,
      fullName: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      role: emp.role,
      order: prev.length + 1
    }]);
  };

  const addManualSigner = () => {
    if (!newSigner.fullName || !newSigner.email) return;
    setSigners(prev => [...prev, {
      fullName: newSigner.fullName,
      email: newSigner.email,
      role: newSigner.role,
      order: prev.length + 1
    }]);
    setNewSigner({ fullName: '', email: '', role: '', isManual: false });
  };

  const removeSigner = (idx: number) => {
    setSigners(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleSubmit = async () => {
    if (!formData.title || signers.length === 0) {
      alert('Por favor complete el título y agregue al menos un firmante');
      return;
    }

    console.log('Submitting form:', { formData, signers });
    await onComplete({
      ...formData,
      signers,
      createdBy: currentUser.id
    });
  };

  const inputClass = `w-full p-4 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`;
  const labelClass = 'block text-[9px] font-black uppercase tracking-widest opacity-40 mb-2';

  return (
    <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
        <span className="ml-4 text-xs font-bold opacity-60">
          {step === 1 ? 'Documento' : step === 2 ? 'Firmantes' : 'Confirmar'}
        </span>
      </div>

      {/* Step 1: Document Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Título del Documento *</label>
            <input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              placeholder="Ej: Consentimiento Informado"
            />
          </div>

          <div>
            <label className={labelClass}>Descripción</label>
            <input
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className={labelClass}>Tipo de Origen</label>
            <div className="flex gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, origin: 'Interno_RichText' }))}
                className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${formData.origin === 'Interno_RichText' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <p className="text-xs font-bold">Rich Text</p>
                <p className="text-[9px] opacity-40">Redactar aquí</p>
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, origin: 'Externo_PDF' }))}
                className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${formData.origin === 'Externo_PDF' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <Upload className="w-6 h-6 mx-auto mb-2" />
                <p className="text-xs font-bold">PDF Externo</p>
                <p className="text-[9px] opacity-40">Subir archivo</p>
              </button>
            </div>
          </div>

          {formData.origin === 'Interno_RichText' && (
            <div>
              <label className={labelClass}>Contenido del Documento</label>
              <textarea
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className={`${inputClass} h-48 resize-none`}
                placeholder="Redacte el contenido del documento..."
              />
            </div>
          )}

          {formData.origin === 'Externo_PDF' && (
            <div>
              <label className={labelClass}>URL del PDF (o arrastrar archivo)</label>
              <input
                value={formData.fileUrl}
                onChange={e => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
          )}
        </div>
      )}

      {/* Step 2: Signers */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-xs font-bold">
              <input
                type="checkbox"
                checked={formData.isSequential}
                onChange={e => setFormData(prev => ({ ...prev, isSequential: e.target.checked }))}
                className="w-4 h-4"
              />
              Firma secuencial (en orden)
            </label>
          </div>

          {/* Add from Staff */}
          <div>
            <label className={labelClass}>Agregar desde Staff</label>
            <select
              onChange={e => { addSignerFromEmployee(e.target.value); e.target.value = ''; }}
              className={inputClass}
            >
              <option value="">-- Seleccionar empleado --</option>
              {employees.filter(e => !signers.some(s => s.employeeId === e.id)).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} - {emp.role}
                </option>
              ))}
            </select>
          </div>

          {/* Manual Entry */}
          <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3">O ingresar manualmente</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                placeholder="Nombre completo"
                value={newSigner.fullName}
                onChange={e => setNewSigner(prev => ({ ...prev, fullName: e.target.value }))}
                className={`p-3 rounded-lg border outline-none text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
              />
              <input
                placeholder="Email"
                type="email"
                value={newSigner.email}
                onChange={e => setNewSigner(prev => ({ ...prev, email: e.target.value }))}
                className={`p-3 rounded-lg border outline-none text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
              />
              <input
                placeholder="Rol (opcional)"
                value={newSigner.role}
                onChange={e => setNewSigner(prev => ({ ...prev, role: e.target.value }))}
                className={`p-3 rounded-lg border outline-none text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>
            <button
              onClick={addManualSigner}
              disabled={!newSigner.fullName || !newSigner.email}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold disabled:opacity-40"
            >
              + Agregar Firmante Manual
            </button>
          </div>

          {/* Signers List */}
          <div>
            <label className={labelClass}>Firmantes Asignados ({signers.length})</label>
            <div className="space-y-2">
              {signers.map((s, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 text-xs font-bold flex items-center justify-center">
                      {s.order}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{s.fullName}</p>
                      <p className="text-[10px] opacity-50">{s.email} {s.role && `• ${s.role}`}</p>
                    </div>
                    {s.employeeId && <span className="text-[8px] bg-blue-100 dark:bg-blue-900 text-blue-600 px-2 py-0.5 rounded-full">Staff</span>}
                  </div>
                  <button onClick={() => removeSigner(idx)} className="text-red-500 p-1"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {signers.length === 0 && (
                <p className="text-center py-8 opacity-40 text-sm">Agregue al menos un firmante</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <h4 className="font-black uppercase text-sm mb-4">Resumen</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="opacity-40">Título:</span> {formData.title}</div>
              <div><span className="opacity-40">Origen:</span> {formData.origin === 'Interno_RichText' ? 'Rich Text' : 'PDF Externo'}</div>
              <div><span className="opacity-40">Firmantes:</span> {signers.length}</div>
              <div><span className="opacity-40">Flujo:</span> {formData.isSequential ? 'Secuencial' : 'Paralelo'}</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs`}>
            <AlertCircle className="w-4 h-4 inline mr-2" />
            El documento se creará en estado <strong>Borrador</strong>. Deberá enviarlo a firmar manualmente.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button onClick={step === 1 ? onCancel : () => setStep(s => s - 1)} className="px-6 py-3 opacity-50 hover:opacity-100 text-sm font-bold">
          {step === 1 ? 'Cancelar' : '← Anterior'}
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 1 && !formData.title) || (step === 2 && signers.length === 0)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-40"
          >
            Siguiente →
          </button>
        ) : (
          <button onClick={handleSubmit} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
            <Check className="w-4 h-4" /> Crear Documento
          </button>
        )}
      </div>
    </div>
  );
};

// Document Detail with Signed Preview
const DocumentDetail = ({ doc, isDark, onSendForSigning, onOpenSignPanel, onDelete }: any) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Download the signed document as image
  const downloadSignedDocument = async () => {
    if (!previewRef.current) return;
    setDownloading(true);

    try {
      // Use html2canvas-like approach with native canvas
      const preview = previewRef.current;
      const canvas = document.createElement('canvas');
      const scale = 2; // High resolution
      canvas.width = preview.offsetWidth * scale;
      canvas.height = preview.offsetHeight * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw document content
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText(doc.title, 40, 50);

      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      const lines = (doc.content || '').split('\n');
      let y = 90;
      for (const line of lines) {
        ctx.fillText(line, 40, y);
        y += 24;
      }

      // Draw signatures
      const signedSigners = doc.signers.filter((s: any) => s.status === 'Firmado' && s.signatureData);
      let sigY = y + 40;

      for (const signer of signedSigners) {
        // Draw signature box
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(40, sigY, 300, 100);

        // Draw signature label
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(signer.fullName, 50, sigY + 90);
        ctx.fillText(new Date(signer.signedAt).toLocaleDateString(), 250, sigY + 90);

        // Draw signature image
        if (signer.signatureData) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 50, sigY + 10, 240, 70);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = signer.signatureData;
          });
        }

        sigY += 120;
      }

      // Download
      const link = document.createElement('a');
      link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}_firmado.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('Error al descargar el documento');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main Content - Full Width when Signed */}
      <div className={`${doc.status === 'Firmado' ? 'xl:col-span-3' : 'xl:col-span-2'} p-8 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <StatusBadge status={doc.status} />
            <h3 className="text-2xl font-black mt-2">{doc.title}</h3>
            {doc.description && <p className="opacity-50 text-sm mt-1">{doc.description}</p>}
          </div>
          <div className="flex gap-2">
            {doc.status === 'Borrador' && (
              <button onClick={onSendForSigning} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Send className="w-4 h-4" /> Enviar a Firmar
              </button>
            )}
            {['Pendiente', 'EnProceso'].includes(doc.status) && (
              <button onClick={onOpenSignPanel} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <PenTool className="w-4 h-4" /> Firmar
              </button>
            )}
            {doc.status === 'Firmado' && (
              <button
                onClick={downloadSignedDocument}
                disabled={downloading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> {downloading ? 'Descargando...' : 'Descargar Documento'}
              </button>
            )}
            <button onClick={onDelete} className="p-2 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Preview (Paper Style) */}
        <div
          ref={previewRef}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 min-h-[600px] relative"
          style={{ fontFamily: 'serif' }}
        >
          {/* Document Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{doc.title}</h1>
            {doc.description && <p className="text-slate-500 text-sm">{doc.description}</p>}
            <p className="text-xs text-slate-400 mt-2">ID: {doc.id}</p>
          </div>

          {/* Document Content */}
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-12" style={{ fontSize: '14px' }}>
            {doc.content || (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                  Ver documento PDF adjunto
                </a>
              </div>
            )}
          </div>

          {/* Signatures Section */}
          {doc.signers.some((s: any) => s.status === 'Firmado') && (
            <div className="border-t-2 border-slate-200 pt-8 mt-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Firmas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doc.signers.filter((s: any) => s.status === 'Firmado').map((signer: SignatureSigner) => (
                  <div key={signer.id} className="border border-slate-200 rounded-lg p-4">
                    {/* Signature Image */}
                    {signer.signatureData && (
                      <div className="h-20 flex items-center justify-center mb-3">
                        <img
                          src={signer.signatureData}
                          alt={`Firma de ${signer.fullName}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    {/* Signature Line */}
                    <div className="border-t border-slate-300 pt-2">
                      <p className="text-sm font-semibold text-slate-800">{signer.fullName}</p>
                      <p className="text-xs text-slate-500">{signer.role || signer.email}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Firmado: {signer.signedAt ? new Date(signer.signedAt).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Signatures */}
          {doc.signers.some((s: any) => s.status === 'Pendiente') && (
            <div className="mt-8 pt-6 border-t border-dashed border-slate-300">
              <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4">Firmas Pendientes</h3>
              <div className="flex flex-wrap gap-4">
                {doc.signers.filter((s: any) => s.status === 'Pendiente').map((signer: SignatureSigner) => (
                  <div key={signer.id} className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-amber-50/50 min-w-[200px]">
                    <div className="h-12 flex items-center justify-center text-amber-400 mb-2">
                      <Clock className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 text-center">{signer.fullName}</p>
                    <p className="text-xs text-slate-500 text-center">Pendiente</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Hash */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-[8px] text-slate-400 font-mono">
              SHA-256: {doc.hashOriginal?.substring(0, 32)}...{doc.hashFinal ? ` → ${doc.hashFinal.substring(0, 16)}...` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar: Evidence (only when not fully signed) */}
      {doc.status !== 'Firmado' && (
        <div className={`p-6 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
            <History className="w-4 h-4" /> Trazabilidad
          </h4>
          <div className="space-y-4">
            {doc.evidenceLog?.map((ev: any) => (
              <div key={ev.id} className="flex gap-3">
                <div className={`w-2 h-2 mt-2 rounded-full ${ev.event === 'signed' || ev.event === 'completed' ? 'bg-emerald-500' : ev.event === 'rejected' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-xs font-bold">{ev.detail}</p>
                  <p className="text-[9px] opacity-40">{new Date(ev.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(!doc.evidenceLog || doc.evidenceLog.length === 0) && (
              <p className="text-sm opacity-40 text-center py-8">Sin eventos</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sign Panel with Position Selection, Canvas and Text Options
const SignPanel = ({ doc, isDark, onSign, onReject, onCancel }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const documentPreviewRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'position' | 'sign' | 'reject'>('position');
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 80 }); // Percentage position
  const [isDragging, setIsDragging] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [signMode, setSignMode] = useState<'draw' | 'text'>('draw');
  const [textSignature, setTextSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState('Dancing Script');
  const [rejectReason, setRejectReason] = useState('');

  const fonts = [
    { name: 'Dancing Script', label: 'Elegante' },
    { name: 'Great Vibes', label: 'Clásica' },
    { name: 'Pacifico', label: 'Casual' },
    { name: 'Sacramento', label: 'Fluida' },
    { name: 'Satisfy', label: 'Moderna' }
  ];

  const currentSigner = doc.signers.find((s: SignatureSigner) => s.status === 'Pendiente');

  // Handle dragging the signature position
  const handlePositionMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handlePositionMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !documentPreviewRef.current) return;

    const rect = documentPreviewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setSignaturePosition({
      x: Math.max(5, Math.min(70, x)),
      y: Math.max(10, Math.min(85, y))
    });
  };

  const handlePositionMouseUp = () => {
    setIsDragging(false);
  };

  // Initialize canvas
  useEffect(() => {
    if (step !== 'sign') return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [step, signMode]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoords(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
    e.preventDefault();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoords(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    e.preventDefault();
  };

  const stopDraw = () => {
    setIsDrawing(false);
    canvasRef.current?.getContext('2d')?.beginPath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const rect = container.getBoundingClientRect();

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  };

  const generateTextSignature = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 150);

    ctx.font = `italic 48px '${selectedFont}', cursive`;
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textSignature, 300, 75);

    return canvas.toDataURL('image/png');
  };

  const handleConfirm = () => {
    let data: string;
    if (signMode === 'draw') {
      data = canvasRef.current?.toDataURL('image/png') || '';
    } else {
      data = generateTextSignature();
    }
    // Include position data with signature
    if (data) {
      onSign(data, signaturePosition);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-auto"
      onMouseMove={handlePositionMouseMove}
      onMouseUp={handlePositionMouseUp}
      onMouseLeave={handlePositionMouseUp}
    >
      <div className="max-w-5xl w-full">

        {/* Step 1: Position Signature */}
        {step === 'position' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-2">📍 Posicionar Firma</h2>
              <p className="text-white/60 text-sm">Arrastre el recuadro para ubicar donde desea firmar</p>
              <p className="text-indigo-400 text-xs mt-1">Firmando como: {currentSigner?.fullName}</p>
            </div>

            {/* Document Preview with Draggable Signature Position */}
            <div
              ref={documentPreviewRef}
              className="bg-white rounded-2xl shadow-xl p-8 min-h-[500px] relative select-none cursor-default"
              style={{ fontFamily: 'serif' }}
            >
              {/* Document Header */}
              <div className="text-center mb-6 pb-4 border-b-2 border-slate-200">
                <h1 className="text-xl font-bold text-slate-800">{doc.title}</h1>
              </div>

              {/* Document Content */}
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap mb-8">
                {doc.content?.substring(0, 800) || 'Documento PDF adjunto'}
                {doc.content?.length > 800 && '...'}
              </div>

              {/* Draggable Signature Placeholder */}
              <div
                className={`absolute border-2 border-dashed rounded-lg p-3 cursor-move transition-shadow ${isDragging ? 'border-indigo-500 shadow-lg bg-indigo-50' : 'border-amber-400 bg-amber-50/50'}`}
                style={{
                  left: `${signaturePosition.x}%`,
                  top: `${signaturePosition.y}%`,
                  width: '160px',
                  height: '60px',
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseDown={handlePositionMouseDown}
              >
                <div className="text-center">
                  <PenTool className="w-5 h-5 mx-auto text-amber-600" />
                  <p className="text-[8px] text-amber-700 font-bold mt-1">FIRMA AQUÍ</p>
                </div>
              </div>

              {/* Existing Signatures (if any) */}
              {doc.signers.filter((s: any) => s.status === 'Firmado').map((signer: any, idx: number) => (
                <div
                  key={signer.id}
                  className="absolute border border-slate-300 rounded-lg p-2 bg-white"
                  style={{
                    left: `${20 + (idx * 35)}%`,
                    bottom: '10%',
                    width: '150px'
                  }}
                >
                  {signer.signatureData && (
                    <img src={signer.signatureData} alt="" className="h-10 object-contain w-full" />
                  )}
                  <p className="text-[8px] text-slate-500 text-center mt-1">{signer.fullName}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-4 border border-white/20 text-white rounded-2xl font-bold text-sm hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep('sign')}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700"
              >
                Continuar a Firma <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Create Signature */}
        {step === 'sign' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-2">✏️ Crear Firma</h2>
              <p className="text-white/60 text-sm">Dibuje o escriba su firma</p>
            </div>

            {/* Signature Mode Tabs */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setSignMode('draw')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${signMode === 'draw' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60'}`}
              >
                ✏️ Dibujar
              </button>
              <button
                onClick={() => setSignMode('text')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${signMode === 'text' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60'}`}
              >
                🔤 Escribir
              </button>
            </div>

            {/* Draw Mode */}
            {signMode === 'draw' && (
              <div>
                <p className="text-center text-white/40 text-xs mb-2">Dibuje su firma en el recuadro blanco</p>
                <div
                  ref={containerRef}
                  className="relative h-48 rounded-2xl overflow-hidden bg-white shadow-lg"
                >
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 cursor-crosshair touch-none"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
                <button
                  onClick={clearCanvas}
                  className="mt-2 mx-auto block px-4 py-2 bg-white/10 text-white/60 rounded-lg text-xs font-bold hover:bg-white/20"
                >
                  🗑️ Limpiar
                </button>
              </div>
            )}

            {/* Text Mode */}
            {signMode === 'text' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={textSignature}
                  onChange={e => setTextSignature(e.target.value)}
                  placeholder="Escriba su nombre..."
                  className="w-full p-4 rounded-xl bg-white text-slate-900 text-xl text-center outline-none"
                  style={{ fontFamily: `'${selectedFont}', cursive`, fontStyle: 'italic' }}
                />

                <div className="flex flex-wrap justify-center gap-2">
                  {fonts.map(font => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(font.name)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${selectedFont === font.name ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60'}`}
                      style={{ fontFamily: `'${font.name}', cursive` }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>

                {textSignature && (
                  <div className="bg-white rounded-xl p-6 text-center">
                    <p
                      className="text-4xl text-slate-800"
                      style={{ fontFamily: `'${selectedFont}', cursive`, fontStyle: 'italic' }}
                    >
                      {textSignature}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('position')}
                className="py-4 px-6 border border-white/20 text-white rounded-2xl font-bold text-sm hover:bg-white/5"
              >
                ← Volver
              </button>
              <button
                onClick={() => setStep('reject')}
                className="py-4 px-6 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700"
              >
                Rechazar
              </button>
              <button
                onClick={handleConfirm}
                disabled={signMode === 'text' && !textSignature}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-40"
              >
                <Check className="w-5 h-5" /> Confirmar Firma
              </button>
            </div>
          </div>
        )}

        {/* Reject Mode */}
        {step === 'reject' && (
          <div className="text-center space-y-6 max-w-md mx-auto">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h3 className="text-2xl font-black text-white">Rechazar Documento</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white outline-none resize-none h-32"
            />
            <div className="flex gap-4">
              <button onClick={() => setStep('sign')} className="flex-1 py-3 border border-white/20 text-white rounded-xl font-bold text-sm">
                Volver
              </button>
              <button
                onClick={() => onReject(rejectReason)}
                disabled={!rejectReason}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-40"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignatureModule;

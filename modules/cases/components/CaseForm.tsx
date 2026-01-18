import React, { useState } from 'react';
import {
    CaseRequest,
    CaseRequestType
} from '../../../types';
import {
    X,
    Save,
    Upload,
    User,
    Building2,
    FileText
} from 'lucide-react';

interface Props {
    isDark: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<CaseRequest>, file: File | null) => Promise<void>;
    institutions: Array<{ id: string, name: string }>;
    currentUser: { id: string, name: string };
}

const CaseForm: React.FC<Props> = ({ isDark, onClose, onSubmit, institutions, currentUser }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<CaseRequest>>({
        requestDate: new Date().toISOString().split('T')[0],
        createdBy: currentUser.id,
        status: 'Nuevo'
    });
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientName || !formData.institutionId || !formData.requestType) return;

        setLoading(true);
        try {
            // Find institution name
            const inst = institutions.find(i => i.id === formData.institutionId);
            await onSubmit({ ...formData, institutionName: inst?.name || 'Desconocida' }, file);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-inherit z-10">
                    <h3 className="text-xl font-black uppercase tracking-tight">Nuevo Caso / Reclamo</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest opacity-60">Paciente</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                                <input
                                    required
                                    type="text"
                                    placeholder="Nombre Completo"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest opacity-60">Identificación (RUT/ID)</label>
                            <input
                                required
                                type="text"
                                placeholder="Ej: 12.345.678-9"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest opacity-60">Institución</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                                <select
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                                    onChange={e => setFormData({ ...formData, institutionId: e.target.value })}
                                >
                                    <option value="">Seleccionar Centro...</option>
                                    {institutions.map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest opacity-60">Tipo Solicitud</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                                onChange={e => setFormData({ ...formData, requestType: e.target.value as CaseRequestType })}
                            >
                                <option value="">Seleccionar Tipo...</option>
                                <option value="Reclamo de Informe">Reclamo de Informe</option>
                                <option value="Revisión Diagnóstica">Revisión Diagnóstica</option>
                                <option value="Consulta Especializada">Consulta Especializada</option>
                                <option value="Caso Discrepancia">Caso Discrepancia</option>
                                <option value="Segunda Opinión">Segunda Opinión</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-60">Motivo / Descripción del Caso</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Describa el motivo detallado de la solicitud..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                        <label className="flex items-center gap-4 cursor-pointer">
                            <div className="p-3 bg-blue-100 dark:bg-slate-800 rounded-xl text-blue-600">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold uppercase tracking-wide">Adjuntar Informe / Evidencia</p>
                                <p className="text-xs opacity-50">{file ? file.name : 'PDF, JPG, PNG (Max 10MB)'}</p>
                            </div>
                            <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-60 hover:opacity-100"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : <><Save className="w-4 h-4" /> Crear Caso</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CaseForm;

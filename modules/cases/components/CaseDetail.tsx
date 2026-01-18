import React, { useState } from 'react';
import {
    CaseRequest,
    CaseStatus,
    AgrawallAnalysis
} from '../../../types';
import {
    ArrowLeft,
    Calendar,
    User,
    Building2,
    FileText,
    ShieldCheck,
    MoreVertical,
    CheckCircle2,
    AlertTriangle,
    Clock,
    MessageSquare
} from 'lucide-react';
import AuditPanel from '../../agrawall/components/AuditPanel';

interface Props {
    isDark: boolean;
    caseItem: CaseRequest;
    onBack: () => void;
    onStatusChange: (status: CaseStatus, notes?: string) => Promise<void>;
    onLinkAgrawall: (analysis: AgrawallAnalysis) => Promise<void>;
    statusLoading: boolean;
}

const CaseDetail: React.FC<Props> = ({
    isDark,
    caseItem,
    onBack,
    onStatusChange,
    onLinkAgrawall,
    statusLoading
}) => {
    const [showAgrawall, setShowAgrawall] = useState(false);

    // Agrawall Integration State
    const [reportText, setReportText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [analysisResult, setAnalysisResult] = useState<AgrawallAnalysis | null>(null);

    const handleAgrawallComplete = async () => {
        // This is a simplified mock. In real impl, we'd call the service.
        // Assuming AuditPanel handles the API call and returns 'analysis' obj via prop/callback 
        // but AuditPanel prop structure is a bit rigid. 
        // Ideally we refactor AuditPanel to pass back the result.
        // For now we assume local state 'analysisResult' is set by AuditPanel
        if (analysisResult) {
            await onLinkAgrawall(analysisResult);
            setShowAgrawall(false);
        }
    };

    const getStatusColor = (status: CaseStatus) => {
        switch (status) {
            case 'Nuevo': return 'bg-blue-500';
            case 'En Proceso': return 'bg-amber-500';
            case 'Resuelto': return 'bg-emerald-500';
            case 'Revisión IA': return 'bg-indigo-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{caseItem.patientName}</h2>
                    <p className="opacity-50 text-xs font-bold uppercase tracking-widest">ID: {caseItem.id} · {caseItem.requestType}</p>
                </div>
                <div className="flex-1" />
                <div className={`px-4 py-2 rounded-xl text-white font-black uppercase tracking-widest text-xs shadow-lg ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className={`p-8 rounded-[32px] border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5" /> Detalles del Caso
                        </h3>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <InfoItem icon={<User />} label="Paciente ID" value={caseItem.patientId} />
                            <InfoItem icon={<Building2 />} label="Institución" value={caseItem.institutionName} />
                            <InfoItem icon={<Calendar />} label="Fecha Solicitud" value={new Date(caseItem.requestDate).toLocaleDateString()} />
                            <InfoItem icon={<User />} label="Médico Referente" value={caseItem.referringPhysicianName || 'N/A'} />
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <p className="text-sm leading-relaxed whitespace-pre-line">{caseItem.description}</p>
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    <div className={`p-8 rounded-[32px] border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-500" /> Auditoría IA Agrawall
                            </h3>
                            {!caseItem.agrawallLevel && (
                                <button
                                    onClick={() => setShowAgrawall(!showAgrawall)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all"
                                >
                                    {showAgrawall ? 'Cancelar' : 'Iniciar Análisis'}
                                </button>
                            )}
                        </div>

                        {caseItem.agrawallLevel !== undefined ? (
                            <div className="flex items-center gap-6 p-6 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl">
                                <div className="text-4xl font-black text-indigo-500">{caseItem.agrawallLevel}</div>
                                <div>
                                    <h4 className="font-bold uppercase mb-1">Análisis Completado</h4>
                                    <p className="text-xs opacity-60">Nivel de discrepancia registrado. Ver detalles completos en módulo Agrawall.</p>
                                </div>
                            </div>
                        ) : showAgrawall ? (
                            // We reuse AuditPanel here but we need to inject the logic to capture result
                            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                                {/* 
                     NOTE: In a real implementation this would need AuditPanel to support a callback 'onAnalysisComplete' 
                     that returns the result object so we can save it.
                     For now, we render a placeholder for the integration.
                 */}
                                <p className="text-center font-bold opacity-50 mb-4">Panel de Integración IA (Simulado)</p>
                                <AuditPanel
                                    isDark={isDark}
                                    reportText={reportText}
                                    setReportText={setReportText}
                                    file={file}
                                    setFile={setFile}
                                    status={analysisStatus}
                                    analysis={analysisResult}
                                    onAnalyze={async () => {
                                        // Simulate analysis flow
                                        setAnalysisStatus('processing');
                                        setTimeout(() => {
                                            const mockResult: any = {
                                                scaleLevel: 2,
                                                levelName: 'Discrepancia Menor',
                                                category: 'Percepción',
                                                technicalAnalysis: 'Simulated analysis result...',
                                                safetyRecommendation: 'Review required',
                                                clinicalImpactDetails: 'Low impact',
                                                findingsEvaluation: { identification: '', terminology: '', correlation: '' },
                                                metadata: { ...caseItem } as any
                                            };
                                            setAnalysisResult(mockResult);
                                            setAnalysisStatus('success');
                                            onLinkAgrawall(mockResult);
                                        }, 2000);
                                    }}
                                />
                            </div>
                        ) : (
                            <p className="text-sm opacity-50 italic">No hay análisis de IA vinculado a este caso.</p>
                        )}
                    </div>
                </div>

                {/* Workflow Sidebar */}
                <div className="space-y-6">
                    <div className={`p-6 rounded-[32px] border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-sm font-black uppercase tracking-widest opacity-60 mb-4">Workflow</h4>
                        <div className="space-y-2">
                            <WorkflowAction
                                label="Iniciar Gestión"
                                active={caseItem.status === 'Nuevo'}
                                onClick={() => onStatusChange('En Proceso')}
                                icon={<Clock className="w-4 h-4" />}
                            />
                            <WorkflowAction
                                label="Solicitar Info"
                                active={caseItem.status === 'En Proceso'}
                                onClick={() => onStatusChange('Pendiente Información')}
                                icon={<MessageSquare className="w-4 h-4" />}
                            />
                            <WorkflowAction
                                label="Marcar Resuelto"
                                active={caseItem.status !== 'Resuelto' && caseItem.status !== 'Cerrado Conforme'}
                                onClick={() => onStatusChange('Resuelto')}
                                icon={<CheckCircle2 className="w-4 h-4" />}
                                color="text-emerald-500 hover:bg-emerald-500/10"
                            />
                        </div>
                    </div>

                    <div className={`p-6 rounded-[32px] border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-sm font-black uppercase tracking-widest opacity-60 mb-4">Historial</h4>
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                            {caseItem.statusHistory.map((h, i) => (
                                <div key={i} className="relative pl-8">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-900" />
                                    <p className="text-xs font-bold uppercase tracking-wide">{h.status}</p>
                                    <p className="text-[10px] opacity-50">{new Date(h.changedAt).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon, label, value }: any) => (
    <div className="flex gap-3 items-center">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg opacity-60">{icon}</div>
        <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</p>
            <p className="font-bold text-sm truncate max-w-[150px]">{value}</p>
        </div>
    </div>
);

const WorkflowAction = ({ label, icon, active, onClick, color = 'text-blue-500 hover:bg-blue-500/10' }: any) => (
    <button
        disabled={!active}
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wide
    ${active ? color : 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800'}`}
    >
        {icon} {label}
    </button>
);

export default CaseDetail;

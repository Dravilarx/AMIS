
import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Check,
  Filter,
  Layers,
  Hash,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  Eye,
  Users,
  Building2,
  Link,
  Tag,
  Grid3X3,
  List,
  ExternalLink,
  Image,
  FileSpreadsheet,
  File,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { useDocumentRepository } from '../hooks/useDocumentRepository';
import { useEmployees } from '../hooks/useEmployees';
import { useInstitutions } from '../hooks/useInstitutions';
import DocumentViewer from '../components/DocumentViewer';
import DocumentUploader from '../components/DocumentUploader';
import {
  CentralDocument,
  RCDDocumentProfile,
  ProfileAssignment,
  DocumentCategory,
  UserSession
} from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

type ViewTab = 'repository' | 'profiles' | 'assignments';
type ViewMode = 'grid' | 'list';

const DocumentationModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const {
    documents,
    profiles,
    assignments,
    isLoading,
    uploadDocument,
    addExternalLink,
    updateDocumentMetadata,
    deleteDocument,
    saveProfile,
    deleteProfile,
    assignProfile,
    updateAssignmentStatus,
    getDocumentsByProfile,
    getCompletionPercentage
  } = useDocumentRepository();

  const { employees } = useEmployees();
  const { institutions } = useInstitutions();

  // State
  const [activeTab, setActiveTab] = useState<ViewTab>('repository');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [selectedDocument, setSelectedDocument] = useState<CentralDocument | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [editingProfile, setEditingProfile] = useState<RCDDocumentProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, categoryFilter]);

  // Stats
  const stats = useMemo(() => ({
    totalDocs: documents.length,
    byCategory: {
      Legal: documents.filter(d => d.category === 'Legal').length,
      Clínico: documents.filter(d => d.category === 'Clínico').length,
      Administrativo: documents.filter(d => d.category === 'Administrativo').length,
      Capacitación: documents.filter(d => d.category === 'Capacitación').length,
      Contrato: documents.filter(d => d.category === 'Contrato').length,
      Técnico: documents.filter(d => d.category === 'Técnico').length,
      Otro: documents.filter(d => d.category === 'Otro').length,
    },
    profilesCount: profiles.length,
    assignmentsCount: assignments.length
  }), [documents, profiles, assignments]);

  const getFileIcon = (doc: CentralDocument) => {
    switch (doc.fileType) {
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />;
      case 'image': return <Image className="w-6 h-6 text-purple-500" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
      default: return <File className="w-6 h-6 text-blue-500" />;
    }
  };

  const handleUpload = async (file: File, metadata: any) => {
    await uploadDocument(file, metadata, currentUser.id);
  };

  const handleAddLink = async (url: string, metadata: any) => {
    await addExternalLink(url, metadata, currentUser.id);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm('¿Eliminar este documento del repositorio?')) {
      await deleteDocument(docId);
    }
  };

  const handleCreateProfile = () => {
    setEditingProfile({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      documentIds: [],
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicableTo: ['employee']
    });
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (editingProfile && editingProfile.name.trim()) {
      await saveProfile(editingProfile);
      setShowProfileModal(false);
      setEditingProfile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Cargando Repositorio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Repositorio Central</h2>
          <p className="opacity-40 text-lg font-medium italic">Sistema unificado de documentación institucional</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowUploader(true)}
            className="px-8 py-5 bg-blue-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-blue-500/30"
          >
            <UploadCloud className="w-5 h-5" />
            Nuevo Documento
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Docs" value={stats.totalDocs} icon={<FolderOpen className="text-blue-500" />} isDark={isDark} />
        <StatCard label="Perfiles" value={stats.profilesCount} icon={<Layers className="text-purple-500" />} isDark={isDark} />
        <StatCard label="Asignaciones" value={stats.assignmentsCount} icon={<Users className="text-emerald-500" />} isDark={isDark} />
        <StatCard label="Categorías" value={Object.values(stats.byCategory).filter(v => v > 0).length} icon={<Tag className="text-amber-500" />} isDark={isDark} />
      </div>

      {/* Tab Navigation */}
      <div className={`p-2 rounded-[32px] inline-flex ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {[
          { key: 'repository', label: 'Repositorio', icon: <FolderOpen className="w-4 h-4" /> },
          { key: 'profiles', label: 'Perfiles', icon: <Layers className="w-4 h-4" /> },
          { key: 'assignments', label: 'Asignaciones', icon: <Users className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ViewTab)}
            className={`px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600'
                : 'opacity-50 hover:opacity-100'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Repository View */}
      {activeTab === 'repository' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`w-full pl-14 pr-6 py-5 rounded-[24px] border outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-800 focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500'}`}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className={`px-6 py-5 rounded-[24px] border outline-none font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <option value="all">Todas las Categorías</option>
              <option value="Legal">Legal</option>
              <option value="Clínico">Clínico</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Capacitación">Capacitación</option>
              <option value="Contrato">Contrato</option>
              <option value="Técnico">Técnico</option>
              <option value="Otro">Otro</option>
            </select>
            <div className="flex gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-40'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-40'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Documents Grid/List */}
          {filteredDocuments.length === 0 ? (
            <div className={`p-16 rounded-[48px] border-2 border-dashed text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <FolderOpen className="w-20 h-20 mx-auto opacity-10 mb-6" />
              <p className="text-xl font-black uppercase tracking-tight opacity-40 mb-2">Repositorio Vacío</p>
              <p className="text-sm opacity-30 mb-6">Comienza agregando documentos al repositorio central</p>
              <button
                onClick={() => setShowUploader(true)}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Agregar Documento
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map(doc => (
                <div
                  key={doc.id}
                  className={`p-6 rounded-[32px] border transition-all hover:scale-105 cursor-pointer group ${isDark ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500 shadow-sm'}`}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                      {getFileIcon(doc)}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                        className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tight mb-2 line-clamp-2">{doc.name}</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase ${getCategoryStyle(doc.category)}`}>
                      {doc.category}
                    </span>
                    {doc.storageType === 'external_link' && (
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-600 rounded-xl text-[8px] font-black uppercase">
                        Enlace
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold opacity-30 uppercase">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-[32px] border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full">
                <thead className={isDark ? 'bg-slate-800' : 'bg-slate-50'}>
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Documento</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Categoría</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Tipo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Fecha</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest opacity-40">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map(doc => (
                    <tr
                      key={doc.id}
                      className={`border-t cursor-pointer transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'}`}
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {getFileIcon(doc)}
                          <span className="font-bold text-sm">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${getCategoryStyle(doc.category)}`}>
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold uppercase opacity-60">{doc.fileType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold opacity-40">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedDocument(doc); }}
                            className="p-2 hover:bg-blue-500/10 hover:text-blue-500 rounded-xl transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Profiles View */}
      {activeTab === 'profiles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{profiles.length} Perfiles Documentales</p>
            <button
              onClick={handleCreateProfile}
              className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              Nuevo Perfil
            </button>
          </div>

          {profiles.length === 0 ? (
            <div className={`p-16 rounded-[48px] border-2 border-dashed text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <Layers className="w-20 h-20 mx-auto opacity-10 mb-6" />
              <p className="text-xl font-black uppercase tracking-tight opacity-40 mb-2">Sin Perfiles</p>
              <p className="text-sm opacity-30 mb-6">Crea perfiles para agrupar documentos requeridos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className={`p-8 rounded-[40px] border transition-all hover:border-blue-500 group ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl">
                      <Hash className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => { setEditingProfile(profile); setShowProfileModal(true); }}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-blue-500 hover:scale-110 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-red-500 hover:scale-110 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight mb-2">{profile.name}</h4>
                  <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-6 line-clamp-2">{profile.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.documentIds.slice(0, 3).map(docId => {
                      const doc = documents.find(d => d.id === docId);
                      return doc ? (
                        <span key={docId} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[8px] font-black uppercase">
                          {doc.name.substring(0, 20)}...
                        </span>
                      ) : null;
                    })}
                    {profile.documentIds.length > 3 && (
                      <span className="px-3 py-1.5 bg-blue-600/10 text-blue-600 rounded-xl text-[8px] font-black uppercase">
                        +{profile.documentIds.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments View */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{assignments.length} Asignaciones Activas</p>

          {assignments.length === 0 ? (
            <div className={`p-16 rounded-[48px] border-2 border-dashed text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <Users className="w-20 h-20 mx-auto opacity-10 mb-6" />
              <p className="text-xl font-black uppercase tracking-tight opacity-40 mb-2">Sin Asignaciones</p>
              <p className="text-sm opacity-30">Los perfiles aún no han sido asignados a entidades</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map(assignment => {
                const profile = profiles.find(p => p.id === assignment.profileId);
                const entity = assignment.entityType === 'employee'
                  ? employees.find(e => e.id === assignment.entityId)
                  : institutions.find(i => i.id === assignment.entityId);
                const completion = getCompletionPercentage(assignment.id);

                return (
                  <div
                    key={assignment.id}
                    className={`p-6 rounded-[32px] border flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        {assignment.entityType === 'employee' ? <Users className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">
                          {assignment.entityType === 'employee' && entity
                            ? `${(entity as any).firstName} ${(entity as any).lastName}`
                            : (entity as any)?.name || 'Entidad Desconocida'}
                        </p>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                          Perfil: {profile?.name || 'Desconocido'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold opacity-40">Completado</span>
                          <span className="text-[10px] font-black">{completion}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${completion === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 opacity-20" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isDark={isDark}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowUploader(false)} />
          <div className="relative w-full max-w-2xl">
            <DocumentUploader
              isDark={isDark}
              onUpload={handleUpload}
              onAddLink={handleAddLink}
              onClose={() => setShowUploader(false)}
            />
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && editingProfile && (
        <ProfileEditModal
          isDark={isDark}
          profile={editingProfile}
          documents={documents}
          onClose={() => { setShowProfileModal(false); setEditingProfile(null); }}
          onSave={handleSaveProfile}
          onChange={setEditingProfile}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ label, value, icon, isDark }: { label: string; value: number | string; icon: React.ReactNode; isDark: boolean }) => (
  <div className={`p-6 rounded-[32px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">{icon}</div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
    <h3 className="text-3xl font-black">{value}</h3>
  </div>
);

const getCategoryStyle = (category: DocumentCategory): string => {
  const styles: Record<DocumentCategory, string> = {
    'Legal': 'bg-red-500/10 text-red-600',
    'Clínico': 'bg-emerald-500/10 text-emerald-600',
    'Administrativo': 'bg-blue-500/10 text-blue-600',
    'Capacitación': 'bg-purple-500/10 text-purple-600',
    'Contrato': 'bg-amber-500/10 text-amber-600',
    'Técnico': 'bg-cyan-500/10 text-cyan-600',
    'Otro': 'bg-slate-500/10 text-slate-600'
  };
  return styles[category] || styles['Otro'];
};

// Profile Edit Modal Component
const ProfileEditModal: React.FC<{
  isDark: boolean;
  profile: RCDDocumentProfile;
  documents: CentralDocument[];
  onClose: () => void;
  onSave: () => void;
  onChange: (profile: RCDDocumentProfile) => void;
}> = ({ isDark, profile, documents, onClose, onSave, onChange }) => {
  const [search, setSearch] = useState('');

  const filteredDocs = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleDocument = (docId: string) => {
    const current = profile.documentIds;
    const next = current.includes(docId)
      ? current.filter(id => id !== docId)
      : [...current, docId];
    onChange({ ...profile, documentIds: next });
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="p-8 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-2xl font-black uppercase tracking-tighter">Configurar Perfil</h3>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Seleccione los documentos requeridos</p>
        </div>

        <div className="p-8 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-8">
            {/* Left: Profile Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Nombre del Perfil</label>
                <input
                  value={profile.name}
                  onChange={e => onChange({ ...profile, name: e.target.value })}
                  placeholder="Ej. Acreditación Médico"
                  className={`w-full px-5 py-4 rounded-2xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Descripción</label>
                <textarea
                  value={profile.description}
                  onChange={e => onChange({ ...profile, description: e.target.value })}
                  placeholder="Describe el propósito del perfil..."
                  rows={3}
                  className={`w-full px-5 py-4 rounded-2xl border outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Aplicable a</label>
                <div className="flex gap-3">
                  {['employee', 'institution'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        const current = profile.applicableTo;
                        const next = current.includes(type as any)
                          ? current.filter(t => t !== type)
                          : [...current, type as any];
                        onChange({ ...profile, applicableTo: next });
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${profile.applicableTo.includes(type as any)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 opacity-50'
                        }`}
                    >
                      {type === 'employee' ? 'Empleados' : 'Instituciones'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Documents */}
              <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
                  {profile.documentIds.length} Documentos Seleccionados
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.documentIds.map(docId => {
                    const doc = documents.find(d => d.id === docId);
                    return doc ? (
                      <span key={docId} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase shadow-sm">
                        {doc.name.substring(0, 25)}
                        <X className="w-3 h-3 cursor-pointer text-red-500" onClick={() => toggleDocument(docId)} />
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Right: Document Selection */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {filteredDocs.map(doc => {
                  const isSelected = profile.documentIds.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => toggleDocument(doc.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : isDark
                            ? 'bg-slate-800 border-slate-700 hover:border-blue-500'
                            : 'bg-white border-slate-200 hover:border-blue-500'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-white/20 border-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-tight">{doc.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-200 dark:border-slate-800 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!profile.name.trim()}
            className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 disabled:opacity-30 transition-all"
          >
            Guardar Perfil
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModule;

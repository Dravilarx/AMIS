import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Link, X, File, FileText, Image, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { DocumentCategory, DocumentAccessLevel, DocumentFileType } from '../types';

interface DocumentUploaderProps {
    isDark: boolean;
    onUpload: (file: File, metadata: UploadMetadata) => Promise<void>;
    onAddLink: (url: string, metadata: LinkMetadata) => Promise<void>;
    onClose?: () => void;
}

interface UploadMetadata {
    name?: string;
    category: DocumentCategory;
    tags?: string[];
    description?: string;
    expiryDate?: string;
    accessLevel?: DocumentAccessLevel;
}

interface LinkMetadata extends UploadMetadata {
    name: string;
    fileType?: DocumentFileType;
}

type UploadMode = 'file' | 'link';

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ isDark, onUpload, onAddLink, onClose }) => {
    const [mode, setMode] = useState<UploadMode>('file');
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [externalUrl, setExternalUrl] = useState('');
    const [linkName, setLinkName] = useState('');
    const [category, setCategory] = useState<DocumentCategory>('Administrativo');
    const [tags, setTags] = useState('');
    const [description, setDescription] = useState('');
    const [accessLevel, setAccessLevel] = useState<DocumentAccessLevel>('restricted');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setSelectedFile(files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <Image className="w-6 h-6 text-purple-500" />;
        if (file.type === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
        if (file.type.includes('spreadsheet') || file.type.includes('excel')) return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
        return <File className="w-6 h-6 text-blue-500" />;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    const handleSubmit = async () => {
        setIsUploading(true);
        setUploadStatus('idle');

        try {
            const metadata: UploadMetadata = {
                category,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                description: description.trim() || undefined,
                accessLevel
            };

            if (mode === 'file' && selectedFile) {
                await onUpload(selectedFile, { ...metadata, name: selectedFile.name });
            } else if (mode === 'link' && externalUrl && linkName) {
                await onAddLink(externalUrl, { ...metadata, name: linkName });
            }

            setUploadStatus('success');
            // Reset form
            setTimeout(() => {
                setSelectedFile(null);
                setExternalUrl('');
                setLinkName('');
                setTags('');
                setDescription('');
                setUploadStatus('idle');
                onClose?.();
            }, 1500);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    const isValid = mode === 'file' ? !!selectedFile : (!!externalUrl && !!linkName);

    return (
        <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            {/* Mode Selector */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight">Agregar Documento</h3>
                <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <button
                        onClick={() => setMode('file')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'file' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'opacity-50 hover:opacity-100'}`}
                    >
                        <UploadCloud className="w-4 h-4" />
                        Archivo
                    </button>
                    <button
                        onClick={() => setMode('link')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'link' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'opacity-50 hover:opacity-100'}`}
                    >
                        <Link className="w-4 h-4" />
                        Enlace
                    </button>
                </div>
            </div>

            {/* File Upload Zone */}
            {mode === 'file' && (
                <div className="mb-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {!selectedFile ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${isDragging
                                    ? 'border-blue-500 bg-blue-500/5'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-500/5'
                                }`}
                        >
                            <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'opacity-20'}`} />
                            <p className="text-sm font-bold mb-2">
                                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic para seleccionar'}
                            </p>
                            <p className="text-[10px] font-bold uppercase opacity-40">
                                PDF, Imágenes, Documentos, Hojas de cálculo
                            </p>
                        </div>
                    ) : (
                        <div className={`p-6 rounded-3xl border flex items-center justify-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                                {getFileIcon(selectedFile)}
                                <div>
                                    <p className="text-sm font-bold">{selectedFile.name}</p>
                                    <p className="text-[10px] font-bold opacity-40 uppercase">{formatFileSize(selectedFile.size)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Link Input */}
            {mode === 'link' && (
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">URL del Documento</label>
                        <input
                            type="url"
                            value={externalUrl}
                            onChange={e => setExternalUrl(e.target.value)}
                            placeholder="https://..."
                            className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Nombre del Documento</label>
                        <input
                            type="text"
                            value={linkName}
                            onChange={e => setLinkName(e.target.value)}
                            placeholder="Ej. Manual de Procedimientos"
                            className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                        />
                    </div>
                </div>
            )}

            {/* Metadata Fields */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Categoría</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value as DocumentCategory)}
                        className={`w-full px-5 py-4 rounded-2xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                        <option value="Legal">Legal</option>
                        <option value="Clínico">Clínico</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Capacitación">Capacitación</option>
                        <option value="Contrato">Contrato</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Acceso</label>
                    <select
                        value={accessLevel}
                        onChange={e => setAccessLevel(e.target.value as DocumentAccessLevel)}
                        className={`w-full px-5 py-4 rounded-2xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                        <option value="public">Público</option>
                        <option value="restricted">Restringido</option>
                        <option value="confidential">Confidencial</option>
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Etiquetas (separadas por coma)</label>
                <input
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="Ej. acreditación, médico, obligatorio"
                    className={`w-full px-5 py-4 rounded-2xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                />
            </div>

            <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Descripción (opcional)</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Breve descripción del documento..."
                    rows={2}
                    className={`w-full px-5 py-4 rounded-2xl border outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!isValid || isUploading}
                    className={`flex-1 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${uploadStatus === 'success'
                            ? 'bg-emerald-500 text-white'
                            : uploadStatus === 'error'
                                ? 'bg-red-500 text-white'
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30'
                        }`}
                >
                    {isUploading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Subiendo...
                        </>
                    ) : uploadStatus === 'success' ? (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            ¡Documento Agregado!
                        </>
                    ) : uploadStatus === 'error' ? (
                        <>
                            <AlertCircle className="w-5 h-5" />
                            Error al subir
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-5 h-5" />
                            {mode === 'file' ? 'Subir Archivo' : 'Agregar Enlace'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DocumentUploader;

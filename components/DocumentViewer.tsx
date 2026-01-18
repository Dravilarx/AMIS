import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, ExternalLink, FileText, Image, FileSpreadsheet, File } from 'lucide-react';
import { CentralDocument } from '../types';

interface DocumentViewerProps {
    document: CentralDocument | null;
    isDark: boolean;
    onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, isDark, onClose }) => {
    const [zoom, setZoom] = useState(100);

    if (!document) return null;

    const url = document.storageType === 'uploaded' ? document.fileUrl : document.externalLink;

    const getFileIcon = () => {
        switch (document.fileType) {
            case 'pdf': return <FileText className="w-8 h-8" />;
            case 'image': return <Image className="w-8 h-8" />;
            case 'spreadsheet': return <FileSpreadsheet className="w-8 h-8" />;
            default: return <File className="w-8 h-8" />;
        }
    };

    const renderContent = () => {
        if (!url) {
            return (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                    {getFileIcon()}
                    <p className="mt-4 text-sm font-bold">No hay URL disponible para este documento</p>
                </div>
            );
        }

        switch (document.fileType) {
            case 'pdf':
                return (
                    <iframe
                        src={`${url}#toolbar=0&navpanes=0`}
                        className="w-full h-full rounded-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    />
                );

            case 'image':
                return (
                    <div className="flex items-center justify-center h-full overflow-auto">
                        <img
                            src={url}
                            alt={document.name}
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                            style={{ transform: `scale(${zoom / 100})` }}
                        />
                    </div>
                );

            case 'spreadsheet':
                // For spreadsheets, we'll show a preview link or embed Google Sheets viewer
                if (url.includes('docs.google.com') || url.includes('sheets.google.com')) {
                    return (
                        <iframe
                            src={url.replace('/edit', '/preview')}
                            className="w-full h-full rounded-2xl"
                        />
                    );
                }
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <FileSpreadsheet className="w-16 h-16 opacity-30 mb-4" />
                        <p className="text-sm font-bold opacity-60 mb-4">Vista previa no disponible para este tipo de archivo</p>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Abrir en nueva pestaña
                        </a>
                    </div>
                );

            case 'markdown':
            case 'text':
                return (
                    <iframe
                        src={url}
                        className="w-full h-full rounded-2xl bg-white dark:bg-slate-900"
                    />
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        {getFileIcon()}
                        <p className="text-sm font-bold opacity-60 mt-4 mb-4">Vista previa no disponible</p>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Abrir documento
                        </a>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />

            <div className={`relative w-full max-w-6xl h-[90vh] rounded-[48px] border overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-8 py-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
                            {getFileIcon()}
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">{document.name}</h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                {document.category} • {document.fileType.toUpperCase()}
                                {document.fileSizeBytes && ` • ${(document.fileSizeBytes / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Zoom controls */}
                        {(document.fileType === 'pdf' || document.fileType === 'image') && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <button
                                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold w-12 text-center">{zoom}%</span>
                                <button
                                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Download */}
                        {url && (
                            <a
                                href={url}
                                download={document.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"
                                title="Descargar"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        )}

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-hidden">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;

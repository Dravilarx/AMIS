import { useState, useEffect, useCallback } from 'react';
import {
    CentralDocument,
    RCDDocumentProfile,
    ProfileAssignment,
    ProfileCompletionItem,
    DocumentFileType,
    DocumentCategory,
    DocumentAccessLevel
} from '../types';
import {
    addDocument,
    getDocuments,
    updateDocument as updateFirestoreDoc,
    deleteDocument as deleteFirestoreDoc,
    setDocument
} from '../services/firestoreService';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../services/firebaseConfig';

// Collection names
const DOCUMENTS_COLLECTION = 'central_documents';
const PROFILES_COLLECTION = 'document_profiles';
const ASSIGNMENTS_COLLECTION = 'profile_assignments';

// Helper to determine file type from MIME
const getFileTypeFromMime = (mimeType: string): DocumentFileType => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
    if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') return 'markdown';
    if (mimeType.startsWith('text/')) return 'text';
    return 'other';
};

// Initial empty data
const INITIAL_DOCUMENTS: CentralDocument[] = [];
const INITIAL_PROFILES: RCDDocumentProfile[] = [];
const INITIAL_ASSIGNMENTS: ProfileAssignment[] = [];

export const useDocumentRepository = () => {
    const [documents, setDocuments] = useState<CentralDocument[]>(INITIAL_DOCUMENTS);
    const [profiles, setProfiles] = useState<RCDDocumentProfile[]>(INITIAL_PROFILES);
    const [assignments, setAssignments] = useState<ProfileAssignment[]>(INITIAL_ASSIGNMENTS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load all data from Firestore
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [docsData, profilesData, assignmentsData] = await Promise.all([
                    getDocuments(DOCUMENTS_COLLECTION),
                    getDocuments(PROFILES_COLLECTION),
                    getDocuments(ASSIGNMENTS_COLLECTION)
                ]);
                setDocuments(docsData as CentralDocument[]);
                setProfiles(profilesData as RCDDocumentProfile[]);
                setAssignments(assignmentsData as ProfileAssignment[]);
            } catch (err) {
                console.error('Error loading document repository:', err);
                setError('Error al cargar el repositorio de documentos');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // ==================== DOCUMENT OPERATIONS ====================

    // Upload a file to Firebase Storage and create document record
    const uploadDocument = useCallback(async (
        file: File,
        metadata: {
            name?: string;
            category: DocumentCategory;
            tags?: string[];
            description?: string;
            expiryDate?: string;
            accessLevel?: DocumentAccessLevel;
        },
        uploadedBy: string
    ): Promise<CentralDocument | null> => {
        try {
            const docId = crypto.randomUUID();
            const storagePath = `documents/${docId}/${file.name}`;
            const storageRef = ref(storage, storagePath);

            // Upload file
            await uploadBytes(storageRef, file);
            const fileUrl = await getDownloadURL(storageRef);

            const now = new Date().toISOString();
            const newDoc: CentralDocument = {
                id: docId,
                name: metadata.name || file.name,
                fileType: getFileTypeFromMime(file.type),
                storageType: 'uploaded',
                fileUrl,
                fileSizeBytes: file.size,
                mimeType: file.type,
                uploadedBy,
                uploadedAt: now,
                updatedAt: now,
                tags: metadata.tags || [],
                category: metadata.category,
                description: metadata.description,
                expiryDate: metadata.expiryDate,
                accessLevel: metadata.accessLevel || 'restricted'
            };

            await setDocument(DOCUMENTS_COLLECTION, docId, newDoc);
            setDocuments(prev => [...prev, newDoc]);
            return newDoc;
        } catch (err) {
            console.error('Error uploading document:', err);
            setError('Error al subir el documento');
            return null;
        }
    }, []);

    // Add external link as document
    const addExternalLink = useCallback(async (
        url: string,
        metadata: {
            name: string;
            category: DocumentCategory;
            tags?: string[];
            description?: string;
            expiryDate?: string;
            accessLevel?: DocumentAccessLevel;
            fileType?: DocumentFileType;
        },
        uploadedBy: string
    ): Promise<CentralDocument | null> => {
        try {
            const docId = crypto.randomUUID();
            const now = new Date().toISOString();

            const newDoc: CentralDocument = {
                id: docId,
                name: metadata.name,
                fileType: metadata.fileType || 'other',
                storageType: 'external_link',
                externalLink: url,
                uploadedBy,
                uploadedAt: now,
                updatedAt: now,
                tags: metadata.tags || [],
                category: metadata.category,
                description: metadata.description,
                expiryDate: metadata.expiryDate,
                accessLevel: metadata.accessLevel || 'restricted'
            };

            await setDocument(DOCUMENTS_COLLECTION, docId, newDoc);
            setDocuments(prev => [...prev, newDoc]);
            return newDoc;
        } catch (err) {
            console.error('Error adding external link:', err);
            setError('Error al agregar enlace externo');
            return null;
        }
    }, []);

    // Update document metadata
    const updateDocumentMetadata = useCallback(async (
        docId: string,
        updates: Partial<Omit<CentralDocument, 'id' | 'uploadedBy' | 'uploadedAt'>>
    ): Promise<boolean> => {
        try {
            const updatedData = { ...updates, updatedAt: new Date().toISOString() };
            await updateFirestoreDoc(DOCUMENTS_COLLECTION, docId, updatedData);
            setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updatedData } : d));
            return true;
        } catch (err) {
            console.error('Error updating document:', err);
            setError('Error al actualizar el documento');
            return false;
        }
    }, []);

    // Delete document
    const deleteDocumentFromRepo = useCallback(async (docId: string): Promise<boolean> => {
        try {
            const doc = documents.find(d => d.id === docId);
            if (doc?.storageType === 'uploaded' && doc.fileUrl) {
                // Delete from storage
                const storageRef = ref(storage, doc.fileUrl);
                await deleteObject(storageRef).catch(() => { }); // Ignore if already deleted
            }
            await deleteFirestoreDoc(DOCUMENTS_COLLECTION, docId);
            setDocuments(prev => prev.filter(d => d.id !== docId));
            return true;
        } catch (err) {
            console.error('Error deleting document:', err);
            setError('Error al eliminar el documento');
            return false;
        }
    }, [documents]);

    // ==================== PROFILE OPERATIONS ====================

    // Create or update profile
    const saveProfile = useCallback(async (profile: RCDDocumentProfile): Promise<boolean> => {
        try {
            const now = new Date().toISOString();
            const isNew = !profiles.find(p => p.id === profile.id);
            const profileData = {
                ...profile,
                updatedAt: now,
                createdAt: isNew ? now : profile.createdAt
            };

            await setDocument(PROFILES_COLLECTION, profile.id, profileData);

            if (isNew) {
                setProfiles(prev => [...prev, profileData]);
            } else {
                setProfiles(prev => prev.map(p => p.id === profile.id ? profileData : p));
            }
            return true;
        } catch (err) {
            console.error('Error saving profile:', err);
            setError('Error al guardar el perfil');
            return false;
        }
    }, [profiles]);

    // Delete profile
    const deleteProfile = useCallback(async (profileId: string): Promise<boolean> => {
        try {
            await deleteFirestoreDoc(PROFILES_COLLECTION, profileId);
            setProfiles(prev => prev.filter(p => p.id !== profileId));
            // Also remove related assignments
            const relatedAssignments = assignments.filter(a => a.profileId === profileId);
            for (const assignment of relatedAssignments) {
                await deleteFirestoreDoc(ASSIGNMENTS_COLLECTION, assignment.id);
            }
            setAssignments(prev => prev.filter(a => a.profileId !== profileId));
            return true;
        } catch (err) {
            console.error('Error deleting profile:', err);
            setError('Error al eliminar el perfil');
            return false;
        }
    }, [assignments]);

    // Get documents by profile
    const getDocumentsByProfile = useCallback((profileId: string): CentralDocument[] => {
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) return [];
        return documents.filter(d => profile.documentIds.includes(d.id));
    }, [profiles, documents]);

    // ==================== ASSIGNMENT OPERATIONS ====================

    // Assign profile to entity
    const assignProfile = useCallback(async (
        profileId: string,
        entityType: 'employee' | 'institution',
        entityId: string,
        assignedBy: string
    ): Promise<ProfileAssignment | null> => {
        try {
            const profile = profiles.find(p => p.id === profileId);
            if (!profile) return null;

            const assignmentId = crypto.randomUUID();
            const now = new Date().toISOString();

            const assignment: ProfileAssignment = {
                id: assignmentId,
                profileId,
                entityType,
                entityId,
                assignedBy,
                assignedAt: now,
                completionStatus: profile.documentIds.map(docId => ({
                    documentId: docId,
                    status: 'pending' as const
                }))
            };

            await setDocument(ASSIGNMENTS_COLLECTION, assignmentId, assignment);
            setAssignments(prev => [...prev, assignment]);
            return assignment;
        } catch (err) {
            console.error('Error assigning profile:', err);
            setError('Error al asignar el perfil');
            return null;
        }
    }, [profiles]);

    // Update assignment completion status
    const updateAssignmentStatus = useCallback(async (
        assignmentId: string,
        documentId: string,
        status: ProfileCompletionItem['status'],
        fileUrl?: string,
        verifiedBy?: string
    ): Promise<boolean> => {
        try {
            const assignment = assignments.find(a => a.id === assignmentId);
            if (!assignment) return false;

            const updatedCompletionStatus = assignment.completionStatus.map(item =>
                item.documentId === documentId
                    ? {
                        ...item,
                        status,
                        uploadedAt: status === 'uploaded' ? new Date().toISOString() : item.uploadedAt,
                        fileUrl: fileUrl || item.fileUrl,
                        verifiedBy: verifiedBy || item.verifiedBy
                    }
                    : item
            );

            await updateFirestoreDoc(ASSIGNMENTS_COLLECTION, assignmentId, { completionStatus: updatedCompletionStatus });
            setAssignments(prev => prev.map(a =>
                a.id === assignmentId ? { ...a, completionStatus: updatedCompletionStatus } : a
            ));
            return true;
        } catch (err) {
            console.error('Error updating assignment status:', err);
            setError('Error al actualizar el estado');
            return false;
        }
    }, [assignments]);

    // Get profiles by entity
    const getProfilesByEntity = useCallback((entityType: 'employee' | 'institution', entityId: string): RCDDocumentProfile[] => {
        const entityAssignments = assignments.filter(a => a.entityType === entityType && a.entityId === entityId);
        return entityAssignments
            .map(a => profiles.find(p => p.id === a.profileId))
            .filter((p): p is RCDDocumentProfile => p !== undefined);
    }, [assignments, profiles]);

    // Get assignment for entity and profile
    const getAssignment = useCallback((entityType: 'employee' | 'institution', entityId: string, profileId: string): ProfileAssignment | undefined => {
        return assignments.find(a => a.entityType === entityType && a.entityId === entityId && a.profileId === profileId);
    }, [assignments]);

    // Calculate completion percentage for an assignment
    const getCompletionPercentage = useCallback((assignmentId: string): number => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment || assignment.completionStatus.length === 0) return 0;

        const completed = assignment.completionStatus.filter(s => s.status === 'verified' || s.status === 'uploaded').length;
        return Math.round((completed / assignment.completionStatus.length) * 100);
    }, [assignments]);

    return {
        // State
        documents,
        profiles,
        assignments,
        isLoading,
        error,

        // Document operations
        uploadDocument,
        addExternalLink,
        updateDocumentMetadata,
        deleteDocument: deleteDocumentFromRepo,

        // Profile operations
        saveProfile,
        deleteProfile,
        getDocumentsByProfile,

        // Assignment operations
        assignProfile,
        updateAssignmentStatus,
        getProfilesByEntity,
        getAssignment,
        getCompletionPercentage
    };
};

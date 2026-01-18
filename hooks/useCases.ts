import { useState, useEffect } from 'react';
import {
    CaseRequest,
    CaseStatus,
    CaseStatusChange,
    CaseAttachment
} from '../types';
import {
    addDocument,
    getDocuments,
    updateDocument,
    deleteDocument,
    getDocumentsByField
} from '../services/firestoreService';

export const useCases = () => {
    const [cases, setCases] = useState<CaseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const collection = 'cases_requests';

    const loadCases = async () => {
        try {
            setLoading(true);
            // Load all cases sorted by createdAt descending
            const data = await getDocuments<CaseRequest>(collection, 'createdAt');
            setCases(data);
            setError(null);
        } catch (err: any) {
            console.error('Error loading cases:', err);
            setError(err.message || 'Failed to load cases');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCases();
    }, []);

    const createCase = async (newCase: Omit<CaseRequest, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'status'>) => {
        try {
            const now = new Date().toISOString();

            const initialStatus: CaseStatus = 'Nuevo';
            const historyEntry: CaseStatusChange = {
                status: initialStatus,
                changedAt: now,
                changedBy: newCase.createdBy,
                notes: 'Caso creado inicialmente'
            };

            const caseData: Omit<CaseRequest, 'id'> = {
                ...newCase,
                status: initialStatus,
                statusHistory: [historyEntry],
                createdAt: now,
                updatedAt: now,
            };

            const id = await addDocument(collection, caseData);

            const createdCase: CaseRequest = { ...caseData, id };
            setCases(prev => [createdCase, ...prev]);

            return id;
        } catch (err: any) {
            console.error('Error creating case:', err);
            throw err;
        }
    };

    const updateCase = async (id: string, updates: Partial<CaseRequest>) => {
        try {
            const updatedAt = new Date().toISOString();
            const finalUpdates = { ...updates, updatedAt };

            await updateDocument(collection, id, finalUpdates);

            setCases(prev => prev.map(c =>
                c.id === id ? { ...c, ...finalUpdates } : c
            ));
        } catch (err: any) {
            console.error('Error updating case:', err);
            throw err;
        }
    };

    const updateStatus = async (
        id: string,
        newStatus: CaseStatus,
        userId: string,
        notes?: string
    ) => {
        try {
            const caseItem = cases.find(c => c.id === id);
            if (!caseItem) throw new Error('Case not found');

            const now = new Date().toISOString();

            const newHistoryEntry: CaseStatusChange = {
                status: newStatus,
                changedAt: now,
                changedBy: userId,
                notes
            };

            const updates = {
                status: newStatus,
                statusHistory: [newHistoryEntry, ...caseItem.statusHistory], // Prepend new status
                updatedAt: now,
                // If status is 'Resuelto', set resolution date default if not present? 
                // Logic can be handled in UI or here based on requirements.
                // For now, we keeping it simple.
            };

            await updateDocument(collection, id, updates);

            setCases(prev => prev.map(c =>
                c.id === id ? { ...c, ...updates, statusHistory: [newHistoryEntry, ...c.statusHistory] } : c
            ));
        } catch (err: any) {
            console.error('Error updating case status:', err);
            throw err;
        }
    };

    const deleteCase = async (id: string) => {
        try {
            await deleteDocument(collection, id);
            setCases(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            console.error('Error deleting case:', err);
            throw err;
        }
    };

    const addAttachment = async (id: string, attachment: CaseAttachment) => {
        try {
            const caseItem = cases.find(c => c.id === id);
            if (!caseItem) throw new Error('Case not found');

            const newAttachments = [...caseItem.attachments, attachment];
            const updates = {
                attachments: newAttachments,
                updatedAt: new Date().toISOString()
            };

            await updateDocument(collection, id, updates);

            setCases(prev => prev.map(c =>
                c.id === id ? { ...c, attachmens: newAttachments } : c
            ));
        } catch (err: any) {
            console.error('Error adding attachment:', err);
            throw err;
        }
    };

    return {
        cases,
        loading,
        error,
        createCase,
        updateCase,
        updateStatus,
        deleteCase,
        addAttachment,
        refreshCases: loadCases
    };
};

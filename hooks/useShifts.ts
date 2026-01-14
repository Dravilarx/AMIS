
import { useState, useEffect } from 'react';
import { ShiftAssignment } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

const INITIAL_SHIFTS: ShiftAssignment[] = []; // Usually starts empty or with seeded data

export const useShifts = () => {
    const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const collection = 'shifts';

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await getDocuments<ShiftAssignment>(collection, 'date');
                setShifts(data);
                setError(null);
            } catch (err) {
                console.error('Error loading shifts:', err);
                setError('Failed to load shift assignments');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const addShift = async (assignment: Omit<ShiftAssignment, 'id' | 'createdAt' | 'status'>) => {
        try {
            const newShift = {
                ...assignment,
                status: 'Confirmed' as const,
                createdAt: new Date().toISOString()
            };
            const id = await addDocument(collection, newShift);
            const entryWithId = { ...newShift, id } as ShiftAssignment;
            setShifts(prev => [entryWithId, ...prev]);
            return entryWithId;
        } catch (err) {
            console.error('Error adding shift:', err);
            throw err;
        }
    };

    const updateShift = async (id: string, updates: Partial<ShiftAssignment>) => {
        try {
            await updateDocument(collection, id, updates);
            setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        } catch (err) {
            console.error('Error updating shift:', err);
            throw err;
        }
    };

    const deleteShift = async (id: string) => {
        try {
            await deleteDocument(collection, id);
            setShifts(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error deleting shift:', err);
            throw err;
        }
    };

    return { shifts, loading, error, addShift, updateShift, deleteShift };
};

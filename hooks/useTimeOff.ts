
import { useState, useEffect } from 'react';
import { TimeOffEntry } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

const INITIAL_TIMEOFF: TimeOffEntry[] = [
  {
    id: 'to-1',
    employeeId: '1', // Julián Riquelme
    type: 'Vacación',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: 'Vacaciones de invierno anuales.',
    status: 'Aprobado',
    createdAt: new Date().toISOString()
  }
];

export const useTimeOff = () => {
  const [entries, setEntries] = useState<TimeOffEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const collection = 'time_off_entries';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let data = await getDocuments<TimeOffEntry>(collection, 'createdAt');
        if (data.length === 0) {
          console.log('No time off entries found, seeding...');
          for (const entry of INITIAL_TIMEOFF) {
            await addDocument(collection, entry);
          }
          data = await getDocuments<TimeOffEntry>(collection, 'createdAt');
        }
        setEntries(data);
        setError(null);
      } catch (err) {
        console.error('Error loading time off entries:', err);
        setError('Failed to load time off data');
        setEntries(INITIAL_TIMEOFF);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addEntry = async (entryData: Omit<TimeOffEntry, 'id' | 'createdAt'>) => {
    try {
      const newEntry = {
        ...entryData,
        createdAt: new Date().toISOString()
      };
      const id = await addDocument(collection, newEntry);
      const entryWithId = { ...newEntry, id } as TimeOffEntry;
      setEntries(prev => [entryWithId, ...prev]);
      return entryWithId;
    } catch (err) {
      console.error('Error adding time off entry:', err);
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<TimeOffEntry>) => {
    try {
      await updateDocument<TimeOffEntry>(collection, id, updates);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    } catch (err) {
      console.error('Error updating time off entry:', err);
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDocument(collection, id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting time off entry:', err);
      throw err;
    }
  };

  return { entries, loading, error, addEntry, updateEntry, deleteEntry };
};

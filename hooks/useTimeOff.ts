
import { useState, useEffect } from 'react';
import { TimeOffEntry, Employee } from '../types';
import { db } from '../services/db';

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
  const collection = 'time_off_entries';

  useEffect(() => {
    const load = async () => {
      let data = await db.getAll<TimeOffEntry>(collection);
      if (data.length === 0) {
        await db.saveAll(collection, INITIAL_TIMEOFF);
        data = INITIAL_TIMEOFF;
      }
      setEntries(data);
      setLoading(false);
    };
    load();
  }, []);

  const addEntry = async (entryData: Omit<TimeOffEntry, 'id' | 'createdAt'>) => {
    const newEntry: TimeOffEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    await db.add(collection, newEntry);
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const updateEntry = async (id: string, updates: Partial<TimeOffEntry>) => {
    await db.update(collection, id, updates);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEntry = async (id: string) => {
    await db.delete(collection, id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return { entries, loading, addEntry, updateEntry, deleteEntry };
};

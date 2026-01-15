import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, SharedCalendar, CalendarMember } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument, setDocument } from '../services/firestoreService';

const EVENTS_COLLECTION = 'calendar_events';
const CALENDARS_COLLECTION = 'shared_calendars';

export const useCalendar = (currentUserId: string) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load calendars and events
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);

                // Load calendars user owns or is a member of
                const allCalendars = await getDocuments<SharedCalendar>(CALENDARS_COLLECTION);
                const userCalendars = allCalendars.filter(c =>
                    c.ownerId === currentUserId ||
                    c.members.some(m => m.userId === currentUserId)
                );

                // Create default personal calendar if none exists
                if (!userCalendars.some(c => c.ownerId === currentUserId && c.isDefault)) {
                    const defaultCal: Omit<SharedCalendar, 'id'> = {
                        name: 'Mi Calendario',
                        ownerId: currentUserId,
                        color: '#3B82F6',
                        members: [],
                        isDefault: true,
                        createdAt: new Date().toISOString()
                    };
                    const id = await addDocument(CALENDARS_COLLECTION, defaultCal);
                    userCalendars.push({ ...defaultCal, id } as SharedCalendar);
                }

                setCalendars(userCalendars);

                // Load events from all accessible calendars
                const calendarIds = userCalendars.map(c => c.id);
                const allEvents = await getDocuments<CalendarEvent>(EVENTS_COLLECTION);
                const userEvents = allEvents.filter(e =>
                    calendarIds.includes(e.calendarId) ||
                    e.participantIds.includes(currentUserId)
                );

                setEvents(userEvents);
                setError(null);
            } catch (err) {
                console.error('Error loading calendar:', err);
                setError('Error al cargar calendario');
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) load();
    }, [currentUserId]);

    // Create event
    const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const timestamp = new Date().toISOString();
            const newEvent = { ...eventData, createdAt: timestamp, updatedAt: timestamp };
            const id = await addDocument(EVENTS_COLLECTION, newEvent);
            const eventWithId = { ...newEvent, id } as CalendarEvent;
            setEvents(prev => [...prev, eventWithId]);
            return eventWithId;
        } catch (err) {
            console.error('Error creating event:', err);
            throw err;
        }
    };

    // Update event
    const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
        try {
            const timestamp = new Date().toISOString();
            await updateDocument(EVENTS_COLLECTION, id, { ...updates, updatedAt: timestamp });
            setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: timestamp } : e));
        } catch (err) {
            console.error('Error updating event:', err);
            throw err;
        }
    };

    // Delete event
    const deleteEvent = async (id: string) => {
        try {
            await deleteDocument(EVENTS_COLLECTION, id);
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Error deleting event:', err);
            throw err;
        }
    };

    // Create shared calendar
    const createCalendar = async (name: string, color: string, description?: string) => {
        try {
            const newCal: Omit<SharedCalendar, 'id'> = {
                name,
                description,
                ownerId: currentUserId,
                color,
                members: [],
                createdAt: new Date().toISOString()
            };
            const id = await addDocument(CALENDARS_COLLECTION, newCal);
            const calWithId = { ...newCal, id } as SharedCalendar;
            setCalendars(prev => [...prev, calWithId]);
            return calWithId;
        } catch (err) {
            console.error('Error creating calendar:', err);
            throw err;
        }
    };

    // Share calendar with user
    const shareCalendar = async (calendarId: string, userId: string, permission: CalendarMember['permission']) => {
        try {
            const cal = calendars.find(c => c.id === calendarId);
            if (!cal) throw new Error('Calendar not found');

            const newMember: CalendarMember = {
                userId,
                permission,
                addedAt: new Date().toISOString()
            };

            const updatedMembers = [...cal.members.filter(m => m.userId !== userId), newMember];
            await updateDocument(CALENDARS_COLLECTION, calendarId, { members: updatedMembers });
            setCalendars(prev => prev.map(c => c.id === calendarId ? { ...c, members: updatedMembers } : c));
        } catch (err) {
            console.error('Error sharing calendar:', err);
            throw err;
        }
    };

    // Remove member from calendar
    const unshareCalendar = async (calendarId: string, userId: string) => {
        try {
            const cal = calendars.find(c => c.id === calendarId);
            if (!cal) throw new Error('Calendar not found');

            const updatedMembers = cal.members.filter(m => m.userId !== userId);
            await updateDocument(CALENDARS_COLLECTION, calendarId, { members: updatedMembers });
            setCalendars(prev => prev.map(c => c.id === calendarId ? { ...c, members: updatedMembers } : c));
        } catch (err) {
            console.error('Error unsharing calendar:', err);
            throw err;
        }
    };

    // Get events for a specific date range
    const getEventsInRange = useCallback((startDate: Date, endDate: Date) => {
        return events.filter(e => {
            const eventStart = new Date(e.startDate);
            const eventEnd = new Date(e.endDate);
            return eventStart <= endDate && eventEnd >= startDate;
        });
    }, [events]);

    // Get events for a specific day
    const getEventsForDay = useCallback((date: Date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        return getEventsInRange(dayStart, dayEnd);
    }, [getEventsInRange]);

    return {
        events,
        calendars,
        loading,
        error,
        createEvent,
        updateEvent,
        deleteEvent,
        createCalendar,
        shareCalendar,
        unshareCalendar,
        getEventsInRange,
        getEventsForDay
    };
};

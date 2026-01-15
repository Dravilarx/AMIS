import React, { useState, useMemo } from 'react';
import {
    Calendar, MessageSquare, Plus, ChevronLeft, ChevronRight,
    Users, Lock, Globe, Clock, MapPin, X, Send, Hash,
    User, Search, MoreVertical, Share2, Settings, Eye
} from 'lucide-react';
import { useCalendar } from '../hooks/useCalendar';
import { useChat } from '../hooks/useChat';
import { useEmployees } from '../hooks/useEmployees';
import { useMessaging } from '../hooks/useMessaging';
import { CalendarEvent, SharedCalendar, ChatChannel, UserSession } from '../types';

interface Props {
    isDark: boolean;
    currentUser: UserSession;
}

const WorkHubModule: React.FC<Props> = ({ isDark, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'agenda' | 'chat'>('agenda');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">WorkHub</h2>
                    <p className="opacity-40 text-lg font-medium italic">Central de colaboración: agenda compartida y comunicación en tiempo real.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex border border-slate-300 dark:border-slate-600 rounded-[20px] overflow-hidden">
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${activeTab === 'agenda' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <Calendar className="w-4 h-4" /> Agenda
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-l border-slate-300 dark:border-slate-600 flex items-center gap-2 ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <MessageSquare className="w-4 h-4" /> Chat
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'agenda' ? (
                <AgendaView isDark={isDark} currentUser={currentUser} />
            ) : (
                <ChatView isDark={isDark} currentUser={currentUser} />
            )}
        </div>
    );
};

// ==================== AGENDA VIEW ====================
const AgendaView: React.FC<{ isDark: boolean; currentUser: UserSession }> = ({ isDark, currentUser }) => {
    const { events, calendars, loading, createEvent, deleteEvent, shareCalendar } = useCalendar(currentUser.id);
    const { employees } = useEmployees();
    const { sendMessage } = useMessaging();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: Date[] = [];

        // Add padding days from previous month
        const startPadding = firstDay.getDay();
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push(new Date(year, month, -i));
        }

        // Add days of current month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        // Add padding days from next month
        const endPadding = 42 - days.length;
        for (let i = 1; i <= endPadding; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    }, [currentDate]);

    const getEventsForDate = (date: Date) => {
        return events.filter(e => {
            const eventDate = new Date(e.startDate);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    const navigateMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const handleCreateEvent = async (eventData: any) => {
        const newEvent = await createEvent({
            ...eventData,
            creatorId: currentUser.id,
            calendarId: calendars.find(c => c.isDefault)?.id || calendars[0]?.id || ''
        });

        // Send invitations to messaging system
        if (eventData.participantIds?.length > 0) {
            await sendMessage({
                senderId: currentUser.id,
                recipientIds: eventData.participantIds,
                subject: `📅 Invitación: ${eventData.title}`,
                content: `Has sido invitado al evento "${eventData.title}"\n\nFecha: ${new Date(eventData.startDate).toLocaleString('es-CL')}\nLugar: ${eventData.location || 'No especificado'}\n\n${eventData.description || ''}`,
                attachments: []
            });
        }

        setShowEventModal(false);
    };

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            {/* Sidebar - Calendars */}
            <div className={`lg:col-span-3 p-6 rounded-[32px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-tight">Mis Calendarios</h3>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-3">
                    {calendars.map(cal => (
                        <div key={cal.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.color }} />
                                <span className="text-xs font-bold">{cal.name}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><Share2 className="w-3 h-3" /></button>
                                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><Settings className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Calendarios Compartidos</h4>
                    {calendars.filter(c => c.ownerId !== currentUser.id).length === 0 ? (
                        <p className="text-[10px] opacity-30 italic">Sin calendarios compartidos</p>
                    ) : (
                        calendars.filter(c => c.ownerId !== currentUser.id).map(cal => (
                            <div key={cal.id} className="flex items-center gap-3 p-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cal.color }} />
                                <span className="text-[10px] font-bold">{cal.name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className={`lg:col-span-9 p-8 rounded-[32px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigateMonth(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-black uppercase tracking-tight min-w-[200px] text-center">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <button onClick={() => navigateMonth(1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => { setSelectedDate(new Date()); setShowEventModal(true); }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Evento
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest opacity-40 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((date, idx) => {
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dayEvents = getEventsForDate(date);

                        return (
                            <div
                                key={idx}
                                onClick={() => { setSelectedDate(date); setShowEventModal(true); }}
                                className={`min-h-[100px] p-2 rounded-2xl border cursor-pointer transition-all hover:border-blue-500 group
                  ${isCurrentMonth ? '' : 'opacity-30'}
                  ${isToday ? 'border-blue-500 bg-blue-500/5' : 'border-slate-100 dark:border-slate-800'}
                `}
                            >
                                <div className={`text-sm font-black mb-2 ${isToday ? 'text-blue-600' : ''}`}>
                                    {date.getDate()}
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map(evt => (
                                        <div
                                            key={evt.id}
                                            className="px-2 py-1 rounded-lg text-[8px] font-black uppercase truncate text-white"
                                            style={{ backgroundColor: calendars.find(c => c.id === evt.calendarId)?.color || '#3B82F6' }}
                                        >
                                            {evt.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[8px] font-black opacity-40">+{dayEvents.length - 3} más</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event Modal */}
            {showEventModal && (
                <EventModal
                    isDark={isDark}
                    employees={employees}
                    selectedDate={selectedDate}
                    calendars={calendars}
                    onClose={() => setShowEventModal(false)}
                    onSubmit={handleCreateEvent}
                />
            )}
        </div>
    );
};

// ==================== EVENT MODAL ====================
const EventModal: React.FC<{
    isDark: boolean;
    employees: any[];
    selectedDate: Date | null;
    calendars: SharedCalendar[];
    onClose: () => void;
    onSubmit: (data: any) => void;
}> = ({ isDark, employees, selectedDate, calendars, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(selectedDate?.toISOString().slice(0, 16) || '');
    const [endDate, setEndDate] = useState('');
    const [location, setLocation] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [visibility, setVisibility] = useState<'private' | 'team' | 'public'>('team');
    const [participantIds, setParticipantIds] = useState<string[]>([]);
    const [calendarId, setCalendarId] = useState(calendars.find(c => c.isDefault)?.id || '');

    const handleSubmit = () => {
        if (!title || !startDate) return;
        onSubmit({
            title,
            description,
            startDate,
            endDate: endDate || startDate,
            location,
            allDay,
            visibility,
            participantIds,
            calendarId
        });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
            <div className={`relative w-full max-w-2xl p-10 rounded-[48px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Nuevo Evento</h3>
                    <button onClick={onClose} className="p-2 opacity-40 hover:opacity-100"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-6">
                    <input
                        type="text"
                        placeholder="Título del evento"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className={`w-full p-5 rounded-2xl border outline-none font-black text-xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Inicio</label>
                            <input
                                type="datetime-local"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className={`w-full p-4 rounded-xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Fin</label>
                            <input
                                type="datetime-local"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className={`w-full p-4 rounded-xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                            />
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Ubicación (opcional)"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className={`w-full p-4 rounded-xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                    />

                    <textarea
                        placeholder="Descripción (opcional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className={`w-full p-4 rounded-xl border outline-none font-medium h-24 resize-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                    />

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Invitar participantes</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {participantIds.map(id => {
                                const emp = employees.find(e => e.id === id);
                                return (
                                    <span key={id} className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1">
                                        {emp?.lastName || id}
                                        <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setParticipantIds(participantIds.filter(p => p !== id))} />
                                    </span>
                                );
                            })}
                        </div>
                        <select
                            onChange={e => e.target.value && setParticipantIds([...new Set([...participantIds, e.target.value])])}
                            className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                        >
                            <option value="">Añadir participante...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-3">
                        {(['private', 'team', 'public'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setVisibility(v)}
                                className={`flex-1 p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${visibility === v ? 'border-blue-600 bg-blue-600/10 text-blue-600' : 'border-slate-200 dark:border-slate-700'}`}
                            >
                                {v === 'private' && <Lock className="w-4 h-4" />}
                                {v === 'team' && <Users className="w-4 h-4" />}
                                {v === 'public' && <Globe className="w-4 h-4" />}
                                <span className="text-[10px] font-black uppercase">{v === 'private' ? 'Privado' : v === 'team' ? 'Equipo' : 'Público'}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 font-black text-xs uppercase opacity-40 hover:opacity-100">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title || !startDate}
                        className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 disabled:opacity-30"
                    >
                        Crear Evento
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== CHAT VIEW ====================
const ChatView: React.FC<{ isDark: boolean; currentUser: UserSession }> = ({ isDark, currentUser }) => {
    const { channels, messages, activeChannelId, setActiveChannelId, sendMessage, createGroupChannel, getOrCreateDirectChannel } = useChat(currentUser.id);
    const { employees } = useEmployees();

    const [messageInput, setMessageInput] = useState('');
    const [showNewChannel, setShowNewChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelMembers, setNewChannelMembers] = useState<string[]>([]);

    const activeChannel = channels.find(c => c.id === activeChannelId);

    const getChannelName = (channel: ChatChannel) => {
        if (channel.type === 'group') return channel.name;
        const otherId = channel.memberIds.find(id => id !== currentUser.id);
        const other = employees.find(e => e.id === otherId);
        return other ? `${other.firstName} ${other.lastName}` : 'Usuario';
    };

    const handleSend = async () => {
        if (!messageInput.trim()) return;
        await sendMessage(messageInput);
        setMessageInput('');
    };

    const handleCreateChannel = async () => {
        if (!newChannelName || newChannelMembers.length === 0) return;
        const channel = await createGroupChannel(newChannelName, newChannelMembers);
        setActiveChannelId(channel.id);
        setShowNewChannel(false);
        setNewChannelName('');
        setNewChannelMembers([]);
    };

    const handleStartDirect = async (userId: string) => {
        const channel = await getOrCreateDirectChannel(userId);
        setActiveChannelId(channel.id);
    };

    return (
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-280px)]">
            {/* Channel List */}
            <div className={`lg:col-span-3 rounded-[32px] border flex flex-col overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setShowNewChannel(true)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Canal
                    </button>
                </div>

                <div className="p-2">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className={`w-full pl-10 pr-4 py-2 rounded-xl outline-none text-xs font-bold ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar px-2">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30 px-3 mb-2">Canales</p>
                    {channels.filter(c => c.type === 'group').map(channel => (
                        <div
                            key={channel.id}
                            onClick={() => setActiveChannelId(channel.id)}
                            className={`p-3 rounded-xl mb-1 cursor-pointer transition-all flex items-center gap-3 ${activeChannelId === channel.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Hash className="w-4 h-4 opacity-60" />
                            <div className="flex-grow min-w-0">
                                <p className="text-xs font-black truncate">{channel.name}</p>
                                {channel.lastMessagePreview && (
                                    <p className="text-[9px] opacity-60 truncate">{channel.lastMessagePreview}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30 px-3 mb-2 mt-4">Mensajes Directos</p>
                    {channels.filter(c => c.type === 'direct').map(channel => (
                        <div
                            key={channel.id}
                            onClick={() => setActiveChannelId(channel.id)}
                            className={`p-3 rounded-xl mb-1 cursor-pointer transition-all flex items-center gap-3 ${activeChannelId === channel.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <User className="w-4 h-4 opacity-60" />
                            <div className="flex-grow min-w-0">
                                <p className="text-xs font-black truncate">{getChannelName(channel)}</p>
                                {channel.lastMessagePreview && (
                                    <p className="text-[9px] opacity-60 truncate">{channel.lastMessagePreview}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30 px-3 mb-2 mt-4">Staff Disponible</p>
                    {employees.slice(0, 5).map(emp => (
                        <div
                            key={emp.id}
                            onClick={() => handleStartDirect(emp.id)}
                            className="p-3 rounded-xl mb-1 cursor-pointer transition-all flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-60 hover:opacity-100"
                        >
                            <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black">
                                {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <span className="text-[10px] font-bold">{emp.firstName} {emp.lastName}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Panel */}
            <div className={`lg:col-span-9 rounded-[32px] border flex flex-col overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                {activeChannel ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {activeChannel.type === 'group' ? <Hash className="w-5 h-5 text-blue-600" /> : <User className="w-5 h-5 text-blue-600" />}
                                <div>
                                    <h4 className="text-sm font-black uppercase">{getChannelName(activeChannel)}</h4>
                                    <p className="text-[9px] opacity-40">{activeChannel.memberIds.length} miembros</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                                <MoreVertical className="w-4 h-4 opacity-40" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {messages.map(msg => {
                                const sender = employees.find(e => e.id === msg.senderId);
                                const isOwn = msg.senderId === currentUser.id;

                                return (
                                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                {!isOwn && (
                                                    <span className="text-[9px] font-black uppercase opacity-60">
                                                        {sender?.firstName || 'Usuario'}
                                                    </span>
                                                )}
                                                <span className="text-[8px] opacity-30">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className={`p-4 rounded-2xl ${isOwn ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-100 dark:bg-slate-800 rounded-bl-md'}`}>
                                                <p className="text-sm font-medium">{msg.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Escribe un mensaje..."
                                    value={messageInput}
                                    onChange={e => setMessageInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    className={`flex-grow p-4 rounded-2xl border outline-none font-medium ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!messageInput.trim()}
                                    className="px-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase disabled:opacity-30 hover:scale-105 transition-all"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center opacity-20">
                        <MessageSquare className="w-16 h-16 mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">Selecciona una conversación</p>
                    </div>
                )}
            </div>

            {/* New Channel Modal */}
            {showNewChannel && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowNewChannel(false)} />
                    <div className={`relative w-full max-w-md p-8 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Nuevo Canal</h3>

                        <input
                            type="text"
                            placeholder="Nombre del canal"
                            value={newChannelName}
                            onChange={e => setNewChannelName(e.target.value)}
                            className={`w-full p-4 rounded-xl border outline-none font-bold mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                        />

                        <div className="mb-4">
                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Miembros</label>
                            <select
                                onChange={e => e.target.value && setNewChannelMembers([...new Set([...newChannelMembers, e.target.value])])}
                                className={`w-full p-3 rounded-xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                            >
                                <option value="">Añadir miembro...</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                            </select>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {newChannelMembers.map(id => {
                                    const emp = employees.find(e => e.id === id);
                                    return (
                                        <span key={id} className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1">
                                            {emp?.lastName || id}
                                            <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setNewChannelMembers(newChannelMembers.filter(m => m !== id))} />
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowNewChannel(false)} className="flex-1 py-3 font-black text-xs uppercase opacity-40">Cancelar</button>
                            <button
                                onClick={handleCreateChannel}
                                disabled={!newChannelName || newChannelMembers.length === 0}
                                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase disabled:opacity-30"
                            >
                                Crear Canal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkHubModule;

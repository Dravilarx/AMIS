import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firestore } from '../services/firebaseConfig';
import { ChatChannel, ChatMessage } from '../types';
import { addDocument, getDocuments, updateDocument } from '../services/firestoreService';

const CHANNELS_COLLECTION = 'chat_channels';
const MESSAGES_COLLECTION = 'chat_messages';

export const useChat = (currentUserId: string) => {
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load channels where user is a member (real-time)
    useEffect(() => {
        if (!currentUserId) return;

        setLoading(true);
        const channelsRef = collection(firestore, CHANNELS_COLLECTION);
        const q = query(channelsRef, where('memberIds', 'array-contains', currentUserId));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const channelData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ChatChannel[];

                // Sort by last message time
                channelData.sort((a, b) => {
                    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                    return bTime - aTime;
                });

                setChannels(channelData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error loading channels:', err);
                setError('Error al cargar conversaciones');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUserId]);

    // Subscribe to messages for active channel (real-time)
    useEffect(() => {
        if (!activeChannelId) {
            setMessages([]);
            return;
        }

        const messagesRef = collection(firestore, MESSAGES_COLLECTION);
        const q = query(
            messagesRef,
            where('channelId', '==', activeChannelId),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const messageData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
                    };
                }) as ChatMessage[];

                setMessages(messageData);
            },
            (err) => {
                console.error('Error loading messages:', err);
            }
        );

        return () => unsubscribe();
    }, [activeChannelId]);

    // Create or get direct message channel
    const getOrCreateDirectChannel = async (otherUserId: string): Promise<ChatChannel> => {
        // Check if direct channel already exists
        const existing = channels.find(c =>
            c.type === 'direct' &&
            c.memberIds.length === 2 &&
            c.memberIds.includes(otherUserId)
        );

        if (existing) return existing;

        // Create new direct channel
        const newChannel: Omit<ChatChannel, 'id'> = {
            name: '',
            type: 'direct',
            memberIds: [currentUserId, otherUserId],
            creatorId: currentUserId,
            createdAt: new Date().toISOString()
        };

        const id = await addDocument(CHANNELS_COLLECTION, newChannel);
        return { ...newChannel, id } as ChatChannel;
    };

    // Create group channel
    const createGroupChannel = async (name: string, memberIds: string[]): Promise<ChatChannel> => {
        const newChannel: Omit<ChatChannel, 'id'> = {
            name,
            type: 'group',
            memberIds: [...new Set([currentUserId, ...memberIds])],
            creatorId: currentUserId,
            createdAt: new Date().toISOString()
        };

        const id = await addDocument(CHANNELS_COLLECTION, newChannel);
        return { ...newChannel, id } as ChatChannel;
    };

    // Send message
    const sendMessage = async (content: string, attachments?: ChatMessage['attachments']) => {
        if (!activeChannelId || !content.trim()) return;

        try {
            const messagesRef = collection(firestore, MESSAGES_COLLECTION);
            const newMessage = {
                channelId: activeChannelId,
                senderId: currentUserId,
                content: content.trim(),
                timestamp: serverTimestamp(),
                readBy: [currentUserId],
                attachments: attachments || []
            };

            await addDoc(messagesRef, newMessage);

            // Update channel's last message info
            const channelRef = doc(firestore, CHANNELS_COLLECTION, activeChannelId);
            await updateDoc(channelRef, {
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: content.substring(0, 50)
            });
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        }
    };

    // Mark messages as read
    const markAsRead = async (messageIds: string[]) => {
        try {
            for (const msgId of messageIds) {
                const msg = messages.find(m => m.id === msgId);
                if (msg && !msg.readBy.includes(currentUserId)) {
                    const msgRef = doc(firestore, MESSAGES_COLLECTION, msgId);
                    await updateDoc(msgRef, {
                        readBy: [...msg.readBy, currentUserId]
                    });
                }
            }
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    // Get unread count for a channel
    const getUnreadCount = useCallback((channelId: string) => {
        if (channelId !== activeChannelId) return 0;
        return messages.filter(m => !m.readBy.includes(currentUserId)).length;
    }, [messages, currentUserId, activeChannelId]);

    // Add member to group channel
    const addMemberToChannel = async (channelId: string, userId: string) => {
        const channel = channels.find(c => c.id === channelId);
        if (!channel || channel.type !== 'group') return;

        const updatedMembers = [...new Set([...channel.memberIds, userId])];
        await updateDocument(CHANNELS_COLLECTION, channelId, { memberIds: updatedMembers });
    };

    // Remove member from group channel
    const removeMemberFromChannel = async (channelId: string, userId: string) => {
        const channel = channels.find(c => c.id === channelId);
        if (!channel || channel.type !== 'group') return;

        const updatedMembers = channel.memberIds.filter(id => id !== userId);
        await updateDocument(CHANNELS_COLLECTION, channelId, { memberIds: updatedMembers });
    };

    return {
        channels,
        messages,
        activeChannelId,
        setActiveChannelId,
        loading,
        error,
        getOrCreateDirectChannel,
        createGroupChannel,
        sendMessage,
        markAsRead,
        getUnreadCount,
        addMemberToChannel,
        removeMemberFromChannel
    };
};

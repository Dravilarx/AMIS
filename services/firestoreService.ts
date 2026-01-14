import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    query,
    orderBy,
    Timestamp,
    DocumentData,
    QuerySnapshot
} from 'firebase/firestore';
import { firestore } from './firebaseConfig';

/**
 * Generic Firestore service for CRUD operations
 */

export interface FirestoreDocument {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

/**
 * Add a new document to a collection
 */
export async function addDocument<T extends FirestoreDocument>(
    collectionName: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    try {
        const timestamp = new Date().toISOString();
        const docRef = await addDoc(collection(firestore, collectionName), {
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
        return docRef.id;
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw new Error(`Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get all documents from a collection
 */
export async function getDocuments<T extends FirestoreDocument>(
    collectionName: string,
    orderByField?: string
): Promise<T[]> {
    try {
        const collectionRef = collection(firestore, collectionName);
        const q = orderByField
            ? query(collectionRef, orderBy(orderByField, 'desc'))
            : collectionRef;

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as T[];
    } catch (error) {
        console.error(`Error getting documents from ${collectionName}:`, error);
        throw new Error(`Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Update an existing document
 */
export async function updateDocument<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string,
    data: Partial<Omit<T, 'id' | 'createdAt'>>
): Promise<void> {
    try {
        const docRef = doc(firestore, collectionName, documentId);
        const timestamp = new Date().toISOString();
        await updateDoc(docRef, {
            ...data,
            updatedAt: timestamp,
        });
    } catch (error) {
        console.error(`Error updating document ${documentId} in ${collectionName}:`, error);
        throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Set a document with a specific ID (Upsert)
 */
export async function setDocument<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string,
    data: T
): Promise<void> {
    try {
        const docRef = doc(firestore, collectionName, documentId);
        const timestamp = new Date().toISOString();
        const { id, ...dataToSet } = data; // Avoid setting id field manually if it's already document ID
        await setDoc(docRef, {
            ...dataToSet,
            updatedAt: timestamp,
            createdAt: data.createdAt || timestamp,
        }, { merge: true });
    } catch (error) {
        console.error(`Error setting document ${documentId} in ${collectionName}:`, error);
        throw new Error(`Failed to set document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Delete a document from a collection
 */
export async function deleteDocument(
    collectionName: string,
    documentId: string
): Promise<void> {
    try {
        const docRef = doc(firestore, collectionName, documentId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting document ${documentId} from ${collectionName}:`, error);
        throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

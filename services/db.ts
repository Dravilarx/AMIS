
/**
 * DB Service Layer - LocalStorage Implementation
 * Este módulo abstrae la persistencia utilizando el almacenamiento local del navegador.
 */
export const db = {
  // Obtener todos los documentos de una colección
  async getAll<T>(collectionName: string): Promise<T[]> {
    try {
      const data = localStorage.getItem(collectionName);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error obteniendo colección ${collectionName}:`, error);
      return [];
    }
  },

  // Guardar múltiples documentos
  async saveAll<T extends { id: string }>(collectionName: string, data: T[]): Promise<void> {
    try {
      localStorage.setItem(collectionName, JSON.stringify(data));
    } catch (error) {
      console.error(`Error guardando en ${collectionName}:`, error);
    }
  },

  // Añadir o sobreescribir un documento único
  async add<T extends { id: string }>(collectionName: string, item: T): Promise<T> {
    try {
      // Fix: replace 'this' with 'db' as 'this' is untyped in this context
      const data = await db.getAll<T>(collectionName);
      const newData = [...data.filter(i => i.id !== item.id), item];
      await db.saveAll(collectionName, newData);
      return item;
    } catch (error) {
      console.error(`Error añadiendo documento a ${collectionName}:`, error);
      throw error;
    }
  },

  // Eliminar un documento por ID
  async delete(collectionName: string, id: string): Promise<void> {
    try {
      // Fix: replace 'this' with 'db' as 'this' is untyped in this context
      const data = await db.getAll<any>(collectionName);
      const newData = data.filter(i => i.id !== id);
      await db.saveAll(collectionName, newData);
    } catch (error) {
      console.error(`Error eliminando documento ${id} de ${collectionName}:`, error);
    }
  },

  // Actualizar campos específicos de un documento
  async update<T extends { id: string }>(collectionName: string, id: string, updates: Partial<T>): Promise<void> {
    try {
      // Fix: replace 'this' with 'db' as 'this' is untyped in this context
      const data = await db.getAll<T>(collectionName);
      const newData = data.map(i => i.id === id ? { ...i, ...updates } : i);
      await db.saveAll(collectionName, newData);
    } catch (error) {
      console.error(`Error actualizando documento ${id} en ${collectionName}:`, error);
    }
  }
};

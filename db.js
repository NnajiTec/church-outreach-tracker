/**
 * Church Outreach Tracker
 * Database Module - IndexedDB with LocalStorage Fallback
 * Copyright (c) 2024. All rights reserved.
 */

const DB_NAME = 'ChurchOutreachDB';
const DB_VERSION = 1;

class ChurchDatabase {
  constructor() {
    this.db = null;
    this.useLocalStorage = false;
  }

  async init() {
    try {
      this.db = await this.openIndexedDB();
      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.warn('IndexedDB not available, using LocalStorage fallback:', error);
      this.useLocalStorage = true;
    }
  }

  openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject('IndexedDB not supported');
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('contacts')) {
          const contactsStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactsStore.createIndex('name', 'name', { unique: false });
          contactsStore.createIndex('status', 'status', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('visits')) {
          const visitsStore = db.createObjectStore('visits', { keyPath: 'id' });
          visitsStore.createIndex('contactId', 'contactId', { unique: false });
          visitsStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('prayers')) {
          db.createObjectStore('prayers', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('families')) {
          db.createObjectStore('families', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('pending-sync')) {
          db.createObjectStore('pending-sync', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Centralized helper to prevent JSON.parse crashes and reduce duplicate code
  _getLocalStorageData(storeName) {
    try {
      return JSON.parse(localStorage.getItem(storeName) || '[]');
    } catch (e) {
      console.warn(`Corrupted local storage data for ${storeName}. Resetting.`);
      return [];
    }
  }

  async put(storeName, data) {
    if (this.useLocalStorage) {
      const store = this._getLocalStorageData(storeName);
      
      // Fix: Handle auto-increment logic for LocalStorage fallback
      if (!data.id && !data.key) {
        data.id = 'auto_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      }

      const index = store.findIndex(item => 
        (data.id && item.id === data.id) || (data.key && item.key === data.key)
      );
      
      if (index >= 0) store[index] = data;
      else store.push(data);
      
      try {
        localStorage.setItem(storeName, JSON.stringify(store));
      } catch (e) {
        throw new Error('Failed to write to LocalStorage. Quota may be exceeded.');
      }
      return data;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Fix: Add transaction-level error handling
      transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
      transaction.onerror = () => reject(transaction.error);

      const request = store.put(data);
      request.onsuccess = (event) => {
        // Fix: Capture IndexedDB auto-incremented IDs back into the returned object
        if (!data.id && !data.key) {
          data.id = event.target.result;
        }
        resolve(data);
      };
    });
  }

  async get(storeName, id) {
    if (this.useLocalStorage) {
      const store = this._getLocalStorageData(storeName);
      return store.find(item => item.id === id || item.key === id) || null;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      transaction.onerror = () => reject(transaction.error);
      
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll(storeName) {
    if (this.useLocalStorage) {
      return this._getLocalStorageData(storeName);
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      transaction.onerror = () => reject(transaction.error);
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName, id) {
    if (this.useLocalStorage) {
      const store = this._getLocalStorageData(storeName);
      const filtered = store.filter(item => item.id !== id && item.key !== id);
      localStorage.setItem(storeName, JSON.stringify(filtered));
      return;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
      transaction.onerror = () => reject(transaction.error);
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName) {
    if (this.useLocalStorage) {
      localStorage.setItem(storeName, '[]');
      return;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
      transaction.onerror = () => reject(transaction.error);
      
      const request = store.clear();
      request.onsuccess = () => resolve();
    });
  }

  async addToSyncQueue(operation, storeName, data) {
    const syncItem = {
      operation,
      storeName,
      data,
      timestamp: new Date().toISOString()
    };
    return this.put('pending-sync', syncItem);
  }

  async getPendingSync() {
    return this.getAll('pending-sync');
  }

  async clearPendingSync(id) {
    return this.delete('pending-sync', id);
  }
}

const db = new ChurchDatabase();
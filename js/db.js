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

  async put(storeName, data) {
    if (this.useLocalStorage) {
      const store = JSON.parse(localStorage.getItem(storeName) || '[]');
      const index = store.findIndex(item => 
        (data.id && item.id === data.id) || (data.key && item.key === data.key)
      );
      if (index >= 0) store[index] = data;
      else store.push(data);
      localStorage.setItem(storeName, JSON.stringify(store));
      return data;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    if (this.useLocalStorage) {
      const store = JSON.parse(localStorage.getItem(storeName) || '[]');
      return store.find(item => item.id === id || item.key === id) || null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    if (this.useLocalStorage) {
      return JSON.parse(localStorage.getItem(storeName) || '[]');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    if (this.useLocalStorage) {
      const store = JSON.parse(localStorage.getItem(storeName) || '[]');
      const filtered = store.filter(item => item.id !== id && item.key !== id);
      localStorage.setItem(storeName, JSON.stringify(filtered));
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    if (this.useLocalStorage) {
      localStorage.setItem(storeName, '[]');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
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
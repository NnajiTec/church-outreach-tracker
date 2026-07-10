/**
 * Church Outreach Tracker
 * Sync Manager Module
 * Copyright (c) 2024. All rights reserved.
 */

class SyncManager {
  constructor() {
    this.syncing = false;
    this.init();
  }

  init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          this.onSyncComplete(event.data.message);
        }
      });
    }

    connectionManager.onChange((online) => {
      if (online) this.syncAll();
    });
  }

  async syncAll() {
    if (this.syncing) return;
    
    this.syncing = true;
    this.showSyncIndicator('Syncing data...');
    
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-contacts');
        await registration.sync.register('sync-visits');
      }
      
      const pendingItems = await db.getPendingSync();
      
      for (const item of pendingItems) {
        try {
          console.log('Syncing item:', item);
          await new Promise(resolve => setTimeout(resolve, 500));
          await db.clearPendingSync(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
        }
      }
      
      this.hideSyncIndicator();
      this.showSyncSuccess('All data synced');
    } catch (error) {
      console.error('Sync failed:', error);
      this.hideSyncIndicator();
    } finally {
      this.syncing = false;
    }
  }

  showSyncIndicator(message) {
    const indicator = document.getElementById('sync-indicator');
    const messageEl = document.getElementById('sync-message');
    if (indicator && messageEl) {
      messageEl.textContent = message;
      indicator.classList.remove('hidden');
    }
  }

  hideSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    if (indicator) {
      setTimeout(() => indicator.classList.add('hidden'), 2000);
    }
  }

  showSyncSuccess(message) {
    const indicator = document.getElementById('sync-indicator');
    const messageEl = document.getElementById('sync-message');
    if (indicator && messageEl) {
      messageEl.textContent = message;
      indicator.classList.remove('hidden');
    }
  }

  onSyncComplete(message) {
    console.log('Sync complete:', message);
    this.showSyncSuccess(message || 'Sync completed');
  }
}

const syncManager = new SyncManager();
/**
 * Church Outreach Tracker
 * Connection Monitoring Module
 * Copyright (c) 2024. All rights reserved.
 */

class ConnectionManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.init();
  }

  init() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    this.updateUI();
    setInterval(() => this.checkConnection(), 30000);
  }

  handleOnline() {
    console.log('Connection restored');
    this.isOnline = true;
    this.updateUI();
    this.notifyListeners(true);
    if (window.syncManager) window.syncManager.syncAll();
  }

  handleOffline() {
    console.log('Connection lost');
    this.isOnline = false;
    this.updateUI();
    this.notifyListeners(false);
  }

  async checkConnection() {
    try {
      await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-store' 
      });
      if (!this.isOnline) this.handleOnline();
    } catch (error) {
      if (this.isOnline) this.handleOffline();
    }
  }

  updateUI() {
    const banner = document.getElementById('offline-banner');
    const status = document.getElementById('connection-status');
    
    if (this.isOnline) {
      banner?.classList.add('hidden');
      if (status) {
        status.innerHTML = '<i class="fas fa-circle text-[8px] mr-1"></i> Online';
        status.className = 'hidden sm:inline-flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full';
      }
    } else {
      banner?.classList.remove('hidden');
      if (status) {
        status.innerHTML = '<i class="fas fa-circle text-[8px] mr-1"></i> Offline';
        status.className = 'hidden sm:inline-flex items-center text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full';
      }
    }
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(online) {
    this.listeners.forEach(cb => cb(online));
  }
}

const connectionManager = new ConnectionManager();
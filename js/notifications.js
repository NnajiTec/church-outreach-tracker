/**
 * Church Outreach Tracker
 * Notification Center Module - Phase 11
 * Copyright (c) 2024. All rights reserved.
 */

class NotificationManager {
  constructor() {
    this.items = [];
    this.eventsBound = false;
    this.refreshTimer = null;
    this.notifiedIdsKey = 'church-outreach-notified-alerts';
    this.panel = null;
    this.bellButton = null;
    this.badge = null;
    this.summary = null;
    this.list = null;
  }

  async init() {
    this.cacheDom();
    this.bindEvents();
    await this.refresh({ notifyBrowser: false });
    this.refreshTimer = window.setInterval(() => {
      this.refresh({ notifyBrowser: false }).catch(error => {
        console.error('Notification refresh failed:', error);
      });
    }, 60000);
  }

  cacheDom() {
    this.panel = document.getElementById('notification-panel');
    this.bellButton = document.getElementById('notification-bell-btn');
    this.badge = document.getElementById('notification-badge');
    this.summary = document.getElementById('notification-summary');
    this.list = document.getElementById('notification-list');
  }

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    this.bellButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.togglePanel();
    });

    document.getElementById('notification-close-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.closePanel();
    });

    document.addEventListener('click', (event) => {
      if (!this.panel || !this.bellButton) return;
      if (this.panel.contains(event.target) || this.bellButton.contains(event.target)) return;
      this.closePanel();
    });

    window.addEventListener('focus', () => {
      this.refresh({ notifyBrowser: false }).catch(error => {
        console.error('Notification refresh on focus failed:', error);
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.refresh({ notifyBrowser: false }).catch(error => {
          console.error('Notification refresh on visibility change failed:', error);
        });
      }
    });
  }

  async refresh(options = {}) {
    const { notifyBrowser = true } = options;
    this.cacheDom();

    const [visits, prayers, contacts] = await Promise.all([
      db.getAll('visits'),
      db.getAll('prayers'),
      db.getAll('contacts')
    ]);

    this.items = this.buildItems(visits || [], prayers || [], contacts || []);
    this.renderBadge();
    this.renderPanel();

    if (notifyBrowser) {
      await this.maybeNotifyBrowser();
    }
  }

  buildItems(visits, prayers, contacts) {
    const contactMap = new Map(contacts.map(contact => [contact.id, contact]));
    const items = [];
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderMinutes = Number.parseInt(app?.settingsManager?.settings?.reminderAdvance || '30', 10);
    const reminderWindow = new Date(now.getTime() + (Number.isFinite(reminderMinutes) ? reminderMinutes : 30) * 60000);

    visits.forEach(visit => {
      if (visit.status !== 'scheduled' || !visit.date) return;
      const visitDate = new Date(visit.date);
      if (Number.isNaN(visitDate.getTime())) return;
      const contact = contactMap.get(visit.contactId);
      const contactName = contact?.name || 'Unknown Contact';
      const scheduleLabel = this.formatDateTime(visitDate);

      if (visitDate < today) {
        items.push({
          id: `visit-overdue:${visit.id}`,
          kind: 'visit-overdue',
          priority: 0,
          title: 'Overdue visit',
          message: `${contactName} was scheduled for ${scheduleLabel}.`,
          icon: 'fa-calendar-times',
          tone: 'red',
          timestamp: visit.updatedAt || visit.date || visit.createdAt || now.toISOString()
        });
        return;
      }

      if (visitDate <= reminderWindow) {
        const title = visitDate <= now ? 'Visit due now' : 'Visit reminder';
        items.push({
          id: `visit-reminder:${visit.id}`,
          kind: 'visit-reminder',
          priority: 2,
          title,
          message: `${contactName} is scheduled for ${scheduleLabel}.`,
          icon: 'fa-calendar-check',
          tone: 'blue',
          timestamp: visit.updatedAt || visit.date || visit.createdAt || now.toISOString()
        });
      }
    });

    prayers.forEach(prayer => {
      if (prayer.answered || prayer.urgency !== 'Urgent') return;
      items.push({
        id: `prayer-urgent:${prayer.id}`,
        kind: 'prayer-urgent',
        priority: 1,
        title: 'Urgent prayer request',
        message: this.truncate(prayer.request || 'Urgent prayer request', 110),
        icon: 'fa-pray',
        tone: 'purple',
        timestamp: prayer.updatedAt || prayer.answeredAt || prayer.createdAt || now.toISOString()
      });
    });

    return items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  renderBadge() {
    if (!this.badge) return;
    const count = this.items.length;
    this.badge.textContent = String(count);
    this.badge.classList.toggle('hidden', count === 0);
  }

  renderPanel() {
    if (!this.summary || !this.list) return;

    if (this.items.length === 0) {
      this.summary.textContent = 'No active alerts';
      this.list.innerHTML = `
        <div class="px-4 py-8 text-center">
          <i class="fas fa-bell-slash text-3xl text-gray-300 mb-3"></i>
          <p class="text-sm font-medium text-gray-700">You are all caught up</p>
          <p class="text-xs text-gray-500 mt-1">Overdue visits and urgent prayer requests will appear here.</p>
        </div>
      `;
      return;
    }

    const plural = this.items.length === 1 ? '' : 's';
    this.summary.textContent = `${this.items.length} active alert${plural}`;
    this.list.innerHTML = this.items.map(item => this.renderItem(item)).join('');
  }

  renderItem(item) {
    const toneClasses = {
      red: 'bg-red-100 text-red-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      amber: 'bg-amber-100 text-amber-600'
    };
    return `
      <div class="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toneClasses[item.tone] || toneClasses.blue}">
            <i class="fas ${item.icon} text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-800">${this.escapeHtml(item.title)}</p>
            <p class="text-xs text-gray-500 mt-0.5">${this.escapeHtml(item.message)}</p>
          </div>
        </div>
      </div>
    `;
  }

  async maybeNotifyBrowser() {
    const settings = app?.settingsManager?.settings || {};
    if (!settings.notifications) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const notifiedIds = new Set(this.readNotifiedIds());
    const todayKey = new Date().toISOString().slice(0, 10);
    const browserItems = this.items.filter(item => item.priority <= 1);

    const newItems = browserItems.filter(item => {
      const signature = `${item.id}:${todayKey}`;
      return !notifiedIds.has(signature);
    });

    if (newItems.length === 0) return;

    newItems.slice(0, 3).forEach(item => {
      try {
        new Notification(item.title, {
          body: item.message,
          icon: 'assets/icons/icon-192x192.png?v=6',
          tag: item.id,
          silent: true
        });
      } catch (error) {
        console.warn('Browser notification failed:', error);
      }
      notifiedIds.add(`${item.id}:${todayKey}`);
    });

    this.saveNotifiedIds([...notifiedIds].slice(-200));
  }

  async ensurePermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Notification.permission;
    }

    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.warn('Notification permission request failed:', error);
      return 'denied';
    }
  }

  togglePanel() {
    if (!this.panel) return;
    const isHidden = this.panel.classList.contains('hidden');
    if (isHidden) {
      this.openPanel();
    } else {
      this.closePanel();
    }
  }

  openPanel() {
    if (!this.panel) return;
    this.panel.classList.remove('hidden');
  }

  closePanel() {
    if (!this.panel) return;
    this.panel.classList.add('hidden');
  }

  readNotifiedIds() {
    try {
      const raw = localStorage.getItem(this.notifiedIdsKey);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  saveNotifiedIds(ids) {
    try {
      localStorage.setItem(this.notifiedIdsKey, JSON.stringify(ids));
    } catch (error) {
      console.warn('Failed to save notification ids:', error);
    }
  }

  formatDateTime(date) {
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  truncate(text, maxLength) {
    const value = String(text || '');
    return value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}…` : value;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

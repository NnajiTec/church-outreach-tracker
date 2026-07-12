/**
 * Church Outreach Tracker
 * Main Application Controller
 * Copyright (c) 2024. All rights reserved.
 */

class ChurchApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.contactsManager = null;
    this.profileManager = null;
    this.followUpManager = null;
    this.calendarManager = null;
    this.reportsManager = null;
    this.prayerManager = null;
    this.familyManager = null;
    this.importExportManager = null;
    this.notificationManager = null;
    this.settingsManager = null;
    this.modalManager = null;
  }

  async init() {
    // 1. SETUP UI FIRST: This ensures the sidebar and clicks ALWAYS work, 
    // even if a database or file fails to load later.
    this.setupNavigation();
    this.setupSidebar();
    this.setupSearch();

    // 2. Initialize database
    try { 
      await db.init(); 
    } catch(e) { 
      console.warn('DB Init failed:', e); 
    }
    
    this.registerServiceWorker();

    // 3. Initialize Settings Safely
    try {
      if (typeof SettingsManager !== 'undefined') {
        this.settingsManager = new SettingsManager();
        await this.settingsManager.loadSettings();
        const settings = this.settingsManager.settings || {};
        this.settingsManager.applySetting('theme', settings.theme);
        this.settingsManager.applySetting('churchName', settings.churchName);
        this.updateUserProfile(settings.pastorName || 'Pastor James');
      } else {
        console.warn('Settings.js failed to load. Using defaults.');
        this.updateUserProfile('Pastor James');
      }
    } catch(e) { 
      console.warn('Settings initialization failed:', e); 
    }

    // 4. Initialize Managers Safely
    const safeInit = (ManagerClass) => {
      try { 
        return typeof ManagerClass !== 'undefined' ? new ManagerClass() : null; 
      } catch(e) { 
        return null; 
      }
    };

    this.contactsManager = safeInit(ContactsManager);
    this.profileManager = safeInit(ProfileManager);
    this.followUpManager = safeInit(FollowUpManager);
    this.calendarManager = safeInit(CalendarManager);
    this.reportsManager = safeInit(ReportsManager);
    this.prayerManager = safeInit(PrayerManager);
    this.familyManager = safeInit(FamilyManager);
    this.importExportManager = safeInit(ImportExportManager);
    this.notificationManager = safeInit(NotificationManager);
    this.modalManager = safeInit(ModalManager);

    // 5. Load Data
    try {
      await this.loadDashboardData();
      if (this.notificationManager) await this.notificationManager.init();
    } catch(e) { 
      console.warn('Dashboard data failed:', e); 
    }

    // 6. Navigate
    const hash = window.location.hash.replace('#', '');
    let defaultPage = 'dashboard';
    if (this.settingsManager && this.settingsManager.settings) {
      defaultPage = this.settingsManager.settings.defaultView || 'dashboard';
    }
    
    this.navigateTo(hash || defaultPage, false);
    console.log('Church Outreach Tracker initialized successfully');
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js?v=6');
        console.log('Service Worker registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content available. Please refresh.');
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.navigateTo(e.state.page, false);
      }
    });
  }

  navigateTo(page, pushState = true) {
    if (this.currentPage === 'reports' && page !== 'reports' && this.reportsManager) {
      this.reportsManager.destroy();
    }

    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.add('hidden');
    });

    const targetView = document.getElementById(`view-${page}`);
    if (targetView) {
      targetView.classList.remove('hidden');
    }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) {
        item.classList.add('active');
      }
    });

    if (pushState) {
      history.pushState({ page }, '', `#${page}`);
    }

    this.currentPage = page;
    this.closeSidebar();

    switch(page) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'contacts':
        if (this.contactsManager) this.contactsManager.init();
        break;
      case 'followup':
        if (this.followUpManager) this.followUpManager.init();
        break;
      case 'calendar':
        if (this.calendarManager) this.calendarManager.init();
        break;
      case 'reports':
        if (this.reportsManager) this.reportsManager.init();
        break;
      case 'prayers':
        if (this.prayerManager) this.prayerManager.init();
        break;
      case 'families':
        if (this.familyManager) this.familyManager.init();
        break;
      case 'importexport':
        if (this.importExportManager) this.importExportManager.init();
        break;
      case 'settings':
        if (this.settingsManager) this.settingsManager.init();
        break;
    }
  }

  setupSidebar() {
    const openBtn = document.getElementById('open-sidebar-btn');
    const closeBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    openBtn?.addEventListener('click', () => this.openSidebar());
    closeBtn?.addEventListener('click', () => this.closeSidebar());
    backdrop?.addEventListener('click', () => this.closeSidebar());

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        this.closeSidebar();
      }
    });
  }

  openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    sidebar?.classList.remove('-translate-x-full');
    backdrop?.classList.remove('hidden');
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (window.innerWidth < 1024) {
      sidebar?.classList.add('-translate-x-full');
      backdrop?.classList.add('hidden');
    }
  }

  setupSearch() {
    const searchInput = document.querySelector('input[type="search"]');

    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      
      if (this.currentPage === 'families' && this.familyManager) {
        const familySearch = document.getElementById('family-search');
        if (familySearch) familySearch.value = query;
        
        this.familyManager.searchQuery = query;
        this.familyManager.currentPage = 1;
        this.familyManager.applyFilters();
        const familyContent = document.getElementById('family-content');
        if (familyContent) familyContent.innerHTML = this.familyManager.renderFamilyGrid();
        this.familyManager.renderPagination();
        
      } else {
        if (this.currentPage !== 'contacts' && query.length > 0) {
          this.navigateTo('contacts', false); 
        }
        
        const contactSearch = document.getElementById('contact-search');
        if (contactSearch) contactSearch.value = query;
        
        if (this.contactsManager) {
          this.contactsManager.searchQuery = query;
          this.contactsManager.currentPage = 1;
          this.contactsManager.applyFilters();
          this.contactsManager.renderContactList();
        }
      }
    });

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
      });
    });
  }

  async loadDashboardData() {
    try {
      const contacts = await db.getAll('contacts');
      const visits = await db.getAll('visits');

      const today = new Date().toISOString().split('T')[0];
      const todayVisits = visits.filter(v => v.date?.split('T')[0] === today);
      const overdueVisits = visits.filter(v => v.date < today && v.status === 'scheduled');

      const totalContactsEl = document.getElementById('stat-total-contacts');
      const followupEl = document.getElementById('stat-followup');
      const todayApptEl = document.getElementById('stat-today-appointments');
      const overdueEl = document.getElementById('stat-overdue');

      if (totalContactsEl) totalContactsEl.textContent = contacts.length;
      if (followupEl) followupEl.textContent = contacts.filter(c => c.status === 'visited' || c.status === 'interested').length;
      if (todayApptEl) todayApptEl.textContent = todayVisits.length;
      if (overdueEl) overdueEl.textContent = overdueVisits.length;

      const recentActivity = document.getElementById('recent-activity');
      if (recentActivity) {
        const recentVisits = visits
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        if (recentVisits.length > 0) {
          recentActivity.innerHTML = recentVisits.map(visit => {
            const contactName = contacts.find(c => c.id === visit.contactId)?.name || 'Unknown';
            return `
              <div class="flex justify-between border-b pb-2">
                <span>${this.escapeHtml(contactName)} - ${visit.status}</span>
                <span class="text-gray-400">${new Date(visit.date).toLocaleDateString()}</span>
              </div>
            `;
          }).join('');
        } else {
          recentActivity.innerHTML = '<p class="text-gray-400 italic">No recent activity</p>';
        }
      }

      const upcomingAppointments = document.getElementById('upcoming-appointments');
      if (upcomingAppointments) {
        const upcoming = visits
          .filter(v => v.date >= today && v.status === 'scheduled')
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);

        if (upcoming.length > 0) {
          upcomingAppointments.innerHTML = upcoming.map(visit => {
            const contactName = contacts.find(c => c.id === visit.contactId)?.name || 'Unknown';
            return `
              <div class="flex justify-between">
                <span>${this.escapeHtml(contactName)} - ${visit.time || 'All day'}</span>
                <span class="text-blue-600 font-medium">${new Date(visit.date).toLocaleDateString()}</span>
              </div>
            `;
          }).join('');
        } else {
          upcomingAppointments.innerHTML = '<p class="text-gray-400 italic">No upcoming appointments</p>';
        }
      }

      if (this.prayerManager) {
        const prayerStats = await this.prayerManager.getDashboardPrayers();
        const prayerContainer = document.getElementById('dashboard-prayers');
        if (prayerContainer && prayerStats.recent.length > 0) {
          prayerContainer.innerHTML = prayerStats.recent.map(p => `
            <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full ${p.urgency === 'Urgent' ? 'bg-red-500' : 'bg-blue-500'}"></span>
                <span class="text-sm text-gray-700 truncate">${this.escapeHtml(p.request)}</span>
              </div>
              <span class="text-xs text-gray-400">${new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
          `).join('');
        } else if (prayerContainer) {
          prayerContainer.innerHTML = '<p class="text-sm text-gray-400 italic">No prayer requests yet</p>';
        }
      }

      if (this.notificationManager) {
        await this.notificationManager.refresh({ notifyBrowser: false });
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateUserProfile(fullName) {
    const nameEl = document.getElementById('sidebar-user-name');
    const topAvatarEl = document.getElementById('top-nav-avatar');
    const sidebarAvatarEl = document.getElementById('sidebar-avatar');

    if (nameEl) {
      nameEl.textContent = fullName;
    }

    const initials = fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
      
    const finalInitials = initials || 'U';

    if (topAvatarEl) topAvatarEl.textContent = finalInitials;
    if (sidebarAvatarEl) sidebarAvatarEl.textContent = finalInitials;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ChurchApp();
  window.app.init();
});

window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '') || 'dashboard';
  if (window.app) {
    window.app.navigateTo(page, false);
  }
});
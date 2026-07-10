/**
 * Church Outreach Tracker
 * Settings Module - Phase 10
 * Copyright (c) 2024. All rights reserved.
 */

class SettingsManager {
  constructor() {
    this.settings = {};
    this.defaultSettings = {
      churchName: "Shepherd's Reach",
      assembly: 'Main Assembly',
      address: '123 Faith Street, Grace City, ST 12345',
      phone: '(555) 123-4567',
      email: 'info@shepherdsreach.org',
      website: 'www.shepherdsreach.org',
      pastorName: 'Pastor James',
      pastorEmail: 'pastor@shepherdsreach.org',
      theme: 'light',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#f59e0b',
      logo: '',
      timezone: 'America/Chicago',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en',
      autoBackup: true,
      backupFrequency: 'weekly',
      notifications: true,
      emailNotifications: false,
      reminderAdvance: '30',
      defaultView: 'dashboard',
      recordsPerPage: '10',
      enableOfflineMode: true,
      syncOnConnect: true
    };
    this.currentTab = 'general';
  }

  async init() {
    await this.loadSettings();
    this.renderSettingsView();
    this.setupEventListeners();
  }

  async loadSettings() {
    try {
      const savedSettings = await db.getAll('settings');
      this.settings = { ...this.defaultSettings };
      savedSettings.forEach(item => {
        if (item.key && item.value !== undefined) {
          this.settings[item.key] = item.value;
        }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { ...this.defaultSettings };
    }
  }

  async saveSetting(key, value) {
    try {
      this.settings[key] = value;
      await db.put('settings', { key, value });
      this.applySetting(key, value);
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
      throw error;
    }
  }

  applySetting(key, value) {
    switch(key) {
      case 'churchName':
        const sidebarName = document.getElementById('sidebar-church-name');
        const topName = document.getElementById('top-church-name');
        if (sidebarName) sidebarName.textContent = value;
        if (topName) topName.textContent = value;
        document.title = `${value} · Church Outreach`;
        break;
      case 'theme':
        if (value === 'dark') {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
        break;
      case 'primaryColor':
        document.documentElement.style.setProperty('--primary-color', value);
        break;
      case 'recordsPerPage':
        if (app.contactsManager) app.contactsManager.pageSize = parseInt(value);
        if (app.followUpManager) app.followUpManager.pageSize = parseInt(value);
        break;
    }
  }

  renderSettingsView() {
    const container = document.getElementById('settings-container');
    if (!container) return;

    container.innerHTML = `
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Settings</h1>
        <p class="text-gray-500 text-sm">Customize your church outreach tracker</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <div class="lg:w-64 flex-shrink-0">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <nav class="p-2 space-y-1">
              <button class="settings-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center space-x-3 ${this.currentTab === 'general' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}" data-tab="general">
                <i class="fas fa-cog w-5"></i><span>General</span>
              </button>
              <button class="settings-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center space-x-3 ${this.currentTab === 'appearance' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}" data-tab="appearance">
                <i class="fas fa-palette w-5"></i><span>Appearance</span>
              </button>
              <button class="settings-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center space-x-3 ${this.currentTab === 'notifications' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}" data-tab="notifications">
                <i class="fas fa-bell w-5"></i><span>Notifications</span>
              </button>
              <button class="settings-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center space-x-3 ${this.currentTab === 'data' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}" data-tab="data">
                <i class="fas fa-database w-5"></i><span>Data Management</span>
              </button>
              <button class="settings-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center space-x-3 ${this.currentTab === 'advanced' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}" data-tab="advanced">
                <i class="fas fa-sliders-h w-5"></i><span>Advanced</span>
              </button>
              <button class="settings-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center space-x-3 ${this.currentTab === 'about' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}" data-tab="about">
                <i class="fas fa-info-circle w-5"></i><span>About</span>
              </button>
            </nav>
          </div>
        </div>

        <div class="flex-1">
          <div id="settings-content" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            ${this.renderTabContent()}
          </div>
        </div>
      </div>
    `;

    this.setupTabListeners();
  }

  renderTabContent() {
    switch(this.currentTab) {
      case 'general': return this.renderGeneralSettings();
      case 'appearance': return this.renderAppearanceSettings();
      case 'notifications': return this.renderNotificationSettings();
      case 'data': return this.renderDataSettings();
      case 'advanced': return this.renderAdvancedSettings();
      case 'about': return this.renderAboutSection();
      default: return this.renderGeneralSettings();
    }
  }

  renderGeneralSettings() {
    return `
      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-6">General Settings</h2>
        <div class="space-y-6">
          <div>
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Church Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Church Name</label>
                <input type="text" id="setting-churchName" value="${this.escapeHtml(this.settings.churchName)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Assembly/Branch</label>
                <input type="text" id="setting-assembly" value="${this.escapeHtml(this.settings.assembly)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" id="setting-phone" value="${this.escapeHtml(this.settings.phone)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea id="setting-address" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">${this.escapeHtml(this.settings.address)}</textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="setting-email" value="${this.escapeHtml(this.settings.email)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" id="setting-website" value="${this.escapeHtml(this.settings.website)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
              </div>
            </div>
          </div>

          <div class="border-t border-gray-100 pt-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Pastor Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Pastor Name</label>
                <input type="text" id="setting-pastorName" value="${this.escapeHtml(this.settings.pastorName)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Pastor Email</label>
                <input type="email" id="setting-pastorEmail" value="${this.escapeHtml(this.settings.pastorEmail)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button onclick="app.settingsManager.saveGeneralSettings()" class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
              <i class="fas fa-save mr-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderAppearanceSettings() {
    return `
      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-6">Appearance</h2>
        <div class="space-y-6">
          <div>
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Theme Mode</h3>
            <div class="grid grid-cols-2 gap-4">
              <button id="theme-light-btn" class="p-6 border-2 rounded-xl text-center transition-all ${this.settings.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}" onclick="app.settingsManager.setTheme('light')">
                <i class="fas fa-sun text-3xl text-yellow-500 mb-3"></i>
                <p class="font-medium text-gray-800">Light Mode</p>
              </button>
              <button id="theme-dark-btn" class="p-6 border-2 rounded-xl text-center transition-all ${this.settings.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}" onclick="app.settingsManager.setTheme('dark')">
                <i class="fas fa-moon text-3xl text-indigo-500 mb-3"></i>
                <p class="font-medium text-gray-800">Dark Mode</p>
              </button>
            </div>
          </div>

          <div class="border-t border-gray-100 pt-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Church Logo</h3>
            <div class="flex items-center space-x-4">
              <div class="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                ${this.settings.logo ? `<img src="${this.settings.logo}" alt="Logo" class="w-full h-full object-cover">` : '<i class="fas fa-church text-3xl text-gray-400"></i>'}
              </div>
              <div>
                <button onclick="document.getElementById('logo-upload').click()" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                  <i class="fas fa-upload mr-2"></i>Upload Logo
                </button>
                <input type="file" id="logo-upload" accept="image/*" class="hidden" onchange="app.settingsManager.handleLogoUpload(event)">
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button onclick="app.settingsManager.saveAppearanceSettings()" class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
              <i class="fas fa-save mr-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderNotificationSettings() {
    return `
      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-6">Notification Settings</h2>
        <div class="space-y-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-800">Push Notifications</p>
                <p class="text-sm text-gray-500">Receive browser notifications for reminders</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="setting-notifications" ${this.settings.notifications ? 'checked' : ''} class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div class="p-4 bg-gray-50 rounded-lg">
              <label class="block text-sm font-medium text-gray-700 mb-2">Reminder Advance Time</label>
              <select id="setting-reminderAdvance" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
                <option value="15" ${this.settings.reminderAdvance === '15' ? 'selected' : ''}>15 minutes before</option>
                <option value="30" ${this.settings.reminderAdvance === '30' ? 'selected' : ''}>30 minutes before</option>
                <option value="60" ${this.settings.reminderAdvance === '60' ? 'selected' : ''}>1 hour before</option>
                <option value="1440" ${this.settings.reminderAdvance === '1440' ? 'selected' : ''}>1 day before</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button onclick="app.settingsManager.saveNotificationSettings()" class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
              <i class="fas fa-save mr-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderDataSettings() {
    return `
      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-6">Data Management</h2>
        <div class="space-y-6">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-800">Automatic Backup</p>
              <p class="text-sm text-gray-500">Periodically backup all data</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="setting-autoBackup" ${this.settings.autoBackup ? 'checked' : ''} class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="border-t border-gray-100 pt-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Manual Actions</h3>
            <div class="space-y-3">
              <button onclick="app.settingsManager.exportSettings()" class="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-left flex items-center justify-between">
                <span><i class="fas fa-file-export mr-3 text-blue-500"></i>Export Settings</span>
                <i class="fas fa-chevron-right text-gray-400"></i>
              </button>
              <button onclick="document.getElementById('import-settings-input').click()" class="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-left flex items-center justify-between">
                <span><i class="fas fa-file-import mr-3 text-green-500"></i>Import Settings</span>
                <i class="fas fa-chevron-right text-gray-400"></i>
              </button>
              <input type="file" id="import-settings-input" accept=".json" class="hidden" onchange="app.settingsManager.importSettings(event)">
              <button onclick="app.settingsManager.resetSettings()" class="w-full px-4 py-3 bg-red-50 border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-100 transition text-left flex items-center justify-between">
                <span><i class="fas fa-undo mr-3 text-red-500"></i>Reset to Default Settings</span>
                <i class="fas fa-chevron-right text-red-400"></i>
              </button>
              <button onclick="app.settingsManager.clearAllData()" class="w-full px-4 py-3 bg-red-50 border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-100 transition text-left flex items-center justify-between">
                <span><i class="fas fa-trash mr-3 text-red-500"></i>Clear All Data</span>
                <i class="fas fa-chevron-right text-red-400"></i>
              </button>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button onclick="app.settingsManager.saveDataSettings()" class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
              <i class="fas fa-save mr-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderAdvancedSettings() {
    return `
      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-6">Advanced Settings</h2>
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Default Start Page</label>
            <select id="setting-defaultView" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
              <option value="dashboard" ${this.settings.defaultView === 'dashboard' ? 'selected' : ''}>Dashboard</option>
              <option value="contacts" ${this.settings.defaultView === 'contacts' ? 'selected' : ''}>Contacts</option>
              <option value="followup" ${this.settings.defaultView === 'followup' ? 'selected' : ''}>Follow-up</option>
              <option value="calendar" ${this.settings.defaultView === 'calendar' ? 'selected' : ''}>Calendar</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Records Per Page</label>
            <select id="setting-recordsPerPage" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
              <option value="5" ${this.settings.recordsPerPage === '5' ? 'selected' : ''}>5</option>
              <option value="10" ${this.settings.recordsPerPage === '10' ? 'selected' : ''}>10</option>
              <option value="25" ${this.settings.recordsPerPage === '25' ? 'selected' : ''}>25</option>
              <option value="50" ${this.settings.recordsPerPage === '50' ? 'selected' : ''}>50</option>
            </select>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button onclick="app.settingsManager.saveAdvancedSettings()" class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
              <i class="fas fa-save mr-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderAboutSection() {
    return `
      <div class="text-center py-8">
        <i class="fas fa-church text-5xl text-blue-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-800">Shepherd's Reach</h2>
        <p class="text-gray-500 mt-2">Church Outreach Tracker</p>
        <p class="text-sm text-gray-400 mt-1">Version 1.0.0</p>
        <div class="mt-8 max-w-md mx-auto space-y-4 text-left">
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-medium text-gray-800 mb-2">About This Application</h3>
            <p class="text-sm text-gray-600">A comprehensive church outreach management system designed to help churches track contacts, manage visits, monitor spiritual growth, and organize family groups. Built with offline capabilities for field use.</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-medium text-gray-800 mb-2">Data Privacy</h3>
            <p class="text-sm text-gray-600">All data is stored locally on your device. No data is sent to external servers. Your church information remains private and secure.</p>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentTab = btn.dataset.tab;
        this.renderSettingsView();
      });
    });
  }

  setupTabListeners() { this.setupEventListeners(); }

  async handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Logo file size should be less than 2MB'); return; }
    try {
      const base64 = await this.fileToBase64(file);
      await this.saveSetting('logo', base64);
      const logoContainer = document.querySelector('#settings-content .w-24.h-24');
      if (logoContainer) logoContainer.innerHTML = `<img src="${base64}" alt="Logo" class="w-full h-full object-cover">`;
      this.showToast('Logo updated successfully!', 'success');
    } catch (error) { console.error('Failed to upload logo:', error); }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async setTheme(theme) { await this.saveSetting('theme', theme); this.renderSettingsView(); }

  async saveGeneralSettings() {
    const fields = ['churchName', 'assembly', 'phone', 'address', 'email', 'website', 'pastorName', 'pastorEmail'];
    for (const field of fields) {
      const element = document.getElementById(`setting-${field}`);
      if (element) await this.saveSetting(field, element.value);
    }
    this.showToast('General settings saved!', 'success');
  }

  async saveAppearanceSettings() {
    this.showToast('Appearance settings saved!', 'success');
  }

  async saveNotificationSettings() {
    const notifications = document.getElementById('setting-notifications')?.checked;
    const reminderAdvance = document.getElementById('setting-reminderAdvance')?.value;
    if (notifications !== undefined) await this.saveSetting('notifications', notifications);
    if (reminderAdvance) await this.saveSetting('reminderAdvance', reminderAdvance);

    let permission = null;
    if (notifications && app.notificationManager) {
      permission = await app.notificationManager.ensurePermission();
    }

    if (app.notificationManager) {
      await app.notificationManager.refresh({ notifyBrowser: false });
    }

    if (notifications && permission === 'denied') {
      this.showToast('Notification settings saved, but browser permission was denied.', 'error');
      return;
    }

    this.showToast('Notification settings saved!', 'success');
  }

  async saveDataSettings() {
    const autoBackup = document.getElementById('setting-autoBackup')?.checked;
    if (autoBackup !== undefined) await this.saveSetting('autoBackup', autoBackup);
    this.showToast('Data settings saved!', 'success');
  }

  async saveAdvancedSettings() {
    const defaultView = document.getElementById('setting-defaultView')?.value;
    const recordsPerPage = document.getElementById('setting-recordsPerPage')?.value;
    if (defaultView) await this.saveSetting('defaultView', defaultView);
    if (recordsPerPage) await this.saveSetting('recordsPerPage', recordsPerPage);
    this.showToast('Advanced settings saved!', 'success');
  }

  async exportSettings() {
    try {
      const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `church-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.showToast('Settings exported!', 'success');
    } catch (error) { console.error('Failed to export settings:', error); }
  }

  async importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      if (!confirm('Import settings? This will override your current settings.')) return;
      for (const [key, value] of Object.entries(settings)) await this.saveSetting(key, value);
      await this.loadSettings();
      this.renderSettingsView();
      this.showToast('Settings imported successfully!', 'success');
    } catch (error) { console.error('Failed to import settings:', error); alert('Failed to import settings.'); }
  }

  async resetSettings() {
    if (!confirm('Reset all settings to default?')) return;
    try {
      await db.clear('settings');
      for (const [key, value] of Object.entries(this.defaultSettings)) await db.put('settings', { key, value });
      await this.loadSettings();
      this.renderSettingsView();
      this.showToast('Settings reset to defaults', 'success');
    } catch (error) { console.error('Failed to reset settings:', error); }
  }

  async clearAllData() {
    if (!confirm('WARNING: This will delete ALL data. Are you sure?')) return;
    if (prompt('Type DELETE to confirm:') !== 'DELETE') return;
    try {
      const stores = ['contacts', 'visits', 'prayers', 'families', 'settings', 'pending-sync'];
      for (const store of stores) await db.clear(store);
      localStorage.clear();
      alert('All data cleared. The page will reload.');
      window.location.reload();
    } catch (error) { console.error('Failed to clear data:', error); }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium z-50 transition-all ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

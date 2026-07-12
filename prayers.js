/**
 * Church Outreach Tracker
 * Prayer Requests Module - Phase 7
 * Copyright (c) 2024. All rights reserved.
 */

class PrayerManager {
  constructor() {
    this.prayers = [];
    this.contactsById = new Map();
    this.filteredPrayers = [];
    this.currentView = 'all';
    this.currentPage = 1;
    this.pageSize = 10;
    this.searchQuery = '';
    this.filterCategory = 'all';
    this.filterUrgency = 'all';
    this.sortField = 'createdAt';
    this.sortDirection = 'desc';
  }

  async init() { await this.loadPrayers(); this.renderPrayerView(); this.setupEventListeners(); }

  async loadPrayers() {
    try {
      const [prayers, contacts] = await Promise.all([
        db.getAll('prayers'),
        db.getAll('contacts')
      ]);

      this.prayers = prayers || [];
      this.contactsById = new Map((contacts || []).map(contact => [contact.id, contact]));
      this.applyFilters();
    } catch (error) {
      this.prayers = [];
      this.contactsById = new Map();
      this.filteredPrayers = [];
    }
  }

  applyFilters() {
    let result = [...this.prayers];
    if (this.currentView === 'active') result = result.filter(p => !p.answered);
    else if (this.currentView === 'answered') result = result.filter(p => p.answered);
    else if (this.currentView === 'urgent') result = result.filter(p => p.urgency === 'Urgent' && !p.answered);
    if (this.searchQuery) { const q = this.searchQuery.toLowerCase(); result = result.filter(p => p.request?.toLowerCase().includes(q) || p.answer?.toLowerCase().includes(q)); }
    if (this.filterCategory !== 'all') result = result.filter(p => p.category === this.filterCategory);
    if (this.filterUrgency !== 'all') result = result.filter(p => p.urgency === this.filterUrgency);
    result.sort((a, b) => { let va = a[this.sortField] || '', vb = b[this.sortField] || ''; if (typeof va === 'string') va = va.toLowerCase(); if (typeof vb === 'string') vb = vb.toLowerCase(); return this.sortDirection === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1); });
    this.filteredPrayers = result;
  }

  renderPrayerView() {
    const container = document.getElementById('prayers-container'); if (!container) return;
    const stats = this.calculateStats();
    container.innerHTML = `
      <div class="mb-6"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 class="text-2xl font-bold text-gray-800">Prayer Requests</h1><p class="text-gray-500 text-sm">Track and manage prayer needs</p></div><button id="add-prayer-btn" class="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"><i class="fas fa-pray mr-2"></i>Add Prayer Request</button></div></div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition" onclick="app.prayerManager.switchView('all')"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500">Total</p><p class="text-3xl font-bold">${stats.total}</p></div><div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i class="fas fa-praying-hands"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition" onclick="app.prayerManager.switchView('active')"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500">Active</p><p class="text-3xl font-bold text-yellow-600">${stats.active}</p></div><div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><i class="fas fa-hourglass-half"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition" onclick="app.prayerManager.switchView('answered')"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500">Answered</p><p class="text-3xl font-bold text-green-600">${stats.answered}</p></div><div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i class="fas fa-check-circle"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition" onclick="app.prayerManager.switchView('urgent')"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500">Urgent</p><p class="text-3xl font-bold text-red-600">${stats.urgent}</p></div><div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><i class="fas fa-exclamation-circle"></i></div></div></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="flex flex-col lg:flex-row gap-4">
          <div class="flex-1 relative"><i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i><input type="text" id="prayer-search" placeholder="Search prayer requests..." class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"></div>
          <select id="prayer-category-filter" class="px-4 py-2.5 border border-gray-200 rounded-lg text-sm"><option value="all">All Categories</option><option value="Health">Health</option><option value="Family">Family</option><option value="Financial">Financial</option><option value="Spiritual">Spiritual</option><option value="Other">Other</option></select>
          <select id="prayer-urgency-filter" class="px-4 py-2.5 border border-gray-200 rounded-lg text-sm"><option value="all">All Urgency</option><option value="Urgent">Urgent</option><option value="High">High</option><option value="Normal">Normal</option></select>
        </div>
        <div class="flex space-x-2 mt-4">
          <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg ${this.currentView==='all'?'bg-blue-600 text-white':'bg-gray-100'}" data-view="all">All</button>
          <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg ${this.currentView==='active'?'bg-blue-600 text-white':'bg-gray-100'}" data-view="active">Active</button>
          <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg ${this.currentView==='answered'?'bg-blue-600 text-white':'bg-gray-100'}" data-view="answered">Answered</button>
          <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg ${this.currentView==='urgent'?'bg-blue-600 text-white':'bg-gray-100'}" data-view="urgent">Urgent</button>
        </div>
      </div>
      <div id="prayer-list" class="space-y-4">${this.renderPrayerList()}</div>
      <div id="prayer-pagination"></div>
    `;
    this.renderPagination(); this.setupViewButtons();
  }

  renderPrayerList() {
    const start = (this.currentPage - 1) * this.pageSize; const end = start + this.pageSize;
    const pagePrayers = this.filteredPrayers.slice(start, end);
    if (pagePrayers.length === 0) return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center"><i class="fas fa-praying-hands text-5xl text-gray-300 mb-4"></i><p class="text-lg font-medium text-gray-500">No prayer requests found</p></div>`;
    return pagePrayers.map(p => this.createPrayerCard(p)).join('');
  }

  createPrayerCard(prayer) {
    let contact = null; if (prayer.contactId) contact = this.contactsById.get(prayer.contactId) || null;
    const urgencyColors = { 'Urgent': 'border-l-red-500', 'High': 'border-l-orange-500', 'Normal': 'border-l-blue-500' };
    const urgencyBadges = { 'Urgent': 'bg-red-100 text-red-700', 'High': 'bg-orange-100 text-orange-700', 'Normal': 'bg-blue-100 text-blue-700' };
    return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${urgencyColors[prayer.urgency]||'border-l-gray-300'} hover:shadow-md transition ${prayer.answered?'opacity-75':''}"><div class="p-5"><div class="flex items-start justify-between"><div class="flex-1 space-y-3"><div class="flex items-center space-x-2"><span class="px-2.5 py-1 text-xs font-medium rounded-full ${urgencyBadges[prayer.urgency]||'bg-gray-100'}"><i class="fas fa-exclamation-circle mr-1"></i>${prayer.urgency||'Normal'}</span><span class="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">${prayer.category||'General'}</span>${prayer.answered?'<span class="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"><i class="fas fa-check-circle mr-1"></i>Answered</span>':''}</div><p class="text-gray-800 font-medium">${this.escapeHtml(prayer.request)}</p>${prayer.answered&&prayer.answer?`<div class="bg-green-50 border border-green-200 rounded-lg p-3"><p class="text-sm text-green-800"><strong>Answer:</strong> ${this.escapeHtml(prayer.answer)}</p></div>`:''}${contact?`<div class="flex items-center text-sm text-gray-500"><i class="fas fa-user mr-2"></i><button onclick="app.profileManager.viewProfile('${contact.id}')" class="text-blue-600 hover:underline">${this.escapeHtml(contact.name)}</button></div>`:''}<p class="text-xs text-gray-400">Requested ${new Date(prayer.createdAt).toLocaleDateString()}</p></div><div class="flex flex-col space-y-2 ml-4">${!prayer.answered?`<button onclick="app.prayerManager.showAnswerModal('${prayer.id}')" class="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg">Answer</button>`:''}<button onclick="app.prayerManager.editPrayer('${prayer.id}')" class="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">Edit</button><button onclick="app.prayerManager.deletePrayer('${prayer.id}')" class="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg">Delete</button></div></div></div></div>`;
  }

  calculateStats() { return { total: this.prayers.length, active: this.prayers.filter(p => !p.answered).length, answered: this.prayers.filter(p => p.answered).length, urgent: this.prayers.filter(p => p.urgency === 'Urgent' && !p.answered).length }; }

  renderPagination() {
    const container = document.getElementById('prayer-pagination'); if (!container) return;
    const totalPages = Math.ceil(this.filteredPrayers.length / this.pageSize); if (totalPages <= 1) { container.innerHTML = ''; return; }
    let pages = []; for (let i = 1; i <= totalPages; i++) { if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) pages.push(i); else if (pages[pages.length - 1] !== '...') pages.push('...'); }
    container.innerHTML = `<div class="flex items-center justify-center space-x-2 mt-6"><button onclick="app.prayerManager.goToPage(${this.currentPage-1})" ${this.currentPage===1?'disabled':''} class="px-3 py-2 text-sm rounded-lg border ${this.currentPage===1?'text-gray-300':'text-gray-600 hover:bg-gray-50'}"><i class="fas fa-chevron-left"></i></button>${pages.map(p => p==='...'?'<span class="px-2 text-gray-400">...</span>':`<button onclick="app.prayerManager.goToPage(${p})" class="w-9 h-9 text-sm rounded-lg ${p===this.currentPage?'bg-blue-600 text-white':'text-gray-600 border hover:bg-gray-50'}">${p}</button>`).join('')}<button onclick="app.prayerManager.goToPage(${this.currentPage+1})" ${this.currentPage===totalPages?'disabled':''} class="px-3 py-2 text-sm rounded-lg border ${this.currentPage===totalPages?'text-gray-300':'text-gray-600 hover:bg-gray-50'}"><i class="fas fa-chevron-right"></i></button></div>`;
  }

  goToPage(page) { const totalPages = Math.ceil(this.filteredPrayers.length / this.pageSize); if (page < 1 || page > totalPages) return; this.currentPage = page; document.getElementById('prayer-list').innerHTML = this.renderPrayerList(); this.renderPagination(); }

  setupViewButtons() { document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => this.switchView(btn.dataset.view))); }
  switchView(view) { this.currentView = view; this.currentPage = 1; this.applyFilters(); this.renderPrayerView(); }

  setupEventListeners() {
    document.getElementById('add-prayer-btn')?.addEventListener('click', () => this.showPrayerModal());
    document.getElementById('prayer-search')?.addEventListener('input', (e) => { this.searchQuery = e.target.value; this.currentPage = 1; this.applyFilters(); document.getElementById('prayer-list').innerHTML = this.renderPrayerList(); this.renderPagination(); });
    document.getElementById('prayer-category-filter')?.addEventListener('change', (e) => { this.filterCategory = e.target.value; this.currentPage = 1; this.applyFilters(); document.getElementById('prayer-list').innerHTML = this.renderPrayerList(); this.renderPagination(); });
    document.getElementById('prayer-urgency-filter')?.addEventListener('change', (e) => { this.filterUrgency = e.target.value; this.currentPage = 1; this.applyFilters(); document.getElementById('prayer-list').innerHTML = this.renderPrayerList(); this.renderPagination(); });
  }

  async showPrayerModal(prayerData = null) {
    const contacts = await db.getAll('contacts'); const container = document.getElementById('prayer-modal-container'); if (!container) return;
    container.innerHTML = `<div class="modal fixed inset-0 z-50 overflow-y-auto"><div class="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="app.prayerManager.closePrayerModal()"></div><div class="relative min-h-screen flex items-center justify-center p-4"><div class="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"><div class="flex items-center justify-between mb-6"><h3 class="text-lg font-semibold">${prayerData?'Edit':'Add'} Prayer Request</h3><button onclick="app.prayerManager.closePrayerModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button></div><form><input type="hidden" id="prayer-id" value="${prayerData?.id||''}"><div class="space-y-4"><div><label class="block text-sm font-medium mb-1">Prayer Request *</label><textarea id="prayer-request" rows="4" required class="w-full px-3 py-2 border rounded-lg">${this.escapeHtml(prayerData?.request||'')}</textarea></div><div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-1">Urgency</label><select id="prayer-urgency" class="w-full px-3 py-2 border rounded-lg"><option value="Normal">Normal</option><option value="High">High</option><option value="Urgent">Urgent</option></select></div><div><label class="block text-sm font-medium mb-1">Category</label><select id="prayer-category" class="w-full px-3 py-2 border rounded-lg"><option value="Health">Health</option><option value="Family">Family</option><option value="Financial">Financial</option><option value="Spiritual">Spiritual</option><option value="Other">Other</option></select></div></div><div><label class="block text-sm font-medium mb-1">Link to Contact</label><select id="prayer-contact" class="w-full px-3 py-2 border rounded-lg"><option value="">No contact</option>${contacts.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div></div></form><div class="flex justify-end space-x-3 mt-6 pt-4 border-t"><button onclick="app.prayerManager.closePrayerModal()" class="px-4 py-2 border rounded-lg">Cancel</button><button onclick="app.prayerManager.savePrayer()" class="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button></div></div></div></div>`;
  }

  async showAnswerModal(prayerId) { const container = document.getElementById('prayer-modal-container'); if (!container) return; container.innerHTML = `<div class="modal fixed inset-0 z-50 overflow-y-auto"><div class="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="app.prayerManager.closePrayerModal()"></div><div class="relative min-h-screen flex items-center justify-center p-4"><div class="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"><div class="flex items-center justify-between mb-6"><h3 class="text-lg font-semibold">Record Answer</h3><button onclick="app.prayerManager.closePrayerModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button></div><div class="space-y-4"><div><label class="block text-sm font-medium mb-1">How was this prayer answered?</label><textarea id="prayer-answer" rows="4" required class="w-full px-3 py-2 border rounded-lg"></textarea></div><input type="hidden" id="answer-prayer-id" value="${prayerId}"></div><div class="flex justify-end space-x-3 mt-6 pt-4 border-t"><button onclick="app.prayerManager.closePrayerModal()" class="px-4 py-2 border rounded-lg">Cancel</button><button onclick="app.prayerManager.saveAnswer()" class="px-4 py-2 bg-green-600 text-white rounded-lg">Mark Answered</button></div></div></div></div>`; }

  async savePrayer() {
    const id = document.getElementById('prayer-id')?.value; const request = document.getElementById('prayer-request')?.value.trim();
    if (!request) { alert('Please enter a prayer request'); return; }
    const prayer = { id: id || 'prayer_' + Date.now().toString(36), request, urgency: document.getElementById('prayer-urgency')?.value || 'Normal', category: document.getElementById('prayer-category')?.value || 'General', contactId: document.getElementById('prayer-contact')?.value || null, answered: id ? (await db.get('prayers', id))?.answered || false : false, answer: id ? (await db.get('prayers', id))?.answer || '' : '', createdAt: id ? (await db.get('prayers', id))?.createdAt : new Date().toISOString(), updatedAt: new Date().toISOString() };
    try { await db.put('prayers', prayer); if (!connectionManager.isOnline) await db.addToSyncQueue(id?'update':'create', 'prayers', prayer); this.closePrayerModal(); await this.loadPrayers(); this.renderPrayerView(); if (app.notificationManager) await app.notificationManager.refresh(); if (app.currentPage === 'dashboard') app.loadDashboardData(); } catch (error) { console.error('Failed to save prayer:', error); }
  }

  async saveAnswer() {
    const prayerId = document.getElementById('answer-prayer-id')?.value; const answer = document.getElementById('prayer-answer')?.value.trim();
    if (!answer) { alert('Please describe the answer'); return; }
    try { const prayer = await db.get('prayers', prayerId); if (!prayer) return; prayer.answered = true; prayer.answer = answer; prayer.answeredAt = new Date().toISOString(); await db.put('prayers', prayer); this.closePrayerModal(); await this.loadPrayers(); this.renderPrayerView(); if (app.notificationManager) await app.notificationManager.refresh(); } catch (error) { console.error('Failed to save answer:', error); }
  }

  async editPrayer(prayerId) { const prayer = await db.get('prayers', prayerId); if (prayer) await this.showPrayerModal(prayer); }

  async deletePrayer(prayerId) { if (!confirm('Delete this prayer request?')) return; try { await db.delete('prayers', prayerId); await this.loadPrayers(); this.renderPrayerView(); if (app.notificationManager) await app.notificationManager.refresh(); } catch (error) { console.error('Failed to delete prayer:', error); } }

  closePrayerModal() { const container = document.getElementById('prayer-modal-container'); if (container) container.innerHTML = ''; }

  async getDashboardPrayers() {
    try { const prayers = await db.getAll('prayers'); const active = prayers.filter(p => !p.answered); return { total: prayers.length, active: active.length, urgent: active.filter(p => p.urgency === 'Urgent').length, recent: active.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5) }; } catch (error) { return { total: 0, active: 0, urgent: 0, recent: [] }; }
  }

  escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
}

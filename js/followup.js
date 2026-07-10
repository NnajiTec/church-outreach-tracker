/**
 * Church Outreach Tracker
 * Follow-up Module - Phase 4
 * Copyright (c) 2024. All rights reserved.
 */

class FollowUpManager {
  constructor() {
    this.visits = [];
    this.contactsById = new Map();
    this.filteredVisits = [];
    this.currentView = 'upcoming';
    this.currentPage = 1;
    this.pageSize = 10;
  }

  async init() {
    await this.loadVisits();
    this.renderFollowUpView();
    this.setupEventListeners();
  }

  async loadVisits() {
    try {
      const [visits, contacts] = await Promise.all([
        db.getAll('visits'),
        db.getAll('contacts')
      ]);

      this.visits = visits || [];
      this.contactsById = new Map((contacts || []).map(contact => [contact.id, contact]));
      this.applyFilters();
    } catch (error) {
      console.error('Failed to load visits:', error);
      this.visits = [];
      this.contactsById = new Map();
      this.filteredVisits = [];
    }
  }

  applyFilters() {
    const today = new Date(); today.setHours(0, 0, 0, 0); const todayStr = today.toISOString().split('T')[0];
    let result = [...this.visits];
    switch(this.currentView) {
      case 'today': result = result.filter(visit => visit.date.split('T')[0] === todayStr && visit.status !== 'cancelled'); break;
      case 'overdue': result = result.filter(visit => { const visitDate = new Date(visit.date); visitDate.setHours(0,0,0,0); return visitDate < today && visit.status === 'scheduled'; }); break;
      case 'upcoming': result = result.filter(visit => { const visitDate = new Date(visit.date); visitDate.setHours(0,0,0,0); return visitDate >= today && visit.status === 'scheduled'; }); break;
      case 'completed': result = result.filter(visit => visit.status === 'completed'); break;
      case 'cancelled': result = result.filter(visit => visit.status === 'cancelled'); break;
    }
    result.sort((a, b) => this.currentView === 'overdue' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date));
    this.filteredVisits = result;
  }

  renderFollowUpView() {
    const container = document.getElementById('followup-container');
    if (!container) return;
    const stats = this.calculateStats();

    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition" onclick="app.followUpManager.switchView('today')"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500 font-medium">Today's Visits</p><p class="text-3xl font-bold text-blue-600">${stats.today}</p></div><div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i class="fas fa-calendar-day"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition" onclick="app.followUpManager.switchView('overdue')"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500 font-medium">Overdue</p><p class="text-3xl font-bold text-red-500">${stats.overdue}</p></div><div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500"><i class="fas fa-exclamation-triangle"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition" onclick="app.followUpManager.switchView('upcoming')"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500 font-medium">Upcoming</p><p class="text-3xl font-bold text-green-600">${stats.upcoming}</p></div><div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i class="fas fa-calendar-alt"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition" onclick="app.followUpManager.switchView('completed')"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500 font-medium">Completed</p><p class="text-3xl font-bold text-purple-600">${stats.completed}</p></div><div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><i class="fas fa-check-circle"></i></div></div></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex space-x-2">
            <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg transition ${this.currentView === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}" data-view="today"><i class="fas fa-calendar-day mr-1"></i> Today</button>
            <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg transition ${this.currentView === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}" data-view="upcoming"><i class="fas fa-calendar-alt mr-1"></i> Upcoming</button>
            <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg transition ${this.currentView === 'overdue' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}" data-view="overdue"><i class="fas fa-exclamation-triangle mr-1"></i> Overdue ${stats.overdue > 0 ? `<span class="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">${stats.overdue}</span>` : ''}</button>
            <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg transition ${this.currentView === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}" data-view="completed"><i class="fas fa-check-circle mr-1"></i> Completed</button>
            <button class="view-btn px-4 py-2 text-sm font-medium rounded-lg transition ${this.currentView === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}" data-view="cancelled"><i class="fas fa-times-circle mr-1"></i> Cancelled</button>
          </div>
          <button id="schedule-visit-btn" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"><i class="fas fa-plus mr-2"></i>Schedule Visit</button>
        </div>
      </div>
      <div id="visits-list" class="space-y-4">${this.renderVisitsList()}</div>
      <div id="followup-pagination"></div>
    `;
    this.renderPagination();
    this.setupViewButtons();
  }

  renderVisitsList() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageVisits = this.filteredVisits.slice(start, end);
    if (pageVisits.length === 0) {
      return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center"><i class="fas fa-calendar-times text-5xl text-gray-300 mb-4"></i><p class="text-lg font-medium text-gray-500">No ${this.currentView} visits</p></div>`;
    }
    return pageVisits.map(visit => this.createVisitCard(visit)).join('');
  }

  createVisitCard(visit) {
    let contact = { name: 'Unknown Contact' };
    if (visit.contactId) contact = this.contactsById.get(visit.contactId) || contact;
    const isOverdue = visit.status === 'scheduled' && new Date(visit.date) < new Date(new Date().toISOString().split('T')[0]);
    const isToday = visit.date.split('T')[0] === new Date().toISOString().split('T')[0];
    const statusColors = { 'scheduled': isOverdue ? 'border-l-red-500 bg-red-50/50' : isToday ? 'border-l-blue-500 bg-blue-50/50' : 'border-l-yellow-500 bg-yellow-50/50', 'completed': 'border-l-green-500 bg-green-50/50', 'cancelled': 'border-l-gray-400 bg-gray-50/50' };
    const statusBadges = { 'scheduled': isOverdue ? 'bg-red-100 text-red-700' : isToday ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700', 'completed': 'bg-green-100 text-green-700', 'cancelled': 'bg-gray-100 text-gray-600' };
    const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${statusColors[visit.status]} p-5 hover:shadow-md transition-all duration-200">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start space-x-4 flex-1">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">${initials}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-1"><h3 class="font-semibold text-gray-900 truncate">${this.escapeHtml(contact.name)}</h3><span class="px-2 py-0.5 text-xs font-medium rounded-full ${statusBadges[visit.status]}">${visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}</span>${isOverdue ? '<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 animate-pulse">Overdue</span>' : ''}${isToday && visit.status === 'scheduled' ? '<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Today</span>' : ''}</div>
              <p class="text-sm text-gray-500"><i class="far fa-clock mr-1"></i>${new Date(visit.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${visit.time ? ` at ${visit.time}` : ''}</p>
              ${visit.notes ? `<p class="text-sm text-gray-600 mt-2">${this.escapeHtml(visit.notes)}</p>` : ''}
            </div>
          </div>
          <div class="flex items-center space-x-2 flex-shrink-0">
            ${visit.status === 'scheduled' ? `
              <button onclick="app.followUpManager.completeVisit('${visit.id}')" class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition"><i class="fas fa-check mr-1"></i>Complete</button>
              <button onclick="app.followUpManager.showRescheduleModal('${visit.id}')" class="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-lg hover:bg-yellow-600 transition"><i class="fas fa-calendar-alt mr-1"></i>Reschedule</button>
              <button onclick="app.followUpManager.cancelVisit('${visit.id}')" class="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition"><i class="fas fa-times mr-1"></i>Cancel</button>
            ` : ''}
            <button onclick="app.followUpManager.deleteVisit('${visit.id}')" class="text-gray-400 hover:text-red-600 transition p-1"><i class="fas fa-trash text-sm"></i></button>
          </div>
        </div>
      </div>
    `;
  }

  calculateStats() {
    const today = new Date(); today.setHours(0, 0, 0, 0); const todayStr = today.toISOString().split('T')[0];
    return {
      today: this.visits.filter(v => v.date.split('T')[0] === todayStr && v.status !== 'cancelled').length,
      overdue: this.visits.filter(v => new Date(v.date) < today && v.status === 'scheduled').length,
      upcoming: this.visits.filter(v => new Date(v.date) >= today && v.status === 'scheduled').length,
      completed: this.visits.filter(v => v.status === 'completed').length,
      cancelled: this.visits.filter(v => v.status === 'cancelled').length
    };
  }

  renderPagination() {
    const container = document.getElementById('followup-pagination'); if (!container) return;
    const totalPages = Math.ceil(this.filteredVisits.length / this.pageSize);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    container.innerHTML = `<div class="flex items-center justify-center space-x-2 mt-6">
      <button onclick="app.followUpManager.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''} class="px-3 py-2 text-sm font-medium rounded-lg border ${this.currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'} transition"><i class="fas fa-chevron-left"></i></button>
      ${pages.map(page => page === '...' ? '<span class="px-2 text-gray-400">...</span>' : `<button onclick="app.followUpManager.goToPage(${page})" class="w-9 h-9 text-sm font-medium rounded-lg transition ${page === this.currentPage ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 border border-gray-200'}">${page}</button>`).join('')}
      <button onclick="app.followUpManager.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-2 text-sm font-medium rounded-lg border ${this.currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'} transition"><i class="fas fa-chevron-right"></i></button>
    </div>`;
  }

  goToPage(page) { const totalPages = Math.ceil(this.filteredVisits.length / this.pageSize); if (page < 1 || page > totalPages) return; this.currentPage = page; document.getElementById('visits-list').innerHTML = this.renderVisitsList(); this.renderPagination(); }

  setupViewButtons() { document.querySelectorAll('.view-btn').forEach(btn => { btn.addEventListener('click', () => this.switchView(btn.dataset.view)); }); }

  switchView(view) { this.currentView = view; this.currentPage = 1; this.applyFilters(); this.renderFollowUpView(); }

  setupEventListeners() { document.getElementById('schedule-visit-btn')?.addEventListener('click', () => this.showScheduleModal()); }

  async showScheduleModal(visitData = null) {
    const contacts = await db.getAll('contacts');
    const modal = document.getElementById('visit-modal'); const form = document.getElementById('visit-form'); const title = document.getElementById('visit-modal-title');
    if (!modal || !form) return;
    title.textContent = visitData ? 'Edit Visit' : 'Schedule New Visit';
    form.innerHTML = `
      <input type="hidden" id="visit-id" value="${visitData?.id || ''}"><input type="hidden" id="visit-contact-id" value="${visitData?.contactId || ''}">
      <div class="space-y-4">
        <div><label class="block text-sm font-medium text-gray-700 mb-1">Contact *</label><select id="visit-contact" required class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" ${visitData ? 'disabled' : ''}><option value="">Select a contact...</option>${contacts.map(contact => `<option value="${contact.id}" ${visitData?.contactId === contact.id ? 'selected' : ''}>${contact.name}</option>`).join('')}</select></div>
        <div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">Date *</label><input type="date" id="visit-date" required value="${visitData?.date?.split('T')[0] || new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="time" id="visit-time" value="${visitData?.time || ''}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"></div></div>
        <div><label class="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea id="visit-notes" rows="3" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">${this.escapeHtml(visitData?.notes || '')}</textarea></div>
      </div>
    `;
    modal.classList.remove('hidden'); setTimeout(() => document.getElementById('visit-contact')?.focus(), 100);
  }

  async saveVisit() {
    const id = document.getElementById('visit-id')?.value;
    const contactId = document.getElementById('visit-contact-id')?.value || document.getElementById('visit-contact')?.value;
    const date = document.getElementById('visit-date')?.value;
    const time = document.getElementById('visit-time')?.value;
    const notes = document.getElementById('visit-notes')?.value;
    if (!contactId) { alert('Please select a contact'); return; }
    if (!date) { alert('Please select a date'); return; }
    const visit = { id: id || 'visit_' + Date.now().toString(36), contactId, date: date + (time ? `T${time}` : 'T00:00'), time: time || '', notes: notes || '', status: id ? (await db.get('visits', id))?.status || 'scheduled' : 'scheduled', createdAt: id ? (await db.get('visits', id))?.createdAt : new Date().toISOString(), updatedAt: new Date().toISOString() };
    try {
      await db.put('visits', visit);
      const contact = await db.get('contacts', contactId);
      if (contact && visit.status === 'scheduled') { contact.nextAppointment = visit.date; contact.updatedAt = new Date().toISOString(); await db.put('contacts', contact); }
      if (!connectionManager.isOnline) await db.addToSyncQueue(id ? 'update' : 'create', 'visits', visit);
      this.closeVisitModal(); await this.loadVisits(); this.renderFollowUpView();
      if (app.notificationManager) await app.notificationManager.refresh();
      if (app.currentPage === 'dashboard') app.loadDashboardData();
    } catch (error) { console.error('Failed to save visit:', error); alert('Failed to save visit.'); }
  }

  async showRescheduleModal(visitId) { const visit = await db.get('visits', visitId); if (!visit) return; await this.showScheduleModal(visit); }

  async completeVisit(visitId) {
    try {
      const visit = await db.get('visits', visitId); if (!visit) return;
      visit.status = 'completed'; visit.completedAt = new Date().toISOString(); visit.updatedAt = new Date().toISOString();
      await db.put('visits', visit);
      const contact = await db.get('contacts', visit.contactId);
      if (contact && contact.status === 'unreached') { contact.status = 'visited'; contact.updatedAt = new Date().toISOString(); await db.put('contacts', contact); }
      await this.loadVisits(); this.renderFollowUpView();
      if (app.notificationManager) await app.notificationManager.refresh();
      if (app.currentPage === 'dashboard') app.loadDashboardData();
    } catch (error) { console.error('Failed to complete visit:', error); }
  }

  async cancelVisit(visitId) {
    if (!confirm('Are you sure you want to cancel this visit?')) return;
    try { const visit = await db.get('visits', visitId); if (!visit) return; visit.status = 'cancelled'; visit.cancelledAt = new Date().toISOString(); visit.updatedAt = new Date().toISOString(); await db.put('visits', visit); await this.loadVisits(); this.renderFollowUpView(); if (app.notificationManager) await app.notificationManager.refresh(); if (app.currentPage === 'dashboard') app.loadDashboardData(); } catch (error) { console.error('Failed to cancel visit:', error); }
  }

  async deleteVisit(visitId) {
    if (!confirm('Are you sure you want to delete this visit?')) return;
    try { await db.delete('visits', visitId); await this.loadVisits(); this.renderFollowUpView(); if (app.notificationManager) await app.notificationManager.refresh(); if (app.currentPage === 'dashboard') app.loadDashboardData(); } catch (error) { console.error('Failed to delete visit:', error); }
  }

  closeVisitModal() { document.getElementById('visit-modal')?.classList.add('hidden'); }
  escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
}

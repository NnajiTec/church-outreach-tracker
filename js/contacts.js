/**
 * Church Outreach Tracker
 * Contacts Module - Phase 2
 * Copyright (c) 2024. All rights reserved.
 */

class ContactsManager {
  constructor() {
    this.contacts = [];
    this.filteredContacts = [];
    this.currentPage = 1;
    this.pageSize = 10;
    this.searchQuery = '';
    this.filterStatus = 'all';
    this.sortField = 'name';
    this.sortDirection = 'asc';
  }

  async init() {
    await this.loadContacts();
    this.renderContactList();
    this.setupEventListeners();
  }

  async loadContacts() {
    try {
      this.contacts = await db.getAll('contacts');
      this.applyFilters();
    } catch (error) {
      console.error('Failed to load contacts:', error);
      this.contacts = [];
      this.filteredContacts = [];
    }
  }

  applyFilters() {
    let result = [...this.contacts];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(contact => 
        contact.name?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query) ||
        contact.address?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query)
      );
    }

    if (this.filterStatus !== 'all') {
      result = result.filter(contact => contact.status === this.filterStatus);
    }

    result.sort((a, b) => {
      let valueA = (a[this.sortField] || '').toLowerCase();
      let valueB = (b[this.sortField] || '').toLowerCase();
      if (this.sortDirection === 'asc') return valueA.localeCompare(valueB);
      else return valueB.localeCompare(valueA);
    });

    this.filteredContacts = result;
  }

  renderContactList() {
    const container = document.getElementById('contacts-container');
    if (!container) return;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageContacts = this.filteredContacts.slice(start, end);
    const totalPages = Math.ceil(this.filteredContacts.length / this.pageSize);

    if (pageContacts.length === 0) {
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
          <i class="fas fa-user-plus text-5xl mb-4"></i>
          <p class="text-lg font-medium">No contacts found</p>
          <p class="text-sm mt-1">${this.searchQuery ? 'Try adjusting your search' : 'Add your first contact to get started'}</p>
        </div>
      `;
      this.renderPagination(0, 0);
      return;
    }

    container.innerHTML = pageContacts.map(contact => this.createContactCard(contact)).join('');
    this.renderPagination(this.currentPage, totalPages);
  }

  createContactCard(contact) {
    const initials = contact.name
      ? contact.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : '?';
    
    const statusColors = {
      'unreached': 'bg-gray-100 text-gray-700',
      'visited': 'bg-blue-100 text-blue-700',
      'interested': 'bg-green-100 text-green-700',
      'bible-study': 'bg-purple-100 text-purple-700',
      'saved': 'bg-yellow-100 text-yellow-700',
      'baptized': 'bg-teal-100 text-teal-700',
      'serving': 'bg-indigo-100 text-indigo-700'
    };

    const nextAppointment = contact.nextAppointment 
      ? `<p class="text-xs text-gray-500 mt-1"><i class="far fa-calendar-alt mr-1"></i>Next: ${new Date(contact.nextAppointment).toLocaleDateString()}</p>`
      : '';

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
           onclick="app.profileManager.viewProfile('${contact.id}')">
        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0">
            ${contact.photo 
              ? `<img src="${contact.photo}" alt="${contact.name}" class="w-12 h-12 rounded-full object-cover">`
              : `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">${initials}</div>`
            }
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">${this.escapeHtml(contact.name || 'Unnamed Contact')}</h3>
            <p class="text-sm text-gray-500 truncate mt-0.5"><i class="fas fa-phone-alt text-xs mr-1"></i>${contact.phone || 'No phone'}</p>
            <p class="text-sm text-gray-500 truncate"><i class="fas fa-map-marker-alt text-xs mr-1"></i>${contact.address || 'No address'}</p>
            ${nextAppointment}
          </div>
          <div class="flex-shrink-0 flex flex-col items-end space-y-2">
            <span class="px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[contact.status] || 'bg-gray-100 text-gray-700'}">${this.formatStatus(contact.status)}</span>
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="event.stopPropagation(); app.contactsManager.editContact('${contact.id}')" class="text-gray-400 hover:text-blue-600 transition p-1" title="Edit"><i class="fas fa-edit text-sm"></i></button>
              <button onclick="event.stopPropagation(); app.contactsManager.deleteContact('${contact.id}')" class="text-gray-400 hover:text-red-600 transition p-1" title="Delete"><i class="fas fa-trash text-sm"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPagination(currentPage, totalPages) {
    const container = document.getElementById('contacts-pagination');
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    container.innerHTML = `
      <div class="flex items-center justify-center space-x-2 mt-6">
        <button onclick="app.contactsManager.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'} transition"><i class="fas fa-chevron-left"></i></button>
        ${pages.map(page => {
          if (page === '...') return '<span class="px-2 text-gray-400">...</span>';
          return `<button onclick="app.contactsManager.goToPage(${page})" class="w-9 h-9 text-sm font-medium rounded-lg transition ${page === currentPage ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 border border-gray-200'}">${page}</button>`;
        }).join('')}
        <button onclick="app.contactsManager.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'} transition"><i class="fas fa-chevron-right"></i></button>
      </div>
    `;
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredContacts.length / this.pageSize);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderContactList();
  }

  setupEventListeners() {
    document.getElementById('contact-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.currentPage = 1;
      this.applyFilters();
      this.renderContactList();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('bg-blue-600', 'text-white');
          b.classList.add('bg-gray-100', 'text-gray-600');
        });
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-gray-100', 'text-gray-600');
        this.filterStatus = btn.dataset.status;
        this.currentPage = 1;
        this.applyFilters();
        this.renderContactList();
      });
    });

    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sortField = btn.dataset.sort;
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.applyFilters();
        this.renderContactList();
        this.updateSortIcons();
      });
    });

    document.getElementById('add-contact-btn')?.addEventListener('click', () => {
      this.showContactForm();
    });
  }

  updateSortIcons() {
    document.querySelectorAll('.sort-btn i').forEach(icon => {
      icon.className = 'fas fa-sort text-gray-400 ml-1';
    });
    const activeSort = document.querySelector(`.sort-btn[data-sort="${this.sortField}"] i`);
    if (activeSort) {
      activeSort.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} text-blue-600 ml-1`;
    }
  }

  formatStatus(status) {
    const statusMap = {
      'unreached': 'Unreached', 'visited': 'Visited', 'interested': 'Interested',
      'bible-study': 'Bible Study', 'saved': 'Saved', 'baptized': 'Baptized', 'serving': 'Serving'
    };
    return statusMap[status] || 'Unknown';
  }

  async showContactForm(contactId = null) {
    let contact = {
      id: '', name: '', phone: '', email: '', address: '', occupation: '',
      status: 'unreached', notes: '', nextAppointment: '', photo: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };

    if (contactId) {
      const existing = await db.get('contacts', contactId);
      if (existing) contact = existing;
    }

    const modal = document.getElementById('contact-modal');
    const form = document.getElementById('contact-form');
    const title = document.getElementById('modal-title');
    if (!modal || !form) return;

    title.textContent = contactId ? 'Edit Contact' : 'Add New Contact';
    
    form.innerHTML = `
      <input type="hidden" id="contact-id" value="${contact.id}">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input type="text" id="contact-name" value="${this.escapeHtml(contact.name)}" required class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" id="contact-phone" value="${this.escapeHtml(contact.phone)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="contact-email" value="${this.escapeHtml(contact.email)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" id="contact-address" value="${this.escapeHtml(contact.address)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
            <input type="text" id="contact-occupation" value="${this.escapeHtml(contact.occupation)}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="contact-status" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
              ${['unreached','visited','interested','bible-study','saved','baptized','serving'].map(status => 
                `<option value="${status}" ${contact.status === status ? 'selected' : ''}>${this.formatStatus(status)}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Next Appointment</label>
          <input type="date" id="contact-appointment" value="${contact.nextAppointment ? contact.nextAppointment.split('T')[0] : ''}" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="contact-notes" rows="3" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">${this.escapeHtml(contact.notes || '')}</textarea>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('contact-name')?.focus(), 100);
  }

  async saveContact() {
    const id = document.getElementById('contact-id')?.value;
    const name = document.getElementById('contact-name')?.value.trim();
    if (!name) { alert('Please enter a name'); return; }

    const contact = {
      id: id || 'contact_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      name,
      phone: document.getElementById('contact-phone')?.value.trim() || '',
      email: document.getElementById('contact-email')?.value.trim() || '',
      address: document.getElementById('contact-address')?.value.trim() || '',
      occupation: document.getElementById('contact-occupation')?.value.trim() || '',
      status: document.getElementById('contact-status')?.value || 'unreached',
      nextAppointment: document.getElementById('contact-appointment')?.value || '',
      notes: document.getElementById('contact-notes')?.value.trim() || '',
      photo: '',
      createdAt: id ? (await db.get('contacts', id))?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await db.put('contacts', contact);
      if (!connectionManager.isOnline) await db.addToSyncQueue(id ? 'update' : 'create', 'contacts', contact);
      this.closeModal();
      await this.loadContacts();
      this.renderContactList();
      if (app.currentPage === 'dashboard') app.loadDashboardData();
    } catch (error) {
      console.error('Failed to save contact:', error);
      alert('Failed to save contact. Please try again.');
    }
  }

  async editContact(contactId) { await this.showContactForm(contactId); }

  async deleteContact(contactId) {
    const contact = await db.get('contacts', contactId);
    if (!contact) return;
    if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
      try {
        await db.delete('contacts', contactId);
        if (!connectionManager.isOnline) await db.addToSyncQueue('delete', 'contacts', { id: contactId });
        await this.loadContacts();
        this.renderContactList();
        if (app.currentPage === 'dashboard') app.loadDashboardData();
      } catch (error) {
        console.error('Failed to delete contact:', error);
        alert('Failed to delete contact');
      }
    }
  }

  closeModal() {
    document.getElementById('contact-modal')?.classList.add('hidden');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
/**
 * Church Outreach Tracker
 * Family Module - Phase 8
 * Copyright (c) 2024. All rights reserved.
 */

class FamilyManager {
  constructor() {
    this.families = [];
    this.filteredFamilies = [];
    this.currentPage = 1;
    this.pageSize = 9;
    this.searchQuery = '';
    this.currentFamily = null;
    this.currentTab = 'members';
  }

  async init() {
    await this.loadFamilies();
    this.renderFamilyView();
    this.setupEventListeners();
  }

  async loadFamilies() {
    try {
      this.families = await db.getAll('families');
      this.applyFilters();
    } catch (error) {
      console.error('Failed to load families:', error);
      this.families = [];
      this.filteredFamilies = [];
    }
  }

  applyFilters() {
    let result = [...this.families];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(family => 
        family.familyName?.toLowerCase().includes(query) ||
        family.address?.toLowerCase().includes(query) ||
        family.phone?.toLowerCase().includes(query) ||
        family.members?.some(m => m.name?.toLowerCase().includes(query))
      );
    }

    result.sort((a, b) => (a.familyName || '').localeCompare(b.familyName || ''));
    this.filteredFamilies = result;
  }

  renderFamilyView() {
    const container = document.getElementById('families-container');
    if (!container) return;

    const stats = this.calculateStats();

    container.innerHTML = `
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Families</h1>
            <p class="text-gray-500 text-sm">Manage family groups and households</p>
          </div>
          <button id="add-family-btn" class="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center justify-center">
            <i class="fas fa-plus mr-2"></i>Add Family
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 font-medium">Total Families</p>
              <p class="text-3xl font-bold text-blue-600">${stats.total}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <i class="fas fa-users text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 font-medium">Total Members</p>
              <p class="text-3xl font-bold text-green-600">${stats.totalMembers}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <i class="fas fa-user-friends text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 font-medium">Children</p>
              <p class="text-3xl font-bold text-yellow-600">${stats.totalChildren}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <i class="fas fa-child text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 font-medium">Avg. Family Size</p>
              <p class="text-3xl font-bold text-purple-600">${stats.avgSize}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <i class="fas fa-home text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="family-search" placeholder="Search families by name, address, or member..." 
                 class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm">
        </div>
      </div>

      <div id="family-content">
        ${this.currentFamily ? this.renderFamilyDetail() : this.renderFamilyGrid()}
      </div>

      <div id="family-pagination"></div>
      <div id="family-modal-container"></div>
    `;

    if (!this.currentFamily) {
      this.renderPagination();
    }
  }

  renderFamilyGrid() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageFamilies = this.filteredFamilies.slice(start, end);

    if (pageFamilies.length === 0) {
      return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <i class="fas fa-home text-5xl text-gray-300 mb-4"></i>
          <p class="text-lg font-medium text-gray-500">No families found</p>
          <p class="text-sm text-gray-400 mt-1">${this.searchQuery ? 'Try adjusting your search' : 'Add your first family to get started'}</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${pageFamilies.map(family => this.createFamilyCard(family)).join('')}
      </div>
    `;
  }

  createFamilyCard(family) {
    const adults = family.members?.filter(m => m.type === 'adult' || m.type === 'parent') || [];
    const children = family.members?.filter(m => m.type === 'child') || [];
    const hasVisits = family.visitHistory && family.visitHistory.length > 0;
    const lastVisit = hasVisits ? family.visitHistory[family.visitHistory.length - 1] : null;

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
           onclick="app.familyManager.viewFamily('${family.id}')">
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-lg truncate">${this.escapeHtml(family.familyName)}</h3>
            <span class="px-2 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm">
              ${family.members?.length || 0} members
            </span>
          </div>
        </div>

        <div class="p-5 space-y-3">
          <div class="space-y-2">
            ${adults.slice(0, 2).map(member => `
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                  ${member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-800">${this.escapeHtml(member.name)}</p>
                  <p class="text-xs text-gray-500">${member.relationship || 'Member'}</p>
                </div>
              </div>
            `).join('')}
            ${adults.length > 2 ? `<p class="text-xs text-gray-400 pl-10">+${adults.length - 2} more adults</p>` : ''}
          </div>

          ${children.length > 0 ? `
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <i class="fas fa-child text-yellow-500"></i>
              <span>${children.length} child${children.length !== 1 ? 'ren' : ''}</span>
            </div>
          ` : ''}

          <div class="space-y-1 text-sm text-gray-500">
            ${family.address ? `<p><i class="fas fa-map-marker-alt w-4 mr-1"></i>${this.escapeHtml(family.address)}</p>` : ''}
            ${family.phone ? `<p><i class="fas fa-phone-alt w-4 mr-1"></i>${this.escapeHtml(family.phone)}</p>` : ''}
          </div>

          ${lastVisit ? `
            <div class="pt-2 border-t border-gray-100">
              <p class="text-xs text-gray-400">
                <i class="far fa-clock mr-1"></i>Last visit: ${new Date(lastVisit.date).toLocaleDateString()}
              </p>
            </div>
          ` : ''}
        </div>

        <div class="border-t border-gray-100 px-5 py-3 bg-gray-50 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="event.stopPropagation(); app.familyManager.editFamily('${family.id}')" 
                  class="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
          <button onclick="event.stopPropagation(); app.familyManager.deleteFamily('${family.id}')" 
                  class="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </div>
      </div>
    `;
  }

  renderFamilyDetail() {
    const family = this.currentFamily;
    if (!family) return '';

    const visits = family.visitHistory || [];
    const prayers = family.prayerRequests || [];
    const appointments = family.appointments || [];

    return `
      <div class="space-y-6">
        <div class="flex items-center space-x-4 mb-4">
          <button onclick="app.familyManager.backToList()" 
                  class="p-2 hover:bg-gray-100 rounded-lg transition">
            <i class="fas fa-arrow-left text-gray-600"></i>
          </button>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-800">${this.escapeHtml(family.familyName)}</h2>
            <p class="text-gray-500 text-sm">${family.members?.length || 0} members · ${family.address || 'No address'}</p>
          </div>
          <button onclick="app.familyManager.editFamily('${family.id}')" 
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-edit mr-2"></i>Edit Family
          </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="border-b border-gray-200">
            <nav class="flex overflow-x-auto -mb-px">
              <button class="family-tab px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${this.currentTab === 'members' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}" 
                      data-tab="members">
                <i class="fas fa-users mr-1"></i> Members (${family.members?.length || 0})
              </button>
              <button class="family-tab px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${this.currentTab === 'visits' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}" 
                      data-tab="visits">
                <i class="fas fa-history mr-1"></i> Visit History (${visits.length})
              </button>
              <button class="family-tab px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${this.currentTab === 'prayers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}" 
                      data-tab="prayers">
                <i class="fas fa-pray mr-1"></i> Prayer Requests (${prayers.length})
              </button>
              <button class="family-tab px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${this.currentTab === 'appointments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}" 
                      data-tab="appointments">
                <i class="fas fa-calendar-alt mr-1"></i> Appointments (${appointments.length})
              </button>
            </nav>
          </div>

          <div class="p-6">
            ${this.renderTabContent()}
          </div>
        </div>
      </div>
    `;
  }

  renderTabContent() {
    switch(this.currentTab) {
      case 'members': return this.renderMembersTab();
      case 'visits': return this.renderVisitsTab();
      case 'prayers': return this.renderPrayersTab();
      case 'appointments': return this.renderAppointmentsTab();
      default: return '';
    }
  }

  renderMembersTab() {
    const family = this.currentFamily;
    const adults = family.members?.filter(m => m.type === 'adult' || m.type === 'parent') || [];
    const children = family.members?.filter(m => m.type === 'child') || [];

    return `
      <div class="space-y-6">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-semibold text-gray-800"><i class="fas fa-user-tie text-blue-500 mr-2"></i>Parents & Adults</h4>
            <button onclick="app.familyManager.showAddMemberModal('adult')" 
                    class="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              <i class="fas fa-plus mr-1"></i>Add Adult
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${adults.map((member, index) => `
              <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                  ${member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-800">${this.escapeHtml(member.name)}</p>
                  <p class="text-sm text-gray-500">${member.relationship || 'Member'} ${member.age ? `· ${member.age} years` : ''}</p>
                  ${member.phone ? `<p class="text-xs text-gray-400"><i class="fas fa-phone-alt mr-1"></i>${this.escapeHtml(member.phone)}</p>` : ''}
                </div>
                <div class="flex space-x-1">
                  <button onclick="app.familyManager.editMember('adult', ${index})" 
                          class="text-gray-400 hover:text-blue-600 transition p-1">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="app.familyManager.deleteMember('adult', ${index})" 
                          class="text-gray-400 hover:text-red-600 transition p-1">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
            ${adults.length === 0 ? '<p class="text-gray-400 text-sm col-span-full">No adults added yet</p>' : ''}
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-semibold text-gray-800"><i class="fas fa-child text-yellow-500 mr-2"></i>Children</h4>
            <button onclick="app.familyManager.showAddMemberModal('child')" 
                    class="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              <i class="fas fa-plus mr-1"></i>Add Child
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${children.map((child, index) => `
              <div class="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
                <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-semibold text-lg">
                  ${child.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-800">${this.escapeHtml(child.name)}</p>
                  <p class="text-sm text-gray-500">${child.age ? `${child.age} years` : 'Age not specified'} ${child.grade ? `· Grade ${child.grade}` : ''}</p>
                </div>
                <div class="flex space-x-1">
                  <button onclick="app.familyManager.editMember('child', ${index})" 
                          class="text-gray-400 hover:text-blue-600 transition p-1">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="app.familyManager.deleteMember('child', ${index})" 
                          class="text-gray-400 hover:text-red-600 transition p-1">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
            ${children.length === 0 ? '<p class="text-gray-400 text-sm col-span-full">No children added yet</p>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderVisitsTab() {
    const visits = this.currentFamily?.visitHistory || [];

    if (visits.length === 0) {
      return `
        <div class="text-center py-8 text-gray-400">
          <i class="fas fa-calendar-times text-4xl mb-3"></i>
          <p>No visit history for this family</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${visits.sort((a, b) => new Date(b.date) - new Date(a.date)).map(visit => `
          <div class="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-calendar-check text-blue-600"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-800">${new Date(visit.date).toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}</p>
                <span class="px-2 py-1 text-xs font-medium rounded-full ${visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                  ${visit.status}
                </span>
              </div>
              ${visit.notes ? `<p class="text-sm text-gray-600 mt-1">${this.escapeHtml(visit.notes)}</p>` : ''}
              ${visit.purpose ? `<p class="text-xs text-gray-400 mt-1">Purpose: ${visit.purpose}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderPrayersTab() {
    const prayers = this.currentFamily?.prayerRequests || [];

    return `
      <div class="space-y-4">
        <div class="flex justify-end">
          <button onclick="app.familyManager.showAddFamilyPrayerModal()" 
                  class="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <i class="fas fa-plus mr-1"></i>Add Prayer Request
          </button>
        </div>
        ${prayers.length === 0 ? `
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-praying-hands text-4xl mb-3"></i>
            <p>No family prayer requests yet</p>
          </div>
        ` : `
          ${prayers.map((prayer, index) => `
            <div class="border border-gray-200 rounded-lg p-4 ${prayer.answered ? 'bg-green-50/50' : ''}">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${prayer.urgency === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
                      ${prayer.urgency || 'Normal'}
                    </span>
                    ${prayer.answered ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"><i class="fas fa-check mr-1"></i>Answered</span>' : ''}
                  </div>
                  <p class="text-gray-800">${this.escapeHtml(prayer.request)}</p>
                  ${prayer.answer ? `<p class="text-sm text-green-600 mt-2"><strong>Answer:</strong> ${this.escapeHtml(prayer.answer)}</p>` : ''}
                </div>
                <button onclick="app.familyManager.deleteFamilyPrayer(${index})" 
                        class="text-gray-400 hover:text-red-600 transition p-1 ml-2">
                  <i class="fas fa-trash text-sm"></i>
                </button>
              </div>
            </div>
          `).join('')}
        `}
      </div>
    `;
  }

  renderAppointmentsTab() {
    const appointments = this.currentFamily?.appointments || [];

    return `
      <div class="space-y-4">
        <div class="flex justify-end">
          <button onclick="app.followUpManager.showScheduleModal()" 
                  class="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <i class="fas fa-plus mr-1"></i>Schedule Appointment
          </button>
        </div>
        ${appointments.length === 0 ? `
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-calendar-alt text-4xl mb-3"></i>
            <p>No upcoming appointments</p>
          </div>
        ` : `
          ${appointments.sort((a, b) => new Date(a.date) - new Date(b.date)).map(apt => `
            <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <i class="fas fa-calendar text-blue-600"></i>
                <div>
                  <p class="font-medium text-gray-800">${new Date(apt.date).toLocaleDateString('en-US', { 
                    weekday: 'short', month: 'short', day: 'numeric' 
                  })} ${apt.time || ''}</p>
                  <p class="text-sm text-gray-500">${apt.purpose || 'General visit'}</p>
                </div>
              </div>
              <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">${apt.status}</span>
            </div>
          `).join('')}
        `}
      </div>
    `;
  }

  renderPagination() {
    const container = document.getElementById('family-pagination');
    if (!container) return;

    const totalPages = Math.ceil(this.filteredFamilies.length / this.pageSize);
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    container.innerHTML = `
      <div class="flex items-center justify-center space-x-2 mt-6">
        <button onclick="app.familyManager.goToPage(${this.currentPage - 1})" 
                ${this.currentPage === 1 ? 'disabled' : ''}
                class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 
                       ${this.currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'} transition">
          <i class="fas fa-chevron-left"></i>
        </button>
        ${pages.map(page => {
          if (page === '...') return '<span class="px-2 text-gray-400">...</span>';
          return `
            <button onclick="app.familyManager.goToPage(${page})" 
                    class="w-9 h-9 text-sm font-medium rounded-lg transition
                           ${page === this.currentPage ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 border border-gray-200'}">
              ${page}
            </button>
          `;
        }).join('')}
        <button onclick="app.familyManager.goToPage(${this.currentPage + 1})" 
                ${this.currentPage === totalPages ? 'disabled' : ''}
                class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 
                       ${this.currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'} transition">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredFamilies.length / this.pageSize);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    document.getElementById('family-content').innerHTML = this.renderFamilyGrid();
    this.renderPagination();
  }

  calculateStats() {
    const totalMembers = this.families.reduce((sum, f) => sum + (f.members?.length || 0), 0);
    const totalChildren = this.families.reduce((sum, f) => 
      sum + (f.members?.filter(m => m.type === 'child')?.length || 0), 0
    );
    
    return {
      total: this.families.length,
      totalMembers,
      totalChildren,
      avgSize: this.families.length > 0 ? Math.round(totalMembers / this.families.length) : 0
    };
  }

  setupEventListeners() {
    document.getElementById('add-family-btn')?.addEventListener('click', () => {
      this.showFamilyModal();
    });

    document.getElementById('family-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.currentPage = 1;
      this.applyFilters();
      document.getElementById('family-content').innerHTML = this.renderFamilyGrid();
      this.renderPagination();
    });

    document.querySelectorAll('.family-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.dataset.tab;
        this.renderFamilyView();
      });
    });
  }

  async showFamilyModal(familyData = null) {
    const modalContainer = document.getElementById('family-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal fixed inset-0 z-50 overflow-y-auto">
        <div class="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="app.familyManager.closeFamilyModal()"></div>
        <div class="relative min-h-screen flex items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900">${familyData ? 'Edit Family' : 'Create New Family'}</h3>
              <button onclick="app.familyManager.closeFamilyModal()" class="text-gray-400 hover:text-gray-600 transition">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>

            <form id="family-form" onsubmit="event.preventDefault(); app.familyManager.saveFamily();">
              <input type="hidden" id="family-id" value="${familyData?.id || ''}">
              
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                    <input type="text" id="family-name" required 
                           value="${this.escapeHtml(familyData?.familyName || '')}"
                           class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                           placeholder="e.g., The Smith Family">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" id="family-phone" 
                           value="${this.escapeHtml(familyData?.phone || '')}"
                           class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="family-email" 
                           value="${this.escapeHtml(familyData?.email || '')}"
                           class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea id="family-address" rows="2"
                              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">${this.escapeHtml(familyData?.address || '')}</textarea>
                  </div>
                  
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea id="family-notes" rows="3"
                              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">${this.escapeHtml(familyData?.notes || '')}</textarea>
                  </div>
                </div>
              </div>
            </form>

            <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button onclick="app.familyManager.closeFamilyModal()" 
                      class="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onclick="app.familyManager.saveFamily()" 
                      class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                <i class="fas fa-save mr-2"></i>Save Family
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => document.getElementById('family-name')?.focus(), 100);
  }

  async saveFamily() {
    const id = document.getElementById('family-id')?.value;
    const familyName = document.getElementById('family-name')?.value.trim();
    const phone = document.getElementById('family-phone')?.value.trim();
    const email = document.getElementById('family-email')?.value.trim();
    const address = document.getElementById('family-address')?.value.trim();
    const notes = document.getElementById('family-notes')?.value.trim();

    if (!familyName) {
      alert('Please enter a family name');
      return;
    }

    const existing = id ? await db.get('families', id) : null;

    const family = {
      id: id || 'family_' + Date.now().toString(36),
      familyName,
      phone,
      email,
      address,
      notes,
      members: existing?.members || [],
      visitHistory: existing?.visitHistory || [],
      prayerRequests: existing?.prayerRequests || [],
      appointments: existing?.appointments || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await db.put('families', family);
      
      if (!connectionManager.isOnline) {
        await db.addToSyncQueue(id ? 'update' : 'create', 'families', family);
      }

      this.closeFamilyModal();
      await this.loadFamilies();
      this.renderFamilyView();

    } catch (error) {
      console.error('Failed to save family:', error);
      alert('Failed to save family');
    }
  }

  showAddMemberModal(type) {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;
    
    const age = prompt('Enter age (optional):');
    const additional = type === 'adult' ? 
      prompt('Enter relationship (e.g., Father, Mother, Grandparent):') : 
      prompt('Enter grade (optional):');
    
    const member = {
      name: name.trim(),
      type: type,
      age: age ? parseInt(age) : null,
      relationship: type === 'adult' ? (additional || 'Member') : 'Child',
      grade: type === 'child' ? additional || null : null
    };

    this.currentFamily.members.push(member);
    this.saveCurrentFamily();
  }

  editMember(type, index) {
    const members = this.currentFamily.members.filter(m => 
      m.type === type || (type === 'adult' && m.type === 'parent')
    );
    const member = members[index];
    if (!member) return;

    const name = prompt('Edit name:', member.name);
    if (name === null) return;

    const age = prompt('Edit age:', member.age || '');
    const additional = type === 'adult' ? 
      prompt('Edit relationship:', member.relationship) : 
      prompt('Edit grade:', member.grade || '');

    const actualIndex = this.currentFamily.members.indexOf(member);
    if (actualIndex >= 0) {
      this.currentFamily.members[actualIndex] = {
        ...member,
        name: name.trim(),
        age: age ? parseInt(age) : null,
        relationship: type === 'adult' ? (additional || member.relationship) : member.relationship,
        grade: type === 'child' ? (additional || null) : null
      };
      this.saveCurrentFamily();
    }
  }

  deleteMember(type, index) {
    if (!confirm('Remove this family member?')) return;

    const members = this.currentFamily.members.filter(m => 
      m.type === type || (type === 'adult' && m.type === 'parent')
    );
    const member = members[index];
    if (!member) return;

    const actualIndex = this.currentFamily.members.indexOf(member);
    if (actualIndex >= 0) {
      this.currentFamily.members.splice(actualIndex, 1);
      this.saveCurrentFamily();
    }
  }

  showAddFamilyPrayerModal() {
    const request = prompt('Enter prayer request for the family:');
    if (!request) return;

    const urgency = confirm('Is this urgent?') ? 'Urgent' : 'Normal';

    this.currentFamily.prayerRequests.push({
      request: request.trim(),
      urgency,
      answered: false,
      createdAt: new Date().toISOString()
    });
    
    this.saveCurrentFamily();
  }

  deleteFamilyPrayer(index) {
    if (!confirm('Delete this prayer request?')) return;
    this.currentFamily.prayerRequests.splice(index, 1);
    this.saveCurrentFamily();
  }

  async saveCurrentFamily() {
    try {
      this.currentFamily.updatedAt = new Date().toISOString();
      await db.put('families', this.currentFamily);
      this.renderFamilyView();
    } catch (error) {
      console.error('Failed to save family:', error);
      alert('Failed to save changes');
    }
  }

  viewFamily(familyId) {
    const family = this.families.find(f => f.id === familyId);
    if (!family) return;
    this.currentFamily = family;
    this.currentTab = 'members';
    this.renderFamilyView();
  }

  backToList() {
    this.currentFamily = null;
    this.renderFamilyView();
  }

  async editFamily(familyId) {
    const family = this.families.find(f => f.id === familyId);
    if (!family) return;
    await this.showFamilyModal(family);
  }

  async deleteFamily(familyId) {
    const family = this.families.find(f => f.id === familyId);
    if (!family) return;

    if (!confirm(`Are you sure you want to delete the ${family.familyName} family? This will remove all family data.`)) return;

    try {
      await db.delete('families', familyId);
      
      if (this.currentFamily?.id === familyId) {
        this.currentFamily = null;
      }

      await this.loadFamilies();
      this.renderFamilyView();

    } catch (error) {
      console.error('Failed to delete family:', error);
      alert('Failed to delete family');
    }
  }

  closeFamilyModal() {
    const modalContainer = document.getElementById('family-modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
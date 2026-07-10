/**
 * Church Outreach Tracker
 * Contact Profile Module - Phase 3
 * Copyright (c) 2024. All rights reserved.
 */

class ProfileManager {
  constructor() {
    this.currentContactId = null;
    this.currentContact = null;
    this.activeTab = 'overview';
  }

  async viewProfile(contactId) {
    try {
      this.currentContactId = contactId;
      this.currentContact = await db.get('contacts', contactId);
      if (!this.currentContact) { alert('Contact not found'); return; }
      await this.renderProfile();
      this.navigateToProfile();
    } catch (error) {
      console.error('Failed to load profile:', error);
      alert('Failed to load contact profile');
    }
  }

  navigateToProfile() {
    document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
    document.getElementById('view-profile')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  }

  async renderProfile() {
    const container = document.getElementById('profile-container');
    if (!container) return;
    const contact = this.currentContact;
    const initials = contact.name ? contact.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';

    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
              ${contact.photo ? `<img src="${contact.photo}" alt="${contact.name}" class="w-20 h-20 rounded-full border-4 border-white/30 object-cover">` : `<div class="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-4 border-white/30">${initials}</div>`}
              <div>
                <h1 class="text-2xl font-bold">${this.escapeHtml(contact.name)}</h1>
                <p class="text-blue-100">${this.escapeHtml(contact.occupation || 'No occupation')}</p>
                <div class="flex items-center space-x-2 mt-2">
                  <span class="px-3 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm">${this.formatStatus(contact.status)}</span>
                  ${contact.nextAppointment ? `<span class="px-3 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm"><i class="far fa-calendar-alt mr-1"></i>${new Date(contact.nextAppointment).toLocaleDateString()}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="flex space-x-2">
              <button onclick="app.contactsManager.editContact('${contact.id}')" class="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-lg hover:bg-white/30 transition"><i class="fas fa-edit mr-2"></i>Edit</button>
              <button onclick="app.navigateTo('contacts')" class="px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-lg hover:bg-white/20 transition"><i class="fas fa-arrow-left mr-2"></i>Back</button>
            </div>
          </div>
        </div>
        <div class="border-b border-gray-200">
          <nav class="flex overflow-x-auto -mb-px">
            <button class="profile-tab active px-4 py-3 text-sm font-medium border-b-2 border-blue-600 text-blue-600 whitespace-nowrap" data-tab="overview"><i class="fas fa-user mr-1"></i> Overview</button>
            <button class="profile-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="pipeline"><i class="fas fa-road mr-1"></i> Spiritual Pipeline</button>
            <button class="profile-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="family"><i class="fas fa-users mr-1"></i> Family</button>
            <button class="profile-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="prayers"><i class="fas fa-pray mr-1"></i> Prayer Requests</button>
            <button class="profile-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="visits"><i class="fas fa-history mr-1"></i> Visit History</button>
            <button class="profile-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap" data-tab="documents"><i class="fas fa-file-alt mr-1"></i> Documents & Notes</button>
          </nav>
        </div>
      </div>
      <div id="profile-tab-content"></div>
    `;

    await this.loadTabContent('overview');
    this.setupTabListeners();
  }

  setupTabListeners() {
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', async () => {
        document.querySelectorAll('.profile-tab').forEach(t => { t.classList.remove('active', 'border-blue-600', 'text-blue-600'); t.classList.add('border-transparent', 'text-gray-500'); });
        tab.classList.add('active', 'border-blue-600', 'text-blue-600');
        tab.classList.remove('border-transparent', 'text-gray-500');
        await this.loadTabContent(tab.dataset.tab);
      });
    });
  }

  async loadTabContent(tabName) {
    const content = document.getElementById('profile-tab-content');
    if (!content) return;
    this.activeTab = tabName;

    switch(tabName) {
      case 'overview': content.innerHTML = await this.renderOverviewTab(); break;
      case 'pipeline': content.innerHTML = await this.renderPipelineTab(); break;
      case 'family': content.innerHTML = await this.renderFamilyTab(); break;
      case 'prayers': content.innerHTML = await this.renderPrayersTab(); break;
      case 'visits': content.innerHTML = await this.renderVisitsTab(); break;
      case 'documents': content.innerHTML = await this.renderDocumentsTab(); break;
    }
    this.initTabFunctionality(tabName);
  }

  async renderOverviewTab() {
    const contact = this.currentContact;
    const visits = await this.getContactVisits();
    const prayers = await this.getContactPrayers();
    
    return `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center"><i class="fas fa-info-circle text-blue-500 mr-2"></i>Contact Information</h3>
            <div class="space-y-3">
              <div class="flex items-center text-sm"><i class="fas fa-phone-alt w-6 text-gray-400"></i><span class="text-gray-700">${this.escapeHtml(contact.phone || 'Not provided')}</span></div>
              <div class="flex items-center text-sm"><i class="fas fa-envelope w-6 text-gray-400"></i><span class="text-gray-700">${this.escapeHtml(contact.email || 'Not provided')}</span></div>
              <div class="flex items-start text-sm"><i class="fas fa-map-marker-alt w-6 text-gray-400 mt-0.5"></i><span class="text-gray-700">${this.escapeHtml(contact.address || 'Not provided')}</span></div>
              <div class="flex items-center text-sm"><i class="fas fa-briefcase w-6 text-gray-400"></i><span class="text-gray-700">${this.escapeHtml(contact.occupation || 'Not provided')}</span></div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center"><i class="fas fa-chart-bar text-blue-500 mr-2"></i>Quick Stats</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm"><span class="text-gray-600">Total Visits</span><span class="font-semibold text-gray-800">${visits.length}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-600">Prayer Requests</span><span class="font-semibold text-gray-800">${prayers.length}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-600">Family Members</span><span class="font-semibold text-gray-800">${(contact.familyMembers || []).length}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-600">Last Visit</span><span class="font-semibold text-gray-800">${visits.length > 0 ? new Date(visits[visits.length-1].date).toLocaleDateString() : 'Never'}</span></div>
            </div>
          </div>
        </div>
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center"><i class="fas fa-history text-blue-500 mr-2"></i>Recent Activity</h3>
            <div class="space-y-4">
              ${visits.slice(-5).reverse().map(visit => `
                <div class="flex space-x-3">
                  <div class="flex-shrink-0"><div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><i class="fas fa-calendar-check text-blue-600 text-sm"></i></div></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">Visit on ${new Date(visit.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p class="text-sm text-gray-500">${this.escapeHtml(visit.notes || 'No notes')}</p>
                    <span class="text-xs text-gray-400">${new Date(visit.date).toLocaleTimeString()}</span>
                  </div>
                </div>
              `).join('')}
              ${visits.length === 0 ? '<p class="text-sm text-gray-400 italic">No visits recorded yet</p>' : ''}
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center"><i class="fas fa-pray text-blue-500 mr-2"></i>Recent Prayer Requests</h3>
            <div class="space-y-3">
              ${prayers.slice(-3).reverse().map(prayer => `
                <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getUrgencyColor(prayer.urgency)}">${prayer.urgency || 'Normal'}</span>
                  <div class="flex-1"><p class="text-sm text-gray-700">${this.escapeHtml(prayer.request)}</p>${prayer.answered ? '<span class="text-xs text-green-600"><i class="fas fa-check-circle mr-1"></i>Answered</span>' : ''}</div>
                </div>
              `).join('')}
              ${prayers.length === 0 ? '<p class="text-sm text-gray-400 italic">No prayer requests yet</p>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async renderPipelineTab() {
    const contact = this.currentContact;
    const pipelineStages = [
      { id: 'unreached', label: 'Unreached', icon: 'fa-user-slash' },
      { id: 'visited', label: 'Visited', icon: 'fa-door-open' },
      { id: 'interested', label: 'Interested', icon: 'fa-seedling' },
      { id: 'bible-study', label: 'Bible Study', icon: 'fa-book-open' },
      { id: 'saved', label: 'Saved', icon: 'fa-heart' },
      { id: 'baptized', label: 'Baptized', icon: 'fa-water' },
      { id: 'serving', label: 'Serving', icon: 'fa-hands-helping' }
    ];

    const nextStages = { 'unreached': 'visited', 'visited': 'interested', 'interested': 'bible-study', 'bible-study': 'saved', 'saved': 'baptized', 'baptized': 'serving' };

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-semibold text-gray-800 mb-6 flex items-center"><i class="fas fa-road text-blue-500 mr-2"></i>Spiritual Journey Pipeline</h3>
        <div class="relative">
          ${pipelineStages.map((stage, index) => `
            <div class="flex items-start mb-6 relative">
              ${index < pipelineStages.length - 1 ? `<div class="absolute left-6 top-12 w-0.5 h-12 bg-gray-200"></div>` : ''}
              <div class="flex-shrink-0 relative z-10">
                <div class="w-12 h-12 rounded-full flex items-center justify-center ${contact.status === stage.id ? 'bg-blue-600 text-white shadow-lg' : this.isStageCompleted(contact.status, stage.id) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}">
                  <i class="fas ${stage.icon} text-lg"></i>
                </div>
              </div>
              <div class="ml-4 flex-1 pt-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium ${contact.status === stage.id ? 'text-blue-600' : 'text-gray-800'}">${stage.label}</h4>
                  ${contact.status === stage.id ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Current</span>' : this.isStageCompleted(contact.status, stage.id) ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Completed</span>' : ''}
                </div>
                <p class="text-sm text-gray-500 mt-1">${this.getStageDescription(stage.id)}</p>
                ${contact.status === stage.id && nextStages[contact.status] ? `<div class="mt-3"><button onclick="app.profileManager.advancePipeline('${nextStages[contact.status]}')" class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"><i class="fas fa-arrow-right mr-1"></i>Move to ${this.formatStatus(nextStages[contact.status])}</button></div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  async renderFamilyTab() {
    const contact = this.currentContact;
    const familyMembers = contact.familyMembers || [];
    const adults = familyMembers.filter(m => m.type === 'adult' || m.type === 'parent');
    const children = familyMembers.filter(m => m.type === 'child');

    return `
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-6"><h3 class="font-semibold text-gray-800 flex items-center"><i class="fas fa-users text-blue-500 mr-2"></i>Family Members</h3><button onclick="app.profileManager.showAddFamilyMember()" class="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"><i class="fas fa-plus mr-1"></i> Add Member</button></div>
          <div class="space-y-4">
            ${adults.map((member, index) => `
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">${member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>
                  <div><p class="font-medium text-gray-800">${this.escapeHtml(member.name)}</p><p class="text-sm text-gray-500">${this.escapeHtml(member.relationship)} ${member.age ? `· ${member.age} years` : ''}</p></div>
                </div>
                <div class="flex space-x-2">
                  <button onclick="app.profileManager.editFamilyMember(${index})" class="text-gray-400 hover:text-blue-600 transition p-1"><i class="fas fa-edit"></i></button>
                  <button onclick="app.profileManager.deleteFamilyMember(${index})" class="text-gray-400 hover:text-red-600 transition p-1"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            `).join('')}
            ${adults.length === 0 ? '<p class="text-gray-400 text-sm">No adults added yet</p>' : ''}
          </div>
          ${children.length > 0 ? `<h4 class="font-semibold text-gray-800 mt-6 mb-4"><i class="fas fa-child text-yellow-500 mr-2"></i>Children</h4><div class="space-y-4">${children.map((child, index) => `
            <div class="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-semibold text-sm">${child.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>
                <div><p class="font-medium text-gray-800">${this.escapeHtml(child.name)}</p><p class="text-sm text-gray-500">${child.age ? `${child.age} years` : ''} ${child.grade ? `· Grade ${child.grade}` : ''}</p></div>
              </div>
              <div class="flex space-x-2">
                <button onclick="app.profileManager.editFamilyMember(${adults.length + index})" class="text-gray-400 hover:text-blue-600 transition p-1"><i class="fas fa-edit"></i></button>
                <button onclick="app.profileManager.deleteFamilyMember(${adults.length + index})" class="text-gray-400 hover:text-red-600 transition p-1"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          `).join('')}</div>` : ''}
        </div>
      </div>
    `;
  }

  async renderPrayersTab() {
    const prayers = await this.getContactPrayers();
    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6"><h3 class="font-semibold text-gray-800 flex items-center"><i class="fas fa-pray text-blue-500 mr-2"></i>Prayer Requests</h3><button onclick="app.profileManager.showAddPrayerRequest()" class="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"><i class="fas fa-plus mr-1"></i> Add Request</button></div>
        <div class="space-y-4">
          ${prayers.map(prayer => `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getUrgencyColor(prayer.urgency)}">${prayer.urgency || 'Normal'}</span>
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">${prayer.category || 'General'}</span>
                    ${prayer.answered ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"><i class="fas fa-check-circle mr-1"></i>Answered</span>' : ''}
                  </div>
                  <p class="text-gray-800">${this.escapeHtml(prayer.request)}</p>
                  ${prayer.answer ? `<p class="text-sm text-green-600 mt-2 bg-green-50 p-2 rounded"><strong>Answer:</strong> ${this.escapeHtml(prayer.answer)}</p>` : ''}
                  <p class="text-xs text-gray-400 mt-2">Requested on ${new Date(prayer.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="flex space-x-2 ml-4">
                  ${!prayer.answered ? `<button onclick="app.profileManager.markPrayerAnswered('${prayer.id}')" class="text-gray-400 hover:text-green-600 transition p-1" title="Mark as Answered"><i class="fas fa-check"></i></button>` : ''}
                  <button onclick="app.profileManager.deletePrayerRequest('${prayer.id}')" class="text-gray-400 hover:text-red-600 transition p-1" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
          `).join('')}
          ${prayers.length === 0 ? '<div class="text-center py-8 text-gray-400"><i class="fas fa-praying-hands text-4xl mb-3"></i><p>No prayer requests yet</p></div>' : ''}
        </div>
      </div>
    `;
  }

  async renderVisitsTab() {
    const visits = await this.getContactVisits();
    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6"><h3 class="font-semibold text-gray-800 flex items-center"><i class="fas fa-history text-blue-500 mr-2"></i>Visit History</h3><button onclick="app.followUpManager.showScheduleModal()" class="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"><i class="fas fa-calendar-plus mr-1"></i> Schedule Visit</button></div>
        <div class="relative"><div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div class="space-y-6">
            ${visits.sort((a, b) => new Date(b.date) - new Date(a.date)).map(visit => `
              <div class="relative pl-10">
                <div class="absolute left-0 w-8 h-8 rounded-full ${visit.status === 'completed' ? 'bg-green-100' : visit.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'} flex items-center justify-center">
                  <i class="fas ${visit.status === 'completed' ? 'fa-check text-green-600' : visit.status === 'cancelled' ? 'fa-times text-red-600' : 'fa-calendar text-blue-600'} text-sm"></i>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2"><h4 class="font-medium text-gray-800">${visit.status === 'completed' ? 'Visit Completed' : visit.status === 'cancelled' ? 'Visit Cancelled' : 'Visit Scheduled'}</h4><span class="text-sm text-gray-500">${new Date(visit.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                  <p class="text-sm text-gray-600">${this.escapeHtml(visit.notes || 'No notes recorded')}</p>
                </div>
              </div>
            `).join('')}
          </div>
          ${visits.length === 0 ? '<div class="text-center py-8 text-gray-400"><i class="fas fa-calendar-times text-4xl mb-3"></i><p>No visits recorded yet</p></div>' : ''}
        </div>
      </div>
    `;
  }

  async renderDocumentsTab() {
    const notes = this.currentContact.notes || '';
    return `
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="font-semibold text-gray-800 mb-4 flex items-center"><i class="fas fa-sticky-note text-blue-500 mr-2"></i>Notes</h3>
          <div class="space-y-4">
            <textarea id="profile-notes" rows="6" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" placeholder="Add notes about this contact...">${this.escapeHtml(notes)}</textarea>
            <button onclick="app.profileManager.saveNotes()" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"><i class="fas fa-save mr-2"></i>Save Notes</button>
          </div>
        </div>
      </div>
    `;
  }

  async getContactVisits() {
    try { const allVisits = await db.getAll('visits'); return allVisits.filter(visit => visit.contactId === this.currentContactId); } catch (error) { return []; }
  }

  async getContactPrayers() {
    try { const allPrayers = await db.getAll('prayers'); return allPrayers.filter(prayer => prayer.contactId === this.currentContactId); } catch (error) { return []; }
  }

  isStageCompleted(currentStatus, stageId) {
    const stages = ['unreached', 'visited', 'interested', 'bible-study', 'saved', 'baptized', 'serving'];
    return stages.indexOf(currentStatus) > stages.indexOf(stageId);
  }

  getStageDescription(stageId) {
    const descriptions = { 'unreached': 'Initial contact not yet made', 'visited': 'First visit completed, building relationship', 'interested': 'Showing interest in spiritual matters', 'bible-study': 'Regularly participating in Bible study', 'saved': 'Has accepted Christ as Savior', 'baptized': 'Has been baptized', 'serving': 'Actively serving in ministry' };
    return descriptions[stageId] || '';
  }

  async advancePipeline(newStatus) {
    try {
      this.currentContact.status = newStatus;
      this.currentContact.updatedAt = new Date().toISOString();
      await db.put('contacts', this.currentContact);
      const visit = { id: 'visit_' + Date.now(), contactId: this.currentContactId, date: new Date().toISOString(), status: 'completed', notes: `Advanced to ${this.formatStatus(newStatus)}`, type: 'pipeline_change' };
      await db.put('visits', visit);
      await this.renderProfile();
      await this.loadTabContent('pipeline');
    } catch (error) { console.error('Failed to advance pipeline:', error); alert('Failed to update status'); }
  }

  async saveNotes() {
    const notesText = document.getElementById('profile-notes')?.value;
    if (notesText === undefined) return;
    try {
      this.currentContact.notes = notesText;
      this.currentContact.updatedAt = new Date().toISOString();
      await db.put('contacts', this.currentContact);
    } catch (error) { console.error('Failed to save notes:', error); }
  }

  async showAddPrayerRequest() {
    const request = prompt('Enter prayer request:');
    if (!request || !request.trim()) return;
    const urgency = confirm('Is this urgent?') ? 'Urgent' : 'Normal';
    const prayer = { id: 'prayer_' + Date.now(), contactId: this.currentContactId, request: request.trim(), urgency, category: 'General', answered: false, answer: '', createdAt: new Date().toISOString() };
    try { await db.put('prayers', prayer); await this.loadTabContent('prayers'); } catch (error) { console.error('Failed to add prayer request:', error); }
  }

  async markPrayerAnswered(prayerId) {
    const answer = prompt('Enter the answer to this prayer:');
    if (answer === null) return;
    try {
      const prayer = await db.get('prayers', prayerId);
      if (prayer) { prayer.answered = true; prayer.answer = answer; prayer.answeredAt = new Date().toISOString(); await db.put('prayers', prayer); await this.loadTabContent('prayers'); }
    } catch (error) { console.error('Failed to mark prayer as answered:', error); }
  }

  async deletePrayerRequest(prayerId) {
    if (!confirm('Delete this prayer request?')) return;
    try { await db.delete('prayers', prayerId); await this.loadTabContent('prayers'); } catch (error) { console.error('Failed to delete prayer request:', error); }
  }

  showAddFamilyMember() {
    const name = prompt('Enter family member name:'); if (!name) return;
    const relationship = prompt('Enter relationship (spouse, child, parent, etc.):'); if (!relationship) return;
    const age = prompt('Enter age (optional):');
    const type = relationship.toLowerCase() === 'child' ? 'child' : 'adult';
    const member = { name: name.trim(), type, relationship: relationship.trim(), age: age ? parseInt(age) : null };
    if (!this.currentContact.familyMembers) this.currentContact.familyMembers = [];
    this.currentContact.familyMembers.push(member);
    this.saveContactAndReload();
  }

  editFamilyMember(index) {
    const member = this.currentContact.familyMembers[index]; if (!member) return;
    const name = prompt('Edit name:', member.name); if (name === null) return;
    const relationship = prompt('Edit relationship:', member.relationship); if (relationship === null) return;
    const age = prompt('Edit age:', member.age || '');
    this.currentContact.familyMembers[index] = { ...member, name: name.trim(), relationship: relationship.trim(), age: age ? parseInt(age) : null };
    this.saveContactAndReload();
  }

  deleteFamilyMember(index) {
    if (!confirm('Remove this family member?')) return;
    this.currentContact.familyMembers.splice(index, 1);
    this.saveContactAndReload();
  }

  async saveContactAndReload() {
    try { this.currentContact.updatedAt = new Date().toISOString(); await db.put('contacts', this.currentContact); await this.loadTabContent('family'); } catch (error) { console.error('Failed to save contact:', error); }
  }

  getUrgencyColor(urgency) {
    switch(urgency) { case 'Urgent': return 'bg-red-100 text-red-700'; case 'High': return 'bg-orange-100 text-orange-700'; case 'Normal': return 'bg-blue-100 text-blue-700'; default: return 'bg-blue-100 text-blue-700'; }
  }

  formatStatus(status) {
    const statusMap = { 'unreached': 'Unreached', 'visited': 'Visited', 'interested': 'Interested', 'bible-study': 'Bible Study', 'saved': 'Saved', 'baptized': 'Baptized', 'serving': 'Serving' };
    return statusMap[status] || 'Unknown';
  }

  escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
  initTabFunctionality(tabName) { if (tabName === 'documents') document.getElementById('profile-notes')?.focus(); }
}
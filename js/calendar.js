/**
 * Church Outreach Tracker
 * Calendar Module - Phase 5
 * Copyright (c) 2024. All rights reserved.
 */

class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.currentView = 'month';
    this.visits = [];
    this.selectedDate = null;
  }

  async init() { await this.loadVisits(); this.renderCalendar(); this.setupEventListeners(); }

  async loadVisits() { try { this.visits = await db.getAll('visits'); } catch (error) { this.visits = []; } }

  renderCalendar() {
    const container = document.getElementById('calendar-container'); if (!container) return;
    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <button id="calendar-prev" class="p-2 hover:bg-gray-100 rounded-lg transition"><i class="fas fa-chevron-left text-gray-600"></i></button>
            <h2 id="calendar-title" class="text-xl font-semibold text-gray-800 min-w-[200px] text-center"></h2>
            <button id="calendar-next" class="p-2 hover:bg-gray-100 rounded-lg transition"><i class="fas fa-chevron-right text-gray-600"></i></button>
            <button id="calendar-today" class="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Today</button>
          </div>
          <div class="flex bg-gray-100 rounded-lg p-1">
            <button class="calendar-view-btn px-4 py-2 text-sm font-medium rounded-md transition ${this.currentView === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}" data-view="month"><i class="fas fa-calendar-alt mr-1"></i> Month</button>
            <button class="calendar-view-btn px-4 py-2 text-sm font-medium rounded-md transition ${this.currentView === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}" data-view="week"><i class="fas fa-calendar-week mr-1"></i> Week</button>
            <button class="calendar-view-btn px-4 py-2 text-sm font-medium rounded-md transition ${this.currentView === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}" data-view="day"><i class="fas fa-calendar-day mr-1"></i> Day</button>
          </div>
          <button id="calendar-add-visit" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"><i class="fas fa-plus mr-2"></i>New Appointment</button>
        </div>
      </div>
      <div id="calendar-grid" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">${this.renderCalendarGrid()}</div>
      <div class="mt-6">${this.renderUpcomingReminders()}</div>
    `;
    this.updateCalendarTitle();
    this.setupCalendarListeners();
  }

  renderCalendarGrid() {
    switch(this.currentView) {
      case 'month': return this.renderMonthView();
      case 'week': return this.renderWeekView();
      case 'day': return this.renderDayView();
      default: return this.renderMonthView();
    }
  }

  renderMonthView() {
    const year = this.currentDate.getFullYear(), month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(), totalDays = lastDay.getDate();
    const today = new Date(); today.setHours(0,0,0,0); const todayStr = today.toISOString().split('T')[0];
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = `<div class="grid grid-cols-7 border-b border-gray-200">${dayHeaders.map(day => `<div class="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">${day}</div>`).join('')}</div><div class="grid grid-cols-7">`;
    for (let i = 0; i < startPadding; i++) { const prevMonthDay = new Date(year, month, -startPadding + i + 1); html += this.renderDayCell(prevMonthDay, true); }
    for (let day = 1; day <= totalDays; day++) { const date = new Date(year, month, day); const dateStr = date.toISOString().split('T')[0]; const isToday = dateStr === todayStr; html += this.renderDayCell(date, false, isToday); }
    const endPadding = 42 - (startPadding + totalDays);
    for (let i = 1; i <= endPadding; i++) { const nextMonthDay = new Date(year, month + 1, i); html += this.renderDayCell(nextMonthDay, true); }
    html += '</div>'; return html;
  }

  renderDayCell(date, isPadding, isToday = false) {
    const dateStr = date.toISOString().split('T')[0]; const dayVisits = this.getVisitsForDate(dateStr);
    const hasOverdue = dayVisits.some(v => v.status === 'scheduled' && new Date(v.date) < new Date());
    return `<div class="calendar-day border-b border-r border-gray-100 min-h-[100px] p-1.5 cursor-pointer hover:bg-blue-50/50 transition group ${isPadding ? 'bg-gray-50/50' : ''} ${isToday ? 'bg-blue-50/30' : ''}" onclick="app.calendarManager.handleDayClick('${dateStr}', ${isPadding})">
      <div class="flex items-center justify-between mb-1"><span class="text-xs font-medium ${isPadding ? 'text-gray-400' : 'text-gray-700'} ${isToday ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center' : ''}">${date.getDate()}</span>${hasOverdue ? '<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>' : ''}</div>
      <div class="space-y-0.5">${dayVisits.slice(0, 3).map(visit => `<div class="text-[10px] px-1.5 py-0.5 rounded border ${visit.status === 'completed' ? 'bg-green-100 text-green-700' : visit.status === 'scheduled' && new Date(visit.date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'} truncate">${visit.time ? visit.time + ' ' : ''}Visit</div>`).join('')}${dayVisits.length > 3 ? `<div class="text-[10px] text-gray-500 font-medium px-1.5">+${dayVisits.length - 3} more</div>` : ''}</div>
    </div>`;
  }

  renderWeekView() {
    const startOfWeek = this.getStartOfWeek(this.currentDate); const today = new Date(); today.setHours(0,0,0,0); const todayStr = today.toISOString().split('T')[0];
    const hours = Array.from({ length: 16 }, (_, i) => i + 6);
    let html = `<div class="overflow-x-auto"><div class="min-w-[800px]"><div class="grid grid-cols-8 border-b border-gray-200 bg-gray-50"><div class="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase border-r border-gray-200">Time</div>${Array.from({ length: 7 }, (_, i) => { const date = new Date(startOfWeek); date.setDate(date.getDate() + i); const dateStr = date.toISOString().split('T')[0]; const isToday = dateStr === todayStr; return `<div class="px-2 py-3 text-center border-r border-gray-200 ${isToday ? 'bg-blue-50' : ''}"><div class="text-xs font-semibold text-gray-600">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}</div><div class="text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}">${date.getDate()}</div></div>`; }).join('')}</div><div class="grid grid-cols-8">`;
    hours.forEach(hour => { const hourStr = hour.toString().padStart(2, '0') + ':00'; html += `<div class="contents"><div class="px-2 py-4 text-xs text-gray-400 border-r border-b border-gray-100 text-right pr-3">${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}</div>${Array.from({ length: 7 }, (_, dayIndex) => { const date = new Date(startOfWeek); date.setDate(date.getDate() + dayIndex); const dateStr = date.toISOString().split('T')[0]; return `<div class="border-r border-b border-gray-100 p-1 relative min-h-[40px] hover:bg-blue-50/30 transition cursor-pointer" onclick="app.calendarManager.handleDayClick('${dateStr}', false)"></div>`; }).join('')}</div>`; });
    html += '</div></div></div>'; return html;
  }

  renderDayView() {
    const dateStr = this.currentDate.toISOString().split('T')[0]; const dayVisits = this.getVisitsForDate(dateStr);
    return `<div class="p-6"><div class="text-center mb-6"><h3 class="text-2xl font-bold text-gray-800">${this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3><p class="text-gray-500 mt-1">${dayVisits.length} appointment${dayVisits.length !== 1 ? 's' : ''}</p></div><div class="max-w-2xl mx-auto space-y-2">${dayVisits.map(visit => `<div class="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition" onclick="app.calendarManager.showEventDetail('${visit.id}')"><div class="flex items-center justify-between"><h4 class="font-medium text-gray-800">Visit</h4><span class="text-sm text-gray-500">${visit.time || ''}</span></div>${visit.notes ? `<p class="text-sm text-gray-600 mt-1">${this.escapeHtml(visit.notes)}</p>` : ''}</div>`).join('')}</div></div>`;
  }

  renderUpcomingReminders() {
    const now = new Date(); const upcomingVisits = this.visits.filter(v => v.status === 'scheduled' && new Date(v.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
    if (upcomingVisits.length === 0) return '';
    return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 class="font-semibold text-gray-800 mb-4 flex items-center"><i class="fas fa-bell text-blue-500 mr-2"></i>Upcoming Reminders</h3><div class="space-y-3">${upcomingVisits.map(visit => { const isSoon = (new Date(visit.date) - now) < (24 * 60 * 60 * 1000); return `<div class="flex items-center justify-between p-3 rounded-lg ${isSoon ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}"><div class="flex items-center space-x-3"><div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><i class="fas fa-calendar-check text-blue-600"></i></div><div><p class="font-medium text-gray-800">Visit</p><p class="text-sm text-gray-500">${new Date(visit.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}${visit.time ? ' at ' + visit.time : ''}</p></div></div>${isSoon ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Soon</span>' : ''}</div>`; }).join('')}</div></div>`;
  }

  getVisitsForDate(dateStr) { return this.visits.filter(visit => visit.date.split('T')[0] === dateStr && visit.status !== 'cancelled'); }
  getStartOfWeek(date) { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }

  updateCalendarTitle() {
    const title = document.getElementById('calendar-title'); if (!title) return;
    switch(this.currentView) {
      case 'month': title.textContent = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); break;
      case 'week': const start = this.getStartOfWeek(this.currentDate); const end = new Date(start); end.setDate(end.getDate() + 6); title.textContent = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`; break;
      case 'day': title.textContent = this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); break;
    }
  }

  navigateTo(direction) {
    switch(this.currentView) { case 'month': this.currentDate.setMonth(this.currentDate.getMonth() + direction); break; case 'week': this.currentDate.setDate(this.currentDate.getDate() + (direction * 7)); break; case 'day': this.currentDate.setDate(this.currentDate.getDate() + direction); break; }
    this.renderCalendar();
  }

  goToToday() { this.currentDate = new Date(); this.renderCalendar(); }
  switchView(view) { this.currentView = view; this.renderCalendar(); }

  handleDayClick(dateStr, isPadding) {
    if (isPadding) { const [year, month] = dateStr.split('-'); this.currentDate = new Date(parseInt(year), parseInt(month) - 1, 1); this.renderCalendar(); return; }
    this.selectedDate = dateStr; this.currentView = 'day'; this.currentDate = new Date(dateStr); this.renderCalendar();
  }

 async showEventDetail(visitId) {
    const visit = await db.get('visits', visitId); if (!visit) return;
    const contact = await db.get('contacts', visit.contactId);
    const modal = document.getElementById('calendar-event-detail'); if (!modal) return;
    
    // Calculate initials safely
    const rawName = contact?.name || '?';
    const initials = rawName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    modal.innerHTML = `<div class="modal fixed inset-0 z-50 overflow-y-auto"><div class="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="this.closest('.modal').remove()"></div><div class="relative min-h-screen flex items-center justify-center p-4"><div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6"><div class="flex items-center justify-between mb-6"><h3 class="text-lg font-semibold">Appointment Details</h3><button onclick="this.closest('.modal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button></div><div class="space-y-4"><div class="flex items-center space-x-3"><div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">${this.escapeHtml(initials)}</div><div><h4 class="font-medium">${this.escapeHtml(contact?.name || 'Unknown')}</h4></div></div><div class="space-y-2 text-sm"><div><i class="far fa-calendar w-6 text-gray-400"></i>${new Date(visit.date).toLocaleDateString()}</div>${visit.time ? `<div><i class="far fa-clock w-6 text-gray-400"></i>${visit.time}</div>` : ''}</div>${visit.notes ? `<div class="border-t pt-4"><h5 class="text-sm font-medium mb-2">Notes</h5><p class="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">${this.escapeHtml(visit.notes)}</p></div>` : ''}</div><div class="flex justify-end space-x-3 mt-6 pt-4 border-t">${visit.status === 'scheduled' ? `<button onclick="app.followUpManager.completeVisit('${visit.id}'); this.closest('.modal').remove();" class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Complete</button><button onclick="app.followUpManager.showRescheduleModal('${visit.id}'); this.closest('.modal').remove();" class="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg">Reschedule</button>` : ''}<button onclick="app.followUpManager.deleteVisit('${visit.id}'); this.closest('.modal').remove();" class="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg">Delete</button><button onclick="this.closest('.modal').remove()" class="px-4 py-2 border text-gray-600 text-sm rounded-lg">Close</button></div></div></div></div>`;
  }

  setupEventListeners() {
    document.getElementById('calendar-prev')?.addEventListener('click', () => this.navigateTo(-1));
    document.getElementById('calendar-next')?.addEventListener('click', () => this.navigateTo(1));
    document.getElementById('calendar-today')?.addEventListener('click', () => this.goToToday());
    document.querySelectorAll('.calendar-view-btn').forEach(btn => btn.addEventListener('click', () => this.switchView(btn.dataset.view)));
    document.getElementById('calendar-add-visit')?.addEventListener('click', () => app.followUpManager?.showScheduleModal());
  }

  setupCalendarListeners() { this.setupEventListeners(); }
  escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
}
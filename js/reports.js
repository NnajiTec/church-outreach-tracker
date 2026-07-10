/**
 * Church Outreach Tracker
 * Reports Module - Phase 6
 * Copyright (c) 2024. All rights reserved.
 */

class ReportsManager {
  constructor() {
    this.charts = {};
    this.chartColors = {
      blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', red: '#ef4444',
      purple: '#8b5cf6', teal: '#14b8a6', indigo: '#6366f1', orange: '#f97316',
      pink: '#ec4899', gray: '#6b7280'
    };
  }

  async init() {
    await this.loadChartJS();
    await this.renderReports();
    this.setupEventListeners();
  }

  async loadChartJS() {
    if (window.Chart) return true;
    if (this.chartLoadPromise) return this.chartLoadPromise;

    this.chartLoadPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('Chart.js could not be loaded. Reports will render without charts.');
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return this.chartLoadPromise;
  }

  async renderReports() {
    const container = document.getElementById('reports-container');
    if (!container) return;
    const data = await this.gatherReportData();

    container.innerHTML = `
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 class="text-2xl font-bold text-gray-800">Reports & Analytics</h1><p class="text-gray-500 text-sm">Track your outreach progress and growth</p></div>
          <div class="flex space-x-2">
            <button id="export-pdf-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"><i class="fas fa-file-pdf mr-2"></i>Export PDF</button>
            <button id="export-csv-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"><i class="fas fa-file-csv mr-2"></i>Export CSV</button>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500 font-medium">Total Contacts</p><p class="text-3xl font-bold text-gray-800">${data.totalContacts}</p></div><div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i class="fas fa-users text-xl"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500 font-medium">Total Visits</p><p class="text-3xl font-bold text-gray-800">${data.totalVisits}</p></div><div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i class="fas fa-calendar-check text-xl"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500 font-medium">Follow-up Rate</p><p class="text-3xl font-bold text-gray-800">${data.followUpRate}%</p></div><div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><i class="fas fa-chart-line text-xl"></i></div></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><div class="flex items-center justify-between"><div><p class="text-sm text-gray-500 font-medium">People Saved</p><p class="text-3xl font-bold text-gray-800">${data.peopleSaved}</p></div><div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><i class="fas fa-heart text-xl"></i></div></div></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 class="font-semibold text-gray-800 mb-4"><i class="fas fa-chart-line text-blue-500 mr-2"></i>Visits Per Month</h3><div class="h-64"><canvas id="chart-visits-monthly"></canvas></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 class="font-semibold text-gray-800 mb-4"><i class="fas fa-user-plus text-green-500 mr-2"></i>New Contacts</h3><div class="h-64"><canvas id="chart-contacts-monthly"></canvas></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 class="font-semibold text-gray-800 mb-4"><i class="fas fa-check-circle text-yellow-500 mr-2"></i>Follow-up Completion</h3><div class="h-64"><canvas id="chart-followup-completion"></canvas></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 class="font-semibold text-gray-800 mb-4"><i class="fas fa-chart-pie text-purple-500 mr-2"></i>Status Distribution</h3><div class="h-64"><canvas id="chart-status-distribution"></canvas></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 class="font-semibold text-gray-800 mb-4"><i class="fas fa-heart text-red-500 mr-2"></i>Saved & Baptized</h3><div class="h-64"><canvas id="chart-saved-baptized"></canvas></div></div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 class="font-semibold text-gray-800 mb-4"><i class="fas fa-book-open text-teal-500 mr-2"></i>Bible Studies</h3><div class="h-64"><canvas id="chart-bible-studies"></canvas></div></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-semibold text-gray-800 mb-4"><i class="fas fa-table text-gray-500 mr-2"></i>Monthly Breakdown</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm"><thead><tr class="border-b border-gray-200"><th class="text-left py-3 px-4 font-semibold text-gray-600">Month</th><th class="text-center py-3 px-4">New Contacts</th><th class="text-center py-3 px-4">Visits</th><th class="text-center py-3 px-4">Completed</th><th class="text-center py-3 px-4">Follow-up Rate</th></tr></thead><tbody>${data.monthlyBreakdown.map(m => `<tr class="border-b border-gray-100 hover:bg-gray-50"><td class="py-3 px-4 font-medium">${m.month}</td><td class="text-center">${m.newContacts}</td><td class="text-center">${m.totalVisits}</td><td class="text-center">${m.completedVisits}</td><td class="text-center">${m.followUpRate}%</td></tr>`).join('')}</tbody></table>
        </div>
      </div>
    `;

    await this.renderCharts(data);
  }

  async renderCharts(data) {
    const chartReady = window.Chart || await this.loadChartJS();
    if (!chartReady || !window.Chart) return;
    
    const visitsCtx = document.getElementById('chart-visits-monthly')?.getContext('2d');
    if (visitsCtx) this.charts.visits = new Chart(visitsCtx, { type: 'bar', data: { labels: data.monthlyBreakdown.map(m => m.month), datasets: [{ label: 'Total Visits', data: data.monthlyBreakdown.map(m => m.totalVisits), backgroundColor: this.chartColors.blue + '80', borderColor: this.chartColors.blue, borderWidth: 2, borderRadius: 6 }, { label: 'Completed', data: data.monthlyBreakdown.map(m => m.completedVisits), backgroundColor: this.chartColors.green + '80', borderColor: this.chartColors.green, borderWidth: 2, borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } } });

    const contactsCtx = document.getElementById('chart-contacts-monthly')?.getContext('2d');
    if (contactsCtx) this.charts.contacts = new Chart(contactsCtx, { type: 'line', data: { labels: data.monthlyBreakdown.map(m => m.month), datasets: [{ label: 'New Contacts', data: data.monthlyBreakdown.map(m => m.newContacts), borderColor: this.chartColors.green, backgroundColor: this.chartColors.green + '20', borderWidth: 2, fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });

    const followupCtx = document.getElementById('chart-followup-completion')?.getContext('2d');
    if (followupCtx) this.charts.followUp = new Chart(followupCtx, { type: 'line', data: { labels: data.monthlyBreakdown.map(m => m.month), datasets: [{ label: 'Follow-up Rate', data: data.monthlyBreakdown.map(m => m.followUpRate), borderColor: this.chartColors.yellow, backgroundColor: this.chartColors.yellow + '20', borderWidth: 2, fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } } });

    const statusCtx = document.getElementById('chart-status-distribution')?.getContext('2d');
    if (statusCtx) this.charts.status = new Chart(statusCtx, { type: 'doughnut', data: { labels: ['Unreached', 'Visited', 'Interested', 'Bible Study', 'Saved', 'Baptized', 'Serving'], datasets: [{ data: data.statusDistribution, backgroundColor: [this.chartColors.gray, this.chartColors.blue, this.chartColors.green, this.chartColors.purple, this.chartColors.yellow, this.chartColors.teal, this.chartColors.indigo], borderWidth: 2, borderColor: '#ffffff' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } } });

    const savedCtx = document.getElementById('chart-saved-baptized')?.getContext('2d');
    if (savedCtx) this.charts.saved = new Chart(savedCtx, { type: 'bar', data: { labels: data.monthlyBreakdown.map(m => m.month), datasets: [{ label: 'Saved', data: data.monthlyBreakdown.map(m => m.peopleSaved), backgroundColor: this.chartColors.red + '80', borderColor: this.chartColors.red, borderWidth: 2, borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } } });

    const bibleCtx = document.getElementById('chart-bible-studies')?.getContext('2d');
    if (bibleCtx) this.charts.bibleStudies = new Chart(bibleCtx, { type: 'bar', data: { labels: data.monthlyBreakdown.map(m => m.month), datasets: [{ label: 'Bible Studies', data: data.monthlyBreakdown.map(m => m.bibleStudies), backgroundColor: [this.chartColors.teal + '80', this.chartColors.blue + '80', this.chartColors.purple + '80'], borderColor: this.chartColors.teal, borderWidth: 2, borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  }

  async gatherReportData() {
    try {
      const contacts = await db.getAll('contacts') || [];
      const visits = await db.getAll('visits') || [];
      const monthlyBreakdown = this.generateMonthlyBreakdown(contacts, visits);
      return {
        totalContacts: contacts.length,
        totalVisits: visits.length,
        followUpRate: visits.length > 0 ? Math.round((visits.filter(v => v.status === 'completed').length / visits.length) * 100) : 0,
        peopleSaved: contacts.filter(c => ['saved','baptized','serving'].includes(c.status)).length,
        monthlyBreakdown,
        statusDistribution: ['unreached','visited','interested','bible-study','saved','baptized','serving'].map(s => contacts.filter(c => c.status === s).length)
      };
    } catch (error) { return { totalContacts: 0, totalVisits: 0, followUpRate: 0, peopleSaved: 0, monthlyBreakdown: [], statusDistribution: [0,0,0,0,0,0,0] }; }
  }

  generateMonthlyBreakdown(contacts, visits) {
    const months = []; const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const monthVisits = visits.filter(v => { const d = new Date(v.date); return d >= monthStart && d <= monthEnd; });
      months.push({
        month: monthStr,
        newContacts: contacts.filter(c => { const d = new Date(c.createdAt); return d >= monthStart && d <= monthEnd; }).length,
        totalVisits: monthVisits.length,
        completedVisits: monthVisits.filter(v => v.status === 'completed').length,
        followUpRate: monthVisits.length > 0 ? Math.round((monthVisits.filter(v => v.status === 'completed').length / monthVisits.length) * 100) : 0,
        peopleSaved: contacts.filter(c => { const d = new Date(c.updatedAt); return ['saved','baptized'].includes(c.status) && d >= monthStart && d <= monthEnd; }).length,
        bibleStudies: monthVisits.filter(v => v.purpose === 'bible-study').length
      });
    }
    return months;
  }

  setupEventListeners() {
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => this.exportPDF());
    document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportCSV());
  }

  async exportPDF() {
    const data = await this.gatherReportData();
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Please allow pop-ups'); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Report</title><style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 32px; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; }
      .wrap { max-width: 1024px; margin: 0 auto; }
      h1 { font-size: 28px; line-height: 1.2; margin: 0 0 24px; text-align: center; }
      .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
      .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; text-align: center; }
      .label { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
      .value { font-size: 24px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: center; font-size: 14px; }
      th { background: #f3f4f6; }
      @media print { body { padding: 0; } }
    </style></head><body><div class="wrap"><h1>Church Outreach Report</h1><div class="grid">${['Total Contacts','Total Visits','Follow-up Rate','People Saved'].map((label, i) => `<div class="card"><p class="label">${label}</p><p class="value">${[data.totalContacts, data.totalVisits, data.followUpRate+'%', data.peopleSaved][i]}</p></div>`).join('')}</div><table><thead><tr>${['Month','New Contacts','Visits','Completed','Rate'].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${data.monthlyBreakdown.map(m => `<tr>${[m.month, m.newContacts, m.totalVisits, m.completedVisits, m.followUpRate+'%'].map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div><script>window.onload=function(){window.print();}<\/script></body></html>`);
    printWindow.document.close();
  }

  async exportCSV() {
    const data = await this.gatherReportData();
    let csv = 'Month,New Contacts,Total Visits,Completed Visits,Follow-up Rate,People Saved,Bible Studies\n';
    data.monthlyBreakdown.forEach(m => csv += `${m.month},${m.newContacts},${m.totalVisits},${m.completedVisits},${m.followUpRate}%,${m.peopleSaved},${m.bibleStudies}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `church-report-${new Date().toISOString().split('T')[0]}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  destroy() { Object.values(this.charts).forEach(chart => { if (chart) chart.destroy(); }); this.charts = {}; }
}

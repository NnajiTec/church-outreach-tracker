/**
 * Church Outreach Tracker
 * Import/Export Module
 * Copyright (c) 2024. All rights reserved.
 */

class ImportExportManager {
  constructor() {
    this.importData = [];
    this.duplicates = [];
    this.importProgress = 0;
    this.importTotal = 0;
    this.sheetJsPromise = null;
    this.duplicateStrategy = 'skip';
    this.importType = 'contacts';
    this.exportFormat = 'csv';
  }

  async init() {
    this.renderImportExportView();
    this.setupEventListeners();
  }

  renderImportExportView() {
    const container = document.getElementById('importexport-container');
    if (!container) return;

    container.innerHTML = `
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Import & Export</h1>
        <p class="text-gray-500 text-sm">Manage your data with import and export tools</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Import Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-file-import text-blue-500 mr-2"></i>Import Data
          </h2>
          
          <div class="space-y-4">
            <div id="import-dropzone" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer">
              <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
              <p class="text-gray-600 font-medium">Drop files here or click to browse</p>
              <p class="text-sm text-gray-400 mt-1">Supports CSV, Excel (.xlsx), and JSON files</p>
              <input type="file" id="import-file-input" accept=".csv,.xlsx,.json" class="hidden" multiple>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
              <div class="grid grid-cols-3 gap-2">
                <button class="import-type-btn px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white transition" data-type="contacts">
                  <i class="fas fa-address-book mr-1"></i>Contacts
                </button>
                <button class="import-type-btn px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition" data-type="visits">
                  <i class="fas fa-calendar-check mr-1"></i>Visits
                </button>
                <button class="import-type-btn px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition" data-type="families">
                  <i class="fas fa-users mr-1"></i>Families
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Duplicate Handling</label>
              <div class="grid grid-cols-3 gap-2">
                <button class="duplicate-btn px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white transition" data-strategy="skip">
                  <i class="fas fa-forward mr-1"></i>Skip
                </button>
                <button class="duplicate-btn px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition" data-strategy="overwrite">
                  <i class="fas fa-redo mr-1"></i>Overwrite
                </button>
                <button class="duplicate-btn px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition" data-strategy="merge">
                  <i class="fas fa-code-branch mr-1"></i>Merge
                </button>
              </div>
            </div>

            <button id="start-import-btn" disabled class="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="fas fa-upload mr-2"></i>Start Import
            </button>

            <div id="import-progress" class="hidden space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600" id="import-progress-text">Processing...</span>
                <span class="text-gray-500" id="import-progress-count">0/0</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div id="import-progress-bar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
              </div>
            </div>

            <div id="duplicate-preview" class="hidden space-y-3">
              <h4 class="font-medium text-gray-800">Duplicates Found: <span id="duplicate-count" class="text-red-600"></span></h4>
              <div id="duplicate-list" class="max-h-48 overflow-y-auto space-y-2"></div>
            </div>

            <div id="validation-results" class="hidden space-y-2">
              <div class="flex items-center space-x-2">
                <i id="validation-icon" class="fas text-lg"></i>
                <span id="validation-message" class="text-sm"></span>
              </div>
              <div id="validation-errors" class="text-xs space-y-1 max-h-32 overflow-y-auto"></div>
            </div>
          </div>
        </div>

        <!-- Export Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-file-export text-green-500 mr-2"></i>Export Data
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Data to Export</label>
              <div class="space-y-2">
                <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                  <input type="checkbox" class="export-checkbox rounded text-blue-600 focus:ring-blue-500" data-type="contacts" checked>
                  <div class="ml-3"><p class="font-medium text-gray-800">Contacts</p><p class="text-xs text-gray-500">All contact records</p></div>
                </label>
                <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                  <input type="checkbox" class="export-checkbox rounded text-blue-600 focus:ring-blue-500" data-type="visits" checked>
                  <div class="ml-3"><p class="font-medium text-gray-800">Visits</p><p class="text-xs text-gray-500">Visit history and appointments</p></div>
                </label>
                <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                  <input type="checkbox" class="export-checkbox rounded text-blue-600 focus:ring-blue-500" data-type="prayers">
                  <div class="ml-3"><p class="font-medium text-gray-800">Prayer Requests</p><p class="text-xs text-gray-500">All prayer requests</p></div>
                </label>
                <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                  <input type="checkbox" class="export-checkbox rounded text-blue-600 focus:ring-blue-500" data-type="families">
                  <div class="ml-3"><p class="font-medium text-gray-800">Families</p><p class="text-xs text-gray-500">Family groups and members</p></div>
                </label>
                <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                  <input type="checkbox" class="export-checkbox rounded text-blue-600 focus:ring-blue-500" data-type="settings">
                  <div class="ml-3"><p class="font-medium text-gray-800">Settings</p><p class="text-xs text-gray-500">Church information and preferences</p></div>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button class="export-format-btn px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white transition" data-format="csv"><i class="fas fa-file-csv mr-1"></i>CSV</button>
                <button class="export-format-btn px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition" data-format="excel"><i class="fas fa-file-excel mr-1"></i>Excel</button>
                <button class="export-format-btn px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition" data-format="json"><i class="fas fa-file-code mr-1"></i>JSON</button>
                <button class="export-format-btn px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition" data-format="pdf"><i class="fas fa-file-pdf mr-1"></i>PDF</button>
              </div>
            </div>

            <button id="export-all-btn" class="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-download mr-2"></i>Export All Data
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button id="export-selected-btn" class="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"><i class="fas fa-check-square mr-1"></i>Export Selected</button>
              <button id="backup-btn" class="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"><i class="fas fa-database mr-1"></i>Full Backup</button>
            </div>

            <div class="border-t border-gray-100 pt-4 mt-4">
              <h4 class="font-medium text-gray-800 mb-2">Restore Backup</h4>
              <div class="flex space-x-2">
                <input type="file" id="restore-file-input" accept=".json" class="hidden">
                <button id="restore-btn" class="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"><i class="fas fa-undo mr-2"></i>Restore from Backup</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="import-preview" class="hidden mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-semibold text-gray-800 mb-4">Preview Data</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead id="preview-header"></thead>
            <tbody id="preview-body"></tbody>
          </table>
        </div>
        <p class="text-xs text-gray-400 mt-2">Showing first 10 records</p>
      </div>
    `;

    this.setupImportTypeButtons();
    this.setupDuplicateButtons();
    this.setupExportFormatButtons();
  }

  setupEventListeners() {
    const dropzone = document.getElementById('import-dropzone');
    const fileInput = document.getElementById('import-file-input');

    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-blue-400', 'bg-blue-50'); });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('border-blue-400', 'bg-blue-50'));
    dropzone?.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('border-blue-400', 'bg-blue-50'); const files = e.dataTransfer.files; if (files.length > 0) this.handleFileSelection(files[0]); });
    fileInput?.addEventListener('change', (e) => { if (e.target.files.length > 0) this.handleFileSelection(e.target.files[0]); });

    document.getElementById('start-import-btn')?.addEventListener('click', () => this.startImport());
    document.getElementById('export-all-btn')?.addEventListener('click', () => this.exportAllData());
    document.getElementById('export-selected-btn')?.addEventListener('click', () => this.exportSelectedData());
    document.getElementById('backup-btn')?.addEventListener('click', () => this.createFullBackup());
    document.getElementById('restore-btn')?.addEventListener('click', () => document.getElementById('restore-file-input')?.click());
    document.getElementById('restore-file-input')?.addEventListener('change', (e) => { if (e.target.files.length > 0) this.restoreBackup(e.target.files[0]); });
  }

  setupImportTypeButtons() {
    document.querySelectorAll('.import-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.import-type-btn').forEach(b => { b.classList.remove('bg-blue-600', 'text-white'); b.classList.add('bg-gray-100', 'text-gray-600'); });
        btn.classList.remove('bg-gray-100', 'text-gray-600'); btn.classList.add('bg-blue-600', 'text-white');
        this.importType = btn.dataset.type;
      });
    });
  }

  setupDuplicateButtons() {
    document.querySelectorAll('.duplicate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.duplicateStrategy = btn.dataset.strategy;
        document.querySelectorAll('.duplicate-btn').forEach(b => { b.classList.remove('bg-blue-600', 'text-white'); b.classList.add('bg-gray-100', 'text-gray-600'); });
        btn.classList.remove('bg-gray-100', 'text-gray-600'); btn.classList.add('bg-blue-600', 'text-white');
      });
    });
  }

  setupExportFormatButtons() {
    document.querySelectorAll('.export-format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.exportFormat = btn.dataset.format;
        document.querySelectorAll('.export-format-btn').forEach(b => { b.classList.remove('bg-blue-600', 'text-white'); b.classList.add('bg-gray-100', 'text-gray-600'); });
        btn.classList.remove('bg-gray-100', 'text-gray-600'); btn.classList.add('bg-blue-600', 'text-white');
      });
    });
  }

  async handleFileSelection(file) {
    try {
      const extension = file.name.split('.').pop().toLowerCase();
      let data;

      switch(extension) {
        case 'csv': data = await this.parseCSV(file); break;
        case 'xlsx': try { data = await this.parseXLSX(file); } catch (error) { this.showValidationError('Excel support could not be loaded.'); return; } break;
        case 'json': data = await this.parseJSON(file); break;
        default: this.showValidationError('Unsupported file format.'); return;
      }

      if (!data || data.length === 0) {
        this.showValidationError('No valid data found in the file.');
        return;
      }

      data = this.normalizeHeaders(data);
      const importType = document.querySelector('.import-type-btn.bg-blue-600')?.dataset.type || 'contacts';
      const validation = this.validateImportData(data, importType);

      if (!validation.valid) {
        this.showValidationError(validation.message, validation.errors);
        return;
      }

      this.importData = data;
      this.showValidationSuccess(`Successfully parsed ${data.length} records`);
      await this.detectDuplicates(importType);
      this.showPreview(data);
      document.getElementById('start-import-btn').disabled = false;
    } catch (error) {
      console.error('File parsing error:', error);
      this.showValidationError('Failed to parse file. Please check the file format.');
    }
  }

  normalizeHeaders(data) {
    return data.map(row => {
      const normalized = {};
      for (const key in row) {
        // Strip underscores so "next_appointment" becomes "next appointment"
        const cleanKey = key.toLowerCase().replace(/_/g, ' ').trim();
        let finalKey = key;

        if (['name', 'full name', 'contact name', 'first name'].includes(cleanKey)) finalKey = 'name';
        else if (['phone', 'phone number', 'mobile', 'cell'].includes(cleanKey)) finalKey = 'phone';
        else if (['email', 'email address'].includes(cleanKey)) finalKey = 'email';
        else if (['address', 'home address', 'location'].includes(cleanKey)) finalKey = 'address';
        else if (['status', 'contact status'].includes(cleanKey)) finalKey = 'status';
        else if (['notes', 'remark', 'remarks', 'description'].includes(cleanKey)) finalKey = 'notes';
        else if (['appointment', 'appointment date', 'next appointment', 'date'].includes(cleanKey)) finalKey = 'nextAppointment';
        else if (['time', 'appointment time'].includes(cleanKey)) finalKey = 'time';
        else if (['occupation', 'job', 'profession'].includes(cleanKey)) finalKey = 'occupation';

        normalized[finalKey] = row[key];
      }
      return normalized;
    });
  }

  async parseCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) { resolve([]); return; }

          const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
          const data = [];

          for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.replace(/^"(.*)"$/, '$1') || '';
            });
            data.push(row);
          }
          resolve(data);
        } catch (error) { reject(error); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async loadSheetJS() {
    if (window.XLSX) return window.XLSX;
    if (this.sheetJsPromise) return this.sheetJsPromise;

    this.sheetJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => {
        this.sheetJsPromise = null;
        reject(new Error('SheetJS could not be loaded'));
      };
      document.head.appendChild(script);
    });

    return this.sheetJsPromise;
  }

  async parseXLSX(file) {
    const XLSX = await this.loadSheetJS();
    if (!XLSX) throw new Error('SheetJS could not be loaded');

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
    
    result.push(current.trim());
    return result;
  }

  async parseJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) { resolve(data); }
          else if (data.data && Array.isArray(data.data)) { resolve(data.data); }
          else if (data.contacts || data.visits || data.families) {
            const allData = [];
            if (data.contacts) allData.push(...data.contacts);
            if (data.visits) allData.push(...data.visits);
            if (data.families) allData.push(...data.families);
            resolve(allData);
          } else { resolve([]); }
        } catch (error) { reject(error); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  validateImportData(data, type) {
    const errors = [];
    if (!Array.isArray(data) || data.length === 0) {
      return { valid: false, message: 'No valid records found', errors };
    }
    if (type === 'contacts') {
      data.forEach((row, index) => {
        if (!row.name || row.name.trim() === '') errors.push(`Row ${index + 2}: Missing required field "name"`);
      });
    }
    if (errors.length > 10) { errors.push(`... and ${errors.length - 10} more errors`); errors.splice(10); }
    return { valid: errors.length === 0, message: errors.length > 0 ? `Found ${errors.length} validation error(s)` : 'Validation passed', errors };
  }

  async detectDuplicates(type) {
    this.duplicates = [];
    const existingData = await db.getAll(type);
    this.importData.forEach((importRow, index) => {
      const duplicate = existingData.find(existing => {
        if (type === 'contacts') return existing.name?.toLowerCase() === importRow.name?.toLowerCase();
        if (type === 'families') return existing.familyName?.toLowerCase() === importRow.familyName?.toLowerCase();
        return false;
      });
      if (duplicate) this.duplicates.push({ importIndex: index, importRow, existingRow: duplicate });
    });

    if (this.duplicates.length > 0) {
      const preview = document.getElementById('duplicate-preview');
      const list = document.getElementById('duplicate-list');
      const count = document.getElementById('duplicate-count');
      if (preview && list && count) {
        preview.classList.remove('hidden');
        count.textContent = this.duplicates.length;
        list.innerHTML = this.duplicates.slice(0, 5).map(dup => `
          <div class="flex items-center justify-between p-2 bg-yellow-50 rounded text-xs">
            <span>${this.escapeHtml(String(dup.importRow.name || dup.importRow.familyName || 'Row ' + (dup.importIndex + 1)))}</span>
            <span class="text-yellow-700">Duplicate found</span>
          </div>
        `).join('');
      }
    }
  }

  showPreview(data) {
    const preview = document.getElementById('import-preview');
    const header = document.getElementById('preview-header');
    const body = document.getElementById('preview-body');
    if (!preview || !header || !body) return;
    preview.classList.remove('hidden');
    const previewData = data.slice(0, 10);
    const columns = Object.keys(previewData[0] || {});
    header.innerHTML = `<tr><th class="text-left py-2 px-3 bg-gray-50 font-semibold text-gray-600">#</th>${columns.map(col => `<th class="text-left py-2 px-3 bg-gray-50 font-semibold text-gray-600">${col}</th>`).join('')}</tr>`;
    body.innerHTML = previewData.map((row, index) => `
      <tr class="border-t border-gray-100 hover:bg-gray-50">
        <td class="py-2 px-3 text-gray-400">${index + 1}</td>
        ${columns.map(col => `<td class="py-2 px-3 text-gray-700 truncate max-w-[200px]">${this.escapeHtml(String(row[col] || ''))}</td>`).join('')}
      </tr>
    `).join('');
  }

  async startImport() {
    const importType = document.querySelector('.import-type-btn.bg-blue-600')?.dataset.type || 'contacts';
    this.importTotal = this.importData.length;
    this.importProgress = 0;

    const progressBar = document.getElementById('import-progress');
    const progressText = document.getElementById('import-progress-text');
    const progressCount = document.getElementById('import-progress-count');
    const progressBarInner = document.getElementById('import-progress-bar');
    const startBtn = document.getElementById('start-import-btn');

    progressBar?.classList.remove('hidden');
    startBtn.disabled = true;

    let imported = 0, skipped = 0, merged = 0, overwritten = 0;

    for (let i = 0; i < this.importData.length; i++) {
      const row = this.importData[i];
      try {
        const isDuplicate = this.duplicates.some(d => d.importIndex === i);
        if (isDuplicate) {
          switch(this.duplicateStrategy) {
            case 'skip': skipped++; break;
            case 'overwrite':
              const dup = this.duplicates.find(d => d.importIndex === i);
              row.id = dup.existingRow.id;
              await db.put(importType, row);
              overwritten++;
              break;
            case 'merge':
              const dupMerge = this.duplicates.find(d => d.importIndex === i);
              const mergedData = { ...dupMerge.existingRow, ...row, id: dupMerge.existingRow.id };
              await db.put(importType, mergedData);
              merged++;
              break;
          }
        } else {
          if (importType === 'contacts') {
            row.id = 'contact_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            row.createdAt = new Date().toISOString();
            row.updatedAt = new Date().toISOString();

            // Lowercase and format status so it doesn't show as 'Unknown'
            if (row.status) {
               row.status = String(row.status).toLowerCase().trim().replace(/ /g, '-');
            } else {
               row.status = 'unreached';
            }

            if (row.nextAppointment) {
              try {
                 let dateStr = row.nextAppointment;
                 
                 // Handle DD/MM/YYYY formatting issue
                 if (typeof dateStr === 'string' && dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3 && parts[2].length === 4) {
                       dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                 }

                 let d;
                 if (typeof dateStr === 'number') {
                    d = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
                 } else {
                    d = new Date(dateStr);
                 }

                 if (!isNaN(d.getTime())) {
                    const finalDateStr = d.toISOString().split('T')[0];
                    const timeStr = row.time ? String(row.time).trim() : '12:00';
                    row.nextAppointment = `${finalDateStr}T${timeStr}`;

                    await db.put('visits', {
                      id: 'visit_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                      contactId: row.id,
                      date: row.nextAppointment,
                      time: timeStr,
                      notes: 'Imported appointment',
                      status: 'scheduled',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                 } else {
                    row.nextAppointment = '';
                 }
              } catch(e) {
                 row.nextAppointment = '';
              }
            }
          }
          await db.put(importType, row);
          imported++;
        }
      } catch (error) {
        console.error(`Failed to import row ${i}:`, error);
      }

      this.importProgress = i + 1;
      const percentage = Math.round((this.importProgress / this.importTotal) * 100);
      if (progressBarInner) progressBarInner.style.width = percentage + '%';
      if (progressText) progressText.textContent = 'Importing...';
      if (progressCount) progressCount.textContent = `${this.importProgress}/${this.importTotal}`;
      
      if (i % 50 === 0) {
         await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    this.showValidationSuccess(`Import complete: ${imported} imported, ${overwritten} overwritten, ${merged} merged, ${skipped} skipped`);

    setTimeout(() => {
      progressBar?.classList.add('hidden');
      startBtn.disabled = true;
      document.getElementById('import-file-input').value = '';
      this.importData = [];
      this.duplicates = [];
      document.getElementById('duplicate-preview')?.classList.add('hidden');
      document.getElementById('import-preview')?.classList.add('hidden');
    }, 3000);

    if (importType === 'contacts' && app.contactsManager) await app.contactsManager.loadContacts();
    if (app.currentPage === 'dashboard') app.loadDashboardData();
  }

  async exportAllData() {
    const format = document.querySelector('.export-format-btn.bg-blue-600')?.dataset.format || 'csv';
    try {
      const data = {
        contacts: await db.getAll('contacts'),
        visits: await db.getAll('visits'),
        prayers: await db.getAll('prayers'),
        families: await db.getAll('families'),
        settings: await db.getAll('settings')
      };
      await this.downloadData(data, format, 'church-outreach-full-export');
    } catch (error) { console.error('Export failed:', error); alert('Failed to export data'); }
  }

  async exportSelectedData() {
    const format = document.querySelector('.export-format-btn.bg-blue-600')?.dataset.format || 'csv';
    const selectedTypes = [];
    document.querySelectorAll('.export-checkbox:checked').forEach(cb => selectedTypes.push(cb.dataset.type));
    if (selectedTypes.length === 0) { alert('Please select at least one data type to export'); return; }
    try {
      const data = {};
      for (const type of selectedTypes) data[type] = await db.getAll(type);
      await this.downloadData(data, format, 'church-outreach-export');
    } catch (error) { console.error('Export failed:', error); alert('Failed to export data'); }
  }

  async createFullBackup() {
    try {
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          contacts: await db.getAll('contacts'),
          visits: await db.getAll('visits'),
          prayers: await db.getAll('prayers'),
          families: await db.getAll('families'),
          settings: await db.getAll('settings')
        }
      };
      await this.downloadData(backup, 'json', 'church-outreach-backup');
    } catch (error) { console.error('Backup failed:', error); alert('Failed to create backup'); }
  }

  async restoreBackup(file) {
    if (!confirm('Restoring from backup will replace all existing data. Are you sure?')) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data || !backup.version) { alert('Invalid backup file'); return; }
      for (const type of ['contacts', 'visits', 'prayers', 'families', 'settings']) await db.clear(type);
      for (const [type, records] of Object.entries(backup.data)) {
        for (const record of records) await db.put(type, record);
      }
      alert('Backup restored successfully! The page will now reload.');
      window.location.reload();
    } catch (error) { console.error('Restore failed:', error); alert('Failed to restore backup. Invalid file format.'); }
  }

  async downloadData(data, format, filename) {
    let content, mimeType, extension;
    switch(format) {
      case 'csv': content = this.convertToCSV(data); mimeType = 'text/csv;charset=utf-8;'; extension = 'csv'; break;
      case 'excel': {
        const XLSX = await this.loadSheetJS();
        if (!XLSX) throw new Error('SheetJS could not be loaded');
        const workbook = this.buildWorkbook(data, XLSX);
        content = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      }
      case 'json': content = JSON.stringify(data, null, 2); mimeType = 'application/json;charset=utf-8;'; extension = 'json'; break;
      case 'pdf':
        await this.downloadPdf(data, filename);
        return;
    }
    const blob = new Blob([content], { type: mimeType });
    this.triggerDownload(blob, `${filename}-${new Date().toISOString().split('T')[0]}.${extension}`);
  }

  async downloadPdf(data, filename) {
    const lines = this.buildPdfLines(data);
    const pdfText = this.composePdf(lines);
    const blob = new Blob([pdfText], { type: 'application/pdf' });
    this.triggerDownload(blob, `${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  buildPdfLines(data) {
    const lines = [];
    const humanizeKey = (key) => String(key)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, ch => ch.toUpperCase());
    const formatValue = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) return value.map(item => formatValue(item)).join(', ');
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };
    const pushWrapped = (text, indent = 0) => {
      const wrapped = this.wrapPdfText(String(text), 88 - indent);
      wrapped.forEach(line => lines.push(`${' '.repeat(indent)}${line}`));
    };

    const sections = [];
    if (Array.isArray(data)) {
      sections.push({ title: 'Data', records: data });
    } else if (data && data.data && typeof data.data === 'object') {
      sections.push({
        title: 'Backup Info',
        records: [{
          version: data.version || '',
          timestamp: data.timestamp || ''
        }]
      });
      for (const [type, records] of Object.entries(data.data)) {
        sections.push({ title: humanizeKey(type), records: Array.isArray(records) ? records : [] });
      }
    } else if (data && typeof data === 'object') {
      for (const [type, records] of Object.entries(data)) {
        if (Array.isArray(records)) {
          sections.push({ title: humanizeKey(type), records });
        }
      }
    }

    lines.push('Church Outreach Export');
    lines.push(`Generated ${new Date().toLocaleString()}`);
    lines.push('');

    if (sections.length === 0) {
      lines.push('No data available to export.');
      return lines;
    }

    sections.forEach(section => {
      lines.push(`${section.title} (${section.records.length})`);
      if (!section.records.length) {
        lines.push('  No records found.');
        lines.push('');
        return;
      }

      section.records.forEach((record, index) => {
        lines.push(`Record ${index + 1}`);
        const entries = Object.entries(record || {});
        if (entries.length === 0) {
          lines.push('  No fields available.');
        } else {
          entries.forEach(([key, value]) => {
            pushWrapped(`${humanizeKey(key)}: ${formatValue(value)}`, 2);
          });
        }
        lines.push('');
      });

      lines.push('');
    });

    return lines;
  }

  wrapPdfText(text, maxChars) {
    const source = String(text || '').trim();
    if (!source) return [''];

    const words = source.split(/\s+/);
    const lines = [];
    let current = '';

    const flush = () => {
      if (current) lines.push(current);
      current = '';
    };

    words.forEach(word => {
      if (!current) {
        current = word;
        return;
      }

      if ((current + ' ' + word).length <= maxChars) {
        current += ' ' + word;
        return;
      }

      flush();

      if (word.length <= maxChars) {
        current = word;
        return;
      }

      for (let i = 0; i < word.length; i += maxChars) {
        const chunk = word.slice(i, i + maxChars);
        if (chunk.length === maxChars) {
          lines.push(chunk);
        } else {
          current = chunk;
        }
      }
    });

    flush();
    return lines.length > 0 ? lines : [''];
  }

  composePdf(lines) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const leading = 14;
    const maxLinesPerPage = Math.floor((pageHeight - (margin * 2) - 20) / leading);
    const escapedPages = [];
    const contentPages = [];
    const pages = [];

    const escapePdf = (text) => String(text)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

    for (let i = 0; i < lines.length; i += maxLinesPerPage) {
      const chunk = lines.slice(i, i + maxLinesPerPage);
      pages.push(chunk);
    }

    if (pages.length === 0) pages.push(['']);

    const fontObjectNumber = 1;
    const contentStart = 2;
    const pageStart = contentStart + pages.length;
    const pagesObjectNumber = pageStart + pages.length;
    const catalogObjectNumber = pagesObjectNumber + 1;

    const buildContentStream = (pageLines) => {
      const commands = [
        'BT',
        '/F1 11 Tf',
        `${leading} TL`,
        `1 0 0 1 ${margin} ${pageHeight - margin - 20} Tm`
      ];

      pageLines.forEach((line, index) => {
        const escaped = escapePdf(line);
        if (index === 0) {
          commands.push(`(${escaped}) Tj`);
        } else {
          commands.push('T*');
          commands.push(`(${escaped}) Tj`);
        }
      });

      commands.push('ET');
      return commands.join('\n');
    };

    pages.forEach((pageLines, index) => {
      const stream = buildContentStream(pageLines);
      contentPages.push(stream);
      escapedPages.push(index + 1);
    });

    const objects = [];
    objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

    contentPages.forEach(stream => {
      objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });

    for (let i = 0; i < pages.length; i++) {
      const contentObj = contentStart + i;
      objects.push(`<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObj} 0 R >>`);
    }

    const pageRefs = [];
    for (let i = 0; i < pages.length; i++) {
      pageRefs.push(`${pageStart + i} 0 R`);
    }
    objects.push(`<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pages.length} >>`);
    objects.push(`<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>`);

    let pdf = '%PDF-1.4\n';
    const offsets = ['0000000000 65535 f \n'];

    objects.forEach((object, index) => {
      const objectNumber = index + 1;
      offsets.push(String(pdf.length).padStart(10, '0') + ' 00000 n \n');
      pdf += `${objectNumber} 0 obj\n${object}\nendobj\n`;
    });

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += offsets.join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectNumber} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return pdf;
  }

  buildWorkbook(data, XLSX) {
    const workbook = XLSX.utils.book_new();
    const addSheet = (name, rows) => {
      const safeName = this.sanitizeSheetName(name);
      const normalizedRows = Array.isArray(rows) ? rows : (rows ? [rows] : []);
      const sheet = XLSX.utils.json_to_sheet(normalizedRows);
      XLSX.utils.book_append_sheet(workbook, sheet, safeName);
    };

    if (Array.isArray(data)) {
      addSheet('Data', data);
      return workbook;
    }

    if (data && data.data && typeof data.data === 'object') {
      addSheet('Backup Info', [{
        version: data.version || '',
        timestamp: data.timestamp || ''
      }]);

      for (const [type, records] of Object.entries(data.data)) {
        addSheet(type, records);
      }
      return workbook;
    }

    if (data && typeof data === 'object') {
      for (const [type, records] of Object.entries(data)) {
        if (Array.isArray(records)) {
          addSheet(type, records);
        } else if (records && typeof records === 'object') {
          addSheet(type, records);
        }
      }
    }

    if (workbook.SheetNames.length === 0) {
      addSheet('Data', []);
    }

    return workbook;
  }

  sanitizeSheetName(name) {
    const cleaned = String(name || 'Sheet').replace(/[\[\]\*\/\\\?\:]/g, ' ').trim();
    return (cleaned || 'Sheet').slice(0, 31);
  }

  convertToCSV(data) {
    if (data.data) {
      let csv = '';
      for (const [type, records] of Object.entries(data.data)) {
        csv += `\n--- ${type.toUpperCase()} ---\n`;
        csv += this.arrayToCSV(records);
      }
      return csv;
    }
    if (!Array.isArray(data)) {
      let csv = '';
      for (const [type, records] of Object.entries(data)) {
        if (Array.isArray(records) && records.length > 0) {
          csv += `\n--- ${type.toUpperCase()} ---\n`;
          csv += this.arrayToCSV(records);
        }
      }
      return csv;
    }
    return this.arrayToCSV(data);
  }

  arrayToCSV(array) {
    if (!Array.isArray(array) || array.length === 0) return '';
    const headers = Object.keys(array[0]);
    let csv = headers.join(',') + '\n';
    array.forEach(row => {
      const values = headers.map(header => {
        const value = String(row[header] || '');
        return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csv += values.join(',') + '\n';
    });
    return csv;
  }

  showValidationSuccess(message) {
    const results = document.getElementById('validation-results');
    const icon = document.getElementById('validation-icon');
    const messageEl = document.getElementById('validation-message');
    if (results && icon && messageEl) {
      results.classList.remove('hidden');
      icon.className = 'fas fa-check-circle text-green-600';
      messageEl.textContent = message;
      messageEl.className = 'text-sm text-green-700 font-medium';
    }
  }

  showValidationError(message, errors = []) {
    const results = document.getElementById('validation-results');
    const icon = document.getElementById('validation-icon');
    const messageEl = document.getElementById('validation-message');
    const errorsList = document.getElementById('validation-errors');
    if (results && icon && messageEl) {
      results.classList.remove('hidden');
      icon.className = 'fas fa-exclamation-triangle text-red-600';
      messageEl.textContent = message;
      messageEl.className = 'text-sm text-red-700 font-medium';
      if (errorsList && errors.length > 0) {
        errorsList.innerHTML = errors.map(err => `<div class="text-red-600">• ${err}</div>`).join('');
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
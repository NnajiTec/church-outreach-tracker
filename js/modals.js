/**
 * Church Outreach Tracker
 * Modal Management System
 * Copyright (c) 2024. All rights reserved.
 */

class ModalManager {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAllModals();
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closeAllModals();
      });
    });
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      const firstInput = modal.querySelector('input, select, textarea, button');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  }

  showProfileModal(title, content, onSave) {
    const modal = document.createElement('div');
    modal.className = 'modal fixed inset-0 z-50 overflow-y-auto';
    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="this.closest('.modal').remove()"></div>
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">${title}</h3>
            <button onclick="this.closest('.modal').remove()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="mb-4">${content}</div>
          <div class="flex justify-end space-x-3">
            <button onclick="this.closest('.modal').remove()" class="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
            <button class="save-btn px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('.save-btn').addEventListener('click', () => {
      onSave();
      modal.remove();
    });
  }
}
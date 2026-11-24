/**
 * ============================================================================
 * FleetDrive V3 - UI Components, Modal Dialogs, Receipts & Theme Engine
 * 100% Vanilla JavaScript, Responsive & Accessible
 * ============================================================================
 */

(function (window) {
  'use strict';

  const UI = {
    // 1. Toast Notification System
    showToast: function (msg, type = 'success', duration = 4000) {
      let container = document.getElementById('toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:10px; max-width:380px; width:calc(100% - 40px); pointer-events:none;';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `app-alert ${type}`;
      toast.style.cssText = 'pointer-events:auto; margin:0; box-shadow:0 10px 25px -5px rgba(0,0,0,0.3); border-radius:8px; display:flex; justify-content:space-between; align-items:center; animation:slideIn 0.25s ease forwards;';

      const textSpan = document.createElement('span');
      textSpan.textContent = msg;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = 'background:none; border:none; font-size:18px; line-height:1; cursor:pointer; color:inherit; opacity:0.7; padding:0 0 0 10px;';
      closeBtn.onclick = () => toast.remove();

      toast.appendChild(textSpan);
      toast.appendChild(closeBtn);
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    // 2. Generic Modal Dialog
    openModal: function (title, contentHtml, footerHtml = '') {
      let overlay = document.getElementById('fleetModalOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'fleetModalOverlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.75); backdrop-filter:blur(4px); z-index:9999; display:flex; justify-content:center; align-items:center; padding:16px; opacity:0; transition:opacity 0.2s ease;';
        overlay.innerHTML = `
          <div id="fleetModalBox" style="background:var(--bg-surface); color:var(--text-primary); border:1px solid var(--border-color); border-radius:12px; max-width:680px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow-lg); display:flex; flex-direction:column; transform:scale(0.95); transition:transform 0.2s ease;">
            <div style="padding:18px 24px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
              <h3 id="fleetModalTitle" style="margin:0; font-size:19px; font-weight:700;"></h3>
              <button id="fleetModalCloseBtn" type="button" style="background:none; border:none; font-size:24px; line-height:1; color:var(--text-muted); cursor:pointer;">&times;</button>
            </div>
            <div id="fleetModalBody" style="padding:24px; flex:1; font-size:14px; line-height:1.6;"></div>
            <div id="fleetModalFooter" style="padding:16px 24px; border-top:1px solid var(--border-color); display:flex; justify-content:flex-end; gap:10px; background:var(--bg-subtle);"></div>
          </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#fleetModalCloseBtn').onclick = () => UI.closeModal();
        overlay.onclick = (e) => {
          if (e.target === overlay) UI.closeModal();
        };
      }

      overlay.querySelector('#fleetModalTitle').textContent = title;
      overlay.querySelector('#fleetModalBody').innerHTML = contentHtml;

      const foot = overlay.querySelector('#fleetModalFooter');
      foot.innerHTML = footerHtml || `<button class="btn-secondary" onclick="window.FleetUI.closeModal()">Close</button>`;

      overlay.style.display = 'flex';
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.querySelector('#fleetModalBox').style.transform = 'scale(1)';
      });
    },

    closeModal: function () {
      const overlay = document.getElementById('fleetModalOverlay');
      if (overlay) {
        overlay.style.opacity = '0';
        overlay.querySelector('#fleetModalBox').style.transform = 'scale(0.95)';
        setTimeout(() => { overlay.style.display = 'none'; }, 200);
      }
    },

    // Flexible Show Modal wrapper
    showModal: function (optionsOrTitle, contentHtml, footerHtml) {
      if (typeof optionsOrTitle === 'object' && optionsOrTitle !== null) {
        this.openModal(optionsOrTitle.title, optionsOrTitle.content, optionsOrTitle.footer);
      } else {
        this.openModal(optionsOrTitle, contentHtml, footerHtml);
      }
    },

    // User Confirmation Dialog
    showConfirm: function (msg, onConfirm, onCancel) {
      const content = `<p style="font-size: 15px; margin: 0 0 16px;">${msg}</p>`;
      const footer = `
        <button type="button" class="btn-secondary" id="fleetConfirmCancel">Cancel</button>
        <button type="button" class="btn-primary" id="fleetConfirmOk" style="background:#b91c1c; border-color:#b91c1c;">Confirm</button>
      `;
      this.openModal('Confirmation Required', content, footer);
      document.getElementById('fleetConfirmCancel')?.addEventListener('click', () => {
        this.closeModal();
        if (onCancel) onCancel();
      });
      document.getElementById('fleetConfirmOk')?.addEventListener('click', () => {
        this.closeModal();
        if (onConfirm) onConfirm();
      });
    },

    // Render Status Badge Pill
    renderStatusPill: function (status, type = 'booking') {
      if (type === 'booking') {
        if (status === 'Confirmed') {
          return '<span class="status-pill status-confirmed">Confirmed</span>';
        }
        return '<span class="status-pill status-pending">Pending Payment</span>';
      } else if (type === 'rental') {
        if (status === 'Returned') {
          return '<span class="status-pill status-completed">Returned</span>';
        }
        return '<span class="status-pill status-active">On Road</span>';
      } else if (type === 'maintenance') {
        if (status === 'Completed') {
          return '<span class="status-pill status-completed">Completed</span>';
        }
        return '<span class="status-pill status-maintenance">In Progress</span>';
      } else {
        if (status === 'Available') return '<span class="status-pill status-available">Available</span>';
        if (status === 'Reserved') return '<span class="status-pill status-pending">Reserved</span>';
        if (status === 'Rented') return '<span class="status-pill status-active">On Road</span>';
        return '<span class="status-pill status-maintenance">In Service</span>';
      }
    },

    // 3. Payment Receipt Modal (Printable)
    showPaymentReceipt: function (paymentId) {
      const d = window.FleetData.read();
      const p = d.payments.find(item => item.id === paymentId);
      if (!p) return;
      const b = d.bookings.find(item => item.id === p.bookingId) || {};

      const html = `
        <div id="printableReceipt" style="font-family:inherit;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:2px solid var(--border-color); padding-bottom:14px;">
            <div>
              <h2 style="margin:0; font-size:22px; color:var(--primary); font-weight:800;">FleetDrive Systems</h2>
              <p style="margin:2px 0; font-size:12px; color:var(--text-muted);">${d.settings.address}</p>
              <p style="margin:0; font-size:12px; color:var(--text-muted);">Contact: +91 98765 43210 &bull; GSTIN: 09AAACF1234D1Z2</p>
            </div>
            <div style="text-align:right;">
              <span class="status-pill status-confirmed">PAID IN FULL</span>
              <p style="margin:6px 0 0; font-size:13px; font-weight:700;">Receipt No: ${p.receiptNo || 'RCP-' + p.id}</p>
              <p style="margin:0; font-size:12px; color:var(--text-muted);">Date: ${p.date} ${p.time || ''}</p>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
            <div style="background:var(--bg-subtle); padding:12px; border-radius:6px;">
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Customer Details</span>
              <h4 style="margin:4px 0;">${p.customer}</h4>
              <p style="margin:0; font-size:13px; color:var(--text-secondary);">Booking Ref: <strong>${p.bookingId}</strong></p>
            </div>
            <div style="background:var(--bg-subtle); padding:12px; border-radius:6px;">
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Rental Details</span>
              <h4 style="margin:4px 0;">${p.vehicle}</h4>
              <p style="margin:0; font-size:13px; color:var(--text-secondary);">${b.pickup || ''} to ${b.ret || ''} (${b.days || ''} days)</p>
            </div>
          </div>

          <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <thead>
              <tr style="background:var(--bg-subtle);">
                <th style="padding:8px 12px; border:1px solid var(--border-color); font-size:13px;">Description</th>
                <th style="padding:8px 12px; border:1px solid var(--border-color); font-size:13px; text-align:right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:10px 12px; border:1px solid var(--border-color);">Vehicle Rental (${b.days || 1} Days @ Rs. ${b.rate || ''} / day)</td>
                <td style="padding:10px 12px; border:1px solid var(--border-color); text-align:right;">Rs. ${(b.baseAmount || p.amount).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px; border:1px solid var(--border-color);">GST (5% SGST + CGST)</td>
                <td style="padding:10px 12px; border:1px solid var(--border-color); text-align:right;">Rs. ${(b.tax || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="font-weight:700; background:var(--bg-subtle);">
                <td style="padding:10px 12px; border:1px solid var(--border-color);">Total Amount Paid (via ${p.method})</td>
                <td style="padding:10px 12px; border:1px solid var(--border-color); text-align:right; color:var(--status-confirmed-text); font-size:16px;">Rs. ${Number(p.amount).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size:12px; color:var(--text-muted); line-height:1.4; border-top:1px dashed var(--border-color); padding-top:12px;">
            <p style="margin:0 0 4px;">&bull; Bank Ref / UTR: <strong>${p.utr}</strong> &bull; Verified by Operator Counter</p>
            <p style="margin:0;">&bull; Note: This digital receipt is valid proof of booking payment for vehicle handover inspection.</p>
          </div>
        </div>
      `;

      const footer = `
        <button class="btn-secondary" onclick="window.FleetUI.closeModal()">Close</button>
        <button class="btn-primary" onclick="window.print()">Print / Save PDF</button>
      `;

      this.openModal(`Payment Receipt - ${p.id}`, html, footer);
    },

    // 4. Data Backup, Restore & CSV Export Modal
    showBackupRestoreModal: function () {
      const d = window.FleetData.read();
      const lastBackup = d.settings.lastBackup ? new Date(d.settings.lastBackup).toLocaleString() : 'Never';

      const html = `
        <div>
          <div class="booking-lookup" style="margin-top:0; border-left:4px solid var(--primary);">
            <strong>Local Browser Storage Notice:</strong> FleetDrive stores your operational database in your browser's LocalStorage. To protect your data against browser cache clearing or to transfer data to another workstation, use the export features below.
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:20px 0;">
            <div class="stat-card" style="padding:18px;">
              <h4 style="margin:0 0 6px;">Complete JSON Backup</h4>
              <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">Exports all vehicles, customers, bookings, payments, rentals, and maintenance records into a single backup file.</p>
              <button class="btn-primary" onclick="window.FleetData.exportBackupJSON(); window.FleetUI.showToast('JSON Backup downloaded successfully!');" style="width:100%;">
                Download JSON Backup
              </button>
              <p style="font-size:11px; color:var(--text-muted); margin-top:8px;">Last Backup: <strong>${lastBackup}</strong></p>
            </div>

            <div class="stat-card" style="padding:18px;">
              <h4 style="margin:0 0 6px;">Restore from Backup</h4>
              <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">Upload a previously saved FleetDrive JSON backup. A safety snapshot is created before restoring.</p>
              <input type="file" id="backupFileInput" accept=".json" style="display:none;" onchange="window.FleetUI.handleBackupFileUpload(event)">
              <button class="btn-secondary" onclick="document.getElementById('backupFileInput').click();" style="width:100%;">
                Select Backup File (.json)
              </button>
            </div>
          </div>

          <h4 style="margin:24px 0 10px;">Export Module Reports (CSV)</h4>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">Download spreadsheets compatible with Microsoft Excel, Google Sheets, or accounting software:</p>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <button class="btn-table-action" onclick="window.FleetData.exportModuleCSV('Bookings')">Bookings CSV</button>
            <button class="btn-table-action" onclick="window.FleetData.exportModuleCSV('Payments')">Payments CSV</button>
            <button class="btn-table-action" onclick="window.FleetData.exportModuleCSV('Rentals')">Rentals CSV</button>
            <button class="btn-table-action" onclick="window.FleetData.exportModuleCSV('Vehicles')">Vehicles CSV</button>
            <button class="btn-table-action" onclick="window.FleetData.exportModuleCSV('Customers')">Customers CSV</button>
            <button class="btn-table-action" onclick="window.FleetData.exportModuleCSV('Maintenance')">Maintenance CSV</button>
          </div>
        </div>
      `;

      this.openModal('Data Backup, Restore & Reports', html);
    },

    showBackupModal: function () {
      this.showBackupRestoreModal();
    },

    handleBackupFileUpload: function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsed = JSON.parse(content);
          if (!parsed.vehicles || !parsed.bookings) {
            throw new Error('Selected file does not match FleetDrive backup schema.');
          }

          if (confirm(`Confirm restoring database from backup?\n\nRecords to import:\n- Vehicles: ${parsed.vehicles.length}\n- Customers: ${parsed.customers.length}\n- Bookings: ${parsed.bookings.length}\n- Payments: ${parsed.payments.length}\n- Rentals: ${parsed.rentals.length}\n\nYour current database will be archived before replacing.`)) {
            window.FleetData.importBackupJSON(content);
            UI.closeModal();
            UI.showToast('Database successfully restored from backup!', 'success');
          }
        } catch (err) {
          alert('Backup Import Failed: ' + err.message);
        }
      };
      reader.readAsText(file);
    },

    // 5. Light/Dark Theme Controller
    initTheme: function () {
      const toggleBtn = document.getElementById('themeToggle');
      function updateUI(theme) {
        if (!toggleBtn) return;
        const isDark = theme === 'dark';
        const icon = toggleBtn.querySelector('.theme-toggle-icon');
        const text = toggleBtn.querySelector('.theme-toggle-text');
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
        if (text) text.textContent = isDark ? 'Light' : 'Dark';
        toggleBtn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      }

      const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
      updateUI(activeTheme);

      if (toggleBtn) {
        toggleBtn.onclick = () => {
          const current = document.documentElement.getAttribute('data-theme') || 'light';
          const next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('fleetdrive_theme', next);
          updateUI(next);
        };
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'fleetdrive_theme' && e.newValue) {
          document.documentElement.setAttribute('data-theme', e.newValue);
          updateUI(e.newValue);
        }
      });
    },

    initThemeToggle: function () {
      this.initTheme();
    },

    // 6. Mobile Navbar Toggle
    initMobileNav: function () {
      const toggle = document.getElementById('mobileNavToggle');
      const navbar = document.getElementById('navbar');
      if (toggle && navbar) {
        toggle.onclick = (e) => {
          e.stopPropagation();
          navbar.classList.toggle('open');
        };
        document.addEventListener('click', (e) => {
          if (!navbar.contains(e.target) && e.target !== toggle) {
            navbar.classList.remove('open');
          }
        });
      }
    }
  };

  // Expose to window
  window.FleetUI = UI;

  document.addEventListener('DOMContentLoaded', () => {
    UI.initTheme();
    UI.initMobileNav();
  });

})(typeof window !== 'undefined' ? window : this);

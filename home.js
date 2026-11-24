/**
 * FLEETDRIVE V3 - MEMBER 1: HOME DASHBOARD & OPERATIONAL HUB
 * Single Source of Truth, Automatic Live Updates, Multi-Tab Sync, and Unified Theme Controller
 */

(function () {
  'use strict';

  // Ensure FleetData and FleetUI are available
  const dataMgr = window.FleetData;
  const uiMgr = window.FleetUI;

  function renderDashboard() {
    if (!dataMgr) return;

    const data = dataMgr.read();
    const stats = dataMgr.getSystemStats();

    // 1. Update 10 Dynamic Metric Cards
    updateCounter('statTotalVehicles', stats.totalVehicles);
    updateCounter('statAvailableVehicles', stats.availableVehicles);
    updateCounter('statReservedVehicles', stats.reservedVehicles);
    updateCounter('statRentedVehicles', stats.rentedVehicles);
    updateCounter('statUnderMaintenance', stats.underMaintenance);
    updateCounter('statActiveBookings', stats.activeBookings);
    updateCounter('statPendingPayments', stats.pendingPaymentsCount);
    updateCounter('statConfirmedBookings', stats.confirmedBookingsCount);
    updateCounter('statTotalPayments', 'Rs. ' + stats.totalRevenue.toLocaleString('en-IN'));
    updateCounter('statOutstandingAmount', 'Rs. ' + stats.outstandingAmount.toLocaleString('en-IN'));

    // 2. Update Live Summary Banner
    const liveSummary = document.getElementById('liveSummary');
    if (liveSummary) {
      liveSummary.innerHTML = `<strong>Live Synchronized Operational Fleet Status:</strong> ` +
        `Available: <strong>${stats.availableVehicles}</strong> &nbsp;|&nbsp; ` +
        `Reserved: <strong>${stats.reservedVehicles}</strong> &nbsp;|&nbsp; ` +
        `On Road: <strong>${stats.rentedVehicles}</strong> &nbsp;|&nbsp; ` +
        `Under Service: <strong>${stats.underMaintenance}</strong> &nbsp;|&nbsp; ` +
        `Active Bookings: <strong>${stats.activeBookings}</strong> &nbsp;|&nbsp; ` +
        `Pending Payment: <strong style="color:var(--status-pending-text);">${stats.pendingPaymentsCount}</strong> &nbsp;|&nbsp; ` +
        `Revenue: <strong>Rs. ${stats.totalRevenue.toLocaleString('en-IN')}</strong>`;
    }

    // 3. Render Active Dispatches & Return Monitoring Table
    renderActiveRentals(data.rentals || []);

    // 4. Render Recent Reservations Table
    renderRecentBookings(data.bookings || []);

    // 5. Render Recent Payments Table
    renderRecentPayments(data.payments || []);

    // 6. Render Audit Trail Table
    renderAuditLogs(data.auditLog || []);

    // 7. Render Featured Fleet Catalog with Real-time Status Badges
    renderFeaturedVehicles(data.vehicles || []);

    // 8. Re-apply any active search filters
    applyDashboardSearch();
  }

  function updateCounter(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '(': '&#40;', ')': '&#41;',
      '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function renderActiveRentals(rentals) {
    const tbody = document.getElementById('activeRentalsBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const activeList = rentals.filter(r => r.status === 'Active' || r.status === 'On Road');
    if (activeList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="no-records-row">No active vehicles currently dispatched on road</td></tr>`;
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    activeList.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'dashboard-rental-row';
      tr.dataset.search = `${r.id} ${r.bookingId} ${r.customer} ${r.vehicle} ${r.returnDate} ${r.status}`.toLowerCase();

      // Determine return schedule badge
      let scheduleHtml = '';
      if (r.returnDate < todayStr) {
        const diffMs = new Date(todayStr) - new Date(r.returnDate);
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        scheduleHtml = `<span class="badge" style="background:#fee2e2; color:#b91c1c; font-weight:700;">Overdue (${diffDays}d)</span>`;
      } else if (r.returnDate === todayStr) {
        scheduleHtml = `<span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700;">Due Today</span>`;
      } else {
        const diffMs = new Date(r.returnDate) - new Date(todayStr);
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        scheduleHtml = `<span class="badge" style="background:#dcfce7; color:#15803d; font-weight:600;">${diffDays}d remaining</span>`;
      }

      tr.innerHTML = `
        <td><strong>${escapeHtml(r.id)}</strong></td>
        <td><a href="../Member-3-Bookings-Rentals/bookings.html?search=${encodeURIComponent(r.bookingId)}" style="color:var(--primary); font-weight:600;">${escapeHtml(r.bookingId)}</a></td>
        <td>${escapeHtml(r.customer)}</td>
        <td>${escapeHtml(r.vehicle)}</td>
        <td>${escapeHtml(r.returnDate)}</td>
        <td>${scheduleHtml}</td>
        <td>
          <a href="../Member-3-Bookings-Rentals/rentals.html?rentalId=${encodeURIComponent(r.id)}" class="btn btn-sm btn-outline">Process Return</a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderRecentBookings(bookings) {
    const tbody = document.getElementById('recentBookingsBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const recent = bookings.slice().reverse().slice(0, 8);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="no-records-row">No reservations recorded yet</td></tr>`;
      return;
    }

    recent.forEach(b => {
      const tr = document.createElement('tr');
      tr.className = 'dashboard-booking-row';
      tr.dataset.search = `${b.id} ${b.customer} ${b.vehicle} ${b.pickup} ${b.ret} ${b.status}`.toLowerCase();

      const pillHtml = uiMgr ? uiMgr.renderStatusPill(b.status, 'booking') : `<span class="status-pill">${escapeHtml(b.status)}</span>`;

      tr.innerHTML = `
        <td><strong>${escapeHtml(b.id)}</strong></td>
        <td>${escapeHtml(b.customer)}</td>
        <td>${escapeHtml(b.vehicle)}</td>
        <td>${escapeHtml(b.pickup)} to ${escapeHtml(b.ret)} <small class="text-muted">(${escapeHtml(b.days)}d)</small></td>
        <td><strong>Rs. ${(Number(b.amount) || 0).toLocaleString('en-IN')}</strong></td>
        <td>${pillHtml}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderRecentPayments(payments) {
    const tbody = document.getElementById('recentPaymentsBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const recent = payments.slice().reverse().slice(0, 8);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="no-records-row">No verified payment transactions yet</td></tr>`;
      return;
    }

    recent.forEach(p => {
      const tr = document.createElement('tr');
      tr.className = 'dashboard-payment-row';
      tr.dataset.search = `${p.id} ${p.bookingId} ${p.customer} ${p.method} ${p.date}`.toLowerCase();

      tr.innerHTML = `
        <td><strong>${escapeHtml(p.id)}</strong></td>
        <td><a href="../Member-3-Bookings-Rentals/bookings.html?search=${encodeURIComponent(p.bookingId)}" style="color:var(--primary); font-weight:600;">${escapeHtml(p.bookingId)}</a></td>
        <td>${escapeHtml(p.customer)}</td>
        <td>${escapeHtml(p.method)}</td>
        <td><strong style="color:var(--status-confirmed-text);">Rs. ${(Number(p.amount) || 0).toLocaleString('en-IN')}</strong></td>
        <td>${escapeHtml(p.date)}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline receipt-btn" data-payid="${escapeHtml(p.id)}">Receipt</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach receipt buttons
    tbody.querySelectorAll('.receipt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-payid');
        if (uiMgr && id) uiMgr.showPaymentReceipt(id);
      });
    });
  }

  function renderAuditLogs(logs) {
    const tbody = document.getElementById('auditBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const recent = logs.slice().reverse().slice(0, 8);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="no-records-row">Audit trail is currently empty</td></tr>`;
      return;
    }

    recent.forEach(log => {
      const tr = document.createElement('tr');
      tr.className = 'dashboard-audit-row';
      tr.dataset.search = `${log.timestamp} ${log.category} ${log.action} ${log.details}`.toLowerCase();

      const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' ' + new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

      tr.innerHTML = `
        <td style="font-size: 12px; color: var(--text-muted);">${escapeHtml(timeFormatted)}</td>
        <td><span class="badge" style="background:var(--border-color); color:var(--text);">${escapeHtml(log.category)}</span></td>
        <td><strong>${escapeHtml(log.action)}</strong></td>
        <td style="font-size: 13px;">${escapeHtml(log.details)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderFeaturedVehicles(vehicles) {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Pick 8 representative vehicles: 2 SUVs, 2 Sedans, 2 Hatchbacks, 2 Two-Wheelers
    const selected = [];
    const categories = ['SUV', 'Sedan', 'Hatchback', 'Two-Wheeler'];
    categories.forEach(cat => {
      const subset = vehicles.filter(v => v.category === cat && !v.archived);
      selected.push(...subset.slice(0, 2));
    });

    // Fallback if less than 8
    if (selected.length < 8) {
      const remaining = vehicles.filter(v => !selected.includes(v) && !v.archived).slice(0, 8 - selected.length);
      selected.push(...remaining);
    }

    selected.forEach(v => {
      // Calculate dynamic real-time status from single source of truth
      const dynamicStatus = dataMgr.calculateVehicleStatus(v.id);

      let statusBadgeClass = 'status-available';
      if (dynamicStatus === 'Rented') statusBadgeClass = 'status-active';
      else if (dynamicStatus === 'Under Maintenance') statusBadgeClass = 'status-maintenance';
      else if (dynamicStatus === 'Reserved') statusBadgeClass = 'status-pending';

      let actionBtnHtml = '';
      if (dynamicStatus === 'Available') {
        actionBtnHtml = `<a href="../Member-3-Bookings-Rentals/bookings.html?vehicleId=${encodeURIComponent(v.id)}" class="btn-card">Book Now</a>`;
      } else if (dynamicStatus === 'Reserved') {
        actionBtnHtml = `<a href="../Member-3-Bookings-Rentals/rentals.html" class="btn-card" style="background:#0284c7;">Dispatch Ready</a>`;
      } else if (dynamicStatus === 'Rented') {
        actionBtnHtml = `<a href="../Member-3-Bookings-Rentals/rentals.html" class="btn-card booked">On Road</a>`;
      } else {
        actionBtnHtml = `<a href="../Member-4-Maintenance-Payments/maintenance.html" class="btn-card disabled">In Service</a>`;
      }

      const card = document.createElement('div');
      card.className = 'vehicle-card';
      card.setAttribute('data-vehicle', v.name);
      card.innerHTML = `
        <img src="../${escapeHtml(v.image || 'images/image.png')}" alt="${escapeHtml(v.name)}" class="vehicle-img" onerror="this.src='../images/image.png';">
        <div class="card-body">
          <div class="card-badges">
            <span class="badge badge-category">${escapeHtml(v.category)}</span>
            <span class="badge ${statusBadgeClass}">${escapeHtml(dynamicStatus)}</span>
          </div>
          <span class="vehicle-plate">${escapeHtml(v.regNo)}</span>
          <h3>${escapeHtml(v.name)}</h3>
          <p class="vehicle-specs">${escapeHtml(v.specs || 'Fleet Managed Vehicle')}</p>
          <div class="card-footer">
            <span class="price">Rs. ${(Number(v.rate) || 0).toLocaleString('en-IN')} / day</span>
            ${actionBtnHtml}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // Dashboard Global Search
  function applyDashboardSearch() {
    const input = document.getElementById('dashboardSearch');
    const clearBtn = document.getElementById('dashboardSearchClear');
    if (!input) return;

    const query = input.value.trim().toLowerCase();
    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }

    // Filter tables
    filterTableRows('#activeRentalsBody .dashboard-rental-row', '#activeRentalsBody', query, 7, 'active rentals');
    filterTableRows('#recentBookingsBody .dashboard-booking-row', '#recentBookingsBody', query, 6, 'reservations');
    filterTableRows('#recentPaymentsBody .dashboard-payment-row', '#recentPaymentsBody', query, 7, 'payments');
    filterTableRows('#auditBody .dashboard-audit-row', '#auditBody', query, 4, 'audit logs');
  }

  function filterTableRows(rowSelector, tbodySelector, query, colSpan, entityName) {
    const rows = document.querySelectorAll(rowSelector);
    const tbody = document.querySelector(tbodySelector);
    if (!tbody || rows.length === 0) return;

    let matches = 0;
    rows.forEach(row => {
      const text = row.dataset.search || row.textContent.toLowerCase();
      const match = !query || text.includes(query);
      row.style.display = match ? '' : 'none';
      if (match) matches++;
    });

    const existingNo = tbody.querySelector('.no-matches-row');
    if (existingNo) existingNo.remove();

    if (matches === 0 && rows.length > 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.className = 'no-matches-row';
      emptyTr.innerHTML = `<td colspan="${colSpan}" class="no-records-row">No ${entityName} match "${escapeHtml(query)}"</td>`;
      tbody.appendChild(emptyTr);
    }
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme and Mobile Navigation
    if (uiMgr) {
      uiMgr.initThemeToggle();
      uiMgr.initMobileNav();
    }

    // 2. Render Initial State
    renderDashboard();

    // 3. Bind Search Input & Clear Button
    const searchInput = document.getElementById('dashboardSearch');
    const searchClear = document.getElementById('dashboardSearchClear');
    if (searchInput) {
      searchInput.addEventListener('input', applyDashboardSearch);
    }
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyDashboardSearch();
        searchInput.focus();
      });
    }

    // 4. Bind Backup & Restore Button in Top Header
    const backupBtn = document.getElementById('backupModalBtn');
    if (backupBtn && uiMgr) {
      backupBtn.addEventListener('click', () => {
        uiMgr.showBackupModal();
      });
    }

    // 5. Single Source of Truth Event Listeners
    // Internal CustomEvent from any operation in current tab
    window.addEventListener('fleetdrive:data-changed', () => {
      renderDashboard();
    });

    // Cross-tab Synchronization via Storage Event
    window.addEventListener('storage', (e) => {
      if (e.key === 'fleetdrive_v3_master_data' || e.key === 'fleetdrive_records_v2') {
        renderDashboard();
      }
    });

    // Re-render when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        renderDashboard();
      }
    });
  });

})();

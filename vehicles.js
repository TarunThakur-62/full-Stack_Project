/**
 * FLEETDRIVE V3 - MEMBER 2: VEHICLE FLEET & CUSTOMER MANAGEMENT
 * Single Source of Truth, Live Availability Calculations, Vehicle Add/Edit/Archive,
 * Expiry Warnings, Customer Registration & Multi-Tab Synchronization.
 */

(function () {
  'use strict';

  const dataMgr = window.FleetData;
  const uiMgr = window.FleetUI;

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '(': '&#40;', ')': '&#41;',
      '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ============================================================================
  // CUSTOMER MANAGEMENT (customers.html)
  // ============================================================================
  function initCustomersPage() {
    const form = document.querySelector('form');
    const searchInput = document.getElementById('customerSearch');
    const searchClear = document.getElementById('customerSearchClear');
    const hubFilter = document.getElementById('customerHubFilter');
    const tbody = document.getElementById('customersTableBody') || document.querySelector('table tbody');

    // Handle Customer Registration Form
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = form.querySelector('input[placeholder*="Suresh"], input[placeholder*="Name"], input[id*="name"]') || form.querySelectorAll('input[type="text"]')[0];
        const emailInput = form.querySelector('input[type="email"]');
        const phoneInput = form.querySelector('input[type="tel"], input[placeholder*="98765"]');
        const dlInput = form.querySelector('input[placeholder*="UP-85"], input[placeholder*="License"]') || form.querySelectorAll('input[type="text"]')[1];
        const hubSelect = form.querySelector('select');
        const proofSelect = form.querySelectorAll('select')[1];

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const license = dlInput ? dlInput.value.trim().toUpperCase() : '';
        const hub = hubSelect ? hubSelect.value : 'Mathura Cantt';
        const proof = proofSelect ? proofSelect.value : 'Aadhaar Card';

        if (!name || !email || !phone || !license) {
          if (uiMgr) uiMgr.showToast('Please fill in all required customer fields.', 'error');
          return;
        }

        // Phone Validation (10 digits Indian mobile)
        if (!/^[6-9]\d{9}$/.test(phone)) {
          if (uiMgr) uiMgr.showToast('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).', 'error');
          return;
        }

        try {
          const newCust = dataMgr.registerCustomer({
            name,
            email,
            phone,
            license,
            hub,
            proof
          });

          if (uiMgr) {
            uiMgr.showToast(`Customer ${newCust.name} registered successfully with ID: ${newCust.id}!`, 'success');
          }
          form.reset();
          renderCustomersTable();
        } catch (err) {
          if (uiMgr) {
            uiMgr.showToast(err.message || 'Error registering customer.', 'error');
          } else {
            alert(err.message);
          }
        }
      });
    }

    function renderCustomersTable() {
      if (!tbody) return;
      const data = dataMgr.read();

      const elTotal = document.getElementById('statTotalCustomers');
      const elVerified = document.getElementById('statVerifiedCustomers');
      const elActiveRenters = document.getElementById('statActiveRenters');

      const totalCust = data.customers.length;
      const verifiedCust = data.customers.filter(c => c.status === 'Active' || c.license).length;
      const activeRentersCount = data.rentals.filter(r => r.status === 'Active' || r.status === 'On Road').length;

      if (elTotal) elTotal.textContent = totalCust;
      if (elVerified) elVerified.textContent = verifiedCust;
      if (elActiveRenters) elActiveRenters.textContent = activeRentersCount;

      tbody.innerHTML = '';
      if (data.customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="no-records-row">No customer records registered yet</td></tr>`;
        return;
      }

      data.customers.slice().reverse().forEach(c => {
        const rentalCount = (data.bookings || []).filter(b => b.customer && b.customer.toLowerCase().includes(c.name.toLowerCase())).length;
        const tr = document.createElement('tr');
        tr.className = 'customer-data-row';
        tr.dataset.search = `${c.id} ${c.name} ${c.phone} ${c.email} ${c.license || ''} ${c.hub || ''}`.toLowerCase();
        tr.dataset.hub = (c.hub || '').toLowerCase();

        tr.innerHTML = `
          <td><strong>${escapeHtml(c.id)}</strong></td>
          <td>${escapeHtml(c.name)}</td>
          <td>${escapeHtml(c.email)}</td>
          <td>+91 ${escapeHtml(c.phone)}</td>
          <td>${escapeHtml(c.license || 'Verified on Hub')}</td>
          <td>${escapeHtml(c.hub || 'Mathura Cantt')}</td>
          <td><span class="badge" style="background:var(--border-color); color:var(--text);">${rentalCount} Reservation(s)</span></td>
          <td><span class="status-pill status-confirmed">Active</span></td>
          <td>
            <button type="button" class="btn btn-sm btn-outline btn-cust-history" data-cust-id="${escapeHtml(c.id)}" data-cust-name="${escapeHtml(c.name)}">History</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Attach customer history modal handlers
      tbody.querySelectorAll('.btn-cust-history').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const custName = e.currentTarget.getAttribute('data-cust-name');
          showCustomerHistoryModal(custName);
        });
      });

      applyCustomersFilter();
    }

    function showCustomerHistoryModal(customerName) {
      if (!uiMgr) return;
      const data = dataMgr.read();
      const customerBookings = (data.bookings || []).filter(b => b.customer && b.customer.toLowerCase().includes(customerName.toLowerCase()));
      const customerRentals = (data.rentals || []).filter(r => r.customer && r.customer.toLowerCase().includes(customerName.toLowerCase()));

      let bookingsHtml = customerBookings.length === 0 ? '<p class="text-muted">No reservations found.</p>' : `
        <div class="table-responsive" style="margin-bottom: 16px;">
          <table>
            <thead><tr><th>Booking ID</th><th>Vehicle</th><th>Dates</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              ${customerBookings.map(b => `
                <tr>
                  <td><strong>${escapeHtml(b.id)}</strong></td>
                  <td>${escapeHtml(b.vehicle)}</td>
                  <td>${escapeHtml(b.pickup)} to ${escapeHtml(b.ret)}</td>
                  <td>Rs. ${(Number(b.amount) || 0).toLocaleString('en-IN')}</td>
                  <td>${uiMgr.renderStatusPill(b.status, 'booking')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      let rentalsHtml = customerRentals.length === 0 ? '<p class="text-muted">No dispatch history recorded.</p>' : `
        <div class="table-responsive">
          <table>
            <thead><tr><th>Rental ID</th><th>Booking ID</th><th>Vehicle</th><th>Start Date</th><th>Expected Return</th><th>Status</th></tr></thead>
            <tbody>
              ${customerRentals.map(r => `
                <tr>
                  <td><strong>${escapeHtml(r.id)}</strong></td>
                  <td>${escapeHtml(r.bookingId)}</td>
                  <td>${escapeHtml(r.vehicle)}</td>
                  <td>${escapeHtml(r.startDate)}</td>
                  <td>${escapeHtml(r.returnDate)}</td>
                  <td>${uiMgr.renderStatusPill(r.status, 'rental')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      uiMgr.showModal({
        title: `Customer Activity Profile: ${escapeHtml(customerName)}`,
        content: `
          <div>
            <h4 style="margin-bottom: 8px;">Reservation History</h4>
            ${bookingsHtml}
            <h4 style="margin: 16px 0 8px;">Dispatched Rentals & Returns</h4>
            ${rentalsHtml}
          </div>
        `,
        footer: `<button type="button" class="btn btn-secondary" onclick="window.FleetUI.closeModal()">Close</button>`
      });
    }

    function applyCustomersFilter() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const selectedHub = hubFilter ? hubFilter.value.toLowerCase() : '';

      if (searchClear) {
        searchClear.style.display = query ? 'block' : 'none';
      }

      const rows = document.querySelectorAll('#customersTableBody .customer-data-row, table tbody .customer-data-row');
      let visibleCount = 0;

      rows.forEach(r => {
        const text = r.dataset.search || r.textContent.toLowerCase();
        const hub = r.dataset.hub || '';
        const matchText = !query || text.includes(query);
        const matchHub = !selectedHub || hub.includes(selectedHub);
        const match = matchText && matchHub;

        r.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      const existingNoMatch = tbody?.querySelector('.no-matches-row');
      if (existingNoMatch) existingNoMatch.remove();

      if (visibleCount === 0 && rows.length > 0) {
        const emptyTr = document.createElement('tr');
        emptyTr.className = 'no-matches-row';
        emptyTr.innerHTML = `<td colspan="9" class="no-records-row">No customer profiles match "${escapeHtml(query)}"</td>`;
        tbody?.appendChild(emptyTr);
      }
    }

    if (searchInput) searchInput.addEventListener('input', applyCustomersFilter);
    if (hubFilter) hubFilter.addEventListener('change', applyCustomersFilter);
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyCustomersFilter();
        searchInput.focus();
      });
    }

    renderCustomersTable();

    window.addEventListener('storage', (e) => {
      if (e.key === 'fleetdrive_v3_master_data' || e.key === 'fleetdrive_records_v2') renderCustomersTable();
    });
    window.addEventListener('fleetdrive:data-changed', renderCustomersTable);
  }

  // ============================================================================
  // VEHICLE FLEET MANAGEMENT (vehicles.html & subcategory pages)
  // ============================================================================
  function initVehiclesPage() {
    const searchInput = document.getElementById('vehicleSearch');
    const searchClear = document.getElementById('vehicleSearchClear');
    const categoryFilter = document.getElementById('vehicleCategoryFilter');
    const statusFilter = document.getElementById('vehicleStatusFilter');
    const addVehicleBtn = document.getElementById('btnAddVehicleModal');

    // Bind Add Vehicle Modal Button
    if (addVehicleBtn) {
      addVehicleBtn.addEventListener('click', () => {
        showAddVehicleModal();
      });
    }

    function showAddVehicleModal(existingVehicle = null) {
      if (!uiMgr) return;
      const isEdit = !!existingVehicle;

      const modalContent = `
        <form id="vehicleAddEditForm" onsubmit="return false;">
          <div class="form-grid">
            <div class="form-group">
              <label>Vehicle Name / Model *</label>
              <input type="text" id="vModalName" value="${escapeHtml(existingVehicle?.name || '')}" placeholder="e.g. Toyota Innova Hycross" required>
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select id="vModalCategory" required>
                <option value="SUV" ${existingVehicle?.category === 'SUV' ? 'selected' : ''}>SUV</option>
                <option value="Sedan" ${existingVehicle?.category === 'Sedan' ? 'selected' : ''}>Sedan</option>
                <option value="Hatchback" ${existingVehicle?.category === 'Hatchback' ? 'selected' : ''}>Hatchback</option>
                <option value="Two-Wheeler" ${existingVehicle?.category === 'Two-Wheeler' ? 'selected' : ''}>Two-Wheeler</option>
              </select>
            </div>
            <div class="form-group">
              <label>Registration Number *</label>
              <input type="text" id="vModalRegNo" value="${escapeHtml(existingVehicle?.regNo || '')}" placeholder="e.g. UP-85-AB-7788" required style="text-transform:uppercase;">
              <small class="field-hint">Must be a unique Indian state registration plate.</small>
            </div>
            <div class="form-group">
              <label>Daily Rental Rate (Rs.) *</label>
              <input type="number" id="vModalRate" value="${existingVehicle?.rate || ''}" placeholder="e.g. 3500" min="200" required>
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label>Specifications / Features</label>
              <input type="text" id="vModalSpecs" value="${escapeHtml(existingVehicle?.specs || '')}" placeholder="e.g. 7 Seats | 2.0L Petrol | Automatic | 18 km/l">
            </div>
            <div class="form-group">
              <label>Insurance Expiry Date</label>
              <input type="date" id="vModalInsExpiry" value="${existingVehicle?.insuranceExpiry || '2027-06-30'}">
            </div>
            <div class="form-group">
              <label>Registration Expiry Date</label>
              <input type="date" id="vModalRegExpiry" value="${existingVehicle?.regExpiry || '2035-12-31'}">
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label>Vehicle Image Path</label>
              <input type="text" id="vModalImage" value="${escapeHtml(existingVehicle?.image || 'images/image.png')}" placeholder="e.g. images/toyota fortuner.jpg">
            </div>
          </div>
        </form>
      `;

      uiMgr.showModal({
        title: isEdit ? `Edit Vehicle: ${escapeHtml(existingVehicle.name)} (${escapeHtml(existingVehicle.id)})` : 'Add New Fleet Vehicle',
        content: modalContent,
        footer: `
          <button type="button" class="btn btn-secondary" onclick="window.FleetUI.closeModal()">Cancel</button>
          <button type="button" class="btn btn-primary" id="btnSaveVehicleSubmit">${isEdit ? 'Save Changes' : 'Register Vehicle'}</button>
        `
      });

      document.getElementById('btnSaveVehicleSubmit')?.addEventListener('click', () => {
        const formEl = document.getElementById('vehicleAddEditForm');
        if (!formEl.reportValidity()) return;

        const name = document.getElementById('vModalName').value.trim();
        const category = document.getElementById('vModalCategory').value;
        const regNo = document.getElementById('vModalRegNo').value.trim().toUpperCase();
        const rate = Number(document.getElementById('vModalRate').value);
        const specs = document.getElementById('vModalSpecs').value.trim();
        const insuranceExpiry = document.getElementById('vModalInsExpiry').value;
        const regExpiry = document.getElementById('vModalRegExpiry').value;
        const image = document.getElementById('vModalImage').value.trim() || 'images/image.png';

        if (!name || !regNo || !rate || rate <= 0) {
          uiMgr.showToast('Please provide valid vehicle name, unique registration plate, and daily rate.', 'error');
          return;
        }

        try {
          const payload = {
            id: existingVehicle?.id,
            name,
            category,
            regNo,
            rate,
            specs,
            insuranceExpiry,
            regExpiry,
            image
          };

          const saved = dataMgr.saveVehicle(payload);
          uiMgr.closeModal();
          uiMgr.showToast(`Vehicle ${saved.name} (${saved.regNo}) saved successfully!`, 'success');
          syncVehicleAvailability();
        } catch (err) {
          uiMgr.showToast(err.message || 'Error saving vehicle.', 'error');
        }
      });
    }

    function showVehicleDetailsModal(v) {
      if (!uiMgr) return;
      const data = dataMgr.read();
      const currentStatus = dataMgr.calculateVehicleStatus(v.id);

      // Expiry checks
      const todayStr = new Date().toISOString().split('T')[0];
      const insDays = Math.ceil((new Date(v.insuranceExpiry || '2027-01-01') - new Date(todayStr)) / (1000 * 60 * 60 * 24));
      const regDays = Math.ceil((new Date(v.regExpiry || '2035-01-01') - new Date(todayStr)) / (1000 * 60 * 60 * 24));

      let insBadge = insDays < 0 ? '<span class="badge" style="background:#fee2e2; color:#b91c1c;">EXPIRED</span>' :
        insDays < 30 ? `<span class="badge" style="background:#fef3c7; color:#b45309;">Expires in ${insDays} days</span>` :
          `<span class="badge" style="background:#dcfce7; color:#15803d;">Valid (${v.insuranceExpiry})</span>`;

      let regBadge = regDays < 0 ? '<span class="badge" style="background:#fee2e2; color:#b91c1c;">EXPIRED</span>' :
        regDays < 60 ? `<span class="badge" style="background:#fef3c7; color:#b45309;">Expires in ${regDays} days</span>` :
          `<span class="badge" style="background:#dcfce7; color:#15803d;">Valid (${v.regExpiry})</span>`;

      // Vehicle History: Bookings, Rentals, Maintenance
      const vBookings = (data.bookings || []).filter(b => b.vehicle && (b.vehicle.includes(v.name) || (b.vehicleId && b.vehicleId === v.id)));
      const vRentals = (data.rentals || []).filter(r => r.vehicle && (r.vehicle.includes(v.regNo) || r.vehicle.includes(v.name)));
      const vMaint = (data.maintenance || []).filter(m => m.vehicle && (m.vehicle.includes(v.regNo) || m.vehicle.includes(v.name)));

      const detailsHtml = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
          <img src="../${escapeHtml(v.image || 'images/image.png')}" alt="${escapeHtml(v.name)}" style="width: 220px; height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);" onerror="this.src='../images/image.png';">
          <div style="flex: 1; min-width: 240px;">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
              <span class="badge badge-category">${escapeHtml(v.category)}</span>
              ${uiMgr.renderStatusPill(currentStatus, 'vehicle')}
            </div>
            <h3 style="margin-bottom: 4px;">${escapeHtml(v.name)}</h3>
            <p style="font-size: 14px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">Registration Plate: ${escapeHtml(v.regNo)} (ID: ${escapeHtml(v.id)})</p>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;"><strong>Specifications:</strong> ${escapeHtml(v.specs || 'N/A')}</p>
            <p style="font-size: 14px;"><strong>Daily Rental Rate:</strong> Rs. ${(Number(v.rate) || 0).toLocaleString('en-IN')} / day</p>
          </div>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 20px;">
          <div class="stat-card" style="padding: 12px;">
            <div style="font-size: 12px; color: var(--text-muted);">Insurance Status</div>
            <div style="margin-top: 4px;">${insBadge}</div>
          </div>
          <div class="stat-card" style="padding: 12px;">
            <div style="font-size: 12px; color: var(--text-muted);">RC Registration Status</div>
            <div style="margin-top: 4px;">${regBadge}</div>
          </div>
        </div>

        <div>
          <h4 style="margin-bottom: 8px; font-size: 15px;">Operational History & Log</h4>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
            Total Reservations: <strong>${vBookings.length}</strong> &bull; Total Dispatches: <strong>${vRentals.length}</strong> &bull; Maintenance Jobs: <strong>${vMaint.length}</strong>
          </p>
        </div>
      `;

      uiMgr.showModal({
        title: `Vehicle Specifications & Dossier`,
        content: detailsHtml,
        footer: `
          <button type="button" class="btn btn-secondary" onclick="window.FleetUI.closeModal()">Close</button>
          <button type="button" class="btn btn-outline" id="btnEditVehicleModal">Edit Vehicle</button>
          <button type="button" class="btn btn-primary" id="btnArchiveVehicleAction" style="background:#b91c1c; border-color:#b91c1c;">Archive Vehicle</button>
        `
      });

      document.getElementById('btnEditVehicleModal')?.addEventListener('click', () => {
        uiMgr.closeModal();
        showAddVehicleModal(v);
      });

      document.getElementById('btnArchiveVehicleAction')?.addEventListener('click', () => {
        uiMgr.showConfirm(`Are you sure you want to archive "${v.name}" (${v.regNo})? Archived vehicles will not be available for new bookings.`, () => {
          dataMgr.archiveVehicle(v.id);
          uiMgr.showToast(`Vehicle ${v.name} has been archived.`, 'info');
          syncVehicleAvailability();
        });
      });
    }

    function syncVehicleAvailability() {
      const data = dataMgr.read();
      const stats = dataMgr.getSystemStats();

      // Update stat cards
      const elTotal = document.getElementById('statFleetTotal');
      const elAvail = document.getElementById('statFleetAvailable');
      const elBookings = document.getElementById('statFleetBookings');
      const elMaint = document.getElementById('statFleetMaint');

      if (elTotal) elTotal.textContent = stats.totalVehicles;
      if (elAvail) elAvail.textContent = stats.availableVehicles;
      if (elBookings) elBookings.textContent = stats.activeBookings;
      if (elMaint) elMaint.textContent = stats.underMaintenance;

      const cards = document.querySelectorAll('.vehicle-card');
      const todayStr = new Date().toISOString().split('T')[0];

      cards.forEach((card, idx) => {
        const plateEl = card.querySelector('.vehicle-plate');
        const nameEl = card.querySelector('h3, h2');
        const vName = nameEl ? nameEl.textContent.trim() : '';
        const vPlate = plateEl ? plateEl.textContent.trim() : '';

        // Match vehicle from central data
        let vObj = data.vehicles.find(v => (vPlate && v.regNo === vPlate) || (vName && v.name.toLowerCase() === vName.toLowerCase()));
        if (!vObj) {
          const generatedId = `VH-${String(idx + 1).padStart(2, '0')}`;
          vObj = { id: generatedId, name: vName, regNo: vPlate, category: card.dataset.category || 'Fleet' };
        }

        const dynamicStatus = dataMgr.calculateVehicleStatus(vObj.id);
        const badge = card.querySelector('.badge:not(.badge-category)');
        const btn = card.querySelector('.btn-card');

        card.dataset.id = vObj.id;
        card.dataset.name = vObj.name;
        card.dataset.plate = vObj.regNo;
        card.dataset.status = dynamicStatus;

        // Visual plate badge
        if (plateEl && !card.querySelector('.vehicle-id-badge')) {
          const idBadge = document.createElement('span');
          idBadge.className = 'vehicle-plate vehicle-id-badge';
          idBadge.style.marginRight = '6px';
          idBadge.style.backgroundColor = 'var(--primary-light)';
          idBadge.style.color = 'var(--primary)';
          idBadge.style.borderColor = 'var(--primary)';
          idBadge.textContent = vObj.id;
          plateEl.parentNode.insertBefore(idBadge, plateEl);
        }

        // Expiry Warning Badge Check
        const insDays = Math.ceil((new Date(vObj.insuranceExpiry || '2027-01-01') - new Date(todayStr)) / (1000 * 60 * 60 * 24));
        let warningEl = card.querySelector('.expiry-warning-badge');
        if (insDays <= 30) {
          if (!warningEl) {
            warningEl = document.createElement('span');
            warningEl.className = 'badge expiry-warning-badge';
            warningEl.style.fontSize = '10px';
            warningEl.style.padding = '2px 6px';
            warningEl.style.background = '#fef3c7';
            warningEl.style.color = '#b45309';
            warningEl.style.marginLeft = '4px';
            warningEl.textContent = insDays <= 0 ? '⚠️ Ins. Expired' : `⚠️ Ins. ${insDays}d`;
            card.querySelector('.card-badges')?.appendChild(warningEl);
          }
        } else if (warningEl) {
          warningEl.remove();
        }

        // Add 'Details' button if not present in footer
        const cardFooter = card.querySelector('.card-footer');
        if (cardFooter && !cardFooter.querySelector('.btn-vehicle-details')) {
          const detailsBtn = document.createElement('button');
          detailsBtn.type = 'button';
          detailsBtn.className = 'btn btn-sm btn-outline btn-vehicle-details';
          detailsBtn.style.padding = '6px 10px';
          detailsBtn.style.fontSize = '12px';
          detailsBtn.textContent = 'Specs';
          detailsBtn.addEventListener('click', () => {
            showVehicleDetailsModal(vObj);
          });
          cardFooter.insertBefore(detailsBtn, cardFooter.querySelector('.btn-card'));
        }

        // Dynamic Status Badge & Action Button
        if (dynamicStatus === 'Under Maintenance') {
          if (badge) {
            badge.className = 'badge status-maintenance';
            badge.textContent = 'In Maintenance';
          }
          if (btn) {
            btn.className = 'btn-card disabled';
            btn.textContent = 'In Service';
            btn.setAttribute('href', '../Member-4-Maintenance-Payments/maintenance.html');
          }
        } else if (dynamicStatus === 'Rented') {
          if (badge) {
            badge.className = 'badge status-active';
            badge.textContent = 'On Road';
          }
          if (btn) {
            btn.className = 'btn-card booked';
            btn.textContent = 'On Road';
            btn.setAttribute('href', '../Member-3-Bookings-Rentals/rentals.html');
          }
        } else if (dynamicStatus === 'Reserved') {
          if (badge) {
            badge.className = 'badge status-pending';
            badge.textContent = 'Reserved';
          }
          if (btn) {
            btn.className = 'btn-card';
            btn.style.backgroundColor = '#0284c7';
            btn.textContent = 'Handover Ready';
            btn.setAttribute('href', '../Member-3-Bookings-Rentals/rentals.html');
          }
        } else {
          if (badge) {
            badge.className = 'badge status-available';
            badge.textContent = 'Available';
          }
          if (btn) {
            btn.className = 'btn-card';
            btn.style.backgroundColor = '';
            btn.textContent = 'Book Now';
            btn.setAttribute('href', `../Member-3-Bookings-Rentals/bookings.html?vehicleId=${encodeURIComponent(vObj.id)}&vehicle=${encodeURIComponent(vObj.name)}`);
          }
        }
      });

      applyVehicleFilter();
    }

    function applyVehicleFilter() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const selectedCat = categoryFilter ? categoryFilter.value.toLowerCase() : '';
      const selectedStatus = statusFilter ? statusFilter.value.toLowerCase() : '';

      if (searchClear) {
        searchClear.style.display = query ? 'block' : 'none';
      }

      const cards = document.querySelectorAll('.vehicle-card');
      let totalVisible = 0;

      cards.forEach(card => {
        const id = (card.dataset.id || '').toLowerCase();
        const name = (card.dataset.name || '').toLowerCase();
        const plate = (card.dataset.plate || '').toLowerCase();
        const cat = (card.dataset.category || '').toLowerCase();
        const status = (card.dataset.status || '').toLowerCase();

        const combined = `${id} ${name} ${plate} ${cat} ${status}`;
        const matchQuery = !query || combined.includes(query);
        const matchCat = !selectedCat || cat.includes(selectedCat);
        const matchStatus = !selectedStatus || status.includes(selectedStatus) ||
          (selectedStatus === 'on road' && (status.includes('rented') || status.includes('on road'))) ||
          (selectedStatus === 'in maintenance' && (status.includes('under maintenance') || status.includes('service')));

        const visible = matchQuery && matchCat && matchStatus;
        card.style.display = visible ? 'flex' : 'none';
        if (visible) totalVisible++;
      });

      // Show/Hide category sections if on vehicles.html
      document.querySelectorAll('.category-section').forEach(sec => {
        const secCards = sec.querySelectorAll('.vehicle-card');
        const visibleInSec = [...secCards].filter(c => c.style.display !== 'none').length;
        sec.style.display = visibleInSec > 0 ? 'block' : 'none';
      });

      // No Vehicles Found notice
      let noRecordsBox = document.getElementById('noVehiclesFoundBox');
      if (totalVisible === 0) {
        if (!noRecordsBox) {
          noRecordsBox = document.createElement('div');
          noRecordsBox.id = 'noVehiclesFoundBox';
          noRecordsBox.className = 'stat-card';
          noRecordsBox.style.textAlign = 'center';
          noRecordsBox.style.padding = '36px 20px';
          noRecordsBox.style.margin = '32px 0';
          const container = document.querySelector('.main-container');
          container?.insertBefore(noRecordsBox, document.querySelector('.category-tabs')?.nextSibling || container.firstChild);
        }
        noRecordsBox.style.display = 'block';
        noRecordsBox.innerHTML = `
          <h3 style="color:var(--text); margin-bottom:8px;">No Vehicles Found</h3>
          <p style="color:var(--text-muted); margin-bottom:16px;">No fleet vehicles match "${escapeHtml(query)}". Try another model name, registration plate, or filter.</p>
          <button id="btnClearSearchVehicles" class="btn-primary" type="button">Clear Search &amp; Show All Vehicles</button>
        `;
        document.getElementById('btnClearSearchVehicles')?.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          if (categoryFilter) categoryFilter.value = '';
          if (statusFilter) statusFilter.value = '';
          applyVehicleFilter();
          searchInput?.focus();
        });
      } else if (noRecordsBox) {
        noRecordsBox.style.display = 'none';
      }
    }

    if (searchInput) searchInput.addEventListener('input', applyVehicleFilter);
    if (categoryFilter) categoryFilter.addEventListener('change', applyVehicleFilter);
    if (statusFilter) statusFilter.addEventListener('change', applyVehicleFilter);
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyVehicleFilter();
        searchInput.focus();
      });
    }

    syncVehicleAvailability();

    window.addEventListener('storage', (e) => {
      if (e.key === 'fleetdrive_v3_master_data' || e.key === 'fleetdrive_records_v2') syncVehicleAvailability();
    });
    window.addEventListener('fleetdrive:data-changed', syncVehicleAvailability);
  }

  // ============================================================================
  // Initialization
  // ============================================================================
  document.addEventListener('DOMContentLoaded', () => {
    if (uiMgr) {
      uiMgr.initThemeToggle();
      uiMgr.initMobileNav();
    }

    const page = location.pathname.split('/').pop();
    if (page === 'customers.html') {
      initCustomersPage();
    } else {
      initVehiclesPage();
    }
  });

})();

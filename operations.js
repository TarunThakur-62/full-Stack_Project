/**
 * FLEETDRIVE V3 - MEMBER 4: MAINTENANCE & PAYMENTS OPERATIONS
 * Single Source of Truth, Booking-to-Payment Confirmation Bridge, Printable Receipts,
 * Vehicle Maintenance Availability Locking, and Multi-Tab Synchronization.
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
  // PAYMENTS PAGE LOGIC (payments.html)
  // ============================================================================
  function initPaymentsPage() {
    const form = document.getElementById('paymentForm');
    const idInput = document.getElementById('paymentBookingId');
    const customerInput = document.getElementById('paymentCustomer');
    const amountInput = document.getElementById('paymentAmount');
    const dateInput = document.getElementById('paymentDate');
    const utrInput = document.getElementById('paymentUtr');
    const methodSelect = document.getElementById('paymentMethod');
    const lookup = document.getElementById('bookingLookup');
    const submitBtn = document.getElementById('paymentSubmitBtn');
    const searchInput = document.getElementById('paymentSearch');
    const searchClear = document.getElementById('paymentSearchClear');
    const methodFilter = document.getElementById('paymentMethodFilter');
    const tbody = document.getElementById('paymentsTableBody');

    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    let selectedBooking = null;

    function lookupBooking() {
      const id = idInput ? idInput.value.trim().toUpperCase() : '';
      selectedBooking = null;

      if (!id) {
        lookup.textContent = 'Enter a Booking ID to load customer details and payable amount.';
        lookup.className = 'booking-lookup';
        if (customerInput) customerInput.value = '';
        if (amountInput) amountInput.value = '';
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const data = dataMgr.read();
      const b = (data.bookings || []).find(bk => bk.id.toUpperCase() === id);

      if (!b) {
        lookup.className = 'booking-lookup error';
        lookup.innerHTML = `<strong>Booking ID "${escapeHtml(id)}" not found.</strong> Verify the ID on the Bookings page.`;
        if (customerInput) customerInput.value = '';
        if (amountInput) amountInput.value = '';
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      if (customerInput) customerInput.value = b.customer;
      if (amountInput) amountInput.value = b.amount;

      // Check if already confirmed
      if (b.status === 'Confirmed') {
        lookup.className = 'booking-lookup ready';
        lookup.innerHTML = `<strong>Booking ${escapeHtml(b.id)} is ALREADY CONFIRMED and PAID.</strong><br>` +
          `Customer: <strong>${escapeHtml(b.customer)}</strong> &bull; Vehicle: <strong>${escapeHtml(b.vehicle)}</strong> &bull; Amount: <strong>Rs. ${(Number(b.amount) || 0).toLocaleString('en-IN')}</strong><br>` +
          `<em>Duplicate payment confirmation is blocked. Handover can be processed on Rentals page.</em>`;
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      // Pending payment ready for confirmation
      selectedBooking = b;
      if (submitBtn) submitBtn.disabled = false;
      lookup.className = 'booking-lookup ready';
      lookup.innerHTML = `<strong>Booking Found: ${escapeHtml(b.id)} (Status: Pending Payment)</strong><br>` +
        `Customer: <strong>${escapeHtml(b.customer)}</strong> &bull; Vehicle: <strong>${escapeHtml(b.vehicle)}</strong><br>` +
        `Schedule: <strong>${escapeHtml(b.pickup)} to ${escapeHtml(b.ret)} (${escapeHtml(b.days)} days)</strong><br>` +
        `Total Payable: <strong style="color:var(--status-confirmed-text); font-size:15px;">Rs. ${(Number(b.amount) || 0).toLocaleString('en-IN')}</strong>`;
    }

    if (idInput) {
      idInput.addEventListener('input', lookupBooking);
    }

    // Handle Payment Receipt Form Submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        lookupBooking();
        if (!selectedBooking) {
          if (uiMgr) uiMgr.showToast('Please enter a valid, unpaid Booking ID.', 'error');
          return;
        }

        if (selectedBooking.status === 'Confirmed') {
          if (uiMgr) uiMgr.showToast('This booking is already confirmed and paid.', 'warning');
          return;
        }

        const amount = Number(amountInput.value);
        const method = methodSelect ? methodSelect.value : 'UPI';
        const date = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);
        const utr = utrInput ? utrInput.value.trim() : 'UTR-' + Date.now().toString().slice(-6);

        if (amount <= 0) {
          if (uiMgr) uiMgr.showToast('Please enter a valid payment amount.', 'error');
          return;
        }

        try {
          const paymentRecord = dataMgr.confirmPayment({
            bookingId: selectedBooking.id,
            customer: selectedBooking.customer,
            vehicle: selectedBooking.vehicle,
            method,
            amount,
            date,
            utr
          });

          if (uiMgr) {
            uiMgr.showToast(`Payment confirmed! Booking ${selectedBooking.id} is now CONFIRMED (Green).`, 'success');
            // Show receipt modal immediately
            setTimeout(() => {
              uiMgr.showPaymentReceipt(paymentRecord.id);
            }, 300);
          }

          form.reset();
          selectedBooking = null;
          if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
          lookup.className = 'booking-lookup';
          lookup.textContent = 'Enter a Booking ID to load customer details and payable amount.';

          renderPaymentsTable();
        } catch (err) {
          if (uiMgr) {
            uiMgr.showToast(err.message || 'Error recording payment.', 'error');
          } else {
            alert(err.message);
          }
        }
      });
    }

    function renderPaymentsTable() {
      if (!tbody) return;
      const data = dataMgr.read();

      const totalRev = data.payments
        .filter(p => p.status === 'Confirmed')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const confirmedCount = data.payments.filter(p => p.status === 'Confirmed').length;
      const pendingCount = (data.bookings || []).filter(b => b.status === 'Pending Payment').length;
      const digitalCount = data.payments.filter(p => p.method && !p.method.toLowerCase().includes('cash')).length;
      const digitalRatio = data.payments.length ? Math.round((digitalCount / data.payments.length) * 100) : 100;

      const elRev = document.getElementById('statTotalRevenue');
      const elConf = document.getElementById('statConfirmedTxCount');
      const elPend = document.getElementById('statPendingInvoices');
      const elRatio = document.getElementById('statDigitalRatio');

      if (elRev) elRev.textContent = `Rs. ${totalRev.toLocaleString('en-IN')}`;
      if (elConf) elConf.textContent = confirmedCount;
      if (elPend) elPend.textContent = pendingCount;
      if (elRatio) elRatio.textContent = `${digitalRatio}%`;

      tbody.innerHTML = '';
      if (data.payments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="no-records-row">No payment receipts recorded yet</td></tr>`;
        return;
      }

      data.payments.slice().reverse().forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'payment-data-row';
        tr.dataset.search = `${p.id} ${p.bookingId} ${p.customer} ${p.vehicle || ''} ${p.method} ${p.status}`.toLowerCase();
        tr.dataset.method = p.method || '';

        tr.innerHTML = `
          <td><strong>${escapeHtml(p.id)}</strong></td>
          <td><a href="../Member-3-Bookings-Rentals/bookings.html?search=${encodeURIComponent(p.bookingId)}" style="color:var(--primary); font-weight:700; text-decoration:none;">${escapeHtml(p.bookingId)}</a></td>
          <td>${escapeHtml(p.customer)}</td>
          <td>${escapeHtml(p.vehicle || 'Standard Fleet')}</td>
          <td>${escapeHtml(p.method)}</td>
          <td><strong style="color:var(--status-confirmed-text);">Rs. ${(Number(p.amount) || 0).toLocaleString('en-IN')}</strong></td>
          <td>${escapeHtml(p.date)}</td>
          <td><span class="status-pill status-confirmed">Confirmed</span></td>
          <td>
            <button type="button" class="btn btn-sm btn-outline btn-view-receipt" data-payid="${escapeHtml(p.id)}">Receipt</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Attach Receipt View buttons
      tbody.querySelectorAll('.btn-view-receipt').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const payId = e.currentTarget.getAttribute('data-payid');
          if (uiMgr && payId) uiMgr.showPaymentReceipt(payId);
        });
      });

      applyPaymentsFilter();
    }

    function applyPaymentsFilter() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const selectedMethod = methodFilter ? methodFilter.value : '';

      if (searchClear) {
        searchClear.style.display = query ? 'block' : 'none';
      }

      const rows = document.querySelectorAll('#paymentsTableBody .payment-data-row');
      let visibleCount = 0;

      rows.forEach(r => {
        const text = r.dataset.search || r.textContent.toLowerCase();
        const method = r.dataset.method || '';
        const matchText = !query || text.includes(query);
        const matchMethod = !selectedMethod || method.toLowerCase().includes(selectedMethod.toLowerCase());
        const match = matchText && matchMethod;

        r.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      const existingNoMatch = tbody?.querySelector('.no-matches-row');
      if (existingNoMatch) existingNoMatch.remove();

      if (visibleCount === 0 && rows.length > 0) {
        const emptyTr = document.createElement('tr');
        emptyTr.className = 'no-matches-row';
        emptyTr.innerHTML = `<td colspan="9" class="no-records-row">No payment transactions match "${escapeHtml(query)}"</td>`;
        tbody?.appendChild(emptyTr);
      }
    }

    if (searchInput) searchInput.addEventListener('input', applyPaymentsFilter);
    if (methodFilter) methodFilter.addEventListener('change', applyPaymentsFilter);
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyPaymentsFilter();
        searchInput.focus();
      });
    }

    // Auto-fill from URL query param ?bookingId=...
    const params = new URLSearchParams(location.search);
    const urlBk = params.get('bookingId');
    if (urlBk && idInput) {
      idInput.value = urlBk;
      lookupBooking();
    }

    renderPaymentsTable();

    window.addEventListener('storage', (e) => {
      if (e.key === 'fleetdrive_v3_master_data' || e.key === 'fleetdrive_records_v2') renderPaymentsTable();
    });
    window.addEventListener('fleetdrive:data-changed', renderPaymentsTable);
  }

  // ============================================================================
  // MAINTENANCE PAGE LOGIC (maintenance.html)
  // ============================================================================
  function initMaintenancePage() {
    const form = document.getElementById('maintenanceForm');
    const searchInput = document.getElementById('maintenanceSearch');
    const searchClear = document.getElementById('maintenanceSearchClear');
    const statusFilter = document.getElementById('maintenanceStatusFilter');
    const tbody = document.getElementById('maintenanceTableBody');

    const editIdInput = document.getElementById('editMaintenanceId');
    const vehicleSelect = document.getElementById('maintVehicle');
    const typeSelect = document.getElementById('maintType');
    const workshopInput = document.getElementById('maintWorkshop');
    const dateInput = document.getElementById('maintDate');
    const costInput = document.getElementById('maintCost');
    const statusSelect = document.getElementById('maintStatus');
    const completedDateInput = document.getElementById('maintCompletedDate');
    const groupCompleted = document.getElementById('groupCompletedDate');
    const descInput = document.getElementById('maintDesc');
    const formTitle = document.getElementById('formTitle');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    // Populate Vehicle Dropdown from Master Data
    function populateMaintVehicleSelect() {
      if (!vehicleSelect) return;
      const data = dataMgr.read();
      const currentVal = vehicleSelect.value;
      vehicleSelect.innerHTML = '<option value="">-- Choose Vehicle --</option>';

      data.vehicles.filter(v => !v.archived).forEach(v => {
        const opt = document.createElement('option');
        opt.value = `${v.name} (${v.regNo})`;
        opt.dataset.id = v.id;
        opt.dataset.name = v.name;
        opt.dataset.regNo = v.regNo;
        opt.textContent = `${v.name} (${v.regNo}) [${v.category}]`;
        vehicleSelect.appendChild(opt);
      });

      if (currentVal) vehicleSelect.value = currentVal;
    }

    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        if (groupCompleted) {
          groupCompleted.style.display = statusSelect.value === 'Completed' ? 'block' : 'none';
          if (statusSelect.value === 'Completed' && completedDateInput && !completedDateInput.value) {
            completedDateInput.value = new Date().toISOString().slice(0, 10);
          }
        }
      });
    }

    function resetFormToNew() {
      if (editIdInput) editIdInput.value = '';
      if (form) form.reset();
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      if (groupCompleted) groupCompleted.style.display = 'none';
      if (formTitle) formTitle.textContent = 'Log New Vehicle Maintenance';
      if (btnCancelEdit) btnCancelEdit.style.display = 'none';
    }

    if (btnCancelEdit) {
      btnCancelEdit.addEventListener('click', resetFormToNew);
    }

    function loadRecordForEditing(mId) {
      const data = dataMgr.read();
      const record = (data.maintenance || []).find(m => m.id === mId);
      if (!record) return;

      if (editIdInput) editIdInput.value = record.id;
      if (vehicleSelect) vehicleSelect.value = record.vehicle;
      if (typeSelect) typeSelect.value = record.type;
      if (workshopInput) workshopInput.value = record.workshop;
      if (dateInput) dateInput.value = record.date;
      if (costInput) costInput.value = record.cost;
      if (statusSelect) statusSelect.value = record.status;
      if (descInput) descInput.value = record.description || record.notes || '';

      if (record.status === 'Completed') {
        if (groupCompleted) groupCompleted.style.display = 'block';
        if (completedDateInput) completedDateInput.value = record.completedDate || record.date;
      } else {
        if (groupCompleted) groupCompleted.style.display = 'none';
      }

      if (formTitle) formTitle.textContent = `Update Maintenance Record: ${record.id}`;
      if (btnCancelEdit) btnCancelEdit.style.display = 'inline-block';

      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function quickMarkCompleted(mId) {
      const data = dataMgr.read();
      const m = (data.maintenance || []).find(item => item.id === mId);
      if (!m) return;

      const compDate = new Date().toISOString().slice(0, 10);
      try {
        dataMgr.saveMaintenance({
          id: m.id,
          vehicle: m.vehicle,
          type: m.type,
          workshop: m.workshop,
          date: m.date,
          completedDate: compDate,
          cost: m.cost,
          description: m.description,
          status: 'Completed'
        });

        if (uiMgr) {
          uiMgr.showToast(`Maintenance ${m.id} marked Completed! Vehicle availability restored.`, 'success');
        }
        renderMaintenanceTable();
      } catch (err) {
        if (uiMgr) uiMgr.showToast(err.message, 'error');
      }
    }

    // Submit Handler (Create OR Update)
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const existingId = editIdInput ? editIdInput.value.trim() : '';
        const vehicleVal = vehicleSelect.value;
        const typeVal = typeSelect.value;
        const workshopVal = workshopInput.value.trim();
        const dateVal = dateInput.value;
        const costVal = costInput.value.trim();
        const statusVal = statusSelect.value;
        const compDateVal = statusVal === 'Completed' ? (completedDateInput?.value || dateVal) : '';
        const descVal = descInput.value.trim();

        if (!vehicleVal || !workshopVal || !costVal) {
          if (uiMgr) uiMgr.showToast('Please fill all required maintenance fields.', 'error');
          return;
        }

        try {
          const res = dataMgr.saveMaintenance({
            id: existingId || undefined,
            vehicle: vehicleVal,
            type: typeVal,
            workshop: workshopVal,
            date: dateVal,
            completedDate: compDateVal,
            cost: costVal,
            description: descVal,
            status: statusVal
          });

          const msg = existingId ? `Maintenance record ${existingId} updated successfully!` :
            `Maintenance record ${res.id} created! Vehicle status updated to ${statusVal}.`;

          if (uiMgr) uiMgr.showToast(msg, 'success');
          resetFormToNew();
          renderMaintenanceTable();
        } catch (err) {
          if (uiMgr) {
            uiMgr.showToast(err.message || 'Error saving maintenance record.', 'error');
          } else {
            alert(err.message);
          }
        }
      });
    }

    function renderMaintenanceTable() {
      if (!tbody) return;
      const data = dataMgr.read();

      const underMaintCount = data.maintenance.filter(m => m.status !== 'Completed').length;
      const completedCount = data.maintenance.filter(m => m.status === 'Completed').length;
      const totalCost = data.maintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

      const elUnder = document.getElementById('statUnderMaintenanceNow');
      const elComp = document.getElementById('statCompletedServices');
      const elCost = document.getElementById('statTotalServiceExpenses');
      const elTotal = document.getElementById('statTotalMaintenanceRecords');

      if (elUnder) elUnder.textContent = underMaintCount;
      if (elComp) elComp.textContent = completedCount;
      if (elCost) elCost.textContent = `Rs. ${totalCost.toLocaleString('en-IN')}`;
      if (elTotal) elTotal.textContent = data.maintenance.length;

      tbody.innerHTML = '';
      if (data.maintenance.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="no-records-row">No maintenance logs recorded yet</td></tr>`;
        return;
      }

      data.maintenance.slice().reverse().forEach(m => {
        const isCompleted = m.status === 'Completed';
        const tr = document.createElement('tr');
        tr.className = 'maintenance-data-row';
        tr.dataset.search = `${m.id} ${m.vehicle} ${m.type} ${m.workshop} ${m.status}`.toLowerCase();
        tr.dataset.status = m.status;

        const pillHtml = uiMgr ? uiMgr.renderStatusPill(m.status, 'maintenance') : `<span class="status-pill">${escapeHtml(m.status)}</span>`;

        tr.innerHTML = `
          <td><strong>${escapeHtml(m.id)}</strong></td>
          <td>${escapeHtml(m.vehicle)}</td>
          <td>${escapeHtml(m.type)}</td>
          <td>${escapeHtml(m.workshop)}</td>
          <td>${escapeHtml(m.date)}</td>
          <td><strong>${escapeHtml(m.completedDate || (isCompleted ? m.date : 'In Service'))}</strong></td>
          <td>Rs. ${(Number(m.cost) || 0).toLocaleString('en-IN')}</td>
          <td style="max-width:220px; font-size:13px;">${escapeHtml(m.description || m.notes || 'Routine checkup')}</td>
          <td>${pillHtml}</td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button type="button" class="btn btn-sm btn-outline btn-edit-maint" data-id="${escapeHtml(m.id)}">Edit</button>
              ${!isCompleted ? `<button type="button" class="btn btn-sm btn-primary btn-comp-maint" data-id="${escapeHtml(m.id)}" style="background:#16a34a; border-color:#16a34a;">Complete</button>` : ''}
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Bind Edit & Complete buttons
      tbody.querySelectorAll('.btn-edit-maint').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mId = e.currentTarget.getAttribute('data-id');
          loadRecordForEditing(mId);
        });
      });

      tbody.querySelectorAll('.btn-comp-maint').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mId = e.currentTarget.getAttribute('data-id');
          quickMarkCompleted(mId);
        });
      });

      applyMaintenanceFilter();
    }

    function applyMaintenanceFilter() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const selectedStatus = statusFilter ? statusFilter.value : '';

      if (searchClear) {
        searchClear.style.display = query ? 'block' : 'none';
      }

      const rows = document.querySelectorAll('#maintenanceTableBody .maintenance-data-row');
      let visibleCount = 0;

      rows.forEach(r => {
        const text = r.dataset.search || r.textContent.toLowerCase();
        const status = r.dataset.status || '';
        const matchText = !query || text.includes(query);
        const matchStatus = !selectedStatus || status.toLowerCase() === selectedStatus.toLowerCase();
        const match = matchText && matchStatus;

        r.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      const existingNoMatch = tbody?.querySelector('.no-matches-row');
      if (existingNoMatch) existingNoMatch.remove();

      if (visibleCount === 0 && rows.length > 0) {
        const emptyTr = document.createElement('tr');
        emptyTr.className = 'no-matches-row';
        emptyTr.innerHTML = `<td colspan="10" class="no-records-row">No maintenance logs match "${escapeHtml(query)}"</td>`;
        tbody?.appendChild(emptyTr);
      }
    }

    if (searchInput) searchInput.addEventListener('input', applyMaintenanceFilter);
    if (statusFilter) statusFilter.addEventListener('change', applyMaintenanceFilter);
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyMaintenanceFilter();
        searchInput.focus();
      });
    }

    populateMaintVehicleSelect();
    renderMaintenanceTable();

    window.addEventListener('storage', (e) => {
      if (e.key === 'fleetdrive_v3_master_data' || e.key === 'fleetdrive_records_v2') {
        populateMaintVehicleSelect();
        renderMaintenanceTable();
      }
    });
    window.addEventListener('fleetdrive:data-changed', () => {
      populateMaintVehicleSelect();
      renderMaintenanceTable();
    });
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
    if (page === 'maintenance.html') {
      initMaintenancePage();
    } else {
      initPaymentsPage();
    }
  });

})();

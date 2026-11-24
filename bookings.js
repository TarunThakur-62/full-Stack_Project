/**
 * FLEETDRIVE V3 - MEMBER 3: BOOKINGS & RENTALS OPERATIONS
 * Single Source of Truth, Strict 2-State Booking Logic (Pending Payment & Confirmed),
 * Date Conflict Checking, Handover Authorization Gate, and Vehicle Returns with Late Fees.
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
  // BOOKINGS PAGE LOGIC (bookings.html)
  // ============================================================================
  function initBookingsPage() {
    const form = document.getElementById('bookingForm');
    const searchInput = document.getElementById('bookingSearch');
    const searchClear = document.getElementById('bookingSearchClear');
    const statusFilter = document.getElementById('bookingStatusFilter');
    const tbody = document.getElementById('bookingsTableBody');
    const vehicleSelect = document.getElementById('bkVehicle');
    const pickupInput = document.getElementById('bkPickupDate');
    const returnInput = document.getElementById('bkReturnDate');
    const maintHint = document.getElementById('vehicleMaintHint');

    // Populate Vehicle Dropdown from Single Source of Truth
    function populateVehicleSelect() {
      if (!vehicleSelect) return;
      const data = dataMgr.read();
      const currentVal = vehicleSelect.value;
      vehicleSelect.innerHTML = '<option value="">-- Choose Available Fleet Vehicle --</option>';

      data.vehicles.filter(v => !v.archived).forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.dataset.rate = v.rate;
        opt.dataset.name = v.name;
        opt.dataset.plate = v.regNo;
        opt.dataset.category = v.category;
        opt.textContent = `${v.name} (${v.regNo}) - Rs. ${Number(v.rate).toLocaleString('en-IN')}/day [${v.category}]`;
        vehicleSelect.appendChild(opt);
      });

      // Restore or handle URL params
      const params = new URLSearchParams(location.search);
      const urlVehicleId = params.get('vehicleId');
      const urlVehicleName = params.get('vehicle');

      if (urlVehicleId) {
        vehicleSelect.value = urlVehicleId;
      } else if (urlVehicleName) {
        const match = [...vehicleSelect.options].find(o => o.textContent.toLowerCase().includes(urlVehicleName.toLowerCase()));
        if (match) vehicleSelect.value = match.value;
      } else if (currentVal) {
        vehicleSelect.value = currentVal;
      }
    }

    // Set Min Dates
    const todayStr = new Date().toISOString().slice(0, 10);
    if (pickupInput) {
      pickupInput.min = todayStr;
      if (!pickupInput.value) pickupInput.value = todayStr;
      pickupInput.addEventListener('change', () => {
        if (returnInput) {
          returnInput.min = pickupInput.value;
          if (returnInput.value && returnInput.value < pickupInput.value) {
            returnInput.value = pickupInput.value;
          }
        }
        updateEstPreview();
      });
    }

    if (returnInput) {
      returnInput.min = todayStr;
      if (!returnInput.value) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        returnInput.value = tomorrow.toISOString().slice(0, 10);
      }
      returnInput.addEventListener('change', updateEstPreview);
    }

    if (vehicleSelect) {
      vehicleSelect.addEventListener('change', updateEstPreview);
    }

    function updateEstPreview() {
      const estCard = document.getElementById('bookingEstCard');
      if (!estCard || !vehicleSelect || !pickupInput || !returnInput) return;

      const vId = vehicleSelect.value;
      const p = pickupInput.value;
      const r = returnInput.value;

      if (!vId || !p || !r) {
        estCard.style.display = 'none';
        if (maintHint) maintHint.style.display = 'none';
        return;
      }

      const opt = vehicleSelect.selectedOptions[0];
      const rate = Number(opt?.dataset.rate) || 1000;
      const vName = opt?.dataset.name || 'Vehicle';

      // Conflict / Maintenance Check
      const availCheck = dataMgr.checkVehicleAvailabilityForDates(vId, p, r);
      if (!availCheck.available) {
        estCard.style.display = 'block';
        estCard.className = 'booking-lookup error';
        estCard.innerHTML = `<strong>⚠️ Unavailable for Selected Dates:</strong> ${escapeHtml(availCheck.reason)}`;
        if (maintHint) maintHint.style.display = 'block';
        return;
      }

      if (maintHint) maintHint.style.display = 'none';

      const days = Math.max(1, Math.ceil((new Date(r + 'T00:00:00') - new Date(p + 'T00:00:00')) / (1000 * 60 * 60 * 24)));
      const baseRent = days * rate;
      const gst = Math.round(baseRent * 0.18);
      const total = baseRent + gst;

      estCard.style.display = 'block';
      estCard.className = 'booking-lookup ready';
      estCard.innerHTML = `
        <strong>Fare Estimate:</strong> ${days} Day(s) &times; Rs. ${rate.toLocaleString('en-IN')} = Rs. ${baseRent.toLocaleString('en-IN')} + 18% GST (Rs. ${gst.toLocaleString('en-IN')}) = <strong>Total Rs. ${total.toLocaleString('en-IN')}</strong><br>
        <small style="color:var(--text-muted);">Initial Reservation Status: <strong style="color:var(--status-pending-text);">Pending Payment (Orange)</strong>. Payment confirmation required before vehicle handover.</small>
      `;
    }

    // Handle Reservation Form Submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const customer = document.getElementById('bkCustomer').value.trim();
        const vId = vehicleSelect.value;
        const opt = vehicleSelect.selectedOptions[0];
        const vName = opt?.dataset.name || 'Vehicle';
        const hub = document.getElementById('bkHub').value;
        const pickup = pickupInput.value;
        const ret = returnInput.value;
        const remarks = document.getElementById('bkRemarks').value.trim();

        if (!customer || !vId || !pickup || !ret) {
          if (uiMgr) uiMgr.showToast('Please fill all mandatory reservation fields.', 'error');
          return;
        }

        try {
          const newBooking = dataMgr.createBooking({
            customer,
            vehicle: vName,
            vehicleId: vId,
            hub,
            pickup,
            ret,
            remarks
          });

          if (uiMgr) {
            uiMgr.showToast(`Reservation ${newBooking.id} created! Status: Pending Payment (Orange).`, 'success');
          }
          form.reset();
          populateVehicleSelect();
          const estCard = document.getElementById('bookingEstCard');
          if (estCard) estCard.style.display = 'none';

          renderBookingsTable();
        } catch (err) {
          if (uiMgr) {
            uiMgr.showToast(err.message || 'Error creating reservation.', 'error');
          } else {
            alert(err.message);
          }
        }
      });
    }

    function renderBookingsTable() {
      if (!tbody) return;
      const data = dataMgr.read();
      const stats = dataMgr.getSystemStats();

      // Update counters
      const elTotal = document.getElementById('statTotalBookings');
      const elConf = document.getElementById('statConfirmedBookings');
      const elPend = document.getElementById('statPendingBookings');
      const elAvail = document.getElementById('statAvailableFleet');

      if (elTotal) elTotal.textContent = stats.totalBookings;
      if (elConf) elConf.textContent = stats.confirmedBookingsCount;
      if (elPend) elPend.textContent = stats.pendingPaymentsCount;
      if (elAvail) elAvail.textContent = stats.availableVehicles;

      tbody.innerHTML = '';
      if (data.bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="no-records-row">No reservations recorded yet</td></tr>`;
        return;
      }

      data.bookings.slice().reverse().forEach(b => {
        const tr = document.createElement('tr');
        tr.className = 'booking-data-row';
        tr.dataset.search = `${b.id} ${b.customer} ${b.vehicle} ${b.status} ${b.hub}`.toLowerCase();
        tr.dataset.status = b.status;

        const pillHtml = uiMgr ? uiMgr.renderStatusPill(b.status, 'booking') : `<span class="status-pill">${escapeHtml(b.status)}</span>`;

        let actionBtn = '';
        if (b.status === 'Pending Payment') {
          actionBtn = `<a href="../Member-4-Maintenance-Payments/payments.html?bookingId=${encodeURIComponent(b.id)}" class="btn btn-sm btn-outline" style="color:var(--status-pending-text); border-color:var(--status-pending-text);">Pay Now</a>`;
        } else {
          actionBtn = `<a href="rentals.html?bookingId=${encodeURIComponent(b.id)}" class="btn btn-sm btn-outline" style="color:#0284c7; border-color:#0284c7;">Dispatch</a>`;
        }

        tr.innerHTML = `
          <td><strong>${escapeHtml(b.id)}</strong></td>
          <td>${escapeHtml(b.customer)}</td>
          <td>${escapeHtml(b.vehicle)}</td>
          <td>${escapeHtml(b.hub)}</td>
          <td>${escapeHtml(b.pickup)} to ${escapeHtml(b.ret)}</td>
          <td>${escapeHtml(b.days)} Days</td>
          <td><strong>Rs. ${(Number(b.amount) || 0).toLocaleString('en-IN')}</strong></td>
          <td>${pillHtml}</td>
          <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
      });

      applyBookingsFilter();
    }

    function applyBookingsFilter() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const selectedStatus = statusFilter ? statusFilter.value : '';

      if (searchClear) {
        searchClear.style.display = query ? 'block' : 'none';
      }

      const rows = document.querySelectorAll('#bookingsTableBody .booking-data-row');
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
        emptyTr.innerHTML = `<td colspan="9" class="no-records-row">No reservations match "${escapeHtml(query)}"</td>`;
        tbody?.appendChild(emptyTr);
      }
    }

    if (searchInput) searchInput.addEventListener('input', applyBookingsFilter);
    if (statusFilter) statusFilter.addEventListener('change', applyBookingsFilter);
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyBookingsFilter();
        searchInput.focus();
      });
    }

    populateVehicleSelect();
    updateEstPreview();
    renderBookingsTable();

    window.addEventListener('storage', (e) => {
      if (e.key === 'fleetdrive_v3_master_data' || e.key === 'fleetdrive_records_v2') {
        populateVehicleSelect();
        renderBookingsTable();
      }
    });
    window.addEventListener('fleetdrive:data-changed', () => {
      populateVehicleSelect();
      renderBookingsTable();
    });
  }

  // ============================================================================
  // RENTALS PAGE LOGIC (rentals.html)
  // ============================================================================
  function initRentalsPage() {
    const dispatchForm = document.getElementById('dispatchForm');
    const returnForm = document.getElementById('returnForm');
    const searchInput = document.getElementById('rentalSearch');
    const searchClear = document.getElementById('rentalSearchClear');
    const statusFilter = document.getElementById('rentalStatusFilter');
    const tbody = document.getElementById('rentalsTableBody');

    // Dispatch form elements
    const bkIdInput = document.getElementById('rentalBookingId');
    const custInput = document.getElementById('rentalCustomer');
    const vehInput = document.getElementById('rentalVehicle');
    const hubInput = document.getElementById('rentalHub');
    const startInput = document.getElementById('rentalStartDate');
    const endInput = document.getElementById('rentalEndDate');
    const odoInput = document.getElementById('rentalOdo');
    const depositInput = document.getElementById('rentalDeposit');
    const officerInput = document.getElementById('rentalOfficer');
    const lookupBox = document.getElementById('rentalBookingLookup');
    const submitDispatchBtn = document.getElementById('submitDispatchBtn');

    let activeDispatchBooking = null;

    // Real-time Booking ID lookup for Dispatch Handover
    function lookupDispatchBooking() {
      const id = bkIdInput ? bkIdInput.value.trim().toUpperCase() : '';
      activeDispatchBooking = null;

      if (!id) {
        lookupBox.className = 'booking-lookup';
        lookupBox.textContent = 'Enter a Booking ID above to verify confirmation status and auto-populate rental details.';
        if (custInput) custInput.value = '';
        if (vehInput) vehInput.value = '';
        if (hubInput) hubInput.value = '';
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        if (submitDispatchBtn) submitDispatchBtn.disabled = false;
        return;
      }

      const data = dataMgr.read();
      const b = (data.bookings || []).find(bk => bk.id.toUpperCase() === id);

      if (!b) {
        lookupBox.className = 'booking-lookup error';
        lookupBox.innerHTML = `<strong>Booking ID "${escapeHtml(id)}" not found.</strong> Please verify on the Bookings page.`;
        if (custInput) custInput.value = '';
        if (vehInput) vehInput.value = '';
        if (hubInput) hubInput.value = '';
        if (submitDispatchBtn) submitDispatchBtn.disabled = true;
        return;
      }

      // Auto-fill booking details
      if (custInput) custInput.value = b.customer;
      if (vehInput) vehInput.value = b.vehicle;
      if (hubInput) hubInput.value = b.hub;
      if (startInput) startInput.value = b.pickup;
      if (endInput) endInput.value = b.ret;

      // Check if rental already active for this booking
      const existingRental = (data.rentals || []).find(r => r.bookingId && r.bookingId.toUpperCase() === id && (r.status === 'Active' || r.status === 'On Road'));
      if (existingRental) {
        lookupBox.className = 'booking-lookup error';
        lookupBox.innerHTML = `<strong>Active Rental Handover Already Dispatched!</strong><br>Rental ID: <strong>${escapeHtml(existingRental.id)}</strong> is already on road for Booking ${escapeHtml(b.id)}. Cannot dispatch duplicate rental.`;
        if (submitDispatchBtn) submitDispatchBtn.disabled = true;
        return;
      }

      // Check if vehicle under maintenance
      const isMaint = (data.maintenance || []).some(m => m.status !== 'Completed' && (m.vehicle.toLowerCase().includes(b.vehicle.toLowerCase()) || (b.vehicleId && m.vehicleId === b.vehicleId)));
      if (isMaint) {
        lookupBox.className = 'booking-lookup error';
        lookupBox.innerHTML = `<strong>Vehicle Under Maintenance!</strong> Vehicle <strong>${escapeHtml(b.vehicle)}</strong> is currently undergoing servicing. Handover is blocked until maintenance is completed.`;
        if (submitDispatchBtn) submitDispatchBtn.disabled = true;
        return;
      }

      // Requirement 5 & Handover Gate: Handover permitted ONLY if booking is Confirmed
      if (b.status !== 'Confirmed') {
        lookupBox.className = 'booking-lookup error';
        lookupBox.innerHTML = `<strong>HANDOVER LOCKED (PENDING PAYMENT)</strong><br>` +
          `Customer: <strong>${escapeHtml(b.customer)}</strong> &bull; Vehicle: <strong>${escapeHtml(b.vehicle)}</strong><br>` +
          `Booking status is <strong style="color:var(--status-pending-text);">Pending Payment</strong>. Payment must be confirmed on the Payments page before vehicle handover can be authorized.`;
        if (submitDispatchBtn) submitDispatchBtn.disabled = true;
        return;
      }

      // Handover Authorized
      activeDispatchBooking = b;
      if (submitDispatchBtn) submitDispatchBtn.disabled = false;
      lookupBox.className = 'booking-lookup ready';
      lookupBox.innerHTML = `<strong>&check; Handover Authorized (Payment Confirmed)</strong><br>` +
        `Booking ID: <strong>${escapeHtml(b.id)}</strong> &bull; Customer: <strong>${escapeHtml(b.customer)}</strong> &bull; Vehicle: <strong>${escapeHtml(b.vehicle)}</strong><br>` +
        `Dates: <strong>${escapeHtml(b.pickup)} to ${escapeHtml(b.ret)} (${escapeHtml(b.days)} days)</strong> &bull; Total Paid: <strong>Rs. ${(Number(b.amount) || 0).toLocaleString('en-IN')}</strong>`;
    }

    if (bkIdInput) {
      bkIdInput.addEventListener('input', lookupDispatchBooking);
    }

    // Handle Dispatch Handover Form Submit
    if (dispatchForm) {
      dispatchForm.addEventListener('submit', (e) => {
        e.preventDefault();

        lookupDispatchBooking();
        if (!activeDispatchBooking || activeDispatchBooking.status !== 'Confirmed') {
          if (uiMgr) uiMgr.showToast('Handover blocked: Payment must be Confirmed before dispatch.', 'error');
          return;
        }

        const odo = odoInput ? odoInput.value.trim() : '1000';
        const fuel = document.getElementById('rentalFuel')?.value || '100% Full Tank';
        const deposit = depositInput ? depositInput.value.trim() : '5000';
        const officer = officerInput ? officerInput.value.trim() : 'Duty Officer';

        try {
          const rentalRecord = dataMgr.dispatchRental({
            bookingId: activeDispatchBooking.id,
            customer: activeDispatchBooking.customer,
            vehicle: activeDispatchBooking.vehicle,
            pickupHub: activeDispatchBooking.hub,
            startDate: startInput.value || activeDispatchBooking.pickup,
            returnDate: endInput.value || activeDispatchBooking.ret,
            odo,
            fuel,
            deposit,
            officer
          });

          if (uiMgr) {
            uiMgr.showToast(`Vehicle handover complete! Rental ID: ${rentalRecord.id}. Vehicle is now On Road.`, 'success');
          }
          dispatchForm.reset();
          activeDispatchBooking = null;
          lookupBox.className = 'booking-lookup';
          lookupBox.textContent = 'Enter a Booking ID above to verify confirmation status and auto-populate rental details.';

          renderRentalsTable();
        } catch (err) {
          if (uiMgr) {
            uiMgr.showToast(err.message || 'Error dispatching vehicle.', 'error');
          } else {
            alert(err.message);
          }
        }
      });
    }

    // ========================================================================
    // RETURN WORKFLOW (Search by Booking ID / Rental ID & Mark as Returned)
    // ========================================================================
    const returnSearchInput = document.getElementById('returnSearchId');
    const returnCust = document.getElementById('returnCustomer');
    const returnVeh = document.getElementById('returnVehicleName');
    const returnActualDate = document.getElementById('returnActualDate');
    const returnFinalOdo = document.getElementById('returnFinalOdo');
    const returnBox = document.getElementById('returnLookupBox');
    const submitReturnBtn = document.getElementById('submitReturnBtn');

    if (returnActualDate) {
      returnActualDate.value = new Date().toISOString().slice(0, 10);
    }

    let activeReturnRental = null;

    function lookupReturnRental() {
      const query = returnSearchInput ? returnSearchInput.value.trim().toUpperCase() : '';
      activeReturnRental = null;

      if (!query) {
        returnBox.className = 'booking-lookup';
        returnBox.textContent = 'Enter a Booking ID or Rental ID to load the active on-road rental.';
        if (returnCust) returnCust.value = '';
        if (returnVeh) returnVeh.value = '';
        if (submitReturnBtn) submitReturnBtn.disabled = false;
        return;
      }

      const data = dataMgr.read();
      const r = (data.rentals || []).find(item =>
        item.id.toUpperCase() === query || (item.bookingId && item.bookingId.toUpperCase() === query)
      );

      if (!r) {
        returnBox.className = 'booking-lookup error';
        returnBox.innerHTML = `No rental found for ID: <strong>"${escapeHtml(query)}"</strong>.`;
        if (returnCust) returnCust.value = '';
        if (returnVeh) returnVeh.value = '';
        if (submitReturnBtn) submitReturnBtn.disabled = true;
        return;
      }

      if (returnCust) returnCust.value = r.customer;
      if (returnVeh) returnVeh.value = r.vehicle;

      if (r.status === 'Returned') {
        returnBox.className = 'booking-lookup ready';
        returnBox.innerHTML = `<strong>Already Returned:</strong> Rental <strong>${escapeHtml(r.id)}</strong> (Booking: ${escapeHtml(r.bookingId)}) was returned on <strong>${escapeHtml(r.actualReturnDate || r.returnDate)}</strong>.`;
        if (submitReturnBtn) submitReturnBtn.disabled = true;
        return;
      }

      activeReturnRental = r;
      if (submitReturnBtn) submitReturnBtn.disabled = false;

      // Check late return
      const todayStr = returnActualDate ? returnActualDate.value : new Date().toISOString().slice(0, 10);
      let lateHtml = '';
      if (todayStr > r.returnDate) {
        const diffMs = new Date(todayStr) - new Date(r.returnDate);
        const lateDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        lateHtml = `<br><span style="color:#b91c1c; font-weight:700;">⚠️ Vehicle is ${lateDays} day(s) overdue! Standard late fee (1.5x) will apply.</span>`;
      }

      returnBox.className = 'booking-lookup ready';
      returnBox.innerHTML = `<strong>Active Rental Found: ${escapeHtml(r.id)}</strong> (Booking: <strong>${escapeHtml(r.bookingId)}</strong>)<br>` +
        `Customer: <strong>${escapeHtml(r.customer)}</strong> &bull; Vehicle: <strong>${escapeHtml(r.vehicle)}</strong><br>` +
        `Handover Odo: <strong>${escapeHtml(r.odo)} km</strong> &bull; Expected Return: <strong>${escapeHtml(r.returnDate)}</strong>` +
        lateHtml;
    }

    if (returnSearchInput) {
      returnSearchInput.addEventListener('input', lookupReturnRental);
    }
    if (returnActualDate) {
      returnActualDate.addEventListener('change', lookupReturnRental);
    }

    if (returnForm) {
      returnForm.addEventListener('submit', (e) => {
        e.preventDefault();

        lookupReturnRental();
        if (!activeReturnRental) {
          if (uiMgr) uiMgr.showToast('Enter a valid active on-road Booking ID or Rental ID.', 'error');
          return;
        }

        const actualDate = returnActualDate.value || new Date().toISOString().slice(0, 10);
        const finalOdo = returnFinalOdo ? returnFinalOdo.value : '';
        const depositRefund = document.getElementById('returnDepositStatus')?.value || 'Full Deposit Refunded';

        try {
          const res = dataMgr.returnRental({
            rentalId: activeReturnRental.id,
            actualReturnDate: actualDate,
            finalOdo,
            depositRefundStatus: depositRefund
          });

          const lateNotice = res.lateFee > 0 ? ` (Late fee applied: Rs. ${res.lateFee.toLocaleString('en-IN')})` : '';
          if (uiMgr) {
            uiMgr.showToast(`Vehicle returned successfully! Availability restored.${lateNotice}`, 'success');
          }
          returnForm.reset();
          activeReturnRental = null;
          returnBox.className = 'booking-lookup';
          returnBox.textContent = 'Enter a Booking ID or Rental ID to load the active on-road rental.';

          renderRentalsTable();
        } catch (err) {
          if (uiMgr) {
            uiMgr.showToast(err.message || 'Error processing return.', 'error');
          } else {
            alert(err.message);
          }
        }
      });
    }

    // Render Table
    function renderRentalsTable() {
      if (!tbody) return;
      const data = dataMgr.read();

      const onRoadCount = data.rentals.filter(r => r.status === 'Active' || r.status === 'On Road').length;
      const returnedCount = data.rentals.filter(r => r.status === 'Returned').length;
      const activeDeposits = data.rentals
        .filter(r => r.status === 'Active' || r.status === 'On Road')
        .reduce((sum, r) => sum + (Number(r.deposit) || 0), 0);

      const elOnRoad = document.getElementById('statVehiclesOnRoad');
      const elReturned = document.getElementById('statReturnedRentals');
      const elDeposits = document.getElementById('statActiveDeposits');
      const elTotal = document.getElementById('statTotalRentals');

      if (elOnRoad) elOnRoad.textContent = onRoadCount;
      if (elReturned) elReturned.textContent = returnedCount;
      if (elDeposits) elDeposits.textContent = `Rs. ${activeDeposits.toLocaleString('en-IN')}`;
      if (elTotal) elTotal.textContent = data.rentals.length;

      tbody.innerHTML = '';
      if (data.rentals.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="no-records-row">No rental dispatch records recorded yet</td></tr>`;
        return;
      }

      data.rentals.slice().reverse().forEach(r => {
        const isReturned = r.status === 'Returned';
        const tr = document.createElement('tr');
        tr.className = 'rental-data-row';
        tr.dataset.search = `${r.id} ${r.bookingId || ''} ${r.customer} ${r.vehicle} ${r.pickupHub || ''} ${r.status}`.toLowerCase();
        tr.dataset.status = r.status;

        const pillHtml = uiMgr ? uiMgr.renderStatusPill(r.status, 'rental') : `<span class="status-pill">${escapeHtml(r.status)}</span>`;

        tr.innerHTML = `
          <td><strong>${escapeHtml(r.id)}</strong></td>
          <td><a href="bookings.html?search=${encodeURIComponent(r.bookingId)}" style="color:var(--primary); font-weight:600;">${escapeHtml(r.bookingId || 'N/A')}</a></td>
          <td>${escapeHtml(r.customer)}</td>
          <td>${escapeHtml(r.vehicle)}</td>
          <td>${escapeHtml(r.pickupHub || 'Main Hub')}</td>
          <td>${escapeHtml(r.startDate || 'N/A')}</td>
          <td>${escapeHtml(r.returnDate || 'N/A')}</td>
          <td><strong>${escapeHtml(r.actualReturnDate || (isReturned ? r.returnDate : 'Pending Return'))}</strong></td>
          <td>Rs. ${(Number(r.deposit) || 0).toLocaleString('en-IN')}</td>
          <td>${pillHtml}</td>
          <td>
            ${isReturned
              ? `<span style="color:var(--status-confirmed-text); font-weight:700; font-size:12px;">&check; Returned</span>`
              : `<button class="btn btn-sm btn-primary btn-quick-return" data-id="${escapeHtml(r.id)}" type="button">Return</button>`
            }
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Quick return button binding
      tbody.querySelectorAll('.btn-quick-return').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const rId = e.currentTarget.getAttribute('data-id');
          if (returnSearchInput) {
            returnSearchInput.value = rId;
            lookupReturnRental();
            document.getElementById('return-vehicle')?.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      applyRentalsFilter();
    }

    function applyRentalsFilter() {
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const selectedStatus = statusFilter ? statusFilter.value : '';

      if (searchClear) {
        searchClear.style.display = query ? 'block' : 'none';
      }

      const rows = document.querySelectorAll('#rentalsTableBody .rental-data-row');
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
        emptyTr.innerHTML = `<td colspan="11" class="no-records-row">No rentals match "${escapeHtml(query)}"</td>`;
        tbody?.appendChild(emptyTr);
      }
    }

    if (searchInput) searchInput.addEventListener('input', applyRentalsFilter);
    if (statusFilter) statusFilter.addEventListener('change', applyRentalsFilter);
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyRentalsFilter();
        searchInput.focus();
      });
    }

    // Check URL parameters for auto-fill
    const params = new URLSearchParams(location.search);
    const urlBk = params.get('bookingId');
    const urlRental = params.get('rentalId');
    if (urlBk && bkIdInput) {
      bkIdInput.value = urlBk;
      lookupDispatchBooking();
    }
    if (urlRental && returnSearchInput) {
      returnSearchInput.value = urlRental;
      lookupReturnRental();
    }

    renderRentalsTable();

    window.addEventListener('storage', (e) => {
      if (e.key === 'fleetdrive_v3_master_data' || e.key === 'fleetdrive_records_v2') renderRentalsTable();
    });
    window.addEventListener('fleetdrive:data-changed', renderRentalsTable);
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
    if (page === 'rentals.html') {
      initRentalsPage();
    } else {
      initBookingsPage();
    }
  });

})();

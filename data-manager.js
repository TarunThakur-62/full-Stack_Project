/**
 * ============================================================================
 * FleetDrive V3 - Centralized Frontend Data Manager & Single Source of Truth
 * 100% Vanilla JavaScript, LocalStorage, Event-Driven Multi-Tab Sync
 * ============================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_KEY_V3 = 'fleetdrive_v3_master_data';
  const STORAGE_KEY_V2 = 'fleetdrive_records_v2';
  const THEME_KEY = 'fleetdrive_theme';
  const BACKUP_TIMESTAMP_KEY = 'fleetdrive_last_backup';

  // Seed Fleet: 45 vehicles (14 SUVs, 12 Sedans, 11 Hatchbacks, 8 Two-Wheelers)
  const INITIAL_VEHICLES = [
    // SUVs (14)
    { id: 'VH-01', name: 'Hyundai Creta SX(O)', brand: 'Hyundai', model: 'Creta SX(O)', regNo: 'UP-85-AB-1234', category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', seating: 5, pricePerDay: 3200, year: 2024, currentOdo: 24120, insuranceExpiry: '2027-05-15', regExpiry: '2039-04-10', image: '../images/hyundai creta.jpg', status: 'Available', archived: false },
    { id: 'VH-02', name: 'Mahindra Thar LX 4x4', brand: 'Mahindra', model: 'Thar LX', regNo: 'UP-85-CD-2021', category: 'SUV', fuelType: 'Diesel', transmission: 'Manual', seating: 4, pricePerDay: 3800, year: 2023, currentOdo: 18900, insuranceExpiry: '2026-11-20', regExpiry: '2038-08-12', image: '../images/mahindra thar.jpg', status: 'Available', archived: false },
    { id: 'VH-03', name: 'Tata Harrier Fearless+', brand: 'Tata', model: 'Harrier', regNo: 'UP-85-TH-8899', category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', seating: 5, pricePerDay: 3500, year: 2024, currentOdo: 31200, insuranceExpiry: '2027-02-18', regExpiry: '2039-01-22', image: '../images/tata harrier.jpg', status: 'Under Maintenance', archived: false },
    { id: 'VH-04', name: 'Toyota Fortuner Legender', brand: 'Toyota', model: 'Fortuner Legender', regNo: 'UP-85-TF-9999', category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', seating: 7, pricePerDay: 5800, year: 2023, currentOdo: 42100, insuranceExpiry: '2026-12-30', regExpiry: '2038-10-15', image: '../images/toyota fortuner.jpg', status: 'Rented', archived: false },
    { id: 'VH-05', name: 'Mahindra Scorpio-N Z8L', brand: 'Mahindra', model: 'Scorpio-N', regNo: 'UP-85-SN-2101', category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', seating: 7, pricePerDay: 4000, year: 2024, currentOdo: 15400, insuranceExpiry: '2027-08-01', regExpiry: '2039-06-11', image: '../images/mahindra scorpio.jpg', status: 'Available', archived: false },
    { id: 'VH-06', name: 'Kia Seltos GTX+ Dark', brand: 'Kia', model: 'Seltos', regNo: 'UP-85-KS-2202', category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 3400, year: 2023, currentOdo: 27800, insuranceExpiry: '2027-01-14', regExpiry: '2038-12-05', image: '../images/kia seltos.jpg', status: 'Available', archived: false },
    { id: 'VH-07', name: 'Tata Safari Dark Edition', brand: 'Tata', model: 'Safari Dark', regNo: 'UP-85-TS-2303', category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', seating: 7, pricePerDay: 4200, year: 2024, currentOdo: 19600, insuranceExpiry: '2027-04-19', regExpiry: '2039-03-30', image: '../images/tata safari.jpg', status: 'Available', archived: false },
    { id: 'VH-08', name: 'Mahindra XUV700 AX7L', brand: 'Mahindra', model: 'XUV700', regNo: 'UP-85-XU-2404', category: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', seating: 7, pricePerDay: 4500, year: 2023, currentOdo: 29800, insuranceExpiry: '2026-10-10', regExpiry: '2038-09-08', image: '../images/mahindra xuv700.jpg', status: 'Available', archived: false },
    { id: 'VH-09', name: 'Maruti Suzuki Brezza ZXi+', brand: 'Maruti', model: 'Brezza', regNo: 'UP-85-BZ-2505', category: 'SUV', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 2400, year: 2023, currentOdo: 22100, insuranceExpiry: '2027-06-25', regExpiry: '2038-05-14', image: '../images/maruti brezza.jpg', status: 'Available', archived: false },
    { id: 'VH-10', name: 'Hyundai Venue SX Turbo', brand: 'Hyundai', model: 'Venue SX', regNo: 'UP-85-VN-2606', category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 2500, year: 2024, currentOdo: 13500, insuranceExpiry: '2027-07-20', regExpiry: '2039-05-02', image: '../images/hyundai venue.jpg', status: 'Available', archived: false },
    { id: 'VH-11', name: 'Toyota Innova Crysta ZX', brand: 'Toyota', model: 'Innova Crysta', regNo: 'UP-85-IC-2707', category: 'SUV', fuelType: 'Diesel', transmission: 'Manual', seating: 7, pricePerDay: 4600, year: 2023, currentOdo: 51200, insuranceExpiry: '2027-03-11', regExpiry: '2038-02-18', image: '../images/toyota innova.jpg', status: 'Available', archived: false },
    { id: 'VH-12', name: 'MG Hector Sharp Pro', brand: 'MG', model: 'Hector', regNo: 'UP-85-MH-2808', category: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 3600, year: 2023, currentOdo: 33400, insuranceExpiry: '2026-11-05', regExpiry: '2038-07-19', image: '../images/mg hector.jpg', status: 'Available', archived: false },
    { id: 'VH-13', name: 'Mahindra Bolero Neo N10', brand: 'Mahindra', model: 'Bolero Neo', regNo: 'UP-85-BL-2909', category: 'SUV', fuelType: 'Diesel', transmission: 'Manual', seating: 7, pricePerDay: 2200, year: 2022, currentOdo: 64500, insuranceExpiry: '2026-09-18', regExpiry: '2037-08-20', image: '../images/mahindra bolero.jpg', status: 'Available', archived: false },
    { id: 'VH-14', name: 'Force Gurkha 4x4', brand: 'Force', model: 'Gurkha', regNo: 'UP-85-FG-3010', category: 'SUV', fuelType: 'Diesel', transmission: 'Manual', seating: 4, pricePerDay: 3500, year: 2023, currentOdo: 21300, insuranceExpiry: '2027-05-28', regExpiry: '2038-11-12', image: '../images/force gurkha.jpg', status: 'Available', archived: false },

    // Sedans (12)
    { id: 'VH-15', name: 'Honda City ZX CVT', brand: 'Honda', model: 'City ZX', regNo: 'UP-85-HC-3344', category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 2600, year: 2023, currentOdo: 31200, insuranceExpiry: '2027-02-14', regExpiry: '2038-04-12', image: '../images/Honda city.jpg', status: 'Rented', archived: false },
    { id: 'VH-16', name: 'Hyundai Verna SX(O) Turbo', brand: 'Hyundai', model: 'Verna SX', regNo: 'UP-85-HV-5566', category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 2800, year: 2024, currentOdo: 19800, insuranceExpiry: '2027-06-30', regExpiry: '2039-05-18', image: '../images/hyundai verna.jpg', status: 'Rented', archived: false },
    { id: 'VH-17', name: 'Maruti Suzuki Ciaz Alpha', brand: 'Maruti', model: 'Ciaz Alpha', regNo: 'UP-85-CZ-3101', category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 2200, year: 2023, currentOdo: 38400, insuranceExpiry: '2027-01-20', regExpiry: '2038-03-25', image: '../images/maruti ciaz.jpg', status: 'Available', archived: false },
    { id: 'VH-18', name: 'Volkswagen Virtus GT Plus', brand: 'Volkswagen', model: 'Virtus GT', regNo: 'UP-85-VV-3202', category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 3100, year: 2024, currentOdo: 14700, insuranceExpiry: '2027-08-15', regExpiry: '2039-07-01', image: '../images/volkswagen virtus.jpg', status: 'Available', archived: false },
    { id: 'VH-19', name: 'Skoda Octavia Style', brand: 'Skoda', model: 'Octavia', regNo: 'UP-85-SO-3303', category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 4800, year: 2023, currentOdo: 28900, insuranceExpiry: '2026-12-10', regExpiry: '2038-09-15', image: '../images/skoda octavia.jpg', status: 'Available', archived: false },
    { id: 'VH-20', name: 'Toyota Camry Hybrid', brand: 'Toyota', model: 'Camry Hybrid', regNo: 'UP-85-TC-3404', category: 'Sedan', fuelType: 'Hybrid', transmission: 'Automatic', seating: 5, pricePerDay: 6200, year: 2024, currentOdo: 11200, insuranceExpiry: '2027-09-05', regExpiry: '2039-08-10', image: '../images/toyota camry.jpg', status: 'Available', archived: false },
    { id: 'VH-21', name: 'Hyundai Elantra SX', brand: 'Hyundai', model: 'Elantra', regNo: 'UP-85-HE-3505', category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 3600, year: 2022, currentOdo: 46700, insuranceExpiry: '2026-10-22', regExpiry: '2037-11-19', image: '../images/hyundai elantra.jpg', status: 'Available', archived: false },
    { id: 'VH-22', name: 'Skoda Rapid Rider Plus', brand: 'Skoda', model: 'Rapid Rider', regNo: 'UP-85-SR-3606', category: 'Sedan', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 2000, year: 2022, currentOdo: 54100, insuranceExpiry: '2026-11-18', regExpiry: '2037-10-05', image: '../images/skoda rapid.jpg', status: 'Available', archived: false },
    { id: 'VH-23', name: 'Honda Amaze VX CVT', brand: 'Honda', model: 'Amaze VX', regNo: 'UP-85-HA-3707', category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 1900, year: 2023, currentOdo: 27500, insuranceExpiry: '2027-03-24', regExpiry: '2038-04-16', image: '../images/honda amaze.jpg', status: 'Available', archived: false },
    { id: 'VH-24', name: 'Maruti Suzuki Dzire ZXi', brand: 'Maruti', model: 'Dzire ZXi', regNo: 'UP-85-MD-3808', category: 'Sedan', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1800, year: 2024, currentOdo: 16800, insuranceExpiry: '2027-05-12', regExpiry: '2039-04-20', image: '../images/maruti dzire.jpg', status: 'Available', archived: false },
    { id: 'VH-25', name: 'Hyundai Aura SX Plus', brand: 'Hyundai', model: 'Aura SX', regNo: 'UP-85-AU-3909', category: 'Sedan', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1700, year: 2023, currentOdo: 29400, insuranceExpiry: '2027-02-28', regExpiry: '2038-03-15', image: '../images/hyundai aura.jpg', status: 'Available', archived: false },
    { id: 'VH-26', name: 'Tata Tigor XZA Plus', brand: 'Tata', model: 'Tigor XZA', regNo: 'UP-85-TT-4010', category: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 1750, year: 2023, currentOdo: 32100, insuranceExpiry: '2026-12-08', regExpiry: '2038-01-22', image: '../images/tata tigor.jpg', status: 'Available', archived: false },

    // Hatchbacks (11)
    { id: 'VH-27', name: 'Maruti Suzuki Swift ZXi+', brand: 'Maruti', model: 'Swift ZXi+', regNo: 'UP-85-SW-5678', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1800, year: 2024, currentOdo: 18450, insuranceExpiry: '2027-07-15', regExpiry: '2039-06-20', image: '../images/maruti swift.jpg', status: 'Available', archived: false },
    { id: 'VH-28', name: 'Tata Altroz XZ+ i-Turbo', brand: 'Tata', model: 'Altroz XZ+', regNo: 'UP-85-TA-2211', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1900, year: 2023, currentOdo: 22400, insuranceExpiry: '2027-04-10', regExpiry: '2038-05-18', image: '../images/tata altroz.jpg', status: 'Available', archived: false },
    { id: 'VH-29', name: 'Hyundai i20 Asta(O) Turbo', brand: 'Hyundai', model: 'i20 Asta', regNo: 'UP-85-HI-4101', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 2100, year: 2024, currentOdo: 16200, insuranceExpiry: '2027-08-20', regExpiry: '2039-07-11', image: '../images/hyundai i20.jpg', status: 'Available', archived: false },
    { id: 'VH-30', name: 'Maruti Suzuki Baleno Alpha', brand: 'Maruti', model: 'Baleno Alpha', regNo: 'UP-85-MB-4202', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 1950, year: 2023, currentOdo: 28700, insuranceExpiry: '2027-03-15', regExpiry: '2038-04-02', image: '../images/maruti baleno.jpg', status: 'Available', archived: false },
    { id: 'VH-31', name: 'Tata Tiago XZ Plus', brand: 'Tata', model: 'Tiago XZ', regNo: 'UP-85-TT-4303', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1500, year: 2023, currentOdo: 34100, insuranceExpiry: '2026-11-25', regExpiry: '2038-02-14', image: '../images/tata tiago.jpg', status: 'Available', archived: false },
    { id: 'VH-32', name: 'Hyundai Grand i10 Nios Asta', brand: 'Hyundai', model: 'Grand i10', regNo: 'UP-85-GI-4404', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1600, year: 2023, currentOdo: 31800, insuranceExpiry: '2027-01-30', regExpiry: '2038-03-22', image: '../images/hyundai grand i10.jpg', status: 'Available', archived: false },
    { id: 'VH-33', name: 'Maruti Suzuki WagonR ZXi 1.2', brand: 'Maruti', model: 'WagonR ZXi', regNo: 'UP-85-MW-4505', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1400, year: 2023, currentOdo: 39500, insuranceExpiry: '2026-12-15', regExpiry: '2038-01-18', image: '../images/maruti wagonr.jpg', status: 'Available', archived: false },
    { id: 'VH-34', name: 'Maruti Suzuki Ignis Alpha', brand: 'Maruti', model: 'Ignis Alpha', regNo: 'UP-85-MI-4606', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1550, year: 2022, currentOdo: 44200, insuranceExpiry: '2026-10-12', regExpiry: '2037-11-04', image: '../images/maruti ignis.jpg', status: 'Available', archived: false },
    { id: 'VH-35', name: 'Renault Kwid Climber', brand: 'Renault', model: 'Kwid Climber', regNo: 'UP-85-RK-4707', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Automatic', seating: 5, pricePerDay: 1300, year: 2023, currentOdo: 26300, insuranceExpiry: '2027-02-10', regExpiry: '2038-03-08', image: '../images/renault kwid.jpg', status: 'Available', archived: false },
    { id: 'VH-36', name: 'Maruti Suzuki Alto K10 VXi', brand: 'Maruti', model: 'Alto K10', regNo: 'UP-85-MA-4808', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', seating: 4, pricePerDay: 1100, year: 2024, currentOdo: 12400, insuranceExpiry: '2027-06-18', regExpiry: '2039-05-12', image: '../images/maruti alto.jpg', status: 'Available', archived: false },
    { id: 'VH-37', name: 'Citroen C3 Shine Turbo', brand: 'Citroen', model: 'C3 Shine', regNo: 'UP-85-CC-4909', category: 'Hatchback', fuelType: 'Petrol', transmission: 'Manual', seating: 5, pricePerDay: 1750, year: 2023, currentOdo: 23100, insuranceExpiry: '2027-04-05', regExpiry: '2038-06-15', image: '../images/citroen c3.jpg', status: 'Available', archived: false },

    // Two-Wheelers (8)
    { id: 'VH-38', name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', model: 'Classic 350', regNo: 'UP-85-RE-9012', category: 'Two-Wheeler', fuelType: 'Petrol', transmission: 'Manual', seating: 2, pricePerDay: 1200, year: 2023, currentOdo: 8900, insuranceExpiry: '2027-03-20', regExpiry: '2038-04-11', image: '../images/Royal Enfield Classic.jpg', status: 'Under Maintenance', archived: false },
    { id: 'VH-39', name: 'Honda Activa 6G DLX', brand: 'Honda', model: 'Activa 6G', regNo: 'UP-85-AC-7788', category: 'Two-Wheeler', fuelType: 'Petrol', transmission: 'Automatic', seating: 2, pricePerDay: 600, year: 2024, currentOdo: 5420, insuranceExpiry: '2027-05-10', regExpiry: '2039-04-18', image: '../images/honda activa.jpg', status: 'Rented', archived: false },
    { id: 'VH-40', name: 'Royal Enfield Meteor 350', brand: 'Royal Enfield', model: 'Meteor 350', regNo: 'UP-85-RM-5101', category: 'Two-Wheeler', fuelType: 'Petrol', transmission: 'Manual', seating: 2, pricePerDay: 1300, year: 2023, currentOdo: 12800, insuranceExpiry: '2027-02-15', regExpiry: '2038-03-20', image: '../images/royal enfield meteor.jpg', status: 'Available', archived: false },
    { id: 'VH-41', name: 'Bajaj Pulsar NS200', brand: 'Bajaj', model: 'Pulsar NS200', regNo: 'UP-85-BP-5202', category: 'Two-Wheeler', fuelType: 'Petrol', transmission: 'Manual', seating: 2, pricePerDay: 900, year: 2023, currentOdo: 19400, insuranceExpiry: '2026-11-30', regExpiry: '2038-01-25', image: '../images/bajaj pulsar.jpg', status: 'Available', archived: false },
    { id: 'VH-42', name: 'Yamaha FZ-S FI V4', brand: 'Yamaha', model: 'FZ-S V4', regNo: 'UP-85-YF-5303', category: 'Two-Wheeler', fuelType: 'Petrol', transmission: 'Manual', seating: 2, pricePerDay: 850, year: 2024, currentOdo: 11100, insuranceExpiry: '2027-06-12', regExpiry: '2039-05-20', image: '../images/yamaha fz.jpg', status: 'Available', archived: false },
    { id: 'VH-43', name: 'TVS Jupiter 125 Disc', brand: 'TVS', model: 'Jupiter 125', regNo: 'UP-85-TJ-5404', category: 'Two-Wheeler', fuelType: 'Petrol', transmission: 'Automatic', seating: 2, pricePerDay: 650, year: 2023, currentOdo: 14700, insuranceExpiry: '2027-01-18', regExpiry: '2038-02-10', image: '../images/tvs jupiter.jpg', status: 'Available', archived: false },
    { id: 'VH-44', name: 'Suzuki Access 125 Ride Connect', brand: 'Suzuki', model: 'Access 125', regNo: 'UP-85-SA-5505', category: 'Two-Wheeler', fuelType: 'Petrol', transmission: 'Automatic', seating: 2, pricePerDay: 700, year: 2024, currentOdo: 9800, insuranceExpiry: '2027-07-25', regExpiry: '2039-06-30', image: '../images/suzuki access.jpg', status: 'Available', archived: false },
    { id: 'VH-45', name: 'TVS Ntorq 125 Race XP', brand: 'TVS', model: 'Ntorq 125', regNo: 'UP-85-TN-5606', category: 'Two-Wheeler', fuelType: 'Petrol', transmission: 'Automatic', seating: 2, pricePerDay: 750, year: 2023, currentOdo: 16500, insuranceExpiry: '2026-10-15', regExpiry: '2037-12-28', image: '../images/tvs ntorq.jpg', status: 'Available', archived: false }
  ];

  const INITIAL_CUSTOMERS = [
    { id: 'CUST-101', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '9876543210', address: 'B-14 Civil Lines, Mathura Cantt', license: 'DL-042011002341', licenseExpiry: '2031-08-14', verificationStatus: 'Verified', proof: 'Aadhaar Card', status: 'Active', createdAt: '2026-08-10' },
    { id: 'CUST-102', name: 'Priya Verma', email: 'priya.verma@example.com', phone: '9812345678', address: '42 Railway Colony, Mathura Junction', license: 'UP-852019004512', licenseExpiry: '2029-03-22', verificationStatus: 'Verified', proof: 'Passport', status: 'Active', createdAt: '2026-08-12' },
    { id: 'CUST-103', name: 'Amit Kumar', email: 'amit.kumar@example.com', phone: '9723456789', address: 'Plot 88 Highway Enclave, NH-19', license: 'DL-142020008765', licenseExpiry: '2030-11-19', verificationStatus: 'Pending', proof: 'Voter ID', status: 'Active', createdAt: '2026-08-15' },
    { id: 'CUST-104', name: 'Sneha Patel', email: 'sneha.patel@example.com', phone: '9988766554', address: '15 Krishna Nagar, Vrindavan', license: 'GJ-012018009988', licenseExpiry: '2032-05-30', verificationStatus: 'Verified', proof: 'Aadhaar Card', status: 'Active', createdAt: '2026-08-18' },
    { id: 'CUST-105', name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '9845123456', address: 'House 7, Cantt Road, Mathura', license: 'RJ-142017006543', licenseExpiry: '2028-12-05', verificationStatus: 'Verified', proof: 'Driving License', status: 'Active', createdAt: '2026-08-20' },
    { id: 'CUST-106', name: 'Ananya Roy', email: 'ananya.roy@example.com', phone: '9831098765', address: 'Flat 302 Regency Heights, Mathura', license: 'WB-022021003421', licenseExpiry: '2033-04-17', verificationStatus: 'Verified', proof: 'Aadhaar Card', status: 'Active', createdAt: '2026-08-22' },
    { id: 'CUST-107', name: 'Rohit Mehra', email: 'rohit.mehra@example.com', phone: '9711223344', address: '55 Express View, Highway Hub', license: 'DL-032022001199', licenseExpiry: '2031-09-25', verificationStatus: 'Verified', proof: 'Passport', status: 'Active', createdAt: '2026-08-25' }
  ];

  const INITIAL_BOOKINGS = [
    { id: 'BK-101', customerId: 'CUST-101', customer: 'Rahul Sharma', vehicleId: 'VH-01', vehicle: 'Hyundai Creta SX(O)', hub: 'Mathura Cantt', pickup: '2026-09-20', ret: '2026-09-24', days: 4, rate: 3200, amount: 12800, tax: 640, deposit: 5000, totalPayable: 13440, amountPaid: 13440, remarks: 'Family pilgrimage outstation trip', status: 'Confirmed', createdAt: '2026-09-15T10:00:00.000Z' },
    { id: 'BK-102', customerId: 'CUST-102', customer: 'Priya Verma', vehicleId: 'VH-15', vehicle: 'Honda City ZX CVT', hub: 'Mathura Junction', pickup: '2026-09-21', ret: '2026-09-23', days: 2, rate: 2600, amount: 5200, tax: 260, deposit: 4000, totalPayable: 5460, amountPaid: 5460, remarks: 'Executive official visit', status: 'Confirmed', createdAt: '2026-09-16T11:30:00.000Z' },
    { id: 'BK-103', customerId: 'CUST-103', customer: 'Amit Kumar', vehicleId: 'VH-02', vehicle: 'Mahindra Thar LX 4x4', hub: 'Highway Hub', pickup: '2026-09-25', ret: '2026-09-28', days: 3, rate: 3800, amount: 11400, tax: 570, deposit: 5000, totalPayable: 11970, amountPaid: 0, remarks: 'Offroad weekend tour', status: 'Pending Payment', createdAt: '2026-09-17T09:15:00.000Z' },
    { id: 'BK-104', customerId: 'CUST-104', customer: 'Sneha Patel', vehicleId: 'VH-27', vehicle: 'Maruti Suzuki Swift ZXi+', hub: 'Vrindavan Hub', pickup: '2026-09-18', ret: '2026-09-21', days: 3, rate: 1800, amount: 5400, tax: 270, deposit: 3000, totalPayable: 5670, amountPaid: 5670, remarks: 'Local temple commute', status: 'Confirmed', createdAt: '2026-09-16T14:20:00.000Z' },
    { id: 'BK-105', customerId: 'CUST-105', customer: 'Vikram Singh', vehicleId: 'VH-38', vehicle: 'Royal Enfield Classic 350', hub: 'Mathura Cantt', pickup: '2026-09-19', ret: '2026-09-21', days: 2, rate: 1200, amount: 2400, tax: 120, deposit: 2000, totalPayable: 2520, amountPaid: 2520, remarks: 'Braj darshan ride', status: 'Confirmed', createdAt: '2026-09-17T08:45:00.000Z' },
    { id: 'BK-106', customerId: 'CUST-106', customer: 'Ananya Roy', vehicleId: 'VH-16', vehicle: 'Hyundai Verna SX(O) Turbo', hub: 'Mathura Junction', pickup: '2026-09-22', ret: '2026-09-25', days: 3, rate: 2800, amount: 8400, tax: 420, deposit: 4000, totalPayable: 8820, amountPaid: 8820, remarks: 'Corporate client meeting', status: 'Confirmed', createdAt: '2026-09-18T16:00:00.000Z' },
    { id: 'BK-107', customerId: 'CUST-107', customer: 'Rohit Mehra', vehicleId: 'VH-04', vehicle: 'Toyota Fortuner Legender', hub: 'Highway Hub', pickup: '2026-09-20', ret: '2026-09-23', days: 3, rate: 5800, amount: 17400, tax: 870, deposit: 10000, totalPayable: 18270, amountPaid: 18270, remarks: 'VIP escort tour', status: 'Confirmed', createdAt: '2026-09-17T15:10:00.000Z' }
  ];

  const INITIAL_PAYMENTS = [
    { id: 'PAY-401', bookingId: 'BK-101', customerId: 'CUST-101', customer: 'Rahul Sharma', vehicle: 'Hyundai Creta SX(O)', method: 'UPI', amount: 13440, date: '2026-09-15', time: '10:30', utr: 'UPI-2026091500128', receiptNo: 'RCP-401', operatorConfirmed: true, status: 'Confirmed', createdAt: '2026-09-15T10:30:00.000Z' },
    { id: 'PAY-402', bookingId: 'BK-104', customerId: 'CUST-104', customer: 'Sneha Patel', vehicle: 'Maruti Suzuki Swift ZXi+', method: 'Card', amount: 5670, date: '2026-09-16', time: '11:45', utr: 'POS-2026091600540', receiptNo: 'RCP-402', operatorConfirmed: true, status: 'Confirmed', createdAt: '2026-09-16T11:45:00.000Z' },
    { id: 'PAY-403', bookingId: 'BK-105', customerId: 'CUST-105', customer: 'Vikram Singh', vehicle: 'Royal Enfield Classic 350', method: 'Cash', amount: 2520, date: '2026-09-17', time: '09:15', utr: 'CASH-REC-00240', receiptNo: 'RCP-403', operatorConfirmed: true, status: 'Confirmed', createdAt: '2026-09-17T09:15:00.000Z' },
    { id: 'PAY-404', bookingId: 'BK-102', customerId: 'CUST-102', customer: 'Priya Verma', vehicle: 'Honda City ZX CVT', method: 'UPI', amount: 5460, date: '2026-09-18', time: '14:20', utr: 'UPI-2026091800520', receiptNo: 'RCP-404', operatorConfirmed: true, status: 'Confirmed', createdAt: '2026-09-18T14:20:00.000Z' },
    { id: 'PAY-405', bookingId: 'BK-107', customerId: 'CUST-107', customer: 'Rohit Mehra', vehicle: 'Toyota Fortuner Legender', method: 'Card', amount: 18270, date: '2026-09-17', time: '16:10', utr: 'POS-2026091701650', receiptNo: 'RCP-405', operatorConfirmed: true, status: 'Confirmed', createdAt: '2026-09-17T16:10:00.000Z' },
    { id: 'PAY-406', bookingId: 'BK-106', customerId: 'CUST-106', customer: 'Ananya Roy', vehicle: 'Hyundai Verna SX(O) Turbo', method: 'Bank Transfer', amount: 8820, date: '2026-09-18', time: '18:05', utr: 'IMPS-2026091800840', receiptNo: 'RCP-406', operatorConfirmed: true, status: 'Confirmed', createdAt: '2026-09-18T18:05:00.000Z' }
  ];

  const INITIAL_RENTALS = [
    { id: 'RN-201', bookingId: 'BK-101', customer: 'Rahul Sharma', vehicleId: 'VH-01', vehicle: 'Hyundai Creta SX(O)', regNo: 'UP-85-AB-1234', pickupHub: 'Mathura Cantt', startDate: '2026-09-15', returnDate: '2026-09-19', actualReturnDate: '2026-09-19', startOdo: 24120, endOdo: 24650, fuel: '100% Full Tank', deposit: 5000, officer: 'Officer K. Singh', lateFee: 0, damageFee: 0, status: 'Returned', agreementNo: 'AGR-201' },
    { id: 'RN-202', bookingId: 'BK-104', customer: 'Sneha Patel', vehicleId: 'VH-27', vehicle: 'Maruti Suzuki Swift ZXi+', regNo: 'UP-85-SW-5678', pickupHub: 'Vrindavan Hub', startDate: '2026-09-16', returnDate: '2026-09-18', actualReturnDate: '2026-09-18', startOdo: 18450, endOdo: 18780, fuel: '75% Tank', deposit: 3000, officer: 'Officer R. Sharma', lateFee: 0, damageFee: 0, status: 'Returned', agreementNo: 'AGR-202' },
    { id: 'RN-203', bookingId: 'BK-105', customer: 'Vikram Singh', vehicleId: 'VH-38', vehicle: 'Royal Enfield Classic 350', regNo: 'UP-85-RE-9012', pickupHub: 'Mathura Cantt', startDate: '2026-09-14', returnDate: '2026-09-17', actualReturnDate: '2026-09-17', startOdo: 8900, endOdo: 9150, fuel: '100% Full Tank', deposit: 2000, officer: 'Officer K. Singh', lateFee: 0, damageFee: 0, status: 'Returned', agreementNo: 'AGR-203' },
    { id: 'RN-204', bookingId: 'BK-102', customer: 'Priya Verma', vehicleId: 'VH-15', vehicle: 'Honda City ZX CVT', regNo: 'UP-85-HC-3344', pickupHub: 'Mathura Junction', startDate: '2026-09-18', returnDate: '2026-09-21', actualReturnDate: '', startOdo: 31200, endOdo: null, fuel: '100% Full Tank', deposit: 4000, officer: 'Officer M. Verma', lateFee: 0, damageFee: 0, status: 'Active', agreementNo: 'AGR-204' },
    { id: 'RN-205', bookingId: 'BK-107', customer: 'Rohit Mehra', vehicleId: 'VH-04', vehicle: 'Toyota Fortuner Legender', regNo: 'UP-85-TF-9999', pickupHub: 'Highway Hub', startDate: '2026-09-17', returnDate: '2026-09-20', actualReturnDate: '', startOdo: 42100, endOdo: null, fuel: '100% Full Tank', deposit: 10000, officer: 'Officer S. Yadav', lateFee: 0, damageFee: 0, status: 'Active', agreementNo: 'AGR-205' },
    { id: 'RN-206', bookingId: 'BK-106', customer: 'Ananya Roy', vehicleId: 'VH-16', vehicle: 'Hyundai Verna SX(O) Turbo', regNo: 'UP-85-HV-5566', pickupHub: 'Mathura Junction', startDate: '2026-09-17', returnDate: '2026-09-20', actualReturnDate: '', startOdo: 19800, endOdo: null, fuel: '100% Full Tank', deposit: 4000, officer: 'Officer M. Verma', lateFee: 0, damageFee: 0, status: 'Active', agreementNo: 'AGR-206' }
  ];

  const INITIAL_MAINTENANCE = [
    { id: 'MT-301', vehicleId: 'VH-03', vehicle: 'Tata Harrier Fearless+', regNo: 'UP-85-TH-8899', type: 'Periodic Routine Service', workshop: 'Tata Authorized Service Mathura', date: '2026-09-17', completedDate: '', cost: 8500, description: 'Engine oil, fuel filter replacement & diagnostics', notes: 'Parts ordered', status: 'In Progress' },
    { id: 'MT-302', vehicleId: 'VH-38', vehicle: 'Royal Enfield Classic 350', regNo: 'UP-85-RE-9012', type: 'Clutch & Chain Tuning', workshop: 'Royal Enfield Service Hub Cantt', date: '2026-09-18', completedDate: '', cost: 1800, description: 'Clutch cable renewal and chain sprockets lubing', notes: 'Chain adjustment', status: 'In Progress' },
    { id: 'MT-303', vehicleId: 'VH-15', vehicle: 'Honda City ZX CVT', regNo: 'UP-85-HC-3344', type: 'Periodic Routine Service', workshop: 'Apex Honda Service Mathura', date: '2026-09-10', completedDate: '2026-09-12', cost: 4500, description: 'Synthetic engine oil and air filter replacement', notes: 'Road test OK', status: 'Completed' },
    { id: 'MT-304', vehicleId: 'VH-02', vehicle: 'Mahindra Thar LX 4x4', regNo: 'UP-85-CD-2021', type: 'Wheel Balancing & Alignment', workshop: 'Mahindra Offroad Garage Cantt', date: '2026-09-08', completedDate: '2026-09-09', cost: 3200, description: '4WD differential check & computerized wheel alignment', notes: 'Toe and camber aligned', status: 'Completed' }
  ];

  const INITIAL_AUDIT = [
    { id: 'AUD-001', action: 'System Initialization', category: 'SYSTEM', recordId: 'ALL', details: 'FleetDrive V3 Master Single-Source Data initialized with 45 fleet vehicles', timestamp: new Date().toISOString() },
    { id: 'AUD-002', action: 'Booking Created', category: 'BOOKING', recordId: 'BK-101', details: 'Booking created for Rahul Sharma (Hyundai Creta) - Status: Pending Payment', timestamp: '2026-09-15T10:00:00Z' },
    { id: 'AUD-003', action: 'Payment Confirmed', category: 'PAYMENT', recordId: 'PAY-401', details: 'Received Rs. 13,440 via UPI for BK-101. Booking automatically changed to Confirmed.', timestamp: '2026-09-15T10:30:00Z' },
    { id: 'AUD-004', action: 'Vehicle Handover Dispatched', category: 'RENTAL', recordId: 'RN-201', details: 'Vehicle handed over to Rahul Sharma on BK-101. Vehicle marked Rented.', timestamp: '2026-09-15T11:00:00Z' },
    { id: 'AUD-005', action: 'Vehicle Returned', category: 'RENTAL', recordId: 'RN-201', details: 'Vehicle UP-85-AB-1234 physically returned. Availability restored.', timestamp: '2026-09-19T17:00:00Z' }
  ];

  // Helper safe parser
  function safeJsonParse(str, fallback) {
    try {
      const res = JSON.parse(str);
      return res && typeof res === 'object' ? res : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // Master Data Store
  const FleetData = {
    // 1. Read Master Data with Automatic V2 Migration
    read: function () {
      let raw = localStorage.getItem(STORAGE_KEY_V3);
      if (!raw) {
        // Attempt migration from V2 if present
        let v2Raw = localStorage.getItem(STORAGE_KEY_V2);
        let v2Data = safeJsonParse(v2Raw, null);

        let data = {
          version: '3.0.0',
          vehicles: JSON.parse(JSON.stringify(INITIAL_VEHICLES)),
          customers: v2Data && Array.isArray(v2Data.customers) && v2Data.customers.length ? v2Data.customers : JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)),
          bookings: v2Data && Array.isArray(v2Data.bookings) && v2Data.bookings.length ? v2Data.bookings : JSON.parse(JSON.stringify(INITIAL_BOOKINGS)),
          payments: v2Data && Array.isArray(v2Data.payments) && v2Data.payments.length ? v2Data.payments : JSON.parse(JSON.stringify(INITIAL_PAYMENTS)),
          rentals: v2Data && Array.isArray(v2Data.rentals) && v2Data.rentals.length ? v2Data.rentals : JSON.parse(JSON.stringify(INITIAL_RENTALS)),
          maintenance: v2Data && Array.isArray(v2Data.maintenance) && v2Data.maintenance.length ? v2Data.maintenance : JSON.parse(JSON.stringify(INITIAL_MAINTENANCE)),
          auditLog: JSON.parse(JSON.stringify(INITIAL_AUDIT)),
          settings: {
            companyName: 'FleetDrive Rental & Fleet Services',
            address: 'NH-19 Mathura Cantt Central Hub, UP 281001',
            taxRatePercent: 5,
            currency: 'Rs.',
            lastBackup: localStorage.getItem(BACKUP_TIMESTAMP_KEY) || null
          }
        };

        // Harmonize V2 status logic (Strict 2 statuses)
        data.bookings.forEach(b => {
          if (b.status !== 'Confirmed') b.status = 'Pending Payment';
        });

        localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(data));
        const v2Subset = {
          bookings: data.bookings,
          payments: data.payments,
          customers: data.customers,
          rentals: data.rentals,
          maintenance: data.maintenance
        };
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(v2Subset));
        return data;
      }

      let data = safeJsonParse(raw, null);
      if (!data || !Array.isArray(data.vehicles)) {
        // Corrupted recovery fallback
        data = {
          version: '3.0.0',
          vehicles: JSON.parse(JSON.stringify(INITIAL_VEHICLES)),
          customers: JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)),
          bookings: JSON.parse(JSON.stringify(INITIAL_BOOKINGS)),
          payments: JSON.parse(JSON.stringify(INITIAL_PAYMENTS)),
          rentals: JSON.parse(JSON.stringify(INITIAL_RENTALS)),
          maintenance: JSON.parse(JSON.stringify(INITIAL_MAINTENANCE)),
          auditLog: JSON.parse(JSON.stringify(INITIAL_AUDIT)),
          settings: { companyName: 'FleetDrive System', taxRatePercent: 5, currency: 'Rs.' }
        };
        localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(data));
        const v2Subset = {
          bookings: data.bookings,
          payments: data.payments,
          customers: data.customers,
          rentals: data.rentals,
          maintenance: data.maintenance
        };
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(v2Subset));
      }
      return data;
    },

    // 2. Atomic Save & Event Broadcasting
    save: function (data, auditAction, auditDetails) {
      if (auditAction) {
        if (!Array.isArray(data.auditLog)) data.auditLog = [];
        data.auditLog.unshift({
          id: 'AUD-' + Date.now().toString().slice(-6),
          action: auditAction,
          category: auditAction.split(' ')[0].toUpperCase(),
          details: auditDetails || '',
          timestamp: new Date().toISOString()
        });
        if (data.auditLog.length > 100) data.auditLog = data.auditLog.slice(0, 100);
      }

      // Also sync backward compatible V2 key so legacy references still work
      const v2Subset = {
        bookings: data.bookings,
        payments: data.payments,
        customers: data.customers,
        rentals: data.rentals,
        maintenance: data.maintenance
      };
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(v2Subset));
      localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(data));

      // Broadcast Custom Event inside same window
      window.dispatchEvent(new CustomEvent('fleetdrive:data-changed', { detail: { action: auditAction } }));
    },

    // 3. ID Generation
    generateId: function (prefix) {
      return prefix + '-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
    },

    // 4. Dynamic Vehicle Status & Availability Engine
    // Single Source of Truth calculation: Never trusts static strings alone
    calculateVehicleStatus: function (vehicleId, db) {
      const data = db || this.read();
      const veh = data.vehicles.find(v => v.id === vehicleId);
      if (!veh) return 'Unknown';
      if (veh.archived) return 'Out of Service';

      // 1. Is it currently under maintenance?
      const inMaint = data.maintenance.some(m =>
        m.status !== 'Completed' && (
          m.vehicleId === vehicleId ||
          (veh.regNo && m.regNo && m.regNo.toLowerCase() === veh.regNo.toLowerCase()) ||
          (m.vehicle && veh.name && m.vehicle.toLowerCase().includes(veh.name.toLowerCase()))
        )
      );
      if (inMaint) return 'Under Maintenance';

      // 2. Is it currently on an active rental (on road)?
      const onRoad = data.rentals.some(r =>
        (r.status === 'Active' || r.status === 'On Road') && (
          r.vehicleId === vehicleId ||
          (veh.regNo && r.regNo && r.regNo.toLowerCase() === veh.regNo.toLowerCase()) ||
          (r.vehicle && veh.name && r.vehicle.toLowerCase().includes(veh.name.toLowerCase()))
        )
      );
      if (onRoad) return 'Rented';

      // 3. Is it booked for today/overlapping period?
      const todayStr = new Date().toISOString().slice(0, 10);
      const isReserved = data.bookings.some(b =>
        b.status === 'Confirmed' &&
        (b.vehicleId === vehicleId || (b.vehicle && veh.name && b.vehicle.toLowerCase().includes(veh.name.toLowerCase()))) &&
        b.pickup <= todayStr && b.ret >= todayStr
      );
      if (isReserved) return 'Reserved';

      return 'Available';
    },

    // Check if a vehicle can be booked for a specific date window
    checkVehicleAvailabilityForDates: function (vehicleId, pickupDate, returnDate, excludeBookingId) {
      const d = this.read();
      const veh = d.vehicles.find(v => v.id === vehicleId || (v.name && v.name.toLowerCase().includes(vehicleId.toLowerCase())));
      if (!veh) return { available: false, reason: 'Vehicle not found in fleet catalog.' };

      if (veh.archived) return { available: false, reason: 'This vehicle is archived / Out of Service.' };

      // 1. Check Maintenance
      const underMaint = d.maintenance.some(m =>
        m.status !== 'Completed' && (
          m.vehicleId === veh.id ||
          (m.vehicle && m.vehicle.toLowerCase().includes(veh.name.toLowerCase()))
        )
      );
      if (underMaint) {
        return { available: false, reason: `Vehicle "${veh.name}" is currently Under Maintenance and cannot be booked.` };
      }

      // 2. Check Overlapping Bookings (Confirmed or Pending Payment)
      const collision = d.bookings.find(b => {
        if (excludeBookingId && b.id === excludeBookingId) return false;
        const sameVeh = (b.vehicleId === veh.id) || (b.vehicle && veh.name && b.vehicle.toLowerCase().includes(veh.name.toLowerCase()));
        if (!sameVeh) return false;

        // Date overlap check: NOT (b.ret < pickup || b.pickup > return)
        const overlap = !(b.ret < pickupDate || b.pickup > returnDate);
        return overlap;
      });

      if (collision) {
        return {
          available: false,
          reason: `Vehicle "${veh.name}" already has an active reservation (${collision.id} from ${collision.pickup} to ${collision.ret}). Overlapping bookings are blocked.`
        };
      }

      return { available: true, vehicle: veh };
    },

    // 5. Booking Workflow (Strictly 2 Statuses: Pending Payment / Confirmed)
    createBooking: function (payload) {
      const d = this.read();

      // Overlap check
      const check = this.checkVehicleAvailabilityForDates(payload.vehicleId || payload.vehicle, payload.pickup, payload.ret);
      if (!check.available) {
        throw new Error(check.reason);
      }

      const veh = check.vehicle;
      const days = Math.max(1, Math.ceil((new Date(payload.ret + 'T00:00:00') - new Date(payload.pickup + 'T00:00:00')) / 86400000));
      const dailyRate = Number(veh.pricePerDay) || 1000;
      const baseAmount = days * dailyRate;
      const taxRate = d.settings.taxRatePercent || 5;
      const taxAmount = Math.round((baseAmount * taxRate) / 100);
      const depositAmount = payload.deposit ? Number(payload.deposit) : (veh.category === 'SUV' ? 5000 : veh.category === 'Two-Wheeler' ? 2000 : 3000);
      const totalPayable = baseAmount + taxAmount;

      const booking = {
        id: this.generateId('BK'),
        customerId: payload.customerId || '',
        customer: payload.customer,
        vehicleId: veh.id,
        vehicle: veh.name,
        hub: payload.hub,
        pickup: payload.pickup,
        ret: payload.ret,
        days: days,
        rate: dailyRate,
        baseAmount: baseAmount,
        tax: taxAmount,
        deposit: depositAmount,
        totalPayable: totalPayable,
        amount: totalPayable,
        amountPaid: 0,
        remarks: payload.remarks || '',
        // STRICT REQUIREMENT: Initial status is Pending Payment
        status: 'Pending Payment',
        createdAt: new Date().toISOString()
      };

      d.bookings.push(booking);
      this.save(d, 'Booking Created', `Booking ${booking.id} created for ${booking.customer} - Status: Pending Payment`);
      return booking;
    },

    // 6. Payment Confirmation Workflow (The SOLE trigger that makes a booking Confirmed)
    confirmPayment: function (payload) {
      const d = this.read();
      const bIndex = d.bookings.findIndex(b => b.id.toUpperCase() === payload.bookingId.trim().toUpperCase());
      if (bIndex === -1) {
        throw new Error(`Booking ID "${payload.bookingId}" not found.`);
      }

      const b = d.bookings[bIndex];
      if (b.status === 'Confirmed') {
        throw new Error(`Booking ${b.id} is already confirmed and fully paid. Duplicate payment blocked.`);
      }

      const receivedAmount = Number(payload.amount);
      if (receivedAmount <= 0) {
        throw new Error('Payment amount must be greater than zero.');
      }

      const payRecord = {
        id: this.generateId('PAY'),
        bookingId: b.id,
        customerId: b.customerId || '',
        customer: b.customer,
        vehicle: b.vehicle,
        method: payload.method,
        amount: receivedAmount,
        date: payload.date || new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        utr: payload.utr || 'OFFLINE-' + Date.now(),
        receiptNo: 'RCP-' + Date.now().toString().slice(-5),
        operatorConfirmed: true,
        notes: payload.notes || 'Manually confirmed by operator at counter',
        status: 'Confirmed',
        createdAt: new Date().toISOString()
      };

      d.payments.push(payRecord);

      // Requirement 7: Change booking status to Confirmed
      b.amountPaid = (Number(b.amountPaid) || 0) + receivedAmount;
      b.status = 'Confirmed';
      b.confirmedAt = new Date().toISOString();

      this.save(d, 'Payment Confirmed', `Payment of Rs. ${receivedAmount.toLocaleString('en-IN')} confirmed for Booking ${b.id}. Booking is now Confirmed.`);
      const result = Object.assign({}, payRecord, { payment: payRecord, booking: b });
      return result;
    },

    // 7. Rental Handover Workflow
    dispatchRental: function (payload) {
      const d = this.read();
      const b = d.bookings.find(item => item.id.toUpperCase() === payload.bookingId.trim().toUpperCase());
      if (!b) throw new Error(`Booking "${payload.bookingId}" not found.`);

      // Requirement 5: Handover ONLY if Confirmed. Block if Pending Payment.
      if (b.status !== 'Confirmed') {
        throw new Error(`Rental handover is LOCKED. Booking ${b.id} is Pending Payment. Payment must be confirmed first.`);
      }

      // Check if vehicle is in maintenance
      const veh = d.vehicles.find(v => v.id === b.vehicleId || (v.name && v.name.toLowerCase().includes(b.vehicle.toLowerCase())));
      if (veh) {
        const inMaint = d.maintenance.some(m => m.status !== 'Completed' && (m.vehicleId === veh.id || m.vehicle.toLowerCase().includes(veh.name.toLowerCase())));
        if (inMaint) throw new Error(`Vehicle "${veh.name}" is currently Under Maintenance. Handover is blocked.`);
      }

      // Prevent duplicate rental dispatch
      const existingRental = d.rentals.find(r => r.bookingId === b.id && (r.status === 'Active' || r.status === 'On Road'));
      if (existingRental) {
        throw new Error(`Rental handover already active for Booking ${b.id} (Rental ID: ${existingRental.id}).`);
      }

      const rental = {
        id: this.generateId('RN'),
        bookingId: b.id,
        customerId: b.customerId || '',
        customer: b.customer,
        vehicleId: veh ? veh.id : '',
        vehicle: veh ? veh.name : b.vehicle,
        regNo: veh ? veh.regNo : '',
        pickupHub: b.hub,
        startDate: payload.startDate || b.pickup,
        returnDate: payload.returnDate || b.ret,
        actualReturnDate: '',
        startOdo: Number(payload.odo) || (veh ? veh.currentOdo : 0),
        endOdo: null,
        fuel: payload.fuel || '100% Full Tank',
        deposit: Number(payload.deposit) || b.deposit || 3000,
        officer: payload.officer || 'Duty Officer',
        lateFee: 0,
        damageFee: 0,
        conditionNotes: payload.condition || 'Clean, roadworthy, no visible defects',
        status: 'Active',
        agreementNo: 'AGR-' + Date.now().toString().slice(-5),
        createdAt: new Date().toISOString()
      };

      d.rentals.push(rental);

      // Update vehicle status in catalog
      if (veh) {
        veh.status = 'Rented';
        if (payload.odo) veh.currentOdo = Number(payload.odo);
      }

      this.save(d, 'Rental Dispatched', `Rental ${rental.id} dispatched for Booking ${b.id} (${rental.vehicle}). Vehicle status is now Rented.`);
      return rental;
    },

    // 8. Vehicle Return Workflow
    returnRental: function (rentalIdOrBookingId, payload) {
      const d = this.read();
      const p = (typeof rentalIdOrBookingId === 'object') ? rentalIdOrBookingId : (payload || {});
      const targetQuery = (typeof rentalIdOrBookingId === 'string' ? rentalIdOrBookingId : (p.rentalId || p.bookingId || p.id || '')).trim().toUpperCase();

      const r = d.rentals.find(item => item.id.toUpperCase() === targetQuery || (item.bookingId && item.bookingId.toUpperCase() === targetQuery));
      if (!r) throw new Error(`Active rental not found for ID "${targetQuery}".`);

      if (r.status === 'Returned') {
        throw new Error(`Rental ${r.id} has already been marked as Returned.`);
      }

      const todayStr = p.actualReturnDate || new Date().toISOString().slice(0, 10);
      r.status = 'Returned';
      r.actualReturnDate = todayStr;
      if (p.endOdo || p.finalOdo) {
        r.endOdo = Number(p.endOdo || p.finalOdo);
        if (r.startOdo && r.endOdo >= r.startOdo) {
          r.distanceDriven = r.endOdo - r.startOdo;
        }
      }

      // Late fee calculation: if return date > scheduled return date
      let lateFee = 0;
      if (r.returnDate && todayStr > r.returnDate) {
        const daysLate = Math.max(1, Math.ceil((new Date(todayStr + 'T00:00:00') - new Date(r.returnDate + 'T00:00:00')) / 86400000));
        // Retrieve vehicle daily rate
        const b = d.bookings.find(bk => bk.id === r.bookingId);
        const rate = b ? Number(b.rate) : 1500;
        lateFee = daysLate * rate * 1.5; // 1.5x standard rate for late days
      }
      r.lateFee = lateFee;
      r.damageFee = Number(p.damageFee) || 0;
      r.returnNotes = p.notes || p.returnNotes || 'Returned and inspected';
      r.returnedAt = new Date().toISOString();

      // Restore vehicle status in catalog (provided it's not under maintenance)
      const veh = d.vehicles.find(v => v.id === r.vehicleId || (v.regNo && v.regNo === r.regNo));
      if (veh) {
        if (p.endOdo || p.finalOdo) veh.currentOdo = Number(p.endOdo || p.finalOdo);
        const inMaint = d.maintenance.some(m => m.status !== 'Completed' && (m.vehicleId === veh.id || m.vehicle.includes(veh.name)));
        veh.status = inMaint ? 'Under Maintenance' : 'Available';
      }

      // Requirement 7: DO NOT change booking status! Booking status remains Confirmed.
      this.save(d, 'Vehicle Returned', `Rental ${r.id} marked Returned on ${todayStr}. Vehicle availability recalculated.`);
      const returnObj = Object.assign({}, r, { rental: r, lateFee: lateFee });
      return returnObj;
    },

    // 9. Maintenance Workflow
    saveMaintenance: function (payload) {
      const d = this.read();
      const existingId = payload.id ? payload.id.trim() : '';

      // Clean vehicle name & plate
      const veh = d.vehicles.find(v => v.id === payload.vehicleId || (v.name && v.name.toLowerCase().includes(payload.vehicle.toLowerCase())));
      const vName = veh ? veh.name : payload.vehicle;
      const regNo = veh ? veh.regNo : (payload.vehicle.match(/\(([^)]+)\)/)?.[1] || '');

      if (existingId) {
        // UPDATE EXISTING RECORD
        const m = d.maintenance.find(item => item.id === existingId);
        if (!m) throw new Error(`Maintenance record "${existingId}" not found.`);

        m.type = payload.type;
        m.workshop = payload.workshop;
        m.date = payload.date;
        m.cost = Number(payload.cost) || 0;
        m.status = payload.status;
        m.description = payload.description;
        m.notes = payload.notes || payload.description;

        if (payload.status === 'Completed') {
          m.completedDate = payload.completedDate || new Date().toISOString().slice(0, 10);
        }

        // Recalculate vehicle status
        if (veh) {
          veh.status = this.calculateVehicleStatus(veh.id, d);
        }

        this.save(d, 'Maintenance Updated', `Maintenance record ${m.id} updated. Status: ${m.status}`);
        return m;
      }

      // CREATE NEW RECORD
      const mId = this.generateId('MT');
      const mRecord = {
        id: mId,
        vehicleId: veh ? veh.id : '',
        vehicle: vName,
        regNo: regNo,
        type: payload.type,
        workshop: payload.workshop,
        date: payload.date || new Date().toISOString().slice(0, 10),
        completedDate: payload.status === 'Completed' ? (payload.completedDate || payload.date) : '',
        cost: Number(payload.cost) || 0,
        description: payload.description,
        notes: payload.notes || payload.description,
        status: payload.status || 'In Progress',
        createdAt: new Date().toISOString()
      };

      d.maintenance.push(mRecord);

      // If In Progress, vehicle status becomes Under Maintenance
      if (veh) {
        veh.status = payload.status === 'Completed' ? this.calculateVehicleStatus(veh.id, d) : 'Under Maintenance';
      }

      this.save(d, 'Maintenance Logged', `Maintenance ${mRecord.id} logged for ${vName}. Vehicle marked Under Maintenance.`);
      return mRecord;
    },

    // 10. Customer Registration
    registerCustomer: function (payload) {
      const d = this.read();
      const phone = String(payload.phone || '').trim();
      const email = String(payload.email || '').trim().toLowerCase();

      if (!/^[6-9]\d{9}$/.test(phone)) {
        throw new Error('Enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      }

      if (d.customers.some(c => c.email && c.email.toLowerCase() === email)) {
        throw new Error(`Customer with email "${email}" is already registered.`);
      }

      const cust = {
        id: this.generateId('CUST'),
        name: payload.name.trim(),
        email: email,
        phone: phone,
        address: payload.address || 'Mathura, UP',
        license: payload.license ? payload.license.trim() : 'DL-PENDING',
        licenseExpiry: payload.licenseExpiry || '2030-01-01',
        verificationStatus: 'Verified',
        proof: payload.proof || 'Aadhaar Card',
        status: 'Active',
        createdAt: new Date().toISOString()
      };

      d.customers.push(cust);
      this.save(d, 'Customer Registered', `New customer ${cust.name} registered (ID: ${cust.id})`);
      return cust;
    },

    // 11. Add / Update Vehicle
    saveVehicle: function (payload) {
      const d = this.read();
      if (payload.regNo) {
        const cleanReg = payload.regNo.trim().toUpperCase();
        const dup = d.vehicles.find(item => item.id !== payload.id && item.regNo && item.regNo.trim().toUpperCase() === cleanReg);
        if (dup) {
          throw new Error(`Vehicle with registration number "${cleanReg}" already exists (${dup.name}).`);
        }
      }

      if (payload.rate !== undefined && (isNaN(payload.rate) || Number(payload.rate) <= 0)) {
        throw new Error('Daily rental rate must be a positive number.');
      }
      if (payload.pricePerDay !== undefined && (isNaN(payload.pricePerDay) || Number(payload.pricePerDay) <= 0)) {
        throw new Error('Daily rental rate must be a positive number.');
      }

      const dailyPrice = Number(payload.rate || payload.pricePerDay || 1000);

      if (payload.id) {
        const v = d.vehicles.find(item => item.id === payload.id);
        if (!v) throw new Error(`Vehicle ${payload.id} not found.`);
        Object.assign(v, payload);
        v.rate = dailyPrice;
        v.pricePerDay = dailyPrice;
        this.save(d, 'Vehicle Updated', `Vehicle ${v.id} (${v.name}) updated.`);
        return v;
      }

      const newId = 'VH-' + String(d.vehicles.length + 1).padStart(2, '0');
      const newVeh = Object.assign({
        id: newId,
        rate: dailyPrice,
        pricePerDay: dailyPrice,
        status: 'Available',
        archived: false,
        image: 'images/image.png'
      }, payload);
      newVeh.rate = dailyPrice;
      newVeh.pricePerDay = dailyPrice;

      d.vehicles.push(newVeh);
      this.save(d, 'Vehicle Added', `New vehicle ${newVeh.id} (${newVeh.name}) added to fleet.`);
      return newVeh;
    },

    // 12. Backup & Restore (JSON & CSV)
    exportBackupJSON: function () {
      const d = this.read();
      d.settings.lastBackup = new Date().toISOString();
      localStorage.setItem(BACKUP_TIMESTAMP_KEY, d.settings.lastBackup);
      this.save(d);

      const jsonStr = JSON.stringify(d, null, 2);
      if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && document.body && document.createElement) {
        try {
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `FleetDrive_Backup_${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          // headless fallback
        }
      }
      return jsonStr;
    },

    importBackupJSON: function (jsonStr) {
      const parsed = safeJsonParse(jsonStr, null);
      if (!parsed || !Array.isArray(parsed.vehicles) || !Array.isArray(parsed.bookings)) {
        throw new Error('Invalid FleetDrive JSON backup file structure.');
      }

      // Create pre-restore emergency snapshot
      const current = this.read();
      localStorage.setItem('fleetdrive_pre_restore_snapshot', JSON.stringify(current));

      parsed.version = '3.0.0';
      if (!parsed.settings) parsed.settings = {};
      parsed.settings.lastBackup = new Date().toISOString();

      localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(parsed));
      this.save(parsed, 'Data Restored', 'Complete database restored from JSON backup file.');
      return {
        success: true,
        counts: {
          vehicles: parsed.vehicles.length,
          bookings: parsed.bookings.length,
          payments: parsed.payments ? parsed.payments.length : 0,
          rentals: parsed.rentals ? parsed.rentals.length : 0,
          maintenance: parsed.maintenance ? parsed.maintenance.length : 0
        }
      };
    },

    exportModuleCSV: function (moduleName) {
      const d = this.read();
      let rows = [];
      const mName = String(moduleName || '').toLowerCase();
      let filename = `FleetDrive_${moduleName}_${new Date().toISOString().slice(0, 10)}.csv`;

      if (mName === 'bookings') {
        rows.push(['Booking ID', 'Customer', 'Vehicle', 'Hub', 'Pickup Date', 'Return Date', 'Days', 'Amount', 'Status']);
        d.bookings.forEach(b => rows.push([b.id, b.customer, b.vehicle, b.hub, b.pickup, b.ret, b.days, b.amount, b.status]));
      } else if (mName === 'payments') {
        rows.push(['Payment ID', 'Booking ID', 'Customer', 'Vehicle', 'Method', 'Amount', 'Date', 'UTR', 'Status']);
        d.payments.forEach(p => rows.push([p.id, p.bookingId, p.customer, p.vehicle, p.method, p.amount, p.date, p.utr, p.status]));
      } else if (mName === 'rentals') {
        rows.push(['Rental ID', 'Booking ID', 'Customer', 'Vehicle', 'Start Date', 'Return Date', 'Actual Return', 'Status', 'Deposit', 'Late Fee']);
        d.rentals.forEach(r => rows.push([r.id, r.bookingId, r.customer, r.vehicle, r.startDate, r.returnDate, r.actualReturnDate, r.status, r.deposit, r.lateFee || 0]));
      } else if (mName === 'vehicles') {
        rows.push(['Vehicle ID', 'Name', 'Category', 'Registration', 'Daily Price', 'Odometer', 'Status']);
        d.vehicles.forEach(v => rows.push([v.id, v.name, v.category, v.regNo, v.pricePerDay || v.rate, v.currentOdo, this.calculateVehicleStatus(v.id, d)]));
      } else if (mName === 'customers') {
        rows.push(['Customer ID', 'Name', 'Email', 'Phone', 'License', 'Status']);
        d.customers.forEach(c => rows.push([c.id, c.name, c.email, c.phone, c.license, c.status]));
      } else if (mName === 'maintenance') {
        rows.push(['Maintenance ID', 'Vehicle', 'Service Type', 'Workshop', 'Date Sent', 'Completed Date', 'Cost', 'Status']);
        d.maintenance.forEach(m => rows.push([m.id, m.vehicle, m.type, m.workshop, m.date, m.completedDate, m.cost, m.status]));
      }

      const csvContent = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && document.body && document.createElement) {
        try {
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          // headless fallback
        }
      }
      return csvContent;
    },

    // 13. Dynamic System Statistics for Home Dashboard & Modules
    getSystemStats: function () {
      const d = this.read();
      const totalVehicles = d.vehicles.length;

      let underMaint = 0;
      let onRoad = 0;
      let reserved = 0;
      let available = 0;

      d.vehicles.forEach(v => {
        const st = this.calculateVehicleStatus(v.id, d);
        if (st === 'Under Maintenance') underMaint++;
        else if (st === 'Rented') onRoad++;
        else if (st === 'Reserved') reserved++;
        else if (st === 'Available') available++;
      });

      const confirmedBookings = d.bookings.filter(b => b.status === 'Confirmed').length;
      const pendingBookings = d.bookings.filter(b => b.status === 'Pending Payment').length;

      const totalPaymentsReceived = d.payments
        .filter(p => p.status === 'Confirmed')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const totalReceivable = d.bookings
        .filter(b => b.status === 'Confirmed')
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

      const outstandingAmount = Math.max(0, totalReceivable - totalPaymentsReceived);

      const totalMaintenanceExpenses = d.maintenance
        .reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

      return {
        totalVehicles,
        availableVehicles: available,
        reservedVehicles: reserved,
        rentedVehicles: onRoad,
        underMaintenance: underMaint,
        totalBookings: d.bookings.length,
        activeBookings: confirmedBookings,
        pendingPayments: pendingBookings,
        pendingPaymentsCount: pendingBookings,
        confirmedBookings: confirmedBookings,
        confirmedBookingsCount: confirmedBookings,
        totalPaymentsReceived: totalPaymentsReceived,
        totalRevenue: totalPaymentsReceived,
        outstandingAmount: outstandingAmount,
        maintenanceExpenses: totalMaintenanceExpenses,
        netRevenue: totalPaymentsReceived - totalMaintenanceExpenses
      };
    }
  };

  // Expose to window
  window.FleetData = FleetData;

  // Initialize on script load
  FleetData.read();

  // Storage listener for cross-tab synchronization
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY_V3 || e.key === STORAGE_KEY_V2) {
      window.dispatchEvent(new CustomEvent('fleetdrive:data-changed', { detail: { action: 'Cross-Tab Storage Sync' } }));
    }
  });

})(typeof window !== 'undefined' ? window : this);

// Fills the database with demo data. Run with: npm run seed
// WARNING: this deletes everything in the foodloop database first.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const FoodListing = require('../src/models/FoodListing');
const ClaimRequest = require('../src/models/ClaimRequest');
const Pickup = require('../src/models/Pickup');
const Notification = require('../src/models/Notification');
const Counter = require('../src/models/Counter');

const PASSWORD = 'password123';

// Helpers for times relative to "now", so the demo always looks fresh.
const hours = (n) => new Date(Date.now() + n * 60 * 60 * 1000);
const mins = (n) => new Date(Date.now() + n * 60 * 1000);
const days = (n) => hours(n * 24);

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}), FoodListing.deleteMany({}), ClaimRequest.deleteMany({}),
    Pickup.deleteMany({}), Notification.deleteMany({}), Counter.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const mk = (name, email, role, organization, phone, verificationStatus = 'approved') =>
    User.create({ name, email, role, organization, verificationStatus, phone, passwordHash });

  // ---- Users -------------------------------------------------------------
  const admin = await mk('Campus Admin', 'admin@foodloop.test', 'admin', 'FoodLoop', '9000000001');
  const donor = await mk('Main Block Canteen', 'canteen@foodloop.test', 'donor', 'Main Block Canteen', '9000000002');
  const ananya = await mk('Ananya Rao', 'ananya@foodloop.test', 'recipient', 'Asha Night Shelter', '9000000003');
  const farhan = await mk('Farhan Sheikh', 'farhan@foodloop.test', 'recipient', 'Boys Hostel C Mess', '9000000004');
  const kiran = await mk('Kiran Kumar', 'kiran@foodloop.test', 'volunteer', 'NSS Unit 2', '9000000005');
  const meera = await mk('Meera Nair', 'meera@foodloop.test', 'volunteer', 'NSS Unit 2', '9000000006');
  await mk('Rohit Verma', 'rohit@foodloop.test', 'recipient', 'Hope Foundation', '9000000007', 'pending');

  // ---- Listings (created one by one so token numbers are in order) --------
  const base = { donorId: donor._id, location: 'Main Block Canteen, Counter 2' };
  const L = (data) => FoodListing.create({ ...base, ...data });

  // 1. Completed and delivered (two days ago)
  const pulao = await L({
    title: 'Veg Pulao with Raita', description: 'Lunch service surplus, packed hot.',
    quantity: 30, unit: 'plates', reservedQuantity: 30, foodType: 'veg',
    allergenNotes: 'Contains dairy (raita).', preparedAt: days(-2), pickupDeadline: hours(-44), status: 'completed',
  });
  // 2. Completed and delivered (yesterday)
  const idli = await L({
    title: 'Idli Sambar', description: 'Breakfast surplus. Sambar packed separately.',
    quantity: 40, unit: 'plates', reservedQuantity: 40, foodType: 'veg',
    allergenNotes: 'None declared.', preparedAt: days(-1), pickupDeadline: hours(-20), status: 'completed',
  });
  // 3. Available, plenty of time, partly reserved
  const biryani = await L({
    title: 'Chicken Biryani', description: "From today's lunch. Packed in foil boxes with salan.",
    quantity: 20, unit: 'boxes', reservedQuantity: 8, foodType: 'non-veg',
    allergenNotes: 'Contains nuts (cashew) and dairy.', preparedAt: hours(-1), pickupDeadline: hours(4), status: 'available',
  });
  // 4. Available, closing soon (under 1 hour)
  const sandwich = await L({
    title: 'Veg Grilled Sandwiches', description: 'Evening snack counter surplus.',
    quantity: 12, unit: 'packets', reservedQuantity: 0, foodType: 'veg',
    allergenNotes: 'Contains gluten and dairy (cheese).', preparedAt: hours(-2), pickupDeadline: mins(45), status: 'available',
  });
  // 5. Available, very urgent (under 15 minutes)
  await L({
    title: 'Samosa and Chutney', description: 'Tea-time batch, still warm.',
    quantity: 25, unit: 'plates', reservedQuantity: 0, foodType: 'veg',
    allergenNotes: 'Contains gluten. Fried in shared oil.', preparedAt: hours(-3), pickupDeadline: mins(12), status: 'available',
  });
  // 6. Fully reserved
  const thali = await L({
    title: 'Mixed Lunch Thali', description: 'Rice, dal, sabzi, egg curry and roti.',
    quantity: 10, unit: 'plates', reservedQuantity: 10, foodType: 'mixed',
    allergenNotes: 'Contains egg, gluten and dairy.', preparedAt: hours(-2), pickupDeadline: hours(2), status: 'fully_reserved',
  });
  // 7. Expired (nobody collected it in time)
  await L({
    title: 'Curd Rice', description: "Yesterday's dinner surplus.",
    quantity: 15, unit: 'boxes', reservedQuantity: 0, foodType: 'veg',
    allergenNotes: 'Contains dairy.', preparedAt: hours(-30), pickupDeadline: hours(-24), status: 'expired',
  });
  // 8. Available, large quantity by weight
  const dal = await L({
    title: 'Dal Tadka and Jeera Rice', description: 'Bulk surplus in steel containers. Bring your own vessels.',
    quantity: 8, unit: 'kg', reservedQuantity: 0, foodType: 'veg',
    allergenNotes: 'None declared.', preparedAt: mins(-40), pickupDeadline: hours(6), status: 'available',
  });

  // ---- Claims --------------------------------------------------------------
  const C = (listing, recipient, requestedQuantity, status, extra = {}) =>
    ClaimRequest.create({ listingId: listing._id, recipientId: recipient._id, requestedQuantity, status, ...extra });

  const cPulao = await C(pulao, ananya, 30, 'approved', { note: 'For the night shelter dinner.', decidedAt: hours(-47), createdAt: hours(-47.5) });
  const cIdli = await C(idli, farhan, 40, 'approved', { note: 'Hostel breakfast.', decidedAt: hours(-23), createdAt: hours(-23.5) });
  const cBiryani = await C(biryani, ananya, 8, 'approved', { note: 'We can collect by 3 PM.', decidedAt: mins(-30), createdAt: mins(-40) });
  await C(biryani, farhan, 5, 'pending', { note: 'For 5 students staying back.' });
  await C(sandwich, ananya, 6, 'pending', { note: '', createdAt: mins(-12) });
  // 6 + 8 = 14 but only 12 packets exist: approve one of these two and the
  // other can no longer be approved (the over-allocation demo).
  await C(sandwich, farhan, 8, 'pending', { note: 'Night study hall, about 8 of us.', createdAt: mins(-6) });
  const cThali = await C(thali, farhan, 10, 'approved', { note: 'Evening study group.', decidedAt: mins(-50), createdAt: mins(-60) });
  await C(dal, farhan, 3, 'rejected', { note: 'Need it by noon.', decidedAt: mins(-20), createdAt: mins(-30) });
  await C(dal, ananya, 2, 'cancelled', { note: '', createdAt: mins(-35), cancelledAt: mins(-25) });

  // ---- Pickups -------------------------------------------------------------
  await Pickup.create({ claimRequestId: cPulao._id, volunteerId: kiran._id, pickupStatus: 'delivered', assignedAt: hours(-47), pickedUpAt: hours(-46), deliveredAt: hours(-45) });
  await Pickup.create({ claimRequestId: cIdli._id, volunteerId: meera._id, pickupStatus: 'delivered', assignedAt: hours(-23), pickedUpAt: hours(-22), deliveredAt: hours(-21) });
  await Pickup.create({ claimRequestId: cBiryani._id, volunteerId: kiran._id, pickupStatus: 'assigned', assignedAt: mins(-25) });
  await Pickup.create({ claimRequestId: cThali._id, volunteerId: meera._id, pickupStatus: 'picked_up', assignedAt: mins(-45), pickedUpAt: mins(-15) });

  // ---- Notifications ---------------------------------------------------------
  await Notification.insertMany([
    { userId: donor._id, type: 'claim_submitted', message: 'Farhan Sheikh requested 5 boxes of Chicken Biryani.' },
    { userId: donor._id, type: 'claim_submitted', message: 'Ananya Rao requested 6 packets of Veg Grilled Sandwiches.' },
    { userId: donor._id, type: 'claim_submitted', message: 'Farhan Sheikh requested 8 packets of Veg Grilled Sandwiches.' },
    { userId: ananya._id, type: 'claim_approved', message: 'Your request for 8 boxes of Chicken Biryani was approved.' },
    { userId: ananya._id, type: 'volunteer_assigned', message: 'Kiran Kumar will collect your Chicken Biryani.' },
    { userId: farhan._id, type: 'claim_rejected', message: 'Your request for Dal Tadka and Jeera Rice was not approved.' },
    { userId: kiran._id, type: 'volunteer_assigned', message: 'New pickup: 8 boxes of Chicken Biryani for Ananya Rao.' },
    { userId: farhan._id, type: 'delivered', message: 'Idli Sambar (40 plates) was delivered.', isRead: true },
  ]);

  console.log('\nSeed complete. All accounts use the password:', PASSWORD);
  console.table([
    { role: 'admin', email: admin.email },
    { role: 'donor', email: donor.email },
    { role: 'recipient', email: ananya.email },
    { role: 'recipient', email: farhan.email },
    { role: 'volunteer', email: kiran.email },
    { role: 'volunteer', email: meera.email },
    { role: 'recipient (pending)', email: 'rohit@foodloop.test' },
  ]);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

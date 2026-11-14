// Small helpers that keep a listing's status in line with the business rules.
const FoodListing = require('../models/FoodListing');

// Rule 3: a listing whose pickup deadline has passed is expired.
//
// Rather than running a background timer, we "sweep" just before any read:
// one updateMany marks every overdue open listing as expired. This keeps the
// logic in one place and needs no scheduler, which is easy to explain.
//
// Only "available" listings are swept. A fully reserved listing has already
// been handed out to approved requests and its pickups carry on; if one of
// those requests is cancelled the listing goes back to "available" (rule 2)
// and the next sweep expires it if the deadline has passed.
async function expireOverdueListings() {
  await FoodListing.updateMany(
    { status: 'available', pickupDeadline: { $lte: new Date() } },
    { $set: { status: 'expired' } }
  );
}

// Rule 2: reservedQuantity === quantity means "fully_reserved".
// Used after a listing's quantity is edited. Closed listings keep their status.
function openStatusFor(listing) {
  if (listing.status === 'expired' || listing.status === 'completed') return listing.status;
  if (listing.pickupDeadline <= new Date()) return 'expired';
  return listing.reservedQuantity >= listing.quantity ? 'fully_reserved' : 'available';
}

module.exports = { expireOverdueListings, openStatusFor };

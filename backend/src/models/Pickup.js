const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema(
  {
    claimRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClaimRequest', required: true, index: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pickupStatus: {
      type: String,
      enum: ['assigned', 'picked_up', 'delivered', 'cancelled'],
      default: 'assigned',
    },
    assignedAt: { type: Date, default: Date.now },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pickup', pickupSchema);

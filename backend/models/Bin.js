const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  fillLevel: { type: Number, default: 5 },
  batteryLevel: { type: Number, default: 95 },
  status: { type: String, enum: ['NORMAL', 'WARNING', 'CRITICAL'], default: 'NORMAL' },
  odorLevel: { type: String, default: 'Normal (85 ppm)' },
  lastEmptied: { type: String, default: 'Just now' },
  alertSent: { type: Boolean, default: false },
  criticalTime: { type: Date, default: null }, // Track when overflow started
  assignedOfficer: {
    name: { type: String, default: 'Officer Rajesh Kumar' },
    phone: { type: String, default: '+91 9876543210' },
    email: { type: String, default: 'officer@smartbin.io' },
    accessCode: { type: String, required: true, default: '1001' },
    points: { type: Number, default: 0 } // Gamification points
  }
}, { timestamps: true });

module.exports = mongoose.model('Bin', binSchema);
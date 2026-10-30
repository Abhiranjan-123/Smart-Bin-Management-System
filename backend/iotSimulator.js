
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bin = require('./models/Bin');

dotenv.config();

const officerPool = [
  { name: 'Officer Rajesh Kumar', phone: '+91 9876543210', email: 'rajesh@smartbin.io', accessCode: '1001' },
  { name: 'Officer Amit Sharma', phone: '+91 9876543211', email: 'amit@smartbin.io', accessCode: '1002' },
  { name: 'Officer Priya Singh', phone: '+91 9876543212', email: 'priya@smartbin.io', accessCode: '1003' },
  { name: 'Officer Vikram Patel', phone: '+91 9876543213', email: 'vikram@smartbin.io', accessCode: '1004' }
];

const initialBins = [
  { binId: 'BIN-01', location: 'Hostel Block A Gate 1', officerIndex: 0 },
  { binId: 'BIN-02', location: 'Central Library Entrance', officerIndex: 0 },
  { binId: 'BIN-03', location: 'Academic Building Courtyard', officerIndex: 1 },
  { binId: 'BIN-04', location: 'Student Cafeteria West', officerIndex: 1 },
  { binId: 'BIN-05', location: 'Sports Complex Pavilion', officerIndex: 2 },
  { binId: 'BIN-06', location: 'Main Administrative Block', officerIndex: 2 },
  { binId: 'BIN-07', location: 'Computer Science Lab Corridor', officerIndex: 3 },
  { binId: 'BIN-08', location: 'Workshop & Garage Area', officerIndex: 3 },
  { binId: 'BIN-09', location: 'Auditorium Back Exit', officerIndex: 0 },
  { binId: 'BIN-10', location: 'Main Gate Security Post', officerIndex: 1 }
];

async function runIoTTelemetry() {
  try {
    for (const b of initialBins) {
      let bin = await Bin.findOne({ binId: b.binId });
      const officer = officerPool[b.officerIndex];

      if (!bin) {
        bin = new Bin({
          binId: b.binId,
          location: b.location,
          fillLevel: Math.floor(Math.random() * 40) + 10,
          batteryLevel: 95,
          status: 'NORMAL',
          odorLevel: 'Normal (85 ppm)',
          lastEmptied: '2 hours ago',
          alertSent: false,
          assignedOfficer: officer
        });
      } else {
        if (bin.fillLevel < 100) {
          bin.fillLevel = Math.min(100, bin.fillLevel + Math.floor(Math.random() * 10) + 5);
        }

        if (bin.fillLevel >= 95) {
          if (!bin.criticalTime) {
            bin.criticalTime = new Date(); // Record overflow start time
          }
          bin.status = 'CRITICAL';
          bin.odorLevel = 'High (420 ppm)';
          bin.alertSent = true;
        } else if (bin.fillLevel >= 75) {
          bin.status = 'WARNING';
          bin.odorLevel = 'Moderate (230 ppm)';
        } else {
          bin.status = 'NORMAL';
          bin.odorLevel = 'Normal (85 ppm)';
          bin.criticalTime = null;
        }

        // Preserve officer points if existing
        const currentPoints = bin.assignedOfficer?.points || 0;
        bin.assignedOfficer = { ...officer, points: currentPoints };
      }

      await bin.save();
    }
    console.log(`[${new Date().toLocaleTimeString()}] 📡 IoT Telemetry updated successfully.`);
  } catch (err) {
    console.error('Simulation error:', err);
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ IoT Simulator Connected to MongoDB Atlas');
    runIoTTelemetry();
    setInterval(runIoTTelemetry, 15000);
  })
  .catch((err) => console.error('IoT Simulator DB Error:', err));
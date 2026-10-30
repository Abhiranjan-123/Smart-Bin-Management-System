const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// 1. MUST BE AT THE TOP BEFORE MONGOOSE CONNECT
dotenv.config();

const User = require('./models/User');
const Bin = require('./models/Bin'); // 👈 IoT Bin Model

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// 2. Connect using MONGO_URI
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected successfully!'))
  .catch((err) => console.error('Database connection error:', err));

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register Endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    if (!name || !phone || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, phone, email, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ message: 'Complete registration successfully' });
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);
    return res.status(500).json({ message: err.message || 'Server error during registration' });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ Login Failed: User not found for email: ${email}`);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Login Failed: Incorrect password for email: ${email}`);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    console.log(`✅ Successful Login for: ${email}`);
    return res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// ==========================================
// IOT SMART DUSTBIN ENDPOINTS
// ==========================================

// Get all 10 Smart Bins telemetry data
app.get('/api/bins', async (req, res) => {
  try {
    const bins = await Bin.find({});
    return res.status(200).json(bins);
  } catch (err) {
    console.error("FETCH BINS ERROR:", err);
    return res.status(500).json({ message: 'Error fetching bin telemetry' });
  }
});

// Clean / Reset Bin Endpoint
app.post('/api/bins/:id/clean', async (req, res) => {
  try {
    const { id } = req.params;
    let bin = await Bin.findOne({ binId: id });
    if (!bin && mongoose.Types.ObjectId.isValid(id)) {
      bin = await Bin.findById(id);
    }

    if (!bin) {
      return res.status(404).json({ message: `Bin not found with ID: ${id}` });
    }

    bin.fillLevel = 5; // Reset to 5%
    bin.status = 'NORMAL';
    bin.alertSent = false;
    bin.lastEmptied = 'Just now';
    bin.odorLevel = 'Normal (85 ppm)';
    await bin.save();

    return res.status(200).json({ message: `Bin ${id} cleaned successfully!`, bin });
  } catch (err) {
    console.error("CLEAN BIN ERROR:", err);
    return res.status(500).json({ message: err.message || 'Server error cleaning bin' });
  }
});

// ==========================================
// OFFICER PORTAL ENDPOINTS
// ==========================================

// Officer Login via Access Code
app.post('/api/officer/login', async (req, res) => {
  try {
    const { accessCode } = req.body;
    if (!accessCode) {
      return res.status(400).json({ message: 'Access Code is required' });
    }

    const assignedBins = await Bin.find({ 'assignedOfficer.accessCode': accessCode });
    if (!assignedBins || assignedBins.length === 0) {
      return res.status(404).json({ message: 'Invalid Officer Code or no assigned bins found.' });
    }

    const officerInfo = assignedBins[0].assignedOfficer;
    return res.status(200).json({
      message: 'Officer Authentication Successful',
      officer: officerInfo,
      assignedBins
    });
  } catch (err) {
    console.error("OFFICER LOGIN ERROR:", err);
    return res.status(500).json({ message: 'Server error during officer login' });
  }
});

// Complete Clean Endpoint from Officer Portal
app.post('/api/officer/complete-clean', async (req, res) => {
  try {
    const { binId } = req.body;

    if (!binId) {
      return res.status(400).json({ message: 'Bin ID is required' });
    }

    const bin = await Bin.findOne({ binId });
    if (!bin) return res.status(404).json({ message: 'Bin not found' });

    bin.fillLevel = 5; // Reset capacity to 5%
    bin.status = 'NORMAL';
    bin.alertSent = false;
    bin.lastEmptied = 'Just now';
    bin.odorLevel = 'Normal (80 ppm)';
    await bin.save();

    return res.status(200).json({
      message: `Bin ${binId} successfully marked as cleaned!`,
      bin
    });
  } catch (err) {
    console.error("COMPLETE CLEAN ERROR:", err);
    return res.status(500).json({ message: err.message || 'Error processing work completion' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
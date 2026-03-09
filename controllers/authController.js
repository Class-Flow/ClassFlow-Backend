const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: 'student' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.requestAadharOtp = async (req, res) => {
    try {
        const { aadharNumber } = req.body;

        // Validate Aadhar Number
        if (!/^\d{12}$/.test(aadharNumber)) {
            return res.status(400).json({ message: "Invalid Aadhar number. Must be exactly 12 digits." });
        }

        // Find existing user or create a new mock user
        let user = await User.findOne({ aadharNumber });
        if (!user) {
            // For mock purposes, register a new user using their Aadhar number
            const dummyPassword = await bcrypt.hash(aadharNumber, 10);
            user = new User({
                name: "Aadhar User",
                email: `aadhar${aadharNumber}@example.com`,
                password: dummyPassword,
                aadharNumber: aadharNumber
            });
        }

        // Generate a 6-digit mock OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
        await user.save();

        // Send OTP response (In a real app, send via SMS)
        res.json({ message: "OTP sent successfully to registered mobile number", otp: otp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verifyAadharOtp = async (req, res) => {
    try {
        const { aadharNumber, otp } = req.body;

        if (!aadharNumber || !otp) {
            return res.status(400).json({ message: "Aadhar number and OTP are required" });
        }

        const user = await User.findOne({ aadharNumber });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Verify OTP and check expiration
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Clear the OTP fields
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Sign the JWT token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, aadharNumber: user.aadharNumber, role: 'student' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

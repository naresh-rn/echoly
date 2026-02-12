const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// AUTO-HASH: This runs every time .save() is called
// models/User.js

// MODERN ASYNC HOOK: Corrected version
UserSchema.pre('save', async function() {
    // 1. Only hash if password is new or modified
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        // NOTE: No next() call here! In async hooks, simply returning is enough.
    } catch (err) {
        // If an error is thrown in an async hook, Mongoose catches it automatically
        throw err; 
    }
});
module.exports = mongoose.model('User', UserSchema);
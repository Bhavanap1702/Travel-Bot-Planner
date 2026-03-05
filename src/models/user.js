const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  provider: { type: String, default: 'local' }, // e.g., 'google', 'facebook' if you add social login later
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);

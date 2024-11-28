const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: Number,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    trim: true,
  },
  referalCode: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usedReferral: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("User", UserSchema);

const mongoose = require("mongoose");

const reviewsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", 
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1, 
      max: 5,
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model("Reviews", reviewsSchema);

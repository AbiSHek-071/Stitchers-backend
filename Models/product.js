const { type } = require("express/lib/response");
const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    information: {
      type: String,
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
    price: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: "Sale price should not be greater than the regular price.",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    sleeve: {
      type: String,
      required: true,
    },
    sizes: [
      {
        size: { type: String, required: true },
        stock: { type: Number, required: true },
      },
    ],
    totalStock: {
      type: Number,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

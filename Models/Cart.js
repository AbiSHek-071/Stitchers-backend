const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        size: {
          type: String,
          required: true,
        },
        stock: {
          type: Number,
          required: true,
          min: 0,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        salePrice: {
          type: Number,
          min: 0,
          validate: {
            validator: function (value) {
              return value <= this.price;
            },
            message:
              "Sales price should be less than or equal to the regular price",
          },
        },
        discount: {
          type: Number,
          min: 0,
          default: 0,
        },
        discountedAmount: {
          type: Number,
          min: 0,
          default: 0,
        },
        discountAmount: {
          type: Number,
          min: 0,
          default: 0,
        },
        qty: {
          type: Number,
          required: true,
          default: 1,
        },
        totalProductPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    totalCartPrice: {
      type: Number,
      required: true,
      default: function () {
        return this.items.reduce(
          (total, item) => total + item.totalProductPrice,
          0
        );
      },
    },
    total_discount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;

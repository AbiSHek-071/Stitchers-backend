const Cart = require("../../Models/Cart");
const calculateProductOfferinCart = require("../../utils/calculateProductOfferinCart");
const { login } = require("./userController");
async function addToCart(req, res) {
  try {
    const { userId, product } = req.body;
    const { productId, size, stock, price, salePrice, qty } = product;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            size,
            stock,
            price,
            salePrice,
            qty,
            totalProductPrice: salePrice * qty,
          },
        ],
      });
      cart.totalCartPrice = cart.items.reduce(
        (total, item) => total + item.totalProductPrice,
        0
      );
      await cart.save();
      return res
        .status(201)
        .json({ success: true, message: "Item added to cart" });
    }

    let existingItem = cart.items.findIndex((item, index) => {
      return (
        item.productId.toString() === productId.toString() && item.size === size
      );
    });

    if (existingItem >= 0) {
      existingItem = cart.items[existingItem];
      existingItem.qty += qty;
      existingItem.totalProductPrice =
        existingItem.salePrice * existingItem.qty;
      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Item added to cart" });
    } else {
      cart.items.push({
        productId,
        size,
        stock,
        price,
        salePrice,
        qty,
        totalProductPrice: salePrice * qty,
      });

      cart.totalCartPrice = cart.items.reduce(
        (total, item) => total + item.totalProductPrice,
        0
      );

      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Cart updated successfully!" });
    }
  } catch (err) {
    console.log(err);
  }
}
async function fetchCart(req, res) {
  try {
    const _id = req.params.id;

    // Fetch the cart and populate without filtering
    const cartItems = await Cart.findOne({ userId: _id }).populate({
      path: "items.productId",
      populate: [
        { path: "category", populate: { path: "offer" } }, // Populate category and its offer
        { path: "offer" }, // Populate product's own offer
      ],
    });

    if (!cartItems) {
      return res.status(200).json({
        success: false,
        message: "Unable to fetch cart items",
        cartItems,
      });
    }

    // Filter out items where productId.isActive is false
    cartItems.items = cartItems.items.filter(
      (item) => item.productId?.isActive
    );

    // Process each item
    cartItems.items.forEach((item) => {
      const product = item.productId;
      const sizeData = product?.sizes?.find((s) => s.size === item.size);

      if (sizeData) {
        if (item.qty > sizeData.stock) {
          item.qty = sizeData.stock;
        }
        item.totalProductPrice = item.qty * item.discountedAmount;
      }
      if (item.qty === 0 && sizeData?.stock > 1) {
        item.qty = 1;
      }
    });

    // Calculate offers for each item
    cartItems.items.forEach((item) => {
      calculateProductOfferinCart(item);
    });

    // Calculate total cart price and discount
    cartItems.totalCartPrice = cartItems.items.reduce(
      (total, item) => total + (item.totalProductPrice || 0),
      0
    );
    cartItems.total_discount = cartItems.items.reduce(
      (total, item) => total + (item.discountAmount || 0) * (item.qty || 0),
      0
    );

    // Save updated cart items
    await cartItems.save();

    return res.status(200).json({
      success: true,
      message: "Cart items fetched",
      cartItems,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function plusCartItem(req, res) {
  try {
    const cart_id = req.params.cart_id;
    const user_id = req.params.user_id;
    let updated = false;
    let cart = await Cart.findOne({ userId: user_id }).populate(
      "items.productId"
    );

    cart.items.forEach((item) => {
      const product = item.productId;
      const sizeData = product.sizes.find((s) => s.size === item.size);

      if (
        item._id.toString() === cart_id &&
        sizeData &&
        item.qty < sizeData.stock &&
        item.qty < 5
      ) {
        item.qty += 1;
        item.totalProductPrice = item.qty * item.salePrice;
        updated = true;
      }
    });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Maximum qty exceeded",
      });
    }

    cart.totalCartPrice = cart.items.reduce(
      (total, item) => total + item.totalProductPrice,
      0
    );

    await cart.save();
    return res.status(200).json({ success: true, message: "Qty + 1" });
  } catch (err) {
    console.log(err);
  }
}

async function minusCartItem(req, res) {
  try {
    const cart_id = req.params.cart_id;
    const user_id = req.params.user_id;

    let cart = await Cart.findOne({ userId: user_id });
    cart.items.map((item) => {
      if (item._id.toString() === cart_id && item.qty > 1) {
        item.qty -= 1;
        item.totalProductPrice = item.qty * item.salePrice;
      }
      return item;
    });

    cart.totalCartPrice = cart.items.reduce(
      (total, item) => total + item.totalProductPrice,
      0
    );

    await cart.save();
    return res.status(200).json({ success: true, message: "Qty - 1" });
  } catch (err) {
    console.log(err);
  }
}
async function removeCartItem(req, res) {
  try {
    const cart_id = req.params.cart_id;
    const user_id = req.params.user_id;

    let cart = await Cart.findOne({ userId: user_id });
    cart.items = cart.items.filter((item) => {
      if (item._id.toString() !== cart_id) {
        return item;
      }
    });
    cart.totalCartPrice = cart.items.reduce(
      (total, item) => total + item.totalProductPrice,
      0
    );
    await cart.save();
    return res.status(200).json({ success: true, message: "Item removed" });
  } catch (err) {
    console.log(err);
  }
}

async function fetchSize(req, res) {
  try {
    const { selected, product_id, user_id } = req.params;
    const cart = await Cart.findOne({ userId: user_id });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const itemExists = cart.items.find(
      (item) =>
        item.productId.toString() === product_id && item.size === selected
    );

    if (itemExists) {
      return res
        .status(200)
        .json({ success: true, message: "Item is already in the cart" });
    }

    return res
      .status(200)
      .json({ success: false, message: "Item is not in the cart" });
  } catch (err) {
    console.error("Error in fetchSize:", err);
    res.status(500).json({ success: false, message: "Error fetching size" });
  }
}

module.exports = {
  addToCart,
  fetchCart,
  plusCartItem,
  minusCartItem,
  removeCartItem,
  fetchSize,
};

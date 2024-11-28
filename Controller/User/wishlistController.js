const Cart = require("../../Models/Cart");
const Wishlist = require("../../Models/wishlist");

async function addTOWishlist(req, res) {
  try {
    const { product_id, user_id } = req.body;
    let wishlist = await Wishlist.findOne({ userId: user_id });
    if (!wishlist) {
      wishlist = new Wishlist({
        userId: user_id,
        items: [
          {
            productId: product_id,
          },
        ],
      });
      await wishlist.save();
      return res
        .status(201)
        .json({ message: "Product added to wishlist successfully" });
    } else {
      wishlist.items.push({ productId: product_id });
      await wishlist.save();
      return res
        .status(201)
        .json({ message: "Product added to wishlist successfully" });
    }
  } catch (err) {
    console.log(err);
  }
}

async function removeFromWishlist(req, res) {
  try {
    const { product_id, user_id } = req.body;

    console.log("product id", product_id);

    let wishlist = await Wishlist.findOne({ userId: user_id });
    wishlist.items = wishlist.items.filter((item) => {
      return item.productId.toString() !== product_id;
    });

    await wishlist.save();
    return res.status(201).json({ message: "Product removed from wishlist" });
  } catch (err) {
    console.log(err);
  }
}

async function checkIsExistOnWishlistApi(req, res) {
  try {
    const { product_id, user_id } = req.query;
    console.log(product_id, user_id);

    const wishlist = await Wishlist.findOne({ userId: user_id });
    if (
      wishlist &&
      wishlist.items.some((item) => item.productId == product_id)
    ) {
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ success: false });
  } catch (err) {
    console.log(err);
  }
}
async function fetchWishlist(req, res) {
  try {
    const { user_id } = req.query;
    console.log(user_id);

    const wishlist = await Wishlist.findOne({ userId: user_id })
      .populate({
        path: "items.productId",
        model: "Product",
      })
      .exec();
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }
    return res.status(200).json({ success: true, wishlist });
  } catch (err) {
    console.log(err);
  }
}
async function movetocart(req, res) {
  try {
    const { product_id, user_id } = req.body;
    const whishlist = await whishlist.findOne({ userId: user_id });
  } catch (err) {
    console.log(err);
  }
}

async function checkisOnCart(req, res) {
  try {
    const { product_id, size } = req.body;
    const s = size[product_id]?.size;

    const cartData = await Cart.find({
      items: {
        $elemMatch: {
          productId: product_id,
          size: s,
        },
      },
    });
    if (cartData.length == 0) {
      return res.json({ success: false });
    }
    return res.json({ success: true });
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  addTOWishlist,
  removeFromWishlist,
  checkIsExistOnWishlistApi,
  fetchWishlist,
  movetocart,
  checkisOnCart,
};

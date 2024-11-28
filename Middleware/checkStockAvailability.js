const Product = require("../Models/product");

async function checkStockAvailability(req, res, next) {
  try {
    const { cartItems } = req.body;

    for (const item of cartItems) {
      const product = await Product.findById(item.productId._id);
      if (product) {
        const currentProduct = product.sizes.find((s) => s.size === item.size);
        if (currentProduct && currentProduct.stock < item.qty) {
          return res.status(400).json({
            sucess: false,
            message: `Currently quantity of the ${product.name} for ${item.size} is stock out!!`,
          });
        }
      }
    }
    next();
  } catch (error) {
    console.log(error);
  }
}

module.exports = checkStockAvailability;

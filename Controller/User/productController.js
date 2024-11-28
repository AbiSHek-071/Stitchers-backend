const bcrypt = require("bcrypt");
const product = require("../../Models/product");
const Category = require("../../Models/category");
const {
  calculateProductOfferinShop,
} = require("../../utils/calculateProductOfferinShop");

async function fetchProducts(req, res) {
  try {
    const { category, sleeve, size, search, sortBy } = req.query;

    console.log("category:::::::>", category);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    // active category
    let categoryIds = [];
    if (category) {
      const categories = await Category.find({
        name: { $in: category.split(",") },
        isActive: true,
      }).lean();
      categoryIds = categories.map((cat) => cat._id);
    } else {
      const activeCategories = await Category.find({ isActive: true }).lean();
      categoryIds = activeCategories.map((cat) => cat._id);
    }

    //filterQueries active categories
    const filterQueries = { isActive: true, category: { $in: categoryIds } };

    // Filter based on sleeve
    if (sleeve) {
      filterQueries.sleeve = { $in: sleeve.split(",") };
    }

    // Filter based on size
    if (size) {
      filterQueries["sizes"] = {
        $elemMatch: {
          size: { $in: size.split(",") },
          stock: { $gt: 0 },
        },
      };
    }

    //  search to filter queries
    if (search) {
      filterQueries["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sleeve: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting options
    const sort = {};
    if (sortBy == "newest") {
      sort["createdAt"] = -1;
    } else if (sortBy == "price-low-to-high") {
      sort["price"] = 1;
    } else if (sortBy == "price-high-to-low") {
      sort["price"] = -1;
    } else if (sortBy == "name-a-to-z") {
      sort["name"] = 1;
    } else if (sortBy == "name-z-to-a") {
      sort["name"] = -1;
    }

    // Final ProductData
    let productData = await product
      .find(filterQueries)
      .populate([
        { path: "category", populate: { path: "offer" } }, // Populate category and its offer
        { path: "offer" }, // Populate product's own offer
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total products for pagination
    const totalProduct = await product.countDocuments(filterQueries);

    if (!productData.length) {
      return res
        .status(404)
        .json({ message: "No products found", success: false });
    }

    productData.forEach((product) => {
      calculateProductOfferinShop(product);
    });

    return res.status(200).json({
      message: "Products fetched successfully",
      success: true,
      productData,
      currentPage: page,
      totalPages: Math.ceil(totalProduct / limit),
      totalProduct,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", success: false });
  }
}

async function fetchproduct(req, res) {
  try {
    const { id } = req.body;
    const productData = await product.findById({ _id: id }).populate({
      path: "category",
      match: { isActive: true },
      select: "name",
    });

    if (!productData) {
      return res
        .status(404)
        .json({ success: true, message: "Unable to Find the Product," });
    }
    return res.status(200).json({
      success: true,
      message: "Product Fetched",
      product: productData,
    });
  } catch (err) {
    console.log(err);
  }
}

async function fetchRelatedProducts(req, res) {
  try {
    const { categoryId } = req.body;
    const productData = await product
      .find({ category: categoryId, isActive: true })
      .populate({
        path: "category",
        match: { isActive: true },
        select: "name",
      });
    const filteredProductData = productData.filter(
      (prod) => prod.category !== null
    );

    if (!productData) {
      return res
        .status(404)
        .json({ message: "Unable to fetch Image", success: false });
    }
    return res.status(200).json({
      message: "products fetched successfully",
      success: true,
      productData: filteredProductData,
    });
  } catch (err) {
    console.log(err);
  }
}

async function checkisProductSizeAvailabel(req, res) {
  try {
    const { cartItems } = req.query; // Ensure the request is sending data in the body

    // Validate cartItems format
    if (!Array.isArray(cartItems)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid cart items format" });
    }

    const unavailableItems = [];

    for (const item of cartItems) {
      const { productId, size, qty } = item;

      const Product = await product.findOne({
        _id: productId,
        isActive: true,
        "sizes.size": size,
      });

      if (!Product) {
        unavailableItems.push({
          productId,
          size,
          reason: "Product not found or inactive",
        });
        continue;
      }

      const sizeData = Product.sizes.find((s) => s.size === size);

      if (!sizeData || sizeData.stock < qty) {
        unavailableItems.push({
          productId,
          size,
          reason: sizeData ? "Insufficient stock" : "Size not found",
        });
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(200).json({
        success: false,
        message: "Sorry Some items are Currently unavailable",
        unavailableItems,
      });
    }

    res.status(200).json({
      success: true,
      message: "All items are available",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  fetchproduct,
  fetchProducts,
  fetchRelatedProducts,
  checkisProductSizeAvailabel,
};

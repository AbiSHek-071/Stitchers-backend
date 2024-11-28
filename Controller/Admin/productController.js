const bcrypt = require("bcrypt");
const Product = require("../../Models/product");

async function addProduct(req, res) {
  try {
    const {
      name,
      price,
      salePrice,
      description,
      sizes,
      addInfo,
      catId,
      sleeve,
      uploadedImageUrls,
    } = req.body;
    let totalStock = 0;

    sizes.forEach((size) => {
      for (let key in size) {
        if (key === "stock") {
          totalStock += size[key];
        }
      }
    });

    const product = new Product({
      name,
      description,
      information: addInfo,
      price,
      salePrice,
      category: catId,
      sleeve,
      sizes,
      totalStock,
      images: uploadedImageUrls,
    });
    const done = await product.save();

    if (!done) {
      return res
        .status(404)
        .json({ success: false, message: "Unable to add the product" });
    }
    return res
      .status(201)
      .json({ success: true, message: "Product added Successfully" });
  } catch (err) {
    console.log(err);
  }
}

async function fetchProducts(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments();

    const products = await Product.find({})
      .populate({
        path: "category",
        match: { isActive: true },
        select: "name",
      })
      .skip(skip)
      .limit(limit);

    const filteredProductData = products.filter(
      (prod) => prod.category !== null
    );

    if (filteredProductData.length == 0) {
      return res
        .status(404)
        .json({ success: false, message: "unable to fetch products" });
    }
    return res.status(200).json({
      success: true,
      message: "Products list fetched Successfully",
      products: filteredProductData,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    });
  } catch (err) {
    console.log(err);
  }
}

async function editProduct(req, res) {
  try {
    const {
      _id,
      name,
      description,
      price,
      salePrice,
      category,
      sleeve,
      sizes,
      images,
    } = req.body;

    let totalStock = 0;

    sizes.forEach((size) => {
      for (let key in size) {
        if (key === "stock") {
          totalStock += size[key];
        }
      }
    });

    const updateData = await Product.findByIdAndUpdate(
      { _id },
      {
        name,
        description,
        price,
        salePrice,
        category,
        sleeve,
        totalStock,
        sizes,
        images,
      },
      { new: true }
    );

    if (!updateData) {
      return res
        .status(400)
        .json({ success: false, message: "Unable to update the product" });
    }
    return res.status(200).json({ success: false, message: "Product Updated" });
  } catch (err) {
    console.log(err);
  }
}
async function toggleProduct(req, res) {
  try {
    const { _id, isActive } = req.body;
    console.log("_id======>", _id, "isActive=====>", isActive);

    const updateData = await Product.findByIdAndUpdate(
      { _id },
      {
        isActive: isActive ? false : true,
      },
      {
        new: true,
      }
    );
    if (!updateData) {
      return res
        .status(400)
        .json({ message: "unable to update, please try again" });
    }
    if (updateData.isActive) {
      return res.status(200).json({ message: "Product Listed" });
    } else {
      return res.status(200).json({ message: "Product Unlisted" });
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  addProduct,
  fetchProducts,
  editProduct,
  toggleProduct,
};

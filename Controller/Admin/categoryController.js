const bcrypt = require("bcrypt");
const Category = require("../../Models/category");

async function addCategory(req, res) {
  try {
    const { name, description } = req.body;
    const category = new Category({
      name,
      description,
    });
    const done = await category.save();
    if (!done) {
      return res
        .status(404)
        .json({ success: false, message: "unable to add category" });
    }
    return res
      .status(200)
      .json({ success: true, message: `${name} is added to categories` });
  } catch (err) {
    console.log(err);
  }
}
async function fetchCategory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const totalCategory = await Category.countDocuments();

    const categories = await Category.find({}).skip(skip).limit(limit);
    if (!categories) {
      return res
        .status(404)
        .json({ success: false, message: "Category fetch failed" });
    }
    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      categories,
      currentPage: page,
      totalPages: Math.ceil(totalCategory / limit),
      totalCategory,
    });
  } catch (err) {
    console.log(err);
  }
}
async function getCategory(req, res) {
  try {
    const { id } = req.params;

    const categoryData = await Category.findOne({ _id: id });

    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: "Unable to fetch data from Category",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Category Fetched Succesfully",
      categoryData,
    });
  } catch (err) {
    console.log(err);
  }
}

async function editcategory(req, res) {
  try {
    const { id, name, description } = req.body;
    const updatedData = await Category.findByIdAndUpdate(
      id,
      { name, description, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedData) {
      return res
        .status(400)
        .json({ success: false, message: "Unable to update" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Updated Successfully", updatedData });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
async function toggleCategory(req, res) {
  try {
    const { _id, isActive } = req.body;

    const updateData = await Category.findByIdAndUpdate(
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
      return res.status(200).json({ message: "Category enabled" });
    } else {
      return res.status(200).json({ message: "Category disabled" });
    }
  } catch (err) {
    console.log(err);
  }
}

async function sendCatgories(req, res) {
  try {
    const categories = await Category.find({ isActive: true });

    if (categories.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No categories found" });
    }

    return res.status(200).json({
      success: true,
      message: "categories fetched successfully",
      categories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  addCategory,
  fetchCategory,
  getCategory,
  editcategory,
  toggleCategory,
  sendCatgories,
};

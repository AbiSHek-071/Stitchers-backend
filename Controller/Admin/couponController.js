const { findByIdAndDelete } = require("../../Models/admin");
const Coupon = require("../../Models/coupon");

async function addCoupon(req, res) {
  try {
    const { coupon } = req.body;
    const {
      code,
      description,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      expiration_date,
      usage_limit,
    } = coupon;

    const isExist = await Coupon.findOne({ code });

    if (isExist) {
      return res.status(409).json({
        success: false,
        message:
          "coupon with the same code already exist. Try changing the code",
      });
    }

    const data = new Coupon({
      code,
      description,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      expiration_date,
      usage_limit,
    });

    await data.save();

    if (data) {
      return res
        .status(200)
        .json({ success: true, message: "Coupon added successfully" });
    }
    return res
      .status(400)
      .json({ success: false, message: "Unable to add Coupon" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

async function fetchCoupons(req, res) {
  try {
    const Coupons = await Coupon.find();

    if (!Coupons) {
      return res
        .status(404)
        .json({ success: false, message: "Coupons not found" });
    }

    return res.status(200).json({ success: true, Coupons });
  } catch (err) {
    console.log(err);
  }
}

async function deleteCoupon(req, res) {
  try {
    const { _id } = req.query;

    const deleted = await Coupon.findByIdAndDelete(_id);
    console.log("+++++++++++", deleted);

    if (deleted) {
      return res.status(200).json({ message: "Deleted successfully" });
    }
    return res.status(400).json({ message: "Deletion failed" });
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  addCoupon,
  fetchCoupons,
  deleteCoupon,
};

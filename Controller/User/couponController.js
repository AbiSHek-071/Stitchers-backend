const { findOne } = require("../../Models/Cart");
const Coupon = require("../../Models/coupon");

async function fetchCouponDetails(req, res) {
  try {
    const { couponCode } = req.query;

    const CouponData = await Coupon.findOne({ code: couponCode });

    if (!CouponData) {
      return res
        .status(404)
        .json({ success: false, message: "unable to fetch the couponData" });
    }
    return res
      .status(200)
      .json({ message: "couponData fetched successfully", CouponData });
  } catch (err) {
    console.log(err);
  }
}

async function updateCoupon(req, res) {
  try {
    const { coupon_id, user_id } = req.body;
    const couponData = await Coupon.findOne({ _id: coupon_id });

    let userFound = false;

    //if empty array add new object
    if (couponData.users_applied.length === 0) {
      const appliedUser = { user: user_id, used_count: 1 };
      couponData.users_applied.push(appliedUser);
    } else {
      couponData.users_applied.forEach((user_applied) => {
        if (user_applied.user.toString() === user_id) {
          user_applied.used_count += 1;
          userFound = true;
        }
      });

      // If the user is not in the array, add new object to the array
      if (!userFound) {
        const appliedUser = { user: user_id, used_count: 1 };
        couponData.users_applied.push(appliedUser);
      }
    }

    await couponData.save();
    console.log(":::::::couponData:::::::>>>>>", couponData);
  } catch (err) {
    console.log("Error updating coupon:", err);
  }
}

module.exports = { fetchCouponDetails, updateCoupon };

const Banner = require("../../Models/banner");

async function addBanner(req, res) {
  try {
    const { image, title, subtitle, advertisement } = req.body;
    console.log("image::::::", image);
    console.log("title::::::", title);
    console.log("subtitle::::::", subtitle);
    console.log("advertisement::::::", advertisement);

    const newBanner = await Banner.create({
      title,
      subtitle,
      advertisement,
      image,
    });
    newBanner.save();
    return res
      .status(200)
      .json({ success: true, message: `New Banner Added successfully ` });
  } catch (err) {
    console.log(err);
  }
}

async function fetchBanners(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const totalBanner = await Banner.countDocuments();

    const banners = await Banner.find().skip(skip).limit(limit);
    if (!banners) {
      return res
        .status(404)
        .json({ success: false, message: "not found banners" });
    }
    return res.status(200).json({
      success: true,
      message: "banners fetched successfullt",
      banners,
      currentPage: page,
      totalPages: Math.ceil(totalBanner / limit),
    });
  } catch (err) {
    console.log(err);
  }
}

async function toggleStatus(req, res) {
  try {
    const { _id, isActive } = req.body;
    console.log(_id, isActive);

    const updateData = await Banner.findByIdAndUpdate(
      _id,
      {
        isActive: isActive ? false : true,
      },
      { new: true }
    );
    if (!updateData) {
      return res
        .status(400)
        .json({ message: "Unable to change status", success: false });
    }
    if (updateData.isActive) {
      return res.status(200).json({ message: "Banner Listed" });
    } else {
      return res.status(200).json({ message: "Banner Unlisted" });
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = { addBanner, fetchBanners, toggleStatus };

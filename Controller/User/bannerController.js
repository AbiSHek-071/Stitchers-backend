const Banner = require("../../Models/banner");

async function fetchBanners(req, res) {
  console.log("call reached ");

  try {
    const banners = await Banner.find({ isActive: true });
    if (!banners) {
      return res
        .status(404)
        .json({ success: false, message: "not found banners" });
    }
    return res.status(200).json({
      success: true,
      message: "banners fetched successfullt",
      banners,
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports = { fetchBanners };

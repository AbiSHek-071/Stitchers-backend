const reviews = require("../../Models/reviews")

async function addReviews(req, res) {
  try {
    const { userId, productId, rating, review } = req.body;

    const reviewData = new reviews({
      user: userId,
      product: productId,
      description: review,
      rating,
    });

    const done = await reviewData.save();
    if (!done) {
      return res
        .status(404)
        .json({ success: false, message: "unable to add update your Review" });
    }
    return res
      .status(200)
      .json({ success: true, message: `Your review is added` });
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ message: "Failed to add review" });
  }
}

async function fetchReviews(req, res) {
  try {
    const productId = req.params.id;

    const reviewsData = await reviews
      .find({ product: productId })
      .populate("user", "_id name email");

    if (!reviewsData || reviewsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No reviews Yet",
      });
    }

    return res.status(200).json({
      success: true,
      reviews: reviewsData,
    });
  } catch (err) {
    console.log("failed to fetch", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews.",
    });
  }
}
async function fetchAverageRating(req, res) {
  try {
    const productId = req.params.id;
    const reviewsData = await reviews.find({ product: productId });
    let sum = 0;
    reviewsData.forEach((review) => {
      sum += review.rating;
    });

    let avg = sum / reviewsData.length;

    const roundedAvg = Math.round(avg);
    return res.status(200).json({
      success: true,
      averageRating: roundedAvg,
    });
  } catch (err) {
    console.error("Error fetching average rating:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


module.exports = {
  addReviews,
  fetchReviews,
  fetchAverageRating
};

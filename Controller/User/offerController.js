const offer = require("../../Models/offer");

async function fetchCorrectOffer(req, res) {
  try {
    const { product_id, category_id, product_price } = req.query;

    const productOffer = await offer.findOne({ target_id: product_id });
    const categoryOffer = await offer.findOne({ target_id: category_id });

    return res.json({
      productOffer: productOffer ? productOffer.offer_value : null,
      categoryOffer: categoryOffer ? categoryOffer.offer_value : null,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching offers." });
  }
}

module.exports = { fetchCorrectOffer };

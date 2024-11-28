const category = require("../../Models/category");
const Offer = require("../../Models/offer");

const product = require("../../Models/product");

async function addProductOffer(req, res) {
  try {
    const {
      id,
      productName,
      offerName,
      offerValue,
      offerExpairyDate,
      target_type,
    } = req.body;

    // ----- Create the Offer -----
    const offer = new Offer({
      name: offerName,
      offer_value: offerValue,
      target_type,
      target_id: id,
      target_name: productName,
      end_date: offerExpairyDate,
    });

    if (target_type === "product") {
      // ----- Find Product and Assign Offer -----
      const productData = await product.findOne({ _id: id });
      if (!productData) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      productData.offer = offer._id;
      await productData.save();
    }

    // ----- Save the Offer -----
    await offer.save();

    return res.status(200).json({
      success: true,
      message: `Offer successfully added to ${productName}`,
    });
  } catch (err) {
    console.error("Error adding offer:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error adding offer" });
  }
}

async function addCategoryOffer(req, res) {
  try {
    const {
      id,
      CategoryName,
      offerName,
      offerValue,
      offerExpairyDate,
      target_type,
    } = req.body;

    const offer = new Offer({
      name: offerName,
      offer_value: offerValue,
      target_type,
      target_id: id,
      target_name: CategoryName,
      end_date: offerExpairyDate,
    });

    if (target_type === "category") {
      console.log("asdkjagdajshdgajhdashvdh");

      // ----- Find Category and Assign Offer -----
      const categoryData = await category.findOne({ _id: id });
      if (!categoryData) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
      categoryData.offer = offer._id;
      console.log("categoryData====>", categoryData);

      await categoryData.save();
    }

    await offer.save();
    return res.status(200).json({
      success: true,
      message: `Offer successfuly added to ${CategoryName}`,
    });
  } catch (err) {
    console.log(err);
  }
}
async function checkofferexist(req, res) {
  try {
    const { id } = req.query;
    const offer = await Offer.find({ target_id: id });

    if (!offer.length == 0) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (err) {
    console.log(err);
  }
}
async function deleteOffer(req, res) {
  try {
    const { _id } = req.query;
    const data = await Offer.deleteOne({ target_id: _id });

    if (data.deletedCount === 1) {
      return res.status(200).json({ message: "Deleted successfully" });
    } else if (data.deletedCount === 0) {
      return res.status(404).json({ message: "No offer found to delete" });
    } else {
      return res.status(400).json({ message: "Deletion failed" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
async function fetchCatOffer(req, res) {
  try {
    const categoryOffer = await Offer.find({ target_type: "category" });
    return res.json({ categoryOffer });
  } catch (err) {
    console.log(err);
  }
}
async function fetchPrdOffer(req, res) {
  try {
    const productOffer = await Offer.find({ target_type: "product" });
    console.log(productOffer);

    return res.json({ productOffer });
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  addProductOffer,
  addCategoryOffer,
  checkofferexist,
  deleteOffer,
  fetchCatOffer,
  fetchPrdOffer,
};

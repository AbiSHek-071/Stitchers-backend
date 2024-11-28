function calculateProductOfferinShop(product) {
  const productOffer = product.offer?.offer_value || 0;
  const categoryOffer = product.category.offer?.offer_value || 0;

  let discountAmount = 0;
  let discountPercentage = 0;

  // Determine the highest discount offer
  if (categoryOffer > productOffer) {
    discountAmount = (product.salePrice * categoryOffer) / 100;
    discountPercentage = categoryOffer; // Category offer percentage
  } else if (productOffer > categoryOffer) {
    discountAmount = (product.salePrice * productOffer) / 100;
    discountPercentage = productOffer; // Product offer percentage
  } else if (productOffer === categoryOffer && productOffer > 0) {
    // If both are equal and greater than 0, apply either
    discountAmount = (product.salePrice * productOffer) / 100;
    discountPercentage = productOffer;
  }

  // Calculate the final price after discount
  const discountedAmount = product.salePrice - discountAmount;

  // Assign the discount-related fields to the product
  product.discount = discountPercentage;
  product.discountAmount = discountAmount;
  product.discountedAmount = discountedAmount;
}

module.exports = { calculateProductOfferinShop };

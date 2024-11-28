const express = require("express");
``;
const User = require("../Models/UserModel");
const userRoute = express.Router();

const userController = require("../Controller/User/userController");
const productController = require("../Controller/User/productController");
const reviewController = require("../Controller/User/reviewController");
const addressController = require("../Controller/User/addressController");
const cartController = require("../Controller/User/cartController");
const orderController = require("../Controller/User/orderController");
const categoryController = require("../Controller/User/categoryController");
const wishlistController = require("../Controller/User/wishlistController");
const couponController = require("../Controller/User/couponController");
const walletController = require("../Controller/User/walletController");
const offerController = require("../Controller/User/offerController");
const bannerController = require("../Controller/User/bannerController");
//authentications
const userAuth = require("../Middleware/userAuth");
const checkStockAvailability = require("../Middleware/checkStockAvailability");

// user controller routes
userRoute.post("/sendotp", userController.sendOtp);
userRoute.post("/register", userAuth.verifyOtp, userController.register);
userRoute.post("/login", userController.login);
userRoute.post("/googleAuth", userController.googleAuth);
userRoute.post(
  "/edit",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  userController.editUser
);
userRoute.post("/forget-password", userController.forgetPassword);
userRoute.post(
  "/forget-password/otp-verification",
  userAuth.verifyOtp,
  userController.forgotPasswordOtpVerification
);
userRoute.post("/reset-password", userController.resetPassword);
userRoute.post("/change-password", userController.changePassword);
userRoute.post("/referal", userController.referal);

//product controller routes
userRoute.get("/products", productController.fetchProducts);
userRoute.post("/fetchproduct", productController.fetchproduct);
userRoute.post("/products/related", productController.fetchRelatedProducts);
userRoute.get(
  "/product/available",
  productController.checkisProductSizeAvailabel
);

userRoute.patch("/referal/skip", userController.skipReferal);

//review controller routes
userRoute.post(
  "/product/review",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  reviewController.addReviews
);
userRoute.get("/products/:id/reviews", reviewController.fetchReviews);
userRoute.get(
  "/products/:id/reviews/average-rating",
  reviewController.fetchAverageRating
);

//address Controller rouutes
userRoute.post(
  "/address",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  addressController.addAddress
);
userRoute.get("/address/:id", addressController.fetchAddress);
userRoute.post(
  "/address/edit",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  addressController.editAddress
);
userRoute.delete(
  "/address/:id",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  addressController.deleteAddress
);

//cart controller routes
userRoute.post(
  "/cart",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  cartController.addToCart
);
userRoute.get("/cart/:id", userAuth.jwtVerification, cartController.fetchCart);
userRoute.patch(
  "/cart/add/:cart_id/:user_id",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  cartController.plusCartItem
);
userRoute.patch(
  "/cart/min/:cart_id/:user_id",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  cartController.minusCartItem
);
userRoute.delete(
  "/cart/:cart_id/:user_id",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  cartController.removeCartItem
);
userRoute.get("/size/:product_id/:user_id/:selected", cartController.fetchSize);

//category controller routes
userRoute.get("/categories", categoryController.fetchCategory);

//order controller routes
userRoute.post(
  "/order",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  checkStockAvailability,
  orderController.createOrder
);
userRoute.get("/orders/:_id", orderController.fetchOrders);
userRoute.get("/order/:id", orderController.fetchOrderDetails);
// userRoute.patch(
//   "/order/return/:order_id",
//   userAuth.jwtVerification,
//   userAuth.checkUserBlocked,
//   orderController.returnOrder
// );
userRoute.put(
  "/order/cancel/:order_id/:item_id",
  // userAuth.jwtVerification,
  // userAuth.checkUserBlocked,
  orderController.cancelOrder
);
//return request
userRoute.post("/return/request", orderController.registerReturnReq);
userRoute.post("/invoice/download", orderController.downloadInvoice);
userRoute.patch("/order/finish-payment", orderController.finishPayment);

//wishlist controller routes
userRoute.post(
  "/wishlist/add",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  wishlistController.addTOWishlist
);
userRoute.post(
  "/wishlist/remove",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  wishlistController.removeFromWishlist
);
userRoute.get(
  "/wishlist/isexist",
  wishlistController.checkIsExistOnWishlistApi
);
userRoute.get(
  "/wishlist",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  wishlistController.fetchWishlist
);
userRoute.post(
  "/whishlist/movetocart",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  wishlistController.movetocart
);
userRoute.post(
  "/whishlist/isoncart",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  wishlistController.checkisOnCart
);

//coupon Controller routes
userRoute.get(
  "/coupon",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  couponController.fetchCouponDetails
);
userRoute.patch(
  "/coupon",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  couponController.updateCoupon
);

//wallet controller routes
userRoute.post(
  "/wallet/add-money",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  walletController.addMoneytoWallet
);
userRoute.get(
  "/wallet",
  userAuth.jwtVerification,
  userAuth.checkUserBlocked,
  walletController.fetchWallet
);

//offer controller routes
userRoute.get("/findoffer", offerController.fetchCorrectOffer);

//banner Controller routes
userRoute.get("/banner", bannerController.fetchBanners);

module.exports = userRoute;

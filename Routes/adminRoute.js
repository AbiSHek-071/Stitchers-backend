const express = require("express");
``;
const Admin = require("../Models/admin");
const adminRoute = express.Router();

//Controllers Here
const adminController = require("../Controller/Admin/adminController");
const productController = require("../Controller/Admin/productController");
const categoryController = require("../Controller/Admin/categoryController");
const userController = require("../Controller/Admin/userController");
const orderController = require("../Controller/Admin/orderController");
const offerController = require("../Controller/Admin/offerController");
const couponController = require("../Controller/Admin/couponController");
const salesController = require("../Controller/Admin/salesController");
const bannerController = require("../Controller/Admin/bannerController");
const dashboardController = require("../Controller/Admin/dashboardController");
const adminAuth = require("../Middleware/adminAuth");
const admin = require("../Models/admin");

//...........ROUTES................

//admin controller routes
adminRoute.get("/createadmin/:email", adminController.createAdmin);
adminRoute.post("/login", adminController.login);

//category Controller routes
adminRoute.post(
  "/categories",
  adminAuth.jwtVerification,
  categoryController.addCategory
);
adminRoute.get(
  "/categories",
  adminAuth.jwtVerification,
  categoryController.fetchCategory
);
adminRoute.get(
  "/category/:id",
  adminAuth.jwtVerification,
  categoryController.getCategory
);
adminRoute.put(
  "/category",
  adminAuth.jwtVerification,
  categoryController.editcategory
);
adminRoute.get(
  "/categories/active",
  adminAuth.jwtVerification,
  categoryController.sendCatgories
);
adminRoute.put(
  "/categories/toggle-status",
  adminAuth.jwtVerification,
  categoryController.toggleCategory
);

//user Controller routes
adminRoute.get("/users", adminAuth.jwtVerification, userController.getUsers);
adminRoute.put(
  "/users/block",
  adminAuth.jwtVerification,
  userController.blockUser
);

//products Controller routes
adminRoute.post(
  "/product",
  adminAuth.jwtVerification,
  productController.addProduct
);
adminRoute.get(
  "/products",
  adminAuth.jwtVerification,
  productController.fetchProducts
);
adminRoute.put(
  "/product",
  adminAuth.jwtVerification,
  productController.editProduct
);
adminRoute.put(
  "/products/status",
  adminAuth.jwtVerification,
  productController.toggleProduct
);

//orders Controller routes
adminRoute.get("/orders", orderController.fetchOrders);
adminRoute.patch(
  "/status/:orderId/:itemId/:newStatus",
  orderController.switchStatus
);
adminRoute.patch("/return/response", orderController.respondToReturnReq);
adminRoute.get("/order/:id", orderController.fetchOrderDetails);

//offer Controller routes
adminRoute.post("/product/offer", offerController.addProductOffer);
adminRoute.post("/category/offer", offerController.addCategoryOffer);
// adminRoute.get("/product/offer-isexist", offerController.checkofferexist);
adminRoute.get("/offer/category", offerController.fetchCatOffer);
adminRoute.get("/offer/product", offerController.fetchPrdOffer);
adminRoute.delete("/offer", offerController.deleteOffer);

//coupon Controller routes
adminRoute.post("/coupon", couponController.addCoupon);
adminRoute.get("/coupons", couponController.fetchCoupons);
adminRoute.delete("/coupon", couponController.deleteCoupon);

//sales report Controller routes
adminRoute.get("/sales", salesController.fetchSalesReport);
adminRoute.get("/sales/download/pdf", salesController.dowloadSalesPDF);
adminRoute.get("/sales/download/excel", salesController.downloadSalesExcel);

//banner Controller routes
adminRoute.post("/banner", bannerController.addBanner);
adminRoute.get("/banner", bannerController.fetchBanners);
adminRoute.patch("/banner/status", bannerController.toggleStatus);

//dashboard Controller routes
adminRoute.get("/dashboard", dashboardController.fetchDashboardData);

module.exports = adminRoute;

const User = require("../../Models/UserModel");
const Order = require("../../Models/order");
const Product = require("../../Models/product");

async function fetchDashboardData(req, res) {
  try {
    const { timeFilter } = req.query;

    // Validate timeFilter
    if (!["week", "month", "year"].includes(timeFilter)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid time filter" });
    }

    // ::::::::::::::::: Total Customers ::::::::::::::::::
    const TotalCustomers = await User.countDocuments();

    // ::::::::::::::::: Total Sales ::::::::::::::::::
    const totalSalesResult = await Order.aggregate([
      { $unwind: "$order_items" },
      { $match: { "order_items.order_status": "Delivered" } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$order_items.total_price" },
        },
      },
    ]);
    const totalSales = totalSalesResult[0]?.totalSales || 0;

    // ::::::::::::::::: Total Orders ::::::::::::::::::
    const totalOrders = await Order.countDocuments();

    // ::::::::::::::::: Total Products ::::::::::::::::::
    const TotalProducts = await Product.countDocuments();

    // ::::::::::::::::: Sales Chart ::::::::::::::::::

    const currentDate = new Date();
    let startDate = new Date();
    let groupBy = {};
    let groupNameMapping = [];

    // Adjust date range and grouping based on time filter
    switch (timeFilter) {
      case "week":
        // Show sales for the past 7 days
        startDate.setDate(currentDate.getDate() - 7);
        groupBy = { $dayOfWeek: "$placed_at" };
        groupNameMapping = [
          "",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        break;

      case "month":
        // Show sales for each week of the current month
        startDate.setMonth(currentDate.getMonth(), 1); // First day of this month
        groupBy = { $week: "$placed_at" }; // Group by week number within the month
        groupNameMapping = ["", "Week 1", "Week 2", "Week 3", "Week 4"]; // Group labels for weeks
        break;

      case "year":
        // Show sales for each month of the current year
        startDate.setFullYear(currentDate.getFullYear(), 0, 1); // First day of the year
        groupBy = { $month: "$placed_at" }; // Group by month
        groupNameMapping = [
          "",
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ]; // Group labels for months
        break;

      default:
        startDate = currentDate;
        break;
    }

    const salesData = await Order.aggregate([
      { $match: { placed_at: { $gte: startDate, $lte: currentDate } } },
      { $unwind: "$order_items" },
      { $match: { "order_items.order_status": "Delivered" } },
      {
        $group: {
          _id: groupBy,
          sales: { $sum: "$order_items.total_price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by the group field (week/month)
      {
        $addFields: {
          name: {
            $arrayElemAt: [groupNameMapping, "$_id"],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          sales: 1,
          count: 1,
        },
      },
    ]);

    console.log("salesChart::::::::::::::>", salesData);

    // ::::::::::::::::: Best Selling Products ::::::::::::::::::
    const bestProducts = await Order.aggregate([
      { $unwind: "$order_items" },
      { $match: { "order_items.order_status": "Delivered" } },
      {
        $lookup: {
          from: "products",
          localField: "order_items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$order_items.product",
          name: { $first: "$productDetails.name" },
          sales: { $sum: "$order_items.qty" },
          revenue: { $sum: "$order_items.total_price" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: 1,
          sales: 1,
          revenue: 1,
        },
      },
    ]);

    // ::::::::::::::::: Best Selling Categories ::::::::::::::::::
    const bestCategories = await Order.aggregate([
      { $unwind: "$order_items" },
      { $match: { "order_items.order_status": "Delivered" } },
      {
        $lookup: {
          from: "products",
          localField: "order_items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category._id",
          name: { $first: "$category.name" },
          sales: { $sum: "$order_items.qty" },
          revenue: { $sum: "$order_items.total_price" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: 1,
          sales: 1,
          revenue: 1,
        },
      },
    ]);

    // Response
    res.status(200).json({
      success: true,
      message: "Dashboard Data",
      TotalCustomers,
      totalSales,
      totalOrders,
      TotalProducts,
      salesChart: salesData,
      bestProducts,
      bestCategory: bestCategories,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: err.message,
    });
  }
}

module.exports = { fetchDashboardData };

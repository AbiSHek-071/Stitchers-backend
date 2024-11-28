const Order = require("../../Models/order");
const calculateRefundAmount = require("../../utils/calculateRefundAmount");
const { refundAmounttoWallet } = require("../../utils/refundAmounttoWallet");

async function fetchOrders(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find()
      .populate("user")
      .populate("shipping_address")
      .populate("order_items.product")
      .sort({ placed_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
}

async function switchStatus(req, res) {
  try {
    const { orderId, itemId, newStatus } = req.params;

    const orderData = await Order.findById(orderId);

    if (!orderData) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const itemToUpdate = orderData.order_items.find(
      (item) => item._id.toString() === itemId
    );

    if (!itemToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    if (newStatus == "Delivered") {
      itemToUpdate.payment_status = "Paid";
      itemToUpdate.Delivered_on = new Date();
    }

    itemToUpdate.order_status = newStatus;

    await orderData.save();

    return res
      .status(200)
      .json({ success: true, message: "Order Status Updated" });
  } catch (err) {
    console.log("errr:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: err });
  }
}

async function respondToReturnReq(req, res) {
  try {
    const { orderId, itemId, request_status } = req.body;
    const orderData = await Order.findOne({ _id: orderId });
    const returnItem = orderData.order_items.find((item) => item._id == itemId);
    returnItem.returnReq.request_status = request_status;
    orderData.isReturnReq = false;
    if (request_status == "Accepted") {
      returnItem.order_status = "Returned";
      returnItem.payment_status = "Paid";
    } else {
      returnItem.order_status = "Return Rejected";
    }

    orderData.save();

    const refundAmount = calculateRefundAmount(orderData, itemId);

    refundAmounttoWallet(orderData.user, refundAmount);

    return res.status(200).json({
      success: true,
      message:
        request_status == "Accepted"
          ? `Return Request ${request_status} and Amount refunded to wallet`
          : `Return Request ${request_status}`,
    });
  } catch (err) {
    console.log(err);
  }
}

async function fetchOrderDetails(req, res) {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ order_id: id })
      .populate("user")
      .populate("shipping_address")
      .populate("order_items.product");
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Details fetch failed" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Details fetched succesfully", order });
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  fetchOrders,
  switchStatus,
  respondToReturnReq,
  fetchOrderDetails,
};

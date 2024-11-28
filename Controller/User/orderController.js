const Cart = require("../../Models/Cart");
const PDFDocument = require("pdfkit");
const Order = require("../../Models/order");
const Product = require("../../Models/product");
const Wallet = require("../../Models/wallet");
const calculateRefundAmount = require("../../utils/calculateRefundAmount");
const { refundAmounttoWallet } = require("../../utils/refundAmounttoWallet");
const product = require("../../Models/product");

async function createOrder(req, res) {
  try {
    const {
      user,
      cartItems,
      total_amount,
      total_discount,
      coupon_Discount,
      total_price_with_discount,
      shipping_address,
      payment_method,
      payment_status,
      cart_id,
    } = req.body;

    const products = [];

    //creating product array
    cartItems.forEach((item) => {
      if (item.qty >= 1) {
        products.push({
          product: item.productId._id,
          qty: item.qty,
          size: item.size,
          price: item.discountedAmount || item.salePrice,
          payment_status,
          discount: item.discount || 0,
          total_price: item.discountedAmount || item.salePrice,
        });
      }
    });
    //creating order collection document
    const order = await Order.create({
      user,
      order_items: products,
      order_status: "Pending",
      total_amount: total_amount,
      total_discount,
      coupon_discount: coupon_Discount,
      shipping_address,
      payment_method,
      total_price_with_discount: total_price_with_discount,
      shipping_fee: 0,
    });
    await order.save();

    const cart = await Cart.findById(cart_id);

    //filtering and removing the ordered item in the specific size from the cart
    const updatedCartItems = cart.items.filter((cartItem) => {
      return !order.order_items.some(
        (orderItem) =>
          orderItem.product.equals(cartItem.productId) &&
          orderItem.size === cartItem.size
      );
    });
    cart.items = updatedCartItems;
    await cart.save();
    manageProductQty(order.order_items);

    if (payment_method == "wallet") {
      let myWallet = await Wallet.findOne({ user: user });
      if (!myWallet) {
        return res.status(404).json({ message: "unable to find your wallet" });
      }
      myWallet.balance -= total_price_with_discount;
      const transactions = {
        order_id: order._id,
        transaction_date: new Date(),
        transaction_type: "debit",
        transaction_status: "completed",
        amount: total_price_with_discount,
      };
      myWallet.transactions.push(transactions);

      await myWallet.save();
    }

    return res
      .status(201)
      .json({ success: true, message: "Order Placed", order });
  } catch (err) {
    console.log(err);
  }
}

async function manageProductQty(order_items) {
  for (const item of order_items) {
    try {
      const product = await Product.findById(item.product);
      const sizeObject = product.sizes.find((size) => size.size === item.size);

      if (sizeObject) {
        sizeObject.stock -= item.qty;
        product.totalStock -= item.qty;
        await product.save();
      } else {
        console.warn(`Size ${item.size} not found for product ${product._id}`);
      }
    } catch (error) {
      console.error(`Error fetching product ${item.product}:`, error);
    }
  }
}

//function to calcuate and update the cancelled order size and stock
async function manageProductQtyAfterCancel(itemToUpdate) {
  try {
    const product = await Product.findById(itemToUpdate.product);

    const sizeObject = product.sizes.find(
      (size) => size.size === itemToUpdate.size
    );

    if (sizeObject) {
      sizeObject.stock += itemToUpdate.qty;
      product.totalStock += itemToUpdate.qty;

      await product.save();
    } else {
      console.warn(
        `Size ${itemToUpdate.size} not found for product ${product._id}`
      );
    }
  } catch (error) {
    console.error(`Error fetching product ${itemToUpdate.product}:`, error);
  }
}

async function fetchOrders(req, res) {
  try {
    const { _id } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find({ user: _id })
      .populate("user")
      .populate("shipping_address")
      .populate("order_items.product")
      .sort({ placed_at: -1 })
      .skip(skip)
      .limit(limit);

    if (!orders) {
      return res
        .status(404)
        .json({ success: true, message: "Order Fetch failed" });
    }
    return res.status(200).json({
      success: true,
      message: "Order Fetched Successfully",
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
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

async function cancelOrder(req, res) {
  try {
    const { order_id, item_id } = req.params;

    const orderData = await Order.findById(order_id);

    if (!orderData) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const itemToUpdate = orderData.order_items.find(
      (item) => item._id.toString() === item_id
    );

    if (!itemToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    itemToUpdate.order_status = "Cancelled";

    manageProductQtyAfterCancel(itemToUpdate);

    await orderData.save();
    if (orderData.payment_method !== "Cash on Delivery") {
      const refundAmount = calculateRefundAmount(orderData, item_id);

      refundAmounttoWallet(orderData.user, refundAmount);

      return res.status(200).json({
        success: true,
        message:
          "Your order has been successfully cancelled and Amount refunded to waller",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Your order has been successfully cancelled ",
    });
  } catch (err) {
    console.log(err);
    a;
    res.status(500).json({ success: false, message: "Server error" });
  }
}

//register return req
async function registerReturnReq(req, res) {
  try {
    const { reason, explanation, orderId, itemId } = req.body;

    if (!reason || !explanation || !orderId || !itemId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const orderData = await Order.findOne({ _id: orderId });
    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    const returnItem = orderData.order_items.find((item) => item._id == itemId);

    if (!returnItem) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    // Update the return request
    orderData.isReturnReq = true;
    returnItem.returnReq.reason = reason;
    returnItem.returnReq.explanation = explanation;
    returnItem.returnReq.request_status = "Pending";

    await orderData.save();

    return res
      .status(200)
      .json({ message: "Return request registered successfully" });
  } catch (err) {
    console.log(err);
  }
}

//invoice download
async function downloadInvoice(req, res) {
  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res
        .status(400)
        .send("Order data is required to generate an invoice.");
    }

    const pdfDoc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    pdfDoc.pipe(res);

    generateHeader(pdfDoc);
    generateInvoiceInfo(pdfDoc, orderData);
    generateAddressSection(pdfDoc, orderData);
    generateItemsTable(pdfDoc, orderData.order_items);
    generatePaymentSummary(pdfDoc, orderData);
    generateFooter(pdfDoc);

    pdfDoc.end();
  } catch (err) {
    console.error("Error generating invoice PDF:", err);
    res.status(500).send("Error generating invoice PDF");
  }
}

function generateHeader(pdfDoc) {
  // Add logo (you'll need to replace with your actual logo path)
  // pdfDoc.image('path/to/logo.png', 50, 45, { width: 50 });

  pdfDoc
    .fillColor("#444444")
    .fontSize(20)
    .text("Stitchers", 50, 57)
    .fontSize(10)
    .text("123 Fashion Street", 50, 80)
    .text("New Delhi, 110001", 50, 95)
    .moveDown();

  generateHr(pdfDoc, 120);
}

function generateInvoiceInfo(pdfDoc, orderData) {
  pdfDoc.fillColor("#444444").fontSize(20).text("Invoice", 50, 140);

  generateHr(pdfDoc, 165);

  const customerInformationTop = 180;

  pdfDoc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(orderData.order_id, 150, customerInformationTop)
    .font("Helvetica")
    .text("Order Date:", 50, customerInformationTop + 15)
    .text(
      new Date(orderData.placed_at).toLocaleDateString(),
      150,
      customerInformationTop + 15
    );

  generateHr(pdfDoc, 215);
}

function generateAddressSection(pdfDoc, orderData) {
  const address = orderData.shipping_address;
  if (!address) return;

  pdfDoc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Shipping Address:", 50, 235)
    .font("Helvetica")
    .fontSize(10)
    .text(address.name, 50, 255)
    .text(
      `${address.address}${address.landmark ? `, ${address.landmark}` : ""}`,
      50,
      270
    )
    .text(`${address.city}, ${address.district}`, 50, 285)
    .text(`${address.state} - ${address.pincode}`, 50, 300)
    .text(`Phone: ${address.phone}`, 50, 315)
    .text(`Email: ${address.email}`, 50, 330);

  generateHr(pdfDoc, 350);
}

function generateItemsTable(pdfDoc, items) {
  const invoiceTableTop = 370;
  const tableHeaders = ["Item", "Size", "Qty", "Price", "Total"];

  pdfDoc.font("Helvetica-Bold");
  generateTableRow(
    pdfDoc,
    invoiceTableTop,
    tableHeaders[0],
    tableHeaders[1],
    tableHeaders[2],
    tableHeaders[3],
    tableHeaders[4]
  );
  generateHr(pdfDoc, invoiceTableTop + 20);
  pdfDoc.font("Helvetica");

  let position = invoiceTableTop + 30;

  items.forEach((item) => {
    generateTableRow(
      pdfDoc,
      position,
      item.product?.name || "Unknown",
      item.size,
      item.qty,
      formatCurrency(item.price),
      formatCurrency(item.total_price)
    );
    position += 20;
  });

  generateHr(pdfDoc, position + 10);
  return position;
}

function generateTableRow(pdfDoc, y, item, size, quantity, price, total) {
  pdfDoc
    .fontSize(10)
    .text(item, 50, y, { width: 200, truncate: true })
    .text(size, 260, y, { width: 60, align: "center" })
    .text(quantity.toString(), 330, y, { width: 60, align: "center" })
    .text(price, 400, y, { width: 80, align: "right" })
    .text(total, 490, y, { width: 60, align: "right" });
}

function generatePaymentSummary(pdfDoc, orderData) {
  const subtotalPosition = 500;

  pdfDoc.fontSize(10).font("Helvetica");

  // Right-aligned labels and values
  generateSummaryRow(
    pdfDoc,
    subtotalPosition,
    "Subtotal:",
    formatCurrency(orderData.total_amount)
  );
  generateSummaryRow(
    pdfDoc,
    subtotalPosition + 20,
    "Discount:",
    `-${formatCurrency(orderData.total_discount)}`
  );
  generateSummaryRow(
    pdfDoc,
    subtotalPosition + 40,
    "Shipping:",
    formatCurrency(orderData.shipping_fee)
  );

  generateHr(pdfDoc, subtotalPosition + 65);

  // Total in bold
  pdfDoc.font("Helvetica-Bold");
  generateSummaryRow(
    pdfDoc,
    subtotalPosition + 80,
    "Total:",
    formatCurrency(orderData.total_price_with_discount)
  );
}

function generateSummaryRow(pdfDoc, y, label, value) {
  pdfDoc
    .text(label, 400, y, { width: 90, align: "right" })
    .text(value, 490, y, { width: 60, align: "right" });
}

function formatCurrency(amount) {
  return `Rs ${parseFloat(amount).toFixed(2)}`;
}

function generateFooter(pdfDoc) {
  generateHr(pdfDoc, 700);

  pdfDoc
    .fontSize(10)
    .text("Thank you for shopping with us!", 50, 720, { align: "center" })
    .text("For any queries, please contact support@stitchers.com", 50, 735, {
      align: "center",
    })
    .text("www.stitchers.com", 50, 750, { align: "center", color: "blue" });
}

function generateHr(pdfDoc, y) {
  pdfDoc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}
async function finishPayment(req, res) {
  try {
    const { orderId } = req.body;

    // Find the order by ID
    const orderData = await Order.findById(orderId);

    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update payment status for each order item
    orderData.order_items.forEach((item) => {
      item.payment_status = "Paid";
    });

    // Save the updated order
    await orderData.save();

    res.status(200).json({ message: "Payment Successfull" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred" });
  }
}

module.exports = {
  createOrder,
  fetchOrders,
  fetchOrderDetails,
  cancelOrder,
  registerReturnReq,
  downloadInvoice,
  finishPayment,
};

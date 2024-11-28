const Order = require("../../Models/order");
// const PDFDocument = require("pdfkit");
const PdfPrinter = require("pdfmake");
const PDFDocument = require("pdfkit-table");

///function to make filter query

function generateDateFilterQuery(filterType, startDate, endDate) {
  const now = new Date();
  // const filterQueries = {};
  const filterQueries = {
    order_items: {
      $elemMatch: { order_status: "Delivered" }, // Ensure at least one order item is delivered
    },
  };
  if (filterType === "custom" && startDate && endDate) {
    // Custom date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    filterQueries.placed_at = { $gte: start, $lte: end };
  } else if (filterType === "daily") {
    // Filter for today
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    filterQueries.placed_at = { $gte: startOfDay, $lte: endOfDay };
  } else if (filterType === "weekly") {
    // Filter for the current week
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    filterQueries.placed_at = { $gte: startOfWeek, $lte: endOfWeek };
  } else if (filterType === "monthly") {
    // Filter for the current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    filterQueries.placed_at = { $gte: startOfMonth, $lte: endOfMonth };
  } else if (filterType === "yearly") {
    // Filter for the current year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    filterQueries.placed_at = { $gte: startOfYear, $lte: endOfYear };
  }

  return filterQueries;
}

//fetch sales report
async function fetchSalesReport(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { filterType, startDate, endDate } = req.query;

    const filterQueries = generateDateFilterQuery(
      filterType,
      startDate,
      endDate
    );

    const totalSalesCount = await Order.countDocuments(filterQueries);
    const orders = await Order.find(filterQueries)
      .populate("user")
      .populate("shipping_address")
      .populate("order_items.product")
      .sort({ placed_at: -1 })
      .skip(skip)
      .limit(limit);

    let totalSales = orders.reduce((total, order) => {
      const orderTotal = order.order_items.reduce((sum, item) => {
        return sum + item.price * item.qty;
      }, 0);
      return total + orderTotal;
    }, 0);

    res.status(200).json({
      sucess: true,
      orders,
      totalSales,
      currentPage: page,
      totalPages: Math.ceil(totalSalesCount / limit),
    });
    // console.log(orders);
  } catch (err) {
    console.log(err);
  }
}

const dowloadSalesPDF = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;
    const filterQueries = generateDateFilterQuery(
      filterType,
      startDate,
      endDate
    );

    const reports = await Order.find(filterQueries)
      .populate("user")
      .populate("shipping_address")
      .populate("order_items.product")
      .sort({ placed_at: -1 });

    const pdfDoc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );
    pdfDoc.pipe(res);

    pdfDoc.on("pageAdded", () => {
      pdfDoc
        .rect(0, 0, pdfDoc.page.width, pdfDoc.page.height)
        .fillColor("white")
        .fill()
        .fillColor("black");
    });

    pdfDoc
      .rect(0, 0, pdfDoc.page.width, pdfDoc.page.height)
      .fillColor("white")
      .fill()
      .fillColor("black");

    pdfDoc.fontSize(20).text("Sales Report", { align: "center" }).moveDown(2);

    for (let index = 0; index < reports.length; index++) {
      const report = reports[index];

      // Check if there is enough space for the current report header
      if (pdfDoc.y + 100 > pdfDoc.page.height) {
        pdfDoc.addPage();
      }

      pdfDoc.fontSize(14).font("Helvetica-Bold");
      pdfDoc.text(`Order ${index + 1}:`).moveDown(0.5);

      pdfDoc.fontSize(10).font("Helvetica");
      pdfDoc.text(
        `Order Date: ${new Date(report.placed_at).toLocaleDateString()}`
      );
      pdfDoc.text(`Customer Name: ${report.user.name}`);
      pdfDoc.text(`Payment Method: ${report.payment_method}`);
      pdfDoc.text(`Delivery Status: ${report.order_status}`).moveDown(0.5);

      // Prepare table data
      const table = {
        title: "Product Details",
        headers: [
          "Product Name",
          "Quantity",
          "Unit Price (RS)",
          "Total Price (RS)",
          "Discount (RS)",
          "Coupon (RS)",
        ],
        rows: report.order_items.map((item) => [
          item.product.name,
          item.qty.toString(),
          (Number(item.price) || 0).toFixed(2),
          (Number(item.totalProductPrice) || 0).toFixed(2),
          (Number(report.coupon_discount) || 0).toFixed(2),
          (Number(report.total_discount) || 0).toFixed(2),
        ]),
      };

      // Check if there is enough space before adding the table
      if (pdfDoc.y + 150 > pdfDoc.page.height) {
        pdfDoc.addPage();
      }

      try {
        await pdfDoc.table(table, {
          prepareHeader: () => pdfDoc.font("Helvetica-Bold").fontSize(8),
          prepareRow: (row, i) => pdfDoc.font("Helvetica").fontSize(8),
          width: 500,
          columnsSize: [140, 50, 70, 70, 70, 70],
          padding: 5,
        });
      } catch (error) {
        console.error("Error generating table:", error);
      }

      // Ensure there's enough space for the final amount
      if (pdfDoc.y + 20 > pdfDoc.page.height) {
        pdfDoc.addPage();
      }

      pdfDoc.moveDown(0.5);
      pdfDoc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Final Amount: RS. ${report.total_price_with_discount}`);
      pdfDoc.moveDown();
    }

    pdfDoc.end();
  } catch (error) {
    console.error("Error generating sales report PDF:", error);
    res.status(500).send("Error generating sales report PDF");
  }
};

//Download sales report in excel format
const ExcelJS = require("exceljs");

async function downloadSalesExcel(req, res) {
  try {
    const { filterType, startDate, endDate } = req.query;
    const filterQueries = generateDateFilterQuery(
      filterType,
      startDate,
      endDate
    );

    const reports = await Order.find(filterQueries)
      .populate("user")
      .populate("shipping_address")
      .populate("order_items.product")
      .sort({ placed_at: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Create table design
    worksheet.columns = [
      { header: "Order Date", key: "orderDate", width: 20 },
      { header: "Customer Name", key: "customerName", width: 20 },
      { header: "Payment Method", key: "paymentMethod", width: 20 },
      { header: "Delivery Status", key: "deliveryStatus", width: 20 },
      { header: "Product Name", key: "productName", width: 25 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Unit Price (RS)", key: "unitPrice", width: 15 },
      { header: "Discount (RS)", key: "discount", width: 15 },
      { header: "Coupon (RS)", key: "couponDeduction", width: 15 },
      { header: "Final Amount (RS)", key: "finalAmount", width: 15 },
    ];

    // Add data to sheet
    reports.forEach((report) => {
      const orderDate = new Date(report.placed_at).toLocaleDateString();
      const products = report.order_items.map((item) => ({
        orderDate,
        customerName: report.user.name,
        paymentMethod: report.payment_method,
        deliveryStatus: report.order_status,
        productName: item.product.name,
        quantity: item.qty,
        unitPrice: item.price || 0,
        totalPrice: item.totalProductPrice || 0,
        discount: report.total_discount || 0,
        couponDeduction: report.coupon_discount || 0,
        finalAmount: report.total_price_with_discount || 0,
      }));

      // Add each product as a row
      products.forEach((product) => worksheet.addRow(product));
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=SalesReport.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ message: "Failed to generate sales report", error });
  }
}

module.exports = {
  fetchSalesReport,
  dowloadSalesPDF,
  downloadSalesExcel,
};

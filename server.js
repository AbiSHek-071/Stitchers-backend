require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const path = require("path");

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(cookieParser());

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_ORIGIN, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database successfully!");
  } catch (err) {
    console.error("Failed to connect to the database:", err.message);
  }
};

connectToDB();

const userRoute = require("./Routes/userRoute");
const adminRoute = require("./Routes/adminRoute");

app.use("/user", userRoute);
app.use("/admin", adminRoute);

app.listen(process.env.BACKEND_PORT, () => {
  console.log(`App running on ${process.env.BACKEND_PORT}`);
});

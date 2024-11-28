const bcrypt = require("bcrypt");
const Admin = require("../Models/admin"); 

async function createAdmin() {
  try {
    const adminPassword = "admin";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);


    const admin = new Admin({
      email: req.params.email,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}


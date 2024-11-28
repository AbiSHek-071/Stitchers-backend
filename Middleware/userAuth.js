require("dotenv").config();
const otpSchema = require("../Models/otpStore");
const User = require("../Models/UserModel")
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../utils/genarateAccessToken");


const verifyOtp = async (req, res, next) => {
  try {
    const { otp, email } = req.body;
    // Find the OTP data based on email
    const otpData = await otpSchema.findOne({ email });
    if (!otpData) {
      return res
        .status(404)
        .json({ success: false, message: "OTP not found." });
    }

    // Compare the provided OTP with the stored OTP
    if (otp === otpData.otp) {
  
      next(); // Proceed to the next middleware (register function)
    } else {
      console.log("Invalid OTP.");
      return res.status(401).json({ success: false, message: "Invalid OTP." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};



const jwtVerification = async (req, res, next) => {

  
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

  
    if (accessToken) {
      
      const Accessverified = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_KEY
        // "AccesstokenKeyShouldReplaceLater"
      );
    

   
      const user = await User.findById(Accessverified.id).select("-password");
      
      if (!user) {
        console.log("no user");
        return res
          .status(401)
          .json({ message: "Unauthorized: User not found" });
      }

      req.user = user;
      return next();
    }


    else if (refreshToken) {
      const RefreshVerified = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_KEY
        // "RefreshtokenKeyShouldReplaceLater"
      );
      

 
      const user = await User.findById(RefreshVerified.id).select("-password");
      if (!user) {
        console.log("no user");
        
        return res
          .status(401)
          .json({ message: "Unauthorized: User not found" });
      }

   
      const newAccessToken = generateAccessToken(user._id);

      
    
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: false, 
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000, 
      });

   
      req.user = user;
      return next();
    }

    console.log("no user");
    return res
      .status(401)
      .json({ message: "Unauthorized: No valid tokens found" });
  } catch (err) {
    console.log(err);
    return res
      .status(401)
      .json({ message: "Unauthorized: Token verification failed" });
  }
};
async function checkUserBlocked(req, res, next) {
  try {
    const { user } = req;
    
    const userData = await User.findById(user._id);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!userData.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive or blocked",
      });
    }
    console.log("berfore next");
    
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


module.exports = {
  verifyOtp,
  jwtVerification,
  checkUserBlocked,
};

//models
const User = require("../../Models/UserModel");
const otpSchema = require("../../Models/otpStore");
//utils
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const { mailSender } = require("../../utils/nodeMailer");
const otpEmailTemplate = require("../../utils/emailTemplate");
//functions
const generateAccessToken = require("../../utils/genarateAccessToken");
const generateRefreshToken = require("../../utils/genarateRefreshToken");
const { status } = require("express/lib/response");
const Wallet = require("../../Models/wallet");
const { inserMoneytoWallet } = require("../../utils/insertMoneytoWallet");

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const checkExist = await User.findOne({ email });
    if (checkExist) {
      return res
        .status(409)
        .json({ success: false, message: "E-mail already Exist" });
    }
    const otp = otpGenerator.generate(5, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    await otpSchema.create({ email, otp });
    const { subject, htmlContent } = otpEmailTemplate(otp);
    const mailRes = await mailSender(email, subject, htmlContent);

    return res
      .status(200)
      .json({ success: true, message: "OTP Send Successfully", otp });
  } catch (err) {
    console.log(err);
  }
};

const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const referalCode = `SNTC${[...Array(6)]
      .map(() => Math.random().toString(36).charAt(2).toUpperCase())
      .join("")}`;

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      referalCode,
    });
    return res.status(200).json({
      success: false,
      message: "Your are Registereed to Stitchers,Welcome",
    });
  } catch (err) {
    console.log(err);
  }
};

//sending otp

async function forgetPassword(req, res) {
  try {
    const { email } = req.body;
    const checkExist = await User.findOne({ email });
    if (!checkExist) {
      return res
        .status(404)
        .json({ success: false, message: "E-mail Does not  Exist" });
    }
    const otp = otpGenerator.generate(5, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    await otpSchema.create({ email, otp });
    const { subject, htmlContent } = otpEmailTemplate(otp);

    const mailRes = await mailSender(email, subject, htmlContent);

    return res
      .status(200)
      .json({ success: true, message: "OTP Send Successfully", otp });
  } catch (err) {
    console.log(err);
  }
}

// sending user id back after otp verification
async function forgotPasswordOtpVerification(req, res) {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "E-mail Does not  Exist" });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified Successfully",
      _id: userData._id,
    });
  } catch (err) {
    console.log();
  }
}

//resetting password
async function resetPassword(req, res) {
  try {
    const { newPassword, confirmPassword, _id } = req.body;

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Confirm password Do not Match" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedData = await User.findByIdAndUpdate(
      { _id },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedData) {
      return res
        .status(404)
        .json({ success: false, message: "Unable to reset password" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Password reseted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting the password.",
    });
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Email is not registered, Please Signup",
      });
    }

    const matchPass = await bcrypt.compare(password, userData.password);
    if (matchPass) {
      if (userData.isActive == false) {
        const message = `Your account is currently inactive, and access to the website is restricted...!`;
        return res.status(403).json({ success: false, message });
      }

      userData.password = undefined;

      const accessToken = generateAccessToken(userData._id);
      const refreshToken = generateRefreshToken(userData._id);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000, // 15 minutes expiration for access token
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration for refresh token
      });
      return res.status(200).json({
        success: true,
        message: "Login Successful, Welcome Back",
        userData,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  } catch (err) {
    console.error("Unexpected error during login:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { sub, name, email } = req.body;
    const userData = await User.findOne({ email });

    if (userData) {
      if (userData.googleId && userData.googleId == sub) {
        return res
          .status(200)
          .json({ success: true, message: "Login Successful", userData });
      } else if (userData.googleId && userData.googleId != sub) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized User" });
      } else if (!userData.googleId || userData.googleId === "") {
        userData.googleId = sub;
        await userData.save();

        return res.status(200).json({
          success: true,
          message: "Login Successful,Welcome Back",
          userData,
        });
      }
    } else {
      const newUser = new User({
        name: name,
        email: email,
        googleId: sub,
      });
      const userData = await newUser.save();
      return res.status(201).json({
        success: true,
        message: "You are Registered, Welcome to Stitchers",
        userData,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
async function editUser(req, res) {
  try {
    const { userId, name, email, phone } = req.body;
    const update = await User.findByIdAndUpdate(
      { _id: userId },
      { name, email, phone },
      { new: true }
    );
    if (!update) {
      return res
        .status(400)
        .json({ success: false, message: "Unable to update Profile" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Profile Updated", update });
  } catch (err) {
    console.log(err);
  }
}
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword, _id } = req.body;
    const userData = await User.findById(_id);
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      userData.password
    );
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credential unable to change password",
      });
    }
    if (newPassword != confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Confirm password does not match..!",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userData.password = hashedPassword;
    await userData.save();
    return res
      .status(200)
      .json({ success: true, message: "Password Changed successfully" });
  } catch (err) {
    console.log(err);
  }
}

async function referal(req, res) {
  try {
    const { referalCode, _id } = req.body;
    const referalAmount = 200;

    //find the refered user's data and verify referal code
    const RefereduserData = await User.findOne({ referalCode: referalCode });
    if (!RefereduserData) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Referal Code" });
    }

    //Add Referal Reward to User
    inserMoneytoWallet(referalAmount, _id);
    //Add Referal Reward to Refered User
    inserMoneytoWallet(referalAmount, RefereduserData._id);

    //change usedReferral to true to stop have the option to enter referal code
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { usedReferral: true },
      { new: true }
    );
    updatedUser.password = undefined;
    return res.status(200).json({
      success: true,
      message: "successfuly Collected the Referal reward to The Wallet",
      updatedUser,
    });
  } catch (err) {
    console.log(err);
  }
}

async function skipReferal(req, res) {
  try {
    const { _id } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { usedReferral: true },
      { new: true }
    );
    updatedUser.password = undefined;
    return res.status(200).json({
      success: true,
      updatedUser,
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  sendOtp,
  register,
  login,
  googleAuth,
  editUser,
  forgetPassword,
  forgotPasswordOtpVerification,
  resetPassword,
  changePassword,
  referal,
  skipReferal,
};

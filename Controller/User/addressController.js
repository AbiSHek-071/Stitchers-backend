const Address = require("../../Models/address");
const { findByIdAndUpdate } = require("../../Models/UserModel");
async function addAddress(req, res) {
  try {
    const { newAddress } = req.body;

    if (!newAddress) {
      return res.status(400).json({
        success: false,
        message: "No address data provided",
      });
    }

    const {
      user,
      name,
      email,
      phone,
      address,
      pincode,
      landmark,
      city,
      district,
      state,
    } = newAddress;

    const data = await Address.create({
      user,
      name,
      email,
      phone,
      address,
      pincode,
      landmark,
      city,
      district,
      state,
    });

    return res.status(200).json({
      success: true, 
      message: "Address added to profile",
    });
  } catch (err) {
    console.log(err);
    
    return res.status(500).json({
      success: false,
      message: "Error adding address",
      error: err.message,
    });
  }
}

async function fetchAddress(req,res) {
  try {
    const _id = req.params.id;
    const address = await Address.find({ user : _id});
    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      address,
    });
    
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error adding address",
      error: err.message,
    });
  }
}

async function editAddress(req,res) {
  try {
     const { newAddress } = req.body;

     if (!newAddress) {
       return res.status(400).json({
         success: false,
         message: "No address data provided",
       });
     }

     const {
       _id,
       name,
       email,
       phone,
       address,
       pincode,
       landmark,
       city,
       district,
       state,
     } = newAddress;

     const data = await Address.findByIdAndUpdate(
       { _id },
       { name, email, phone, address, pincode, landmark, city, district, state },
       {new:true}
     );
     if (!data){
      return res.status(400).json({
        success: false,
        message: "Address updated failed",
      });
     }
       return res.status(200).json({
         success: true,
         message: "Address updated successfuly",
       });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error updating address",
      error: err.message,
    });
  }
}

async function deleteAddress(req,res) {
  try {
    const _id = req.params.id;
    const deleted = await Address.findByIdAndDelete({_id})
    if(!deleted){
      return res
        .status(200)
        .json({ success: false, message: "Unable to delete the Address" });
    }
    return res.status(400).json({ success: true, message: "Address Deleted" });
  } catch (err) {
   console.log(err);
   return res.status(500).json({
     success: false,
     message: "Error deleting address",
     error: err.message,
   });
  }
}
module.exports = {
    addAddress,
    fetchAddress,
    editAddress,
    deleteAddress,
} 

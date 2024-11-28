const nodemailer = require("nodemailer");
const mailSender = async (email,title,body)=>{
    try{
        let transpoter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          auth: {
            user: process.env.EMAIL_SENDER,
            pass: process.env.APP_PASSWORD,
          },
        });
        let info= await transpoter.sendMail({
            from :"Abhishek P",
            to:email,
            subject:"OTP VERIFICATION FROM STICHERS",
            html:body,
        });
        return info;
        
    }catch(err){
        console.log(err);
        
    }
}
module.exports = {mailSender};
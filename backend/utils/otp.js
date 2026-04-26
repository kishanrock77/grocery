const OtpModel = require("../models/Otp");

async function generateAndSaveOtp(mobile, type = "register") {

  // 🔥 abhi static OTP
  const otp = "1111";

  await OtpModel.findOneAndUpdate(
    { mobile },
    { otp, type },
    { upsert: true, new: true }
  );

  // 👉 future me yaha WhatsApp call kar dena
  // sendWhatsAppOtp(mobile, otp);

  return otp;
}

module.exports = { generateAndSaveOtp };
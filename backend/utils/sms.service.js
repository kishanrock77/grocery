
 
 const axios = require("axios");

const AUTH_KEY =  '521230AQMfDBMK6a41edccP1';
const INTEGRATED_NUMBER = "917827382317";
const TEMPLATE_NAME = "creation";

async function sendOtp(mobile, otp, type) {
  try {
    const response = await axios.post(
      "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
      {
        integrated_number: INTEGRATED_NUMBER,
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: TEMPLATE_NAME,
            language: {
              code: "en",
              policy: "deterministic"
            },
            namespace: null,
            to_and_components: [
              {
                to: [`91${mobile}`],
                components: {
                  header_1: {
                    type: "image",
                    value: "https://your-domain.com/images/header.jpg"
                  },
                  body_1: {
                    type: "text",
                    value: otp.toString()
                  },
                  body_2: {
                    type: "text",
                    value: type
                  }
                }
              }
            ]
          }
        }
      },
      {
        headers: {
          authkey: AUTH_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("WhatsApp Response:", response.data);
    return response.data;

  } catch (error) {
    console.error(
      "MSG91 Error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { sendOtp };
const axios = require('axios');

const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

async function sendOtp(mobile, otp) {
  try {

    const response = await axios.post(
      'https://control.msg91.com/api/v5/otp',
      {
        template_id: TEMPLATE_ID,
        mobile: `91${mobile}`,
        otp: otp
      },
      {
        headers: {
          authkey: AUTH_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error(
      'MSG91 Error:',
      error.response?.data || error.message
    );

    throw error;
  }
}

module.exports = { sendOtp };
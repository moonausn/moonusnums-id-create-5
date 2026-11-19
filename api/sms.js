const axios = require('axios');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ site: "Moon US Nums", error: "Missing token" });
  }

  // Possible API endpoints (jo bhi pehle kaam kare)
  const endpoints = [
    `https://api5-sms.top/api/inbox/${token}`,
    `https://api5-sms.top/api/assignment/${token}`,
    `https://api5-sms.top/api/orders/${token}`,
    `https://api5-sms.top/api/inbox/${token}/data`,
  ];

  let data = null;

  for (const url of endpoints) {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Referer": `https://api5-sms.top/inbox/${token}`,
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      // Check if response is JSON and has otp_code
      if (response.data && typeof response.data === 'object') {
        if (response.data.order && response.data.order.otp_records) {
          data = response.data;
          break;
        }
      }
    } catch (e) {
      // Ignore and try next
    }
  }

  // Agar koi endpoint kaam na kare to waiting
  if (!data) {
    return res.status(200).json({
      site: "Moon US Nums",
      status: "waiting",
      message: "⏳ Waiting for OTP... (API endpoint not found)"
    });
  }

  // OTP extract karo
  const otpRecords = data.order?.otp_records || [];
  const hasOtp = data.order?.has_received_sms === true && otpRecords.length > 0;

  if (!hasOtp) {
    return res.status(200).json({
      site: "Moon US Nums",
      status: "waiting",
      message: "⏳ Waiting for OTP..."
    });
  }

  const latestOtp = otpRecords[otpRecords.length - 1];
  const code = latestOtp.otp_code;

  return res.status(200).json({
    site: "Moon US Nums",
    status: "success",
    code: code
  });
}

const axios = require('axios');

export default async function handler(req, res) {
  // Cache disable
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Token ko URL ke path se nikalna (e.g., /api/sms/194d615f...)
  const pathParts = req.url.split('/');
  const token = pathParts[pathParts.length - 1];

  if (!token || token === 'sms') {
    return res.status(400).json({ 
      site: "Moon US Nums", 
      error: "Missing token in URL path" 
    });
  }

  const target = `https://api5-sms.top/inbox/${token}`;

  try {
    const response = await axios.get(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://api5-sms.top/",
      },
      timeout: 15000,
      transformResponse: [(data) => data],
      validateStatus: () => true,
    });

    let raw = response.data;
    if (typeof raw !== 'string') raw = JSON.stringify(raw);

    // Agar response JSON hai to parse karo, warna plain text hi bhej do
    let data = null;
    try { data = JSON.parse(raw); } catch (e) {}

    // Agar JSON mila aur usme code hai
    if (data && (data.code || data.otp_code || (data.codes && data.codes[0]))) {
      const code = data.code || data.otp_code || data.codes[0];
      return res.status(200).json({
        site: "Moon US Nums",
        status: "success",
        code: code,
      });
    }

    // Agar plain text hai (jaise abhi "no otp recived yet")
    return res.status(200).json({
      site: "Moon US Nums",
      status: "waiting",
      raw_response: raw,
    });

  } catch (error) {
    const errorMsg = error.response
      ? `Upstream Error: ${error.response.status}`
      : `Fetch Error: ${error.message}`;
    return res.status(500).json({
      site: "Moon US Nums",
      error: errorMsg,
    });
  }
}

const axios = require('axios');

export default async function handler(req, res) {
  // Cache disable
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ site: "Moon US Nums", error: "Missing token" });
  }

  const target = `https://api5-sms.top/inbox/${token}`;

  try {
    const response = await axios.get(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://api5-sms.top/",
      },
      timeout: 15000,
      transformResponse: [(data) => data], // Raw HTML string chahiye
      validateStatus: () => true,
    });

    let rawHtml = response.data;

    // HTML ke andar se <main> tag ka text nikalne ke liye regex
    const mainMatch = rawHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    let extractedText = "";

    if (mainMatch && mainMatch[1]) {
      // Agar text ke andar koi HTML tag hai to usay hata dein
      extractedText = mainMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // === AGAR OTP NAHI AAYA (Waiting) ===
    if (!extractedText || extractedText.toLowerCase().includes('no otp') || extractedText.toLowerCase().includes('waiting')) {
      return res.status(200).json({
        site: "Moon US Nums",
        status: "waiting",
        message: "⏳ Waiting for OTP..."
      });
    }

    // === AGAR OTP AA GAYA (Digits extract karein) ===
    const codeMatch = extractedText.match(/\d{4,8}/);
    if (codeMatch) {
      return res.status(200).json({
        site: "Moon US Nums",
        status: "success",
        code: codeMatch[0]
      });
    }

    // Fallback: Agar kuch aur text hai
    return res.status(200).json({
      site: "Moon US Nums",
      status: "success",
      code: extractedText
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

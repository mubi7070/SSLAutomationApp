export default async function handler(req, res) {
    const { code } = req.query; // Get the authorization code from URL
  
    if (!code) {
      return res.status(400).json({ error: "Authorization code missing" });
    }
  
    try {
      // Exchange the authorization code for an access token

        console.log("ZOHO_CLIENT_ID:", process.env.ZOHO_CLIENT_ID);
        console.log("ZOHO_CLIENT_SECRET:", process.env.ZOHO_CLIENT_SECRET);
        console.log("ZOHO_REDIRECT_URI:", process.env.ZOHO_REDIRECT_URI);

      const tokenResponse = await fetch("https://accounts.zoho.com/oauth/v2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.ZOHO_CLIENT_ID,  // Use environment variables
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          redirect_uri: process.env.ZOHO_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
  
      const tokenData = await tokenResponse.json();
  
      if (tokenData.access_token) {
        // Store the token securely (e.g., in a database or session)
        return res.status(200).json({
          message: "Authentication successful",
          tokenData,
        });
      } else {
        return res.status(400).json({ error: "Failed to retrieve token", details: tokenData });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
  
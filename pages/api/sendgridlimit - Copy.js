import axios from 'axios';

export default async function handler(req, res) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const ADMIN_PASSWORD = process.env.SENDGRID_ADMIN_PASSWORD;

  try {
    if (req.method === 'GET') {
      if (req.query.username) {
        // First get subuser details
        const subuserResponse = await axios.get(
          `https://api.sendgrid.com/v3/subusers/${req.query.username}`,
          {
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Then get credit details using on-behalf-of header
        const creditsResponse = await axios.get(
          `https://api.sendgrid.com/v3/user/credits`,
          {
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
              'on-behalf-of': req.query.username
            }
          }
        );

        // Combine both responses
        const combinedData = {
          ...subuserResponse.data,
          credits: creditsResponse.data
        };

        return res.status(200).json({ 
          subuser: {
            ...combinedData,
            monthly_limit: creditsResponse.data.total,
            remaining: creditsResponse.data.remain,
            used: creditsResponse.data.used,
            overdrawn: creditsResponse.data.overage
          }
        });
      }

      // List all subusers (existing working code)
      const response = await axios.get('https://api.sendgrid.com/v3/subusers', {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const subusersArray = Array.isArray(response.data) ? response.data : Object.values(response.data);
      return res.status(200).json({ subusers: subusersArray });

    } else if (req.method === 'POST') {
      if (req.body.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      return res.status(403).json({
        error: 'Updating subuser limits requires enterprise API access. Contact SendGrid support.'
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('SendGrid API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.errors?.[0]?.message || 'SendGrid API Error'
    });
  }
}
import axios from 'axios';
const USERS = JSON.parse(process.env.SENDGRID_USERS || '[]');

export default async function handler(req, res) {
  
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const absoluteUrl = `${protocol}://${host}/api/sendgridsheet`;
  //const ADMIN_PASSWORD = process.env.SENDGRID_ADMIN_PASSWORD;

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
      // Password verification

      const user = USERS.find(u => 
          u.username === req.body.usernameInput && 
          u.password === req.body.userPassword
      );

      if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
      }
      // if (req.body.password !== ADMIN_PASSWORD) {
      //   return res.status(401).json({ error: 'Invalid password' });
      // }

      // Validate input
      if (!req.body.username || !req.body.newLimit) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Update temporary limit using SendGrid API
      const updateResponse = await axios.patch(
        `https://api.sendgrid.com/v3/subusers/${req.body.username}/credits/remaining`,
        { allocation_update: Number(req.body.newLimit) },
        {
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );


      try {
          await axios.post(absoluteUrl, {
              subAccount: req.body.username,
              credits: req.body.newLimit,
              date: new Date().toLocaleDateString("en-US"),
              personName: user.name,
              username: req.body.usernameInput,
              fdTicket: req.body.fdTicket
          });
      } catch (sheetError) {
          console.error('Google Sheet logging failed:', sheetError);
      }

      // Fetch updated credit information
      const creditsResponse = await axios.get(
        `https://api.sendgrid.com/v3/user/credits`,
        {
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
            'on-behalf-of': req.body.username
          }
        }
      );

      

      return res.status(200).json({
        updatedAccount: {
          username: req.body.username,
          monthly_limit: creditsResponse.data.total,
          remaining: creditsResponse.data.remain,
          used: creditsResponse.data.used,
          overdrawn: creditsResponse.data.overage
        }
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('SendGrid API Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.errors?.[0]?.message || 
      'Failed to update temporary limit';
    res.status(500).json({ error: errorMessage });
  }
}
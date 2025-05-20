import axios from 'axios';
const USERS = JSON.parse(process.env.SENDGRID_USERS || '[]');

export default async function handler(req, res) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  // Handle Suppressions Endpoint First
  if (req.url.includes('/api/sendgridlimit/suppressions')) {
    try {
      const { type, username } = req.query;
      const endpoints = {
        bounces: 'suppression/bounces',
        invalids: 'suppression/invalid_emails',
        blocks: 'suppression/blocks'
      };

      if (!endpoints[type]) {
        return res.status(400).json({ error: 'Invalid suppression type' });
      }

      const response = await axios.get(`https://api.sendgrid.com/v3/${endpoints[type]}`, {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
          ...(username && { 'on-behalf-of': username })
        },
        params: { limit: 1000 },
        validateStatus: () => true // Important to handle non-200 responses
      });

      if (response.status >= 400) {
        console.error('SendGrid Suppression Error:', {
          status: response.status,
          data: response.data
        });
        return res.status(response.status).json({ 
          error: response.data?.errors?.[0]?.message || 'Failed to fetch suppression data'
        });
      }

      return res.status(200).json({ 
        data: response.data.map(item => ({
          email: item.email,
          created: item.created,
          reason: item.reason || 'N/A'
        }))
      });

    } catch (error) {
      console.error('Suppression API Error:', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to process suppression request'
      });
    }
  }




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
        
        else {
        // New paginated implementation for all subusers
        let allSubusers = [];
        let limit = 500; // Max allowed by SendGrid API
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await axios.get('https://api.sendgrid.com/v3/subusers', {
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json'
            },
            params: {
              limit,
              offset,
              region: 'all',
              include_region: false
            }
          });

          const subusersChunk = Array.isArray(response.data) ? response.data : [];
          allSubusers = [...allSubusers, ...subusersChunk];

          // Check if we've reached the end of the list
          if (subusersChunk.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        }

        return res.status(200).json({ subusers: allSubusers });
      }
  
      } else if (req.method === 'POST') {

      const user = USERS.find(u => 
          u.username === req.body.usernameInput && 
          u.password === req.body.userPassword
      );

      if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
      }

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
          await axios.post(`${process.env.BASE_URL}/api/sendgridsheet`, {
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
      'Failed to process SendGrid request';
    res.status(500).json({ error: errorMessage });
  }

}
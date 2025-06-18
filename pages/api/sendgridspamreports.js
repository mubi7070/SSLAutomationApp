import axios from 'axios';

export default async function handler(req, res) {
  const { username } = req.query;
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  try {
    // Determine region
    let baseUrl = 'https://api.sendgrid.com';
    try {
      await axios.get('https://api.sendgrid.com/v3/user/credits', {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'on-behalf-of': username
        }
      });
    } catch (globalError) {
      if (globalError.response?.status === 403) {
        await axios.get('https://api.eu.sendgrid.com/v3/user/credits', {
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'on-behalf-of': username
          }
        });
        baseUrl = 'https://api.eu.sendgrid.com';
      }
    }

    // Fetch spam reports
    const response = await axios.get(
      `${baseUrl}/v3/suppression/spam_reports`,
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
          'on-behalf-of': username
        },
        params: { limit: 500 },
        validateStatus: () => true
      }
    );

    if (response.status >= 400) {
      const errorMsg = response.data?.errors?.[0]?.message || 'Failed to fetch spam reports';
      return res.status(response.status).json({ error: errorMsg });
    }

    // Format response data
    const items = response.data.map(item => ({
      email: item.email,
      created: item.created
    }));

    return res.status(200).json({ data: items });
  } catch (error) {
    console.error('Spam Reports API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process spam reports request'
    });
  }
}
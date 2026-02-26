import axios from 'axios';
import { getConfig } from '@/lib/config';

const ENDPOINT_MAP = {
  bounces: 'bounces',
  blocks: 'blocks',
  invalids: 'invalid_emails',
  spam_reports: 'spam_reports'
};

export default async function handler(req, res) {
  const { type, username, emails } = req.body;

  // Get config from database
  const config = await getConfig();
  const SENDGRID_API_KEY = config.SENDGRID_API_KEY;

  if (!type || !username || !emails || !Array.isArray(emails)) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if (!ENDPOINT_MAP[type]) {
    return res.status(400).json({ error: 'Invalid suppression type' });
  }

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

    // Delete emails sequentially
    const results = [];
    for (const email of emails) {
      try {
        const response = await axios.delete(
          `${baseUrl}/v3/suppression/${ENDPOINT_MAP[type]}/${encodeURIComponent(email)}`,
          {
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              'on-behalf-of': username,
              'Content-Type': 'application/json'
            },
            validateStatus: () => true
          }
        );

        results.push({
          email,
          status: response.status,
          success: response.status === 204
        });
      } catch (error) {
        results.push({
          email,
          status: 500,
          success: false,
          error: error.message
        });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Suppression Delete API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process deletion request'
    });
  }
}
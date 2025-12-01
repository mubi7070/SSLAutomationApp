// pages/api/sendgridlimit/suppressions.js
import axios from 'axios';
import { getConfig } from '../lib/config';

export default async function handler(req, res) {
  // Get config from database
  const config = await getConfig();
  const SENDGRID_API_KEY = config.SENDGRID_API_KEY;
  
  const { type, username, limit = 500, offset = 0 } = req.query;

  try {
    // Validate request
    if (!type || !['bounces', 'invalids', 'blocks'].includes(type)) {
      return res.status(400).json({ error: 'Invalid suppression type' });
    }

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit), 500);
    if (parsedLimit < 1) {
      return res.status(400).json({ error: 'Limit must be ≥ 1' });
    }

    // Map types to SendGrid endpoints
    const endpoints = {
      bounces: 'suppression/bounces',
      invalids: 'suppression/invalid_emails',
      blocks: 'suppression/blocks'
    };

    // Fetch data from SendGrid
    const response = await axios.get(
      `https://api.sendgrid.com/v3/${endpoints[type]}`,
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
          ...(username && { 'on-behalf-of': username })
        },
        params: { 
          limit: parsedLimit,
          offset: parseInt(offset) || 0
        }
      }
    );

    // Transform response
    const data = response.data.map(item => ({
      email: item.email,
      created: item.created,
      reason: item.reason || 'N/A'
    }));

    return res.status(200).json({ 
      data,
      pagination: {
        limit: parsedLimit,
        offset: parseInt(offset) || 0
      }
    });
    
  } catch (error) {
    console.error('Suppression API Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data?.errors?.[0]?.message ||
             'Failed to fetch suppression data'
    });
  }
}
import axios from 'axios';
import { getConfig } from '../lib/config';

export default async function handler(req, res) {
    // Get config from database
  const config = await getConfig();
  const SENDGRID_API_KEY = config.SENDGRID_API_KEY;

  const { type, username } = req.query;

  try {
    // Validate request
    if (!type || !['domains', 'links'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }
    if (!username) {
      return res.status(400).json({ error: 'Subuser username is required' });
    }

    // Verify subuser exists first
    try {
      await axios.get(`https://api.sendgrid.com/v3/subusers/${username}`, {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      return res.status(404).json({ error: 'Subuser not found' });
    }

    // Configure endpoints
    const endpoints = {
      domains: {
        url: 'whitelabel/domains',
        params: {
          username: username,
          limit: 1000
        }
      },
      links: {
        url: 'whitelabel/links',
        params: {
          username: username,
          limit: 1000
        }
      }
    };

    const response = await axios.get(
      `https://api.sendgrid.com/v3/${endpoints[type].url}`,
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
          'on-behalf-of': username
        },
        params: endpoints[type].params
      }
    );

    // Transform response
    const transformed = response.data.map(item => ({
      id: item.id,
      domain: item.domain,
      subdomain: item.subdomain,
      valid: item.valid,
      default: item.default || false,
      dns: {
        mail_cname: item.dns?.mail_cname  || null,
        domain_cname: item.dns?.domain_cname  || null
      }
    }));

    return res.status(200).json({ data: transformed });

  } catch (error) {
    console.error('Sender Auth Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.errors?.[0]?.message || 
      'Failed to fetch authentication data';
    return res.status(500).json({ error: errorMessage });
  }
}
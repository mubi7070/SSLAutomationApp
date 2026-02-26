import axios from 'axios';
import { getConfig } from '@/lib/config';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  try {
    const config = await getConfig();
    const SENDGRID_API_KEY = config.SENDGRID_API_KEY;

    if (req.url.includes('/api/sendgridlimit/suppressions')) {
      try {
        const { type, username } = req.query;
        const endpoints = { bounces: 'suppression/bounces', invalids: 'suppression/invalid_emails', blocks: 'suppression/blocks' };
        if (!endpoints[type]) return res.status(400).json({ error: 'Invalid suppression type' });

        const response = await axios.get(`https://api.sendgrid.com/v3/${endpoints[type]}`, {
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
            ...(username && { 'on-behalf-of': username })
          },
          params: { limit: 1000 },
          validateStatus: () => true
        });

        if (response.status >= 400) {
          return res.status(response.status).json({ error: response.data?.errors?.[0]?.message || 'Failed to fetch suppression data' });
        }

        return res.status(200).json({ 
          data: response.data.map(item => ({ email: item.email, created: item.created, reason: item.reason || 'N/A' }))
        });
      } catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to process suppression request' });
      }
    }

    if (req.method === 'GET') {
      if (req.query.username) {
        const subuserResponse = await axios.get(`https://api.sendgrid.com/v3/subusers/${req.query.username}`, {
          headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' }
        });
        const creditsResponse = await axios.get(`https://api.sendgrid.com/v3/user/credits`, {
          headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json', 'on-behalf-of': req.query.username }
        });
        const combinedData = { ...subuserResponse.data, credits: creditsResponse.data };

        return res.status(200).json({ 
          subuser: {
            ...combinedData,
            monthly_limit: creditsResponse.data.total,
            remaining: creditsResponse.data.remain,
            used: creditsResponse.data.used,
            overdrawn: creditsResponse.data.overage
          }
        });
      } else {
        let allSubusers = [];
        let limit = 500; 
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await axios.get('https://api.sendgrid.com/v3/subusers', {
            headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
            params: { limit, offset, region: 'all', include_region: false }
          });
          const subusersChunk = Array.isArray(response.data) ? response.data : [];
          allSubusers = [...allSubusers, ...subusersChunk];

          if (subusersChunk.length < limit) hasMore = false;
          else offset += limit;
        }
        return res.status(200).json({ subusers: allSubusers });
      }

    } else if (req.method === 'POST') {
      const connection = await pool.getConnection();

      try {
        const [users] = await connection.execute(
          'SELECT username, password, name FROM app_users WHERE username = ? AND is_active = TRUE',
          [req.body.usernameInput]
        );

        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];

        // STRICT CHECK: Only accepts bcrypt hashed passwords
        const isPasswordValid = await bcrypt.compare(req.body.userPassword, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!req.body.username || !req.body.newLimit) return res.status(400).json({ error: 'Missing required fields' });

        await axios.patch(
          `https://api.sendgrid.com/v3/subusers/${req.body.username}/credits/remaining`,
          { allocation_update: Number(req.body.newLimit) },
          { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' } }
        );

        try {
          await connection.execute(
            `INSERT INTO sendgrid_limit_logs (sub_account, credits_adjusted, person_name, username, ticket) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.body.username, req.body.newLimit, user.name, req.body.usernameInput, req.body.fdTicket]
          );
        } catch (dbError) {
          console.error('Database logging failed:', dbError);
        }

        const creditsResponse = await axios.get(`https://api.sendgrid.com/v3/user/credits`, {
          headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json', 'on-behalf-of': req.body.username }
        });

        return res.status(200).json({
          updatedAccount: {
            username: req.body.username,
            monthly_limit: creditsResponse.data.total,
            remaining: creditsResponse.data.remain,
            used: creditsResponse.data.used,
            overdrawn: creditsResponse.data.overage
          }
        });

      } finally {
        connection.release();
      }

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('SendGrid API Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.errors?.[0]?.message || 'Failed to process SendGrid request' });
  }
}
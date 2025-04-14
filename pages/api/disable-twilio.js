
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accountSid, authToken } = req.body;

  if (!accountSid || !authToken) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }

  try {
    const client = twilio(accountSid, authToken);
    const account = await client.api.v2010.accounts(accountSid).update({ status: "suspended" });
    
    res.status(200).json({ 
      success: true,
      message: `${account.sid} - Account suspended successfully`
    });
  } catch (error) {
    console.error('Twilio API Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to suspend account' 
    });
  }
}
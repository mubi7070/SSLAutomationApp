import client from '@sendgrid/client';
client.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Properly encode the query parameter
    const query = `from_email="${username}"`;
    const encodedQuery = encodeURIComponent(query);
    
    const queryParams = {
      limit: 100,
      query: encodedQuery
    };

    const request = {
      url: `/v3/messages`,
      method: "GET",
      qs: queryParams,
    };

    const [response, body] = await client.request(request);
    
    if (response.statusCode !== 200) {
      throw new Error('Failed to fetch activity data');
    }
    
    res.status(200).json({ messages: body.messages || [] });
  } catch (error) {
    console.error('Activity Feed Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch activity data',
      details: error.response?.body?.errors || null
    });
  }
}
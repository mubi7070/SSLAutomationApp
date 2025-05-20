import { getCookie } from 'cookies-next';

export default function handler(req, res) {
  try {
    const sessionToken = getCookie('sessionToken', { req, res });
    const users = JSON.parse(process.env.APP_USERS || '[]');
    
    if (!sessionToken) {
      return res.status(401).json({ authenticated: false });
    }

    // Find user by username from session token
    const user = users.find(u => u.username === sessionToken);
    
    if (user) {
      return res.status(200).json({
        authenticated: true,
        user: {
          username: user.username,
          name: user.name
        }
      });
    }

    return res.status(401).json({ authenticated: false });
  } catch (error) {
    return res.status(500).json({ authenticated: false });
  }
}
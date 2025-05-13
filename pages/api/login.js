export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  try {
    const users = JSON.parse(process.env.APP_USERS || '[]');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
      return res.status(200).json({ success: true, user: { username: user.username, name: user.name } });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

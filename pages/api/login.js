// pages/api/login.js
import { setCookie } from 'cookies-next';
import bcrypt from 'bcryptjs';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  console.log('Login attempt for:', username);

  try {
    const users = JSON.parse(process.env.APP_USERS || '[]');
    console.log('Loaded users:', users);

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    console.log('Found user:', user);

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // const passwordValid = bcrypt.compareSync(password, user.password);
    // console.log('Password valid:', passwordValid);

    // if (!passwordValid) {
    //   return res.status(401).json({ success: false, message: 'Invalid credentials' });
    // }

    

    setCookie('sessionToken', user.username, {
      req,
      res,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict',
      path: '/',
    });

    return res.status(200).json({ 
      success: true, 
      user: { 
        username: user.username, 
        name: user.name 
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
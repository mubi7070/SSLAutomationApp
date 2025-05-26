import { deleteCookie } from 'cookies-next';

export default function handler(req, res) {
  deleteCookie('sessionToken', { req, res });
  res.status(200).json({ success: true });
}

// import { getCookie } from 'cookies-next';

// export default function handler(req, res) {
//   try {
//     const sessionToken = getCookie('sessionToken', { req, res });
//     const users = JSON.parse(process.env.APP_USERS || '[]');
    
//     const user = users.find(u => u.username === sessionToken);
    
//     return res.status(user ? 200 : 401).json({
//       authenticated: !!user,
//       user: user ? { 
//         username: user.username, 
//         name: user.name 
//       } : null
//     });
//   } catch (error) {
//     return res.status(500).json({ authenticated: false });
//   }
// }
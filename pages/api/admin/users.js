import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });

  let connection;
  try {
    connection = await pool.getConnection();
    
    const [userRows] = await connection.execute(
      'SELECT is_admin FROM app_users WHERE username = ? AND is_active = TRUE',
      [authHeader]
    );

    if (userRows.length === 0 || !userRows[0].is_admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      let query = 'SELECT id, username, name, email, is_admin, is_active, created_at, last_login FROM app_users WHERE 1=1';
      const params = [];

      if (req.query.search) {
        query += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)';
        const searchTerm = `%${req.query.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      if (req.query.role && req.query.role !== 'all') {
        query += ' AND is_admin = ?';
        params.push(req.query.role === 'admin' ? 1 : 0);
      }
      if (req.query.status && req.query.status !== 'all') {
        query += ' AND is_active = ?';
        params.push(req.query.status === 'active' ? 1 : 0);
      }
      
      if (req.query.single && req.query.id) {
        query = 'SELECT id, username, password, name, email, is_admin, is_active, created_at, last_login FROM app_users WHERE id = ?';
        params.length = 0;
        params.push(req.query.id);
        
        const [user] = await connection.execute(query, params);
        if (user.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
        
        return res.status(200).json({ 
          success: true, 
          user: { ...user[0], is_admin: Boolean(user[0].is_admin), is_active: Boolean(user[0].is_active) }
        });
      }
      
      query += ' ORDER BY created_at DESC';
      const [users] = await connection.execute(query, params);
      
      return res.status(200).json({ 
        success: true, 
        users: users.map(user => ({ ...user, is_admin: Boolean(user.is_admin), is_active: Boolean(user.is_active) }))
      });
    }
    
    if (req.method === 'POST') {
      const { username, password, name, email, is_admin } = req.body;
      if (!username || !password || !name) return res.status(400).json({ success: false, error: 'Missing required fields' });
      
      // Hash password before inserting new user
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await connection.execute(
        'INSERT INTO app_users (username, password, name, email, is_admin) VALUES (?, ?, ?, ?, ?)',
        [username, hashedPassword, name, email || null, is_admin ? 1 : 0]
      );
      return res.status(200).json({ success: true });
    }
    
    if (req.method === 'PUT') {
      const { id, username, password, name, email, is_admin, is_active } = req.body;
      if (!id || !username || !name) return res.status(400).json({ success: false, error: 'Missing required fields' });
      
      if (password) {
        // Hash the new password before updating
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute(
          'UPDATE app_users SET username = ?, password = ?, name = ?, email = ?, is_admin = ?, is_active = ? WHERE id = ?',
          [username, hashedPassword, name, email || null, is_admin ? 1 : 0, is_active ? 1 : 0, id]
        );
      } else {
        await connection.execute(
          'UPDATE app_users SET username = ?, name = ?, email = ?, is_admin = ?, is_active = ? WHERE id = ?',
          [username, name, email || null, is_admin ? 1 : 0, is_active ? 1 : 0, id]
        );
      }
      return res.status(200).json({ success: true });
    }
    
    if (req.method === 'DELETE') {
      let ids = [];
      if (req.query.id) ids = [req.query.id];
      else if (req.body && req.body.ids && Array.isArray(req.body.ids)) ids = req.body.ids;
      else return res.status(400).json({ success: false, error: 'No user IDs provided' });
      
      if (ids.length === 0) return res.status(400).json({ success: false, error: 'No user IDs provided' });
      
      const idNumbers = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (idNumbers.length === 0) return res.status(400).json({ success: false, error: 'Invalid user IDs' });
      
      const placeholders = idNumbers.map(() => '?').join(',');
      const [currentUser] = await connection.execute('SELECT id FROM app_users WHERE username = ?', [authHeader]);
      
      if (currentUser.length > 0 && idNumbers.includes(currentUser[0].id)) {
        return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      }
      
      await connection.execute(`DELETE FROM app_users WHERE id IN (${placeholders})`, idNumbers);
      return res.status(200).json({ success: true });
    }
    
    if (req.method === 'PATCH') {
      const { id, is_active } = req.body;
      if (!id || typeof is_active !== 'boolean') return res.status(400).json({ success: false, error: 'Invalid request data' });
      
      await connection.execute('UPDATE app_users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ success: false, error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Database error occurred' });
  } finally {
    if (connection) connection.release();
  }
}


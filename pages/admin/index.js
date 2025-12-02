import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '/pages/components/Layout.js';
import stylesnew from '/styles/Home.module.css';
import styles from '/styles/Admin.module.css';
import { 
  FiUsers, FiSettings, FiDatabase, FiKey, 
  FiGlobe, FiFileText, FiMail, FiActivity,
  FiEdit2, FiTrash2, FiEye, FiPlus, 
  FiRefreshCw, FiSearch, FiFilter, FiBarChart2,
  FiShield, FiLock, FiUnlock, FiClock
} from 'react-icons/fi';

// User Modal Component
const UserModal = ({ mode, user, onClose, onSave }) => {
  const [formData, setFormData] = useState(user || {
    username: '',
    password: '',
    name: '',
    email: '',
    is_admin: false,
    is_active: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Add this useEffect to handle password display in view mode
  useEffect(() => {
    if (mode === 'view' && user) {
      // Check if user has a password in the current state (might not be loaded)
      setShowPasswordField(!!user.password);
    }
  }, [mode, user]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent2}>
        <div className={styles.modalHeader}>
          <h2>
            {mode === 'add' ? 'Add New User' : 
             mode === 'edit' ? 'Edit User' : 'View User Details'}
          </h2>
          <button onClick={onClose} className={styles.modalClose2}>×</button>
        </div>
        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Username *</label>
              {mode === 'view' ? (
                <div className={styles.viewField}>{formData.username}</div>
              ) : (
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  disabled={mode === 'edit'}
                />
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {mode === 'edit' ? 'New Password (leave blank to keep current)' : mode === 'add' ? 'Password *' : 'Password'}
              </label>
              {mode === 'view' ? (
                showPasswordField ? (
                  <div className={styles.passwordViewContainer}>
                    <div className={styles.passwordViewField}>
                      {showPassword ? formData.password : '••••••••'}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.eyeButtonView}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                ) : (
                  <div className={styles.viewField}>Password not available</div>
                )
              ) : (
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={mode === 'add'}
                />
              )}
              {mode !== 'view' && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  <label htmlFor="showPassword" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    Show password
                  </label>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name *</label>
              {mode === 'view' ? (
                <div className={styles.viewField}>{formData.name}</div>
              ) : (
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              {mode === 'view' ? (
                <div className={styles.viewField}>{formData.email || 'Not set'}</div>
              ) : (
                <input
                  type="email"
                  className={styles.formInput}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Role</label>
              {mode === 'view' ? (
                <div className={styles.viewField}>
                  <span className={`${styles.statusBadge} ${formData.is_admin ? styles.statusAdmin : ''}`}>
                    {formData.is_admin ? 'Admin' : 'User'}
                  </span>
                </div>
              ) : (
                <select
                  className={styles.formSelect}
                  value={formData.is_admin ? 'admin' : 'user'}
                  onChange={(e) => setFormData({...formData, is_admin: e.target.value === 'admin'})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              {mode === 'view' ? (
                <div className={styles.viewField}>
                  <span className={`${styles.statusBadge} ${formData.is_active ? styles.statusActive : styles.statusInactive}`}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ) : (
                <select
                  className={styles.formSelect}
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({...formData, is_active: e.target.value === 'active'})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              )}
            </div>

            {mode !== 'view' && (
              <div className={styles.modalFooter}>
                <button type="button" onClick={onClose} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {mode === 'add' ? 'Add User' : 'Save Changes'}
                </button>
              </div>
            )}
            {mode === 'view' && (
              <div className={styles.modalFooter}>
                <button type="button" onClick={onClose} className={styles.btnSecondary}>
                  Close
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    totalConfigs: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
    const [currentUser, setCurrentUser] = useState(null);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        is_admin: false,
        is_active: true
    });

useEffect(() => {
    // Check if user is authenticated and admin
    const authenticated = localStorage.getItem('authenticated') === 'true';
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const username = localStorage.getItem('username');

    if (!authenticated || !isAdmin || !username) {
        router.push('/');
        return;
    }

    fetchDashboardData(username);
    fetchAllUsers(); // Fetch all users initially
}, []);

  const fetchDashboardData = async (username) => {
    try {
        const response = await fetch('/api/admin/dashboard', {
        headers: {
            'Authorization': username // Sending username as auth header
        }
        });
        
        if (!response.ok) {
            // Handle 404 specifically
            if (response.status === 404) {
                setError('Admin API endpoint not found. Please check server configuration.');
                return;
            }

            if (response.status === 401 || response.status === 403) {
                localStorage.clear();
                router.push('/');
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            setStats(data.stats);
            setUsers(data.recentUsers || []);
        } else {
            setError(data.error || 'Failed to fetch data');
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Network error. Please try again.');
    } finally {
        setLoading(false);
    }
};

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderDashboard = () => (
    <>
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: '#3b82f6' }}>
          <h3>Total Users</h3>
          <div className={styles.statValue}>{stats.totalUsers}</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <FiActivity /> +12% from last month
          </div>
        </div>

        <div className={styles.statCard} style={{ borderLeftColor: '#10b981' }}>
          <h3>Active Users</h3>
          <div className={styles.statValue}>{stats.activeUsers}</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <FiActivity /> +8% from last month
          </div>
        </div>

        <div className={styles.statCard} style={{ borderLeftColor: '#8b5cf6' }}>
          <h3>Admin Users</h3>
          <div className={styles.statValue}>{stats.adminUsers}</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <FiActivity /> +2% from last month
          </div>
        </div>

        <div className={styles.statCard} style={{ borderLeftColor: '#f59e0b' }}>
          <h3>Configurations</h3>
          <div className={styles.statValue}>{stats.totalConfigs}</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <FiActivity /> All systems operational
          </div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <h3>Recent User Activity</h3>
          <div className={styles.chartControls}>
            <button className={styles.chartButton}>Today</button>
            <button className={`${styles.chartButton} ${styles.active}`}>Week</button>
            <button className={styles.chartButton}>Month</button>
          </div>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : users.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        {user.username}
                      </div>
                    </td>
                    <td>{user.email || 'Not set'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.is_admin ? styles.statusAdmin : ''}`}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.is_active ? styles.statusActive : styles.statusInactive}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.btnEdit} onClick={() => handleEditUser(user)}>
                          <FiEdit2 /> Edit
                        </button>
                        <button className={styles.btnDelete} onClick={() => handleDeleteUser(user.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.noData}>No recent user activity</div>
        )}
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.configCard}>
          <h3><FiShield /> System Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Database Connection</span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiUnlock /> Connected
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>API Services</span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiUnlock /> Operational
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>SSL Certificate</span>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiLock /> Valid
              </span>
            </div>
          </div>
        </div>

        <div className={styles.configCard}>
          <h3><FiClock /> Recent Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontWeight: '500', color: '#1e3a8a' }}>Configuration Updated</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>AWS credentials were updated</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>2 hours ago</div>
            </div>
            <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontWeight: '500', color: '#1e3a8a' }}>New User Added</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>User "john.doe" was created</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>1 day ago</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

const renderUsers = () => {
  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(user.created_at).toLocaleDateString().includes(searchTerm);
    
    const matchesRole = roleFilter === 'All Roles' || 
      (roleFilter === 'Admin' && user.is_admin) ||
      (roleFilter === 'User' && !user.is_admin);
    
    const matchesStatus = statusFilter === 'All Status' ||
      (statusFilter === 'Active' && user.is_active) ||
      (statusFilter === 'Inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Add scrollable container with fixed height
  const tableHeight = Math.min(filteredUsers.length * 60, 600); // Max 600px height

//   const handleSelectAll = (e) => {
//     if (e.target.checked) {
//       setSelectedUsers(filteredUsers.map(user => user.id));
//     } else {
//       setSelectedUsers([]);
//     }
//   };

//   const handleSelectUser = (userId) => {
//     setSelectedUsers(prev => 
//       prev.includes(userId) 
//         ? prev.filter(id => id !== userId)
//         : [...prev, userId]
//     );
//   };
  

  return (
    <div>
      <div className={styles.searchContainer}>
        <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by username, name, or date..."
              className={styles.searchInput}
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className={styles.formSelect} 
            style={{ width: '200px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option>All Roles</option>
            <option>Admin</option>
            <option>User</option>
          </select>
          <select 
            className={styles.formSelect} 
            style={{ width: '200px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {selectedUsers.length > 0 && (
            <button className={styles.btnDanger} onClick={handleDeleteSelected}>
              <FiTrash2 /> Delete Selected ({selectedUsers.length})
            </button>
          )}
          <button className={styles.btnPrimary} onClick={handleAddUser}>
            <FiPlus /> Add User
          </button>
        </div>
      </div>

      <div className={styles.tableContainer} style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(filteredUsers.map(user => user.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className={styles.checkbox}
                />
              </th>
              <th>ID</th>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ width: '200px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => {
                      setSelectedUsers(prev =>
                        prev.includes(user.id)
                          ? prev.filter(id => id !== user.id)
                          : [...prev, user.id]
                      );
                    }}
                    className={styles.checkbox}
                  />
                </td>
                <td>{user.id}</td>
                <td>
                  <strong>{user.username}</strong>
                </td>
                <td>{user.name}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`${styles.statusBadge} ${user.is_admin ? styles.statusAdmin : ''}`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${user.is_active ? styles.statusActive : styles.statusInactive}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className={styles.actionButtons} style={{ display: 'flex', gap: '0.3rem' }}> 
                    <button className={`${styles.actionButton} ${styles.btnView}`} onClick={() => handleViewUser(user)}>
                      <FiEye />
                    </button>
                    <button className={`${styles.actionButton} ${styles.btnEdit}`} onClick={() => handleEditUser(user)}>
                      <FiEdit2 />
                    </button>
                    <button 
                      className={`${styles.actionButton} ${user.is_active ? styles.btnWarning : styles.btnSuccess}`}
                      onClick={() => handleToggleStatus(user)}
                      title={user.is_active ? 'Make Inactive' : 'Make Active'}
                    >
                      {user.is_active ? <FiLock /> : <FiUnlock />}
                    </button>
                    <button className={`${styles.actionButton} ${styles.btnDelete}`} onClick={() => handleDeleteUser(user.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className={styles.noData}>No users found</div>
        )}
      </div>
    </div>
  );
};

  const renderAWSConfig = () => (
    <div>
      <div className={styles.configCard}>
        <h3><FiSettings /> AWS Configuration</h3>
        <div className={styles.apiTest}>
          <p>Test AWS S3 Connection:</p>
          <button className={styles.btnPrimary}>
            <FiRefreshCw /> Test Connection
          </button>
          <div className={styles.apiResult}>
            {/* API test results will appear here */}
          </div>
        </div>
        
        <form onSubmit={(e) => handleSaveConfig(e, 'aws')}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Access Key ID</label>
            <input
              type="text"
              className={styles.formInput}
              defaultValue="AKIAIOSFODNN7EXAMPLE"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Secret Access Key</label>
            <input
              type="password"
              className={styles.formInput}
              defaultValue="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Region</label>
              <select className={styles.formSelect} defaultValue="us-east-2">
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-east-2">US East (Ohio)</option>
                <option value="us-west-1">US West (N. California)</option>
                <option value="us-west-2">US West (Oregon)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>S3 Bucket Name</label>
              <input
                type="text"
                className={styles.formInput}
                defaultValue="s1234kup"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Migration Bucket Name</label>
            <input
              type="text"
              className={styles.formInput}
              defaultValue="aut1234n"
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>
              Save Changes
            </button>
            <button type="button" className={styles.btnSecondary}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const handleEditUser = (user) => {
    setModalMode('edit');
    setCurrentUser(user);
    setIsModalOpen(true);
  };

const handleDeleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }

  try {
    const username = localStorage.getItem('username');
    const response = await fetch(`/api/admin/users?id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': username
      }
    });

    const data = await response.json();
    
    if (data.success) {
      setUsers(users.filter(user => user.id !== userId));
      // Remove from selected users if present
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setError(data.error || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    setError('Failed to delete user');
  }
};

const handleDeleteSelected = async () => {
  if (selectedUsers.length === 0) return;
  
  if (!confirm(`Are you sure you want to delete ${selectedUsers.length} selected user(s)?`)) {
    return;
  }

  try {
    const username = localStorage.getItem('username');
    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': username
      },
      body: JSON.stringify({ ids: selectedUsers })
    });

    const data = await response.json();
    
    if (data.success) {
      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
    } else {
      setError(data.error || 'Failed to delete selected users');
    }
  } catch (error) {
    console.error('Error deleting users:', error);
    setError('Failed to delete selected users');
  }
};

const handleSaveUser = async (userData) => {
  try {
    const method = modalMode === 'add' ? 'POST' : 'PUT';
    const url = '/api/admin/users';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('username')
      },
      body: JSON.stringify(modalMode === 'add' ? userData : { id: currentUser.id, ...userData })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Refresh the user list
        fetchAllUsers();
        setIsModalOpen(false);
      }
    }
  } catch (error) {
    console.error('Error saving user:', error);
    setError('Failed to save user');
  }
};


const fetchAllUsers = async () => {
  try {
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': localStorage.getItem('username')
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};



  const handleAddUser = () => {
    setModalMode('add');
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleViewUser = (user) => {
    setModalMode('view');
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    if (!confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) {
        return;
    }

    try {
        const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('username')
        },
        body: JSON.stringify({
            id: user.id,
            is_active: !user.is_active
        })
        });

        if (response.ok) {
        const data = await response.json();
        if (data.success) {
            // Update the user in the list
            setUsers(users.map(u => 
            u.id === user.id ? { ...u, is_active: !user.is_active } : u
            ));
        }
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        setError('Failed to update user status');
    }
    };



  const handleSaveConfig = (e, configType) => {
    e.preventDefault();
    // Implement save config logic
    console.log(`Save ${configType} config`);
  };

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>Admin Dashboard</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>

      <Layout>
        <div className={styles.adminHeader}>
          <div>
            <h1 className={styles.adminTitle}>
              <FiSettings className={styles.adminIcon} size={32} />
              Admin Dashboard
            </h1>
            <p className={styles.adminSubtitle}>
              Manage users, configurations, and system settings
            </p>
          </div>
          <div>
            <button className={styles.btnSecondary} onClick={() => router.push('/home')}>
              Back to Home
            </button>
          </div>
        </div>

        {error && (
        <div style={{
            color: '#ef4444',
            backgroundColor: '#fef2f2',
            padding: '0.75rem',
            borderRadius: '6px',
            margin: '1rem',
            borderLeft: '4px solid #ef4444'
        }}>
            <strong>Error:</strong> {error}
        </div>
        )}

        {isModalOpen && (
            <UserModal
            mode={modalMode}
            user={currentUser}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveUser}
            />
        )}

        <div className={styles.adminNav}>
          <button
            className={`${styles.navButton} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <FiBarChart2 /> Dashboard
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => handleTabChange('users')}
          >
            <FiUsers /> Users
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'aws' ? styles.active : ''}`}
            onClick={() => handleTabChange('aws')}
          >
            <FiSettings /> AWS Config
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'sendgrid' ? styles.active : ''}`}
            onClick={() => handleTabChange('sendgrid')}
          >
            <FiMail /> SendGrid
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'database' ? styles.active : ''}`}
            onClick={() => handleTabChange('database')}
          >
            <FiDatabase /> Database
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'google' ? styles.active : ''}`}
            onClick={() => handleTabChange('google')}
          >
            <FiFileText /> Google Sheets
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'license' ? styles.active : ''}`}
            onClick={() => handleTabChange('license')}
          >
            <FiKey /> License Manager
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'url' ? styles.active : ''}`}
            onClick={() => handleTabChange('url')}
          >
            <FiGlobe /> Base URL
          </button>
        </div>

        <div className={styles.adminContent}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'aws' && renderAWSConfig()}
          {activeTab === 'sendgrid' && (
            <div className={styles.alert}>
              <FiSettings /> SendGrid configuration management coming soon...
            </div>
          )}
          {activeTab === 'database' && (
            <div className={styles.alert}>
              <FiSettings /> Database configuration management coming soon...
            </div>
          )}
          {activeTab === 'google' && (
            <div className={styles.alert}>
              <FiSettings /> Google Sheets configuration management coming soon...
            </div>
          )}
          {activeTab === 'license' && (
            <div className={styles.alert}>
              <FiSettings /> License Manager configuration management coming soon...
            </div>
          )}
          {activeTab === 'url' && (
            <div className={styles.alert}>
              <FiSettings /> Base URL configuration management coming soon...
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}
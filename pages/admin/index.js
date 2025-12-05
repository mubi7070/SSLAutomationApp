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

  // Update useEffect to properly handle password display
  useEffect(() => {
    if (mode === 'view' && user) {
      // Check if user has a password
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
                <div className={styles.passwordViewContainer}>
                  <div className={styles.passwordViewField2}>
                    {showPassword ? formData.password || 'No password set' : '••••••••'}
                  </div>
                  {formData.password && (
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.eyeButtonView2}
                    >
                      {showPassword ? <FiEye /> : <FiEye />}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.formInput}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={mode === 'add'}
                    placeholder={mode === 'edit' ? 'Enter new password or leave blank' : ''}
                  />
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
                </>
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
  const [recentUsers, setRecentUsers] = useState([]); // For dashboard - limited to 5
  const [allUsers, setAllUsers] = useState([]); // For users tab - all users
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
    // Add these with other state variables
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success' // success, error, warning, info
    });

    //AWS Config Variables
    const [awsConfig, setAwsConfig] = useState({
        access_key_id: '',
        secret_access_key: '',
        region: 'us-east-2',
        s3_bucket_name: '',
        s3_migration_bucket_name: ''
    });
    const [awsLoading, setAwsLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [awsError, setAwsError] = useState(null);
    const [awsNotification, setAwsNotification] = useState({
        show: false,
        message: '',
        type: 'success'
    });


// // Add this useEffect to properly mask the secret key on load
// useEffect(() => {
//   if (awsConfig.secret_access_key && !showSecretKey && !isSecretKeyFocused) {
//     // Check if it's already masked (contains asterisks)
//     const isMasked = awsConfig.secret_access_key.includes('*'.repeat(Math.max(awsConfig.secret_access_key.length - 8, 0)));
//     if (!isMasked) {
//       setAwsConfig(prev => ({
//         ...prev,
//         secret_access_key: maskSecretKey(prev.secret_access_key)
//       }));
//     }
//   }
// }, [awsConfig.secret_access_key, showSecretKey, isSecretKeyFocused]);


useEffect(() => {
  if (awsNotification.show) {
    const timer = setTimeout(() => {
      setAwsNotification({ show: false, message: '', type: 'success' });
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [awsNotification.show]);


useEffect(() => {
  if (notification.show) {
    const timer = setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [notification.show]);


// Add this useEffect for auto-dismissing test results
useEffect(() => {
  if (testResult) {
    const timer = setTimeout(() => {
      setTestResult(null);
    }, 10000); // Auto-dismiss after 10 seconds
    
    return () => clearTimeout(timer);
  }
}, [testResult]);


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


// Helper function to mask the secret key (show first 4 and last 4 chars)
const maskSecretKey = (key) => {
  if (!key || key.trim() === '') return '';
  if (key.length <= 8) return key; // If key is too short, return as is
  
  // Check if the key is already masked (contains mostly asterisks)
  if (key.includes('*'.repeat(key.length - 8))) {
    return key;
  }
  
  const firstFour = key.substring(0, 4);
  const lastFour = key.substring(key.length - 4);
  const maskedLength = key.length - 8;
  const maskedChars = '*'.repeat(maskedLength);
  return firstFour + maskedChars + lastFour;
};

// Helper function to check if a value is masked (contains asterisks)
const isMaskedKey = (key) => {
  return key && key.includes('*') && key.length > 8;
};


// Helper function to get the display value for secret key
const getDisplaySecretKey = () => {
  // If we have the actual secret key, mask it for display
  if (actualSecretKey) {
    return maskSecretKey(actualSecretKey);
  }
  // Otherwise use what's in awsConfig (might be masked already)
  return awsConfig.secret_access_key;
};



// Add this function to handle secret key changes
const handleSecretKeyChange = (value) => {
  setAwsConfig(prev => ({
    ...prev,
    secret_access_key: value
  }));
  
  // Also update the actual secret key
  setActualSecretKey(value);
};

const showNotification = (message, type = 'success') => {
  setNotification({
    show: true,
    message,
    type
  });
};

const showAwsNotification = (message, type = 'success') => {
  setAwsNotification({
    show: true,
    message,
    type
  });
};


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
            setRecentUsers(data.recentUsers || []); // Changed from setUsers
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
  if (tab === 'aws') {
    fetchAwsConfig();
  }
};

// AWS Configuration Functions
const fetchAwsConfig = async () => {
  try {
    setAwsLoading(true);
    const username = localStorage.getItem('username');
    const response = await fetch('/api/admin/config/aws', {
      headers: {
        'Authorization': username
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AWS configuration');
    }

    const data = await response.json();
    
    if (data.success && data.config) {
      // Set the config - secret key will be displayed as-is (it's already masked in API)
      setAwsConfig({
        access_key_id: data.config.access_key_id || '',
        secret_access_key: data.config.secret_access_key || '',
        region: data.config.region || 'us-east-2',
        s3_bucket_name: data.config.s3_bucket_name || '',
        s3_migration_bucket_name: data.config.s3_migration_bucket_name || ''
      });
    } else {
      // Set default values if no config exists
      setAwsConfig({
        access_key_id: '',
        secret_access_key: '',
        region: 'us-east-2',
        s3_bucket_name: '',
        s3_migration_bucket_name: ''
      });
    }
  } catch (error) {
    console.error('Error fetching AWS config:', error);
    showAwsNotification('Failed to load AWS configuration', 'error');
    setAwsError(error.message);
  } finally {
    setAwsLoading(false);
  }
};

const saveAwsConfig = async (e) => {
  e.preventDefault();
  try {
    setAwsLoading(true);
    const username = localStorage.getItem('username');

    // Prepare data for saving
    const saveData = {
      access_key_id: awsConfig.access_key_id,
      secret_access_key: awsConfig.secret_access_key,
      region: awsConfig.region,
      s3_bucket_name: awsConfig.s3_bucket_name,
      s3_migration_bucket_name: awsConfig.s3_migration_bucket_name
    };
    
    // Send the data as-is to the API
    const response = await fetch('/api/admin/config/aws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': username
      },
      body: JSON.stringify(saveData)
    });

    const data = await response.json();
    
    if (data.success) {
      showAwsNotification('AWS configuration saved successfully');
      // Refresh the config to get the masked version
      fetchAwsConfig();
    } else {
      throw new Error(data.error || 'Failed to save configuration');
    }
  } catch (error) {
    console.error('Error saving AWS config:', error);
    showAwsNotification(error.message, 'error');
    setAwsError(error.message);
  } finally {
    setAwsLoading(false);
  }
};

// Helper function to fetch current config for getting actual secret key
const fetchCurrentAwsConfig = async (username) => {
  try {
    const response = await fetch('/api/admin/config/aws', {
      headers: {
        'Authorization': username
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.config;
    }
  } catch (error) {
    console.error('Error fetching current AWS config:', error);
  }
  return null;
};

const resetAwsConfig = () => {
  if (confirm('Are you sure you want to reset all changes?')) {
    fetchAwsConfig();
    setTestResult(null);
    setAwsError(null); // Also clear any error details
    showAwsNotification('Configuration reset to saved values');
  }
};

const testAwsConnection = async () => {
  try {
    setTestLoading(true);
    setTestResult(null);
    setAwsError(null);
    
    const username = localStorage.getItem('username');

    // For testing, we need to get the actual secret key from the database
    // since the one in state might be masked
    const currentConfigResponse = await fetch('/api/admin/config/aws/get-actual', {
      headers: {
        'Authorization': username
      }
    });
    
    let actualSecretKey = awsConfig.secret_access_key;
    
    if (currentConfigResponse.ok) {
      const currentData = await currentConfigResponse.json();
      if (currentData.success && currentData.config) {
        // If the displayed key is masked, use the actual one from DB
        if (awsConfig.secret_access_key.includes('*'.repeat(awsConfig.secret_access_key.length - 8))) {
          actualSecretKey = currentData.config.secret_access_key;
        }
      }
    }

    const testData = {
      access_key_id: awsConfig.access_key_id,
      secret_access_key: actualSecretKey,
      region: awsConfig.region,
      s3_bucket_name: awsConfig.s3_bucket_name,
      s3_migration_bucket_name: awsConfig.s3_migration_bucket_name
    };

    const response = await fetch('/api/admin/config/aws/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': username
      },
      body: JSON.stringify(testData)
    });

    // Check if response is OK and content type is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      setTestResult({
        success: true,
        message: data.message || 'Connection test successful!'
      });
      showAwsNotification('AWS S3 connection test succeeded');
    } else {
      setTestResult({
        success: false,
        message: data.error || 'Connection test failed'
      });
      showAwsNotification('AWS S3 connection test failed', 'error');
    }
  } catch (error) {
    console.error('Error testing AWS connection:', error);
    setTestResult({
      success: false,
      message: error.message || 'Failed to test connection'
    });
    showAwsNotification('Failed to test AWS connection', 'error');
    setAwsError(error.message);
  } finally {
    setTestLoading(false);
  }
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
      
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px dashed #e2e8f0',
        color: '#64748b'
      }}>
        <FiClock size={48} style={{ marginBottom: '1rem', color: '#94a3b8' }} />
        <h4 style={{ marginBottom: '0.5rem', color: '#475569' }}>User Activity Tracking</h4>
        <p>This feature will be available soon. We're currently setting up the activity logging system.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Check back later to view recent user activities and login history.
        </p>
      </div>
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
  const filteredUsers = allUsers.filter(user => {
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

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>
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
              <th>Actions</th>
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
                <td title={user.username}>
                  <strong>{user.username}</strong>
                </td>
                <td title={user.username}>{user.name}</td>
                <td title={user.username}>{user.email || '-'}</td>
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
                    <button className={`${styles.actionButton} ${styles.btnView}`} onClick={() => handleViewUser(user)} title="View">
                      <FiEye />
                    </button>
                    <button className={`${styles.actionButton} ${styles.btnEdit}`} onClick={() => handleEditUser(user)} title="Edit">
                      <FiEdit2 />
                    </button>
                    <button 
                      className={`${styles.actionButton} ${user.is_active ? styles.btnWarning : styles.btnSuccess}`}
                      onClick={() => handleToggleStatus(user)}
                      title={user.is_active ? 'Make Inactive' : 'Make Active'}
                    >
                      {user.is_active ? <FiLock /> : <FiUnlock />}
                    </button>
                    <button className={`${styles.actionButton} ${styles.btnDelete}`} onClick={() => handleDeleteUser(user.id)} title="Delete">
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
    <div className={styles.awsConfigCard}>
      <div className={styles.awsConfigHeader}>
        <h3 style={{color: '#1e3a8a'}}><FiSettings /> AWS Configuration</h3>
        <div className={styles.awsTestButtons}>
          <button 
            className={styles.btnPrimary} 
            onClick={testAwsConnection}
            disabled={testLoading}
          >
            <FiRefreshCw /> {testLoading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Loading Bar */}
      {(awsLoading || testLoading) && (
        <div className={styles.awsLoadingBar}>
          <div className={styles.awsLoadingProgress}></div>
        </div>
      )}

      {/* Test Connection Results with Close Button */}
      {testResult && (
        <div className={`${styles.awsTestResultContainer} ${testResult.success ? styles.awsTestSuccess : styles.awsTestError}`}>
          <div className={styles.awsTestResultHeader}>
            <strong>{testResult.success ? '✓ Success:' : '✗ Error:'}</strong>
            <button 
              onClick={() => setTestResult(null)}
              className={styles.awsTestResultClose}
              title="Close"
            >
              ×
            </button>
          </div>
          <div className={styles.awsTestResultContent}>
            {testResult.message}
          </div>
        </div>
      )}

      {/* Error Details with Close Button */}
      {awsError && (
        <div className={styles.awsErrorDetail}>
          <div className={styles.awsErrorHeader}>
            <strong>Error Details:</strong>
            <button 
              onClick={() => setAwsError(null)}
              className={styles.awsErrorClose}
              title="Close"
            >
              ×
            </button>
          </div>
          <pre>{awsError}</pre>
        </div>
      )}

      <form onSubmit={saveAwsConfig}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Access Key ID</label>
          <input
            type="text"
            className={styles.formInput}
            value={awsConfig.access_key_id}
            onChange={(e) => setAwsConfig({...awsConfig, access_key_id: e.target.value})}
            placeholder="Enter Access Key ID"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Secret Access Key</label>
            <input
              type="text"
              className={styles.formInput}
              value={awsConfig.secret_access_key}
              onChange={(e) => {
                setAwsConfig(prev => ({
                    ...prev,
                    secret_access_key: e.target.value
                }));
                }}
              placeholder="Enter Secret Access Key"
              required
            />
        </div>

        <div className={styles.awsFormRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Region</label>
            <select
              className={styles.formSelect}
              value={awsConfig.region}
              onChange={(e) => setAwsConfig({...awsConfig, region: e.target.value})}
              required
            >
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-east-2">US East (Ohio)</option>
              <option value="us-west-1">US West (N. California)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">Europe (Ireland)</option>
              <option value="eu-central-1">Europe (Frankfurt)</option>
              <option value="ap-south-1">Asia Pacific (Mumbai)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
              <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>S3 Bucket Name</label>
            <input
              type="text"
              className={styles.formInput}
              value={awsConfig.s3_bucket_name}
              onChange={(e) => setAwsConfig({...awsConfig, s3_bucket_name: e.target.value})}
              placeholder="Enter S3 Bucket Name"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Migration Bucket Name</label>
          <input
            type="text"
            className={styles.formInput}
            value={awsConfig.s3_migration_bucket_name}
            onChange={(e) => setAwsConfig({...awsConfig, s3_migration_bucket_name: e.target.value})}
            placeholder="Enter Migration Bucket Name"
            required
          />
        </div>

        <div className={styles.awsFormActions}>
          <button 
            type="button" 
            onClick={resetAwsConfig} 
            className={styles.btnSecondary}
            disabled={awsLoading}
          >
            Reset
          </button>
          <button 
            type="submit" 
            className={styles.btnPrimary}
            disabled={awsLoading}
          >
            {awsLoading ? 'Saving...' : 'Save Changes'}
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
      // Remove from allUsers
      setAllUsers(prev => prev.filter(user => user.id !== userId));
      // Remove from selected users if present
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      // Refresh stats
      fetchAllUsers();
      showNotification('User deleted successfully');
    } else {
      setError(data.error || 'Failed to delete user');
      showNotification(data.error || 'Failed to delete user', 'error');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    setError('Failed to delete user');
    showNotification('Failed to delete user', 'error');
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
      setAllUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      // Refresh stats
      fetchAllUsers();
      showNotification(`${selectedUsers.length} user(s) deleted successfully`);
    } else {
      setError(data.error || 'Failed to delete selected users');
      showNotification(data.error || 'Failed to delete selected users', 'error');
    }
  } catch (error) {
    console.error('Error deleting users:', error);
    setError('Failed to delete selected users');
    showNotification('Failed to delete selected users', 'error');
  }
};

const handleSaveUser = async (userData) => {
  try {
    const method = modalMode === 'add' ? 'POST' : 'PUT';
    const url = '/api/admin/users';
    const username = localStorage.getItem('username');
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': username
      },
      body: JSON.stringify(modalMode === 'add' ? userData : { id: currentUser.id, ...userData })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Refresh the user list
        fetchAllUsers();
        setIsModalOpen(false);
        showNotification(modalMode === 'add' ? 'User added successfully' : 'Saved successfully');
      }
    }
  } catch (error) {
    console.error('Error saving user:', error);
    setError('Failed to save user');
    showNotification('Failed to save user', 'error');
  }
};


const fetchAllUsers = async () => {
  try {
    const username = localStorage.getItem('username');
    // Fetch users
    const usersResponse = await fetch('/api/admin/users', {
      headers: {
        'Authorization': username
      }
    });
     
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      if (usersData.success) {
        setAllUsers(usersData.users);
      }
    }
    
    // Also refresh dashboard stats
    await fetchDashboardData(username);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};



  const handleAddUser = () => {
    setModalMode('add');
    setCurrentUser(null);
    setIsModalOpen(true);
  };

const handleViewUser = async (user) => {
  try {
    const username = localStorage.getItem('username');
    const response = await fetch(`/api/admin/users?single=true&id=${user.id}`, {
      headers: {
        'Authorization': username
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setModalMode('view');
        setCurrentUser(data.user);
        setIsModalOpen(true);
      }
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    showNotification('Failed to load user details', 'error');
  }
};

  const handleToggleStatus = async (user) => {
    if (!confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) {
        return;
    }

    try {
        const username = localStorage.getItem('username');
        const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': username
        },
        body: JSON.stringify({
            id: user.id,
            is_active: !user.is_active
        })
        });

        if (response.ok) {
        const data = await response.json();
        if (data.success) {
        // Update the user in allUsers list
        setAllUsers(prev => 
          prev.map(u => 
            u.id === user.id ? { ...u, is_active: !user.is_active } : u
          )
        );
        // Refresh stats
        fetchAllUsers();
        showNotification(`User marked ${!user.is_active ? 'Active' : 'Inactive'}`);
      }
    }
    } catch (error) {
        console.error('Error toggling user status:', error);
        setError('Failed to update user status');
        showNotification('Failed to update user status', 'error');
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

        {/* Notification Component */}
        {notification.show && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
        </div>
        )}

        {/* AWS Notification Component */}
        {awsNotification.show && (
        <div className={`${styles.awsNotification} ${styles[awsNotification.type]}`}>
            {awsNotification.message}
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
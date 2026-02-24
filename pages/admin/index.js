import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '/pages/components/Layout.js';
import stylesnew from '/styles/Home.module.css';
import styles from '/styles/Admin.module.css';
import { 
  FiUsers, FiSettings, FiKey, 
  FiGlobe, FiFileText, FiMail, FiActivity,
  FiEdit2, FiTrash2, FiEye, FiPlus, 
  FiRefreshCw, FiSearch, FiFilter, FiBarChart2,
  FiShield, FiLock, FiUnlock, FiClock, FiCheckCircle, FiXCircle
} from 'react-icons/fi';

const UserModal = ({ mode, user, onClose, onSave }) => {
  const [formData, setFormData] = useState(user || { username: '', password: '', name: '', email: '', is_admin: false, is_active: true });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent2}>
        <div className={styles.modalHeader}>
          <h2>{mode === 'add' ? 'Add New User' : mode === 'edit' ? 'Edit User' : 'View User Details'}</h2>
          <button onClick={onClose} className={styles.modalClose2}>×</button>
        </div>
        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Username *</label>
              {mode === 'view' ? <div className={styles.viewField}>{formData.username}</div> : <input type="text" className={styles.formInput} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required disabled={mode === 'edit'} />}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{mode === 'edit' ? 'New Password (leave blank to keep current)' : mode === 'add' ? 'Password *' : 'Password'}</label>
              {mode === 'view' ? (
                <div className={styles.passwordViewContainer}>
                  <div className={styles.passwordViewField2}>{showPassword ? formData.password || 'No password set' : '••••••••'}</div>
                  {formData.password && <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeButtonView2}><FiEye /></button>}
                </div>
              ) : (
                <>
                  <input type={showPassword ? 'text' : 'password'} className={styles.formInput} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={mode === 'add'} placeholder={mode === 'edit' ? 'Enter new password or leave blank' : ''} />
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="showPassword" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                    <label htmlFor="showPassword" style={{ fontSize: '0.9rem', color: '#64748b' }}>Show password</label>
                  </div>
                </>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name *</label>
              {mode === 'view' ? <div className={styles.viewField}>{formData.name}</div> : <input type="text" className={styles.formInput} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              {mode === 'view' ? <div className={styles.viewField}>{formData.email || 'Not set'}</div> : <input type="email" className={styles.formInput} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Role</label>
              {mode === 'view' ? (
                <div className={styles.viewField}><span className={`${styles.statusBadge} ${formData.is_admin ? styles.statusAdmin : ''}`}>{formData.is_admin ? 'Admin' : 'User'}</span></div>
              ) : (
                <select className={styles.formSelect} value={formData.is_admin ? 'admin' : 'user'} onChange={(e) => setFormData({...formData, is_admin: e.target.value === 'admin'})}>
                  <option value="user">User</option><option value="admin">Admin</option>
                </select>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              {mode === 'view' ? (
                <div className={styles.viewField}><span className={`${styles.statusBadge} ${formData.is_active ? styles.statusActive : styles.statusInactive}`}>{formData.is_active ? 'Active' : 'Inactive'}</span></div>
              ) : (
                <select className={styles.formSelect} value={formData.is_active ? 'active' : 'inactive'} onChange={(e) => setFormData({...formData, is_active: e.target.value === 'active'})}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              )}
            </div>

            {mode !== 'view' && (
              <div className={styles.modalFooter}>
                <button type="button" onClick={onClose} className={styles.btnSecondary}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>{mode === 'add' ? 'Add User' : 'Save Changes'}</button>
              </div>
            )}
            {mode === 'view' && <div className={styles.modalFooter}><button type="button" onClick={onClose} className={styles.btnSecondary}>Close</button></div>}
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
  const [recentUsers, setRecentUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, adminUsers: 0, totalConfigs: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentUser, setCurrentUser] = useState(null);

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [connectionStatus, setConnectionStatus] = useState({ aws: 'checking', sendgrid: 'checking' });

  // AWS Config State
  const [awsConfig, setAwsConfig] = useState({ access_key_id: '', secret_access_key: '', region: 'us-east-2', s3_bucket_name: '', s3_migration_bucket_name: '' });
  const [awsLoading, setAwsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [awsError, setAwsError] = useState(null);
  const [awsNotification, setAwsNotification] = useState({ show: false, message: '', type: 'success' });

  // SendGrid Config State
  const [sendgridConfig, setSendgridConfig] = useState({ api_key: '' });
  const [sendgridLoading, setSendgridLoading] = useState(false);
  const [sendgridTestLoading, setSendgridTestLoading] = useState(false);
  const [sendgridTestResult, setSendgridTestResult] = useState(null);

  // Sendgrid Logs State
  const [sgLogs, setSgLogs] = useState([]);
  const [sgTopAccounts, setSgTopAccounts] = useState([]);
  const [sgGraphData, setSgGraphData] = useState([]);
  const [sgLogsLoading, setSgLogsLoading] = useState(false);
  const [sgLogSearch, setSgLogSearch] = useState('');
  const [sgLogStartDate, setSgLogStartDate] = useState('');
  const [sgLogEndDate, setSgLogEndDate] = useState('');
  
  // Google Sheets Config State
  const [googleConfig, setGoogleConfig] = useState({ license_sheet_id: '' });
  const [googleLoading, setGoogleLoading] = useState(false);

  // Base URL Config State
  const [urlConfig, setUrlConfig] = useState({ base_url: '', environment: 'development' });
  const [urlLoading, setUrlLoading] = useState(false);

  useEffect(() => {
    if (awsNotification.show) {
      const timer = setTimeout(() => { setAwsNotification({ show: false, message: '', type: 'success' }); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [awsNotification.show]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => { setNotification({ show: false, message: '', type: 'success' }); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  useEffect(() => {
    if (testResult || sendgridTestResult) {
      const timer = setTimeout(() => { setTestResult(null); setSendgridTestResult(null); }, 10000);
      return () => clearTimeout(timer);
    }
  }, [testResult, sendgridTestResult]);

  useEffect(() => {
    const authenticated = localStorage.getItem('authenticated') === 'true';
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const username = localStorage.getItem('username');
    if (!authenticated || !isAdmin || !username) {
      router.push('/');
      return;
    }
    fetchDashboardData(username);
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      checkConnections();
      const interval = setInterval(checkConnections, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const showNotification = (message, type = 'success') => { setNotification({ show: true, message, type }); };
  const showAwsNotification = (message, type = 'success') => { setAwsNotification({ show: true, message, type }); };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'aws') fetchAwsConfig();
    if (tab === 'sendgrid') {
      fetchSendgridConfig();
      fetchSendgridLogs();
    }
    if (tab === 'google') fetchGoogleConfig();
    if (tab === 'url') fetchUrlConfig();
  };

  const checkConnections = async () => {
    try {
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/dashboard/status', { headers: { 'Authorization': username } });
      const data = await response.json();
      if (data.success) setConnectionStatus({ aws: data.aws, sendgrid: data.sendgrid });
    } catch (error) {
      setConnectionStatus({ aws: 'error', sendgrid: 'error' });
    }
  };

  const fetchDashboardData = async (username) => {
    try {
      const response = await fetch('/api/admin/dashboard', { headers: { 'Authorization': username } });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { localStorage.clear(); router.push('/'); return; }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) { setStats(data.stats); setRecentUsers(data.recentUsers || []); }
      else setError(data.error || 'Failed to fetch data');
    } catch (error) {
      setError('Network error. Please try again.');
    } finally { setLoading(false); }
  };

  const fetchAwsConfig = async () => {
    try {
      setAwsLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/aws', { headers: { 'Authorization': username } });
      const data = await response.json();
      if (data.success && data.config) setAwsConfig(data.config);
      else setAwsConfig({ access_key_id: '', secret_access_key: '', region: 'us-east-2', s3_bucket_name: '', s3_migration_bucket_name: '' });
    } catch (error) { showAwsNotification('Failed to load AWS configuration', 'error'); } 
    finally { setAwsLoading(false); }
  };

  const saveAwsConfig = async (e) => {
    e.preventDefault();
    try {
      setAwsLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/aws', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify(awsConfig) });
      const data = await response.json();
      if (data.success) { showAwsNotification('AWS configuration saved successfully'); fetchAwsConfig(); }
      else throw new Error(data.error);
    } catch (error) { showAwsNotification(error.message, 'error'); } 
    finally { setAwsLoading(false); }
  };

  const resetAwsConfig = () => { if (confirm('Are you sure you want to reset all changes?')) fetchAwsConfig(); };

  const testAwsConnection = async () => {
    try {
      setTestLoading(true); setTestResult(null); setAwsError(null);
      const username = localStorage.getItem('username');
      const currentConfigResponse = await fetch('/api/admin/config/aws/get-actual', { headers: { 'Authorization': username } });
      let actualSecretKey = awsConfig.secret_access_key;
      if (currentConfigResponse.ok) {
        const currentData = await currentConfigResponse.json();
        if (currentData.success && currentData.config && awsConfig.secret_access_key.includes('*'.repeat(Math.max(awsConfig.secret_access_key.length - 8, 0)))) {
          actualSecretKey = currentData.config.secret_access_key;
        }
      }
      const response = await fetch('/api/admin/config/aws/test', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify({ ...awsConfig, secret_access_key: actualSecretKey }) });
      const data = await response.json();
      if (data.success) { setTestResult({ success: true, message: data.message }); showAwsNotification('AWS S3 connection test succeeded'); }
      else { setTestResult({ success: false, message: data.error || data.message || 'Unknown error' }); showAwsNotification('AWS S3 connection test failed', 'error'); }
    } catch (error) { setTestResult({ success: false, message: error.message }); showAwsNotification('Failed to test AWS connection', 'error'); } 
    finally { setTestLoading(false); }
  };

  const fetchSendgridConfig = async () => {
    try {
      setSendgridLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/sendgrid', { headers: { 'Authorization': username } });
      const data = await response.json();
      if (data.success && data.config) setSendgridConfig(data.config);
    } catch (error) { showNotification('Failed to load SendGrid configuration', 'error'); } 
    finally { setSendgridLoading(false); }
  };

  const fetchSendgridLogs = async () => {
    try {
      setSgLogsLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/sendgrid-logs', { headers: { 'Authorization': username } });
      const data = await response.json();
      if (data.success) {
        setSgLogs(data.logs || []);
        setSgTopAccounts(data.topAccounts || []);
        setSgGraphData(data.graphData || []);
      }
    } catch (error) { console.error("Error fetching logs", error); } 
    finally { setSgLogsLoading(false); }
  };

  const saveSendgridConfig = async (e) => {
    e.preventDefault();
    try {
      setSendgridLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/sendgrid', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify(sendgridConfig) });
      const data = await response.json();
      if (data.success) { showNotification('SendGrid configuration saved successfully'); fetchSendgridConfig(); }
      else throw new Error(data.error);
    } catch (error) { showNotification(error.message, 'error'); } 
    finally { setSendgridLoading(false); }
  };

  const testSendgridConnection = async () => {
    try {
      setSendgridTestLoading(true); setSendgridTestResult(null);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/sendgrid/test', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify(sendgridConfig) });
      const data = await response.json();
      if (data.success) { setSendgridTestResult({ success: true, message: data.message }); showNotification('SendGrid connection test succeeded'); }
      else { setSendgridTestResult({ success: false, message: data.error || data.message || 'Unknown error' }); showNotification('SendGrid connection test failed', 'error'); }
    } catch (error) { setSendgridTestResult({ success: false, message: error.message }); showNotification('Failed to test SendGrid connection', 'error'); } 
    finally { setSendgridTestLoading(false); }
  };

  const fetchGoogleConfig = async () => {
    try {
      setGoogleLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/google', { headers: { 'Authorization': username } });
      const data = await response.json();
      if (data.success && data.config) setGoogleConfig(data.config);
    } catch (error) { showNotification('Failed to load Google Sheets configuration', 'error'); } 
    finally { setGoogleLoading(false); }
  };

  const saveGoogleConfig = async (e) => {
    e.preventDefault();
    try {
      setGoogleLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/google', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify(googleConfig) });
      const data = await response.json();
      if (data.success) showNotification('Google Sheets configuration saved successfully');
      else throw new Error(data.error);
    } catch (error) { showNotification(error.message, 'error'); } 
    finally { setGoogleLoading(false); }
  };

  const fetchUrlConfig = async () => {
    try {
      setUrlLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/url', { headers: { 'Authorization': username } });
      const data = await response.json();
      if (data.success && data.config) setUrlConfig(data.config);
    } catch (error) { showNotification('Failed to load Base URL configuration', 'error'); } 
    finally { setUrlLoading(false); }
  };

  const saveUrlConfig = async (e) => {
    e.preventDefault();
    try {
      setUrlLoading(true);
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/config/url', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify(urlConfig) });
      const data = await response.json();
      if (data.success) showNotification('Base URL configuration saved successfully');
      else throw new Error(data.error);
    } catch (error) { showNotification(error.message, 'error'); } 
    finally { setUrlLoading(false); }
  };

  const fetchAllUsers = async () => {
    try {
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/users', { headers: { 'Authorization': username } });
      if (response.ok) {
        const data = await response.json();
        if (data.success) setAllUsers(data.users);
      }
      await fetchDashboardData(username);
    } catch (error) { console.error('Error fetching users:', error); }
  };

  const handleAddUser = () => { setModalMode('add'); setCurrentUser(null); setIsModalOpen(true); };
  const handleEditUser = (user) => { setModalMode('edit'); setCurrentUser(user); setIsModalOpen(true); };
  const handleViewUser = async (user) => {
    try {
      const username = localStorage.getItem('username');
      const response = await fetch(`/api/admin/users?single=true&id=${user.id}`, { headers: { 'Authorization': username } });
      if (response.ok) {
        const data = await response.json();
        if (data.success) { setModalMode('view'); setCurrentUser(data.user); setIsModalOpen(true); }
      }
    } catch (error) { showNotification('Failed to load user details', 'error'); }
  };

  const handleSaveUser = async (userData) => {
    try {
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/users', { method, headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify(modalMode === 'add' ? userData : { id: currentUser.id, ...userData }) });
      if (response.ok) {
        const data = await response.json();
        if (data.success) { fetchAllUsers(); setIsModalOpen(false); showNotification(modalMode === 'add' ? 'User added successfully' : 'Saved successfully'); }
      }
    } catch (error) { showNotification('Failed to save user', 'error'); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const username = localStorage.getItem('username');
      const response = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE', headers: { 'Authorization': username } });
      const data = await response.json();
      if (data.success) {
        setAllUsers(prev => prev.filter(user => user.id !== userId));
        setSelectedUsers(prev => prev.filter(id => id !== userId));
        fetchAllUsers(); showNotification('User deleted successfully');
      } else showNotification(data.error || 'Failed to delete user', 'error');
    } catch (error) { showNotification('Failed to delete user', 'error'); }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0 || !confirm(`Are you sure you want to delete ${selectedUsers.length} selected user(s)?`)) return;
    try {
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify({ ids: selectedUsers }) });
      const data = await response.json();
      if (data.success) {
        setAllUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        setSelectedUsers([]); fetchAllUsers();
        showNotification(`${selectedUsers.length} user(s) deleted successfully`);
      } else showNotification(data.error || 'Failed to delete selected users', 'error');
    } catch (error) { showNotification('Failed to delete selected users', 'error'); }
  };

  const handleToggleStatus = async (user) => {
    if (!confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) return;
    try {
      const username = localStorage.getItem('username');
      const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': username }, body: JSON.stringify({ id: user.id, is_active: !user.is_active }) });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u));
          fetchAllUsers(); showNotification(`User marked ${!user.is_active ? 'Active' : 'Inactive'}`);
        }
      }
    } catch (error) { showNotification('Failed to update user status', 'error'); }
  };

  const renderDashboard = () => (
    <>
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: '#3b82f6' }}>
          <h3>Total Users</h3><div className={styles.statValue}>{stats.totalUsers}</div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#10b981' }}>
          <h3>Active Users</h3><div className={styles.statValue}>{stats.activeUsers}</div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#8b5cf6' }}>
          <h3>Admin Users</h3><div className={styles.statValue}>{stats.adminUsers}</div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#f59e0b' }}>
          <h3>Configurations</h3><div className={styles.statValue}>{stats.totalConfigs}</div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.configCard}>
          <h3><FiShield /> System Connections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>AWS Connection</span>
              <span style={{ color: connectionStatus.aws === 'connected' ? '#10b981' : connectionStatus.aws === 'error' ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                {connectionStatus.aws === 'connected' ? <FiCheckCircle /> : connectionStatus.aws === 'error' ? <FiXCircle /> : <FiClock />} 
                {connectionStatus.aws === 'connected' ? 'Connected' : connectionStatus.aws === 'error' ? 'Not Connected' : 'Checking...'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>SendGrid Connection</span>
              <span style={{ color: connectionStatus.sendgrid === 'connected' ? '#10b981' : connectionStatus.sendgrid === 'error' ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                {connectionStatus.sendgrid === 'connected' ? <FiCheckCircle /> : connectionStatus.sendgrid === 'error' ? <FiXCircle /> : <FiClock />} 
                {connectionStatus.sendgrid === 'connected' ? 'Connected' : connectionStatus.sendgrid === 'error' ? 'Not Connected' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.configCard}>
          <h3><FiClock /> Recent Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontWeight: '500', color: '#1e3a8a' }}>Polling Active</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Connections refresh every 5s</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderUsers = () => {
    const filteredUsers = allUsers.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All Roles' || 
        (roleFilter === 'Admin' && user.is_admin) || (roleFilter === 'User' && !user.is_admin);
      const matchesStatus = statusFilter === 'All Status' ||
        (statusFilter === 'Active' && user.is_active) || (statusFilter === 'Inactive' && !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });

    return (
      <div>
        <div className={styles.searchContainer}>
          <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" placeholder="Search users..." className={styles.searchInput} style={{ paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className={styles.formSelect} style={{ width: '200px' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option>All Roles</option><option>Admin</option><option>User</option>
            </select>
            <select className={styles.formSelect} style={{ width: '200px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All Status</option><option>Active</option><option>Inactive</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {selectedUsers.length > 0 && (
              <button className={styles.btnDanger} onClick={handleDeleteSelected}>
                <FiTrash2 /> Delete Selected ({selectedUsers.length})
              </button>
            )}
            <button className={styles.btnPrimary} onClick={handleAddUser}><FiPlus /> Add User</button>
          </div>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} onChange={(e) => setSelectedUsers(e.target.checked ? filteredUsers.map(u => u.id) : [])} className={styles.checkbox} />
                </th>
                <th>ID</th><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => setSelectedUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])} className={styles.checkbox} />
                  </td>
                  <td>{user.id}</td><td><strong>{user.username}</strong></td><td>{user.name}</td><td>{user.email || '-'}</td>
                  <td><span className={`${styles.statusBadge} ${user.is_admin ? styles.statusAdmin : ''}`}>{user.is_admin ? 'Admin' : 'User'}</span></td>
                  <td><span className={`${styles.statusBadge} ${user.is_active ? styles.statusActive : styles.statusInactive}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}> 
                      <button className={`${styles.actionButton} ${styles.btnView}`} onClick={() => handleViewUser(user)} title="View"><FiEye /></button>
                      <button className={`${styles.actionButton} ${styles.btnEdit}`} onClick={() => handleEditUser(user)} title="Edit"><FiEdit2 /></button>
                      <button className={`${styles.actionButton} ${user.is_active ? styles.btnWarning : styles.btnSuccess}`} onClick={() => handleToggleStatus(user)} title="Toggle Status">{user.is_active ? <FiLock /> : <FiUnlock />}</button>
                      <button className={`${styles.actionButton} ${styles.btnDelete}`} onClick={() => handleDeleteUser(user.id)} title="Delete"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className={styles.noData}>No users found</div>}
        </div>
      </div>
    );
  };

  const renderAWSConfig = () => (
    <div className={styles.awsConfigCard}>
      <div className={styles.awsConfigHeader}>
        <h3 style={{color: '#1e3a8a'}}><FiSettings /> AWS Configuration</h3>
        <button className={styles.btnPrimary} onClick={testAwsConnection} disabled={testLoading}>
          <FiRefreshCw /> {testLoading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
      {(awsLoading || testLoading) && <div className={styles.awsLoadingBar}><div className={styles.awsLoadingProgress}></div></div>}
      
      {testResult && (
        <div className={`${styles.awsTestResultContainer} ${testResult.success ? styles.awsTestSuccess : styles.awsTestError}`}>
          <div className={styles.awsTestResultHeader}>
            <strong>{testResult.success ? '✓ Success:' : '✗ Error:'}</strong>
            <button onClick={() => setTestResult(null)} className={styles.awsTestResultClose}>×</button>
          </div>
          <div className={styles.awsTestResultContent}>{testResult.message}</div>
        </div>
      )}

      <form onSubmit={saveAwsConfig}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Access Key ID</label>
          <input type="text" className={styles.formInput} value={awsConfig.access_key_id} onChange={(e) => setAwsConfig({...awsConfig, access_key_id: e.target.value})} required />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Secret Access Key</label>
          <input type="text" className={styles.formInput} value={awsConfig.secret_access_key} onChange={(e) => setAwsConfig({...awsConfig, secret_access_key: e.target.value})} required />
        </div>
        <div className={styles.awsFormRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Region</label>
            <input type="text" className={styles.formInput} value={awsConfig.region} onChange={(e) => setAwsConfig({...awsConfig, region: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>S3 Bucket Name</label>
            <input type="text" className={styles.formInput} value={awsConfig.s3_bucket_name} onChange={(e) => setAwsConfig({...awsConfig, s3_bucket_name: e.target.value})} required />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Migration Bucket Name</label>
          <input type="text" className={styles.formInput} value={awsConfig.s3_migration_bucket_name} onChange={(e) => setAwsConfig({...awsConfig, s3_migration_bucket_name: e.target.value})} required />
        </div>
        <div className={styles.awsFormActions}>
          <button type="button" onClick={resetAwsConfig} className={styles.btnSecondary} disabled={awsLoading}>Reset</button>
          <button type="submit" className={styles.btnPrimary} disabled={awsLoading}>{awsLoading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );

  const renderSendGridConfig = () => {
    const filteredSgLogs = sgLogs.filter(log => {
      const matchSearch = sgLogSearch === '' || 
        log.sub_account.toLowerCase().includes(sgLogSearch.toLowerCase()) ||
        log.person_name.toLowerCase().includes(sgLogSearch.toLowerCase()) ||
        log.username.toLowerCase().includes(sgLogSearch.toLowerCase()) ||
        log.ticket.toLowerCase().includes(sgLogSearch.toLowerCase());
      
      let matchDate = true;
      const logDate = new Date(log.created_at);
      logDate.setHours(0,0,0,0);
      
      if (sgLogStartDate) {
        const start = new Date(sgLogStartDate);
        start.setHours(0,0,0,0);
        if (logDate < start) matchDate = false;
      }
      if (sgLogEndDate) {
        const end = new Date(sgLogEndDate);
        end.setHours(0,0,0,0);
        if (logDate > end) matchDate = false;
      }
      return matchSearch && matchDate;
    });

    const handleSgLogsDownload = () => {
      let csvContent = "Sub-Account Name,Credits,Date,Person Name,Username,FD / Mantis Ticket\n";
      filteredSgLogs.forEach(log => {
        const row = [
          `"${log.sub_account}"`,
          `"${log.credits_adjusted}"`,
          `"${new Date(log.created_at).toLocaleDateString()}"`,
          `"${log.person_name}"`,
          `"${log.username}"`,
          `"${log.ticket}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Sendgrid_Limit_Logs.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Calculate maximum graph height value
    const maxGraphTotal = sgGraphData.length > 0 ? Math.max(...sgGraphData.map(d => Number(d.total_increased)), 1) : 1;

    return (
      <div className={styles.awsConfigCard}>
        <div className={styles.awsConfigHeader}>
          <h3 style={{color: '#1e3a8a'}}><FiMail /> SendGrid Configuration</h3>
          <button className={styles.btnPrimary} onClick={testSendgridConnection} disabled={sendgridTestLoading}>
            <FiRefreshCw /> {sendgridTestLoading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        {(sendgridLoading || sendgridTestLoading) && <div className={styles.awsLoadingBar}><div className={styles.awsLoadingProgress}></div></div>}
        
        {sendgridTestResult && (
          <div className={`${styles.awsTestResultContainer} ${sendgridTestResult.success ? styles.awsTestSuccess : styles.awsTestError}`}>
            <div className={styles.awsTestResultHeader}>
              <strong>{sendgridTestResult.success ? '✓ Success:' : '✗ Error:'}</strong>
              <button onClick={() => setSendgridTestResult(null)} className={styles.awsTestResultClose}>×</button>
            </div>
            <div className={styles.awsTestResultContent}>{sendgridTestResult.message}</div>
          </div>
        )}

        <form onSubmit={saveSendgridConfig}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>SendGrid API Key</label>
            <input type="text" className={styles.formInput} value={sendgridConfig.api_key} onChange={(e) => setSendgridConfig({...sendgridConfig, api_key: e.target.value})} placeholder="SG.xxxxxxxxxxxxxxx" required />
          </div>
          <div className={styles.awsFormActions}>
            <button type="button" onClick={fetchSendgridConfig} className={styles.btnSecondary} disabled={sendgridLoading}>Reset</button>
            <button type="submit" className={styles.btnPrimary} disabled={sendgridLoading}>{sendgridLoading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>

        <hr style={{ margin: '3rem 0', borderColor: '#e2e8f0', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
        
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#1e3a8a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiActivity /> Limit Adjustment Logs
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
            {/* Top 5 Accounts Table */}
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
              <h4 style={{ color: '#475569', marginBottom: '0.5rem' }}>Top 5 Most Adjusted (Last 6 Months)</h4>
              <div className={styles.tableContainer} style={{ maxHeight: 'none' }}>
                <table className={styles.adminTable} style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      {/* Fixed width overrides nth-child CSS rule completely */}
                      <th style={{ width: '160px', minWidth: '160px', maxWidth: '160px', whiteSpace: 'normal', wordWrap: 'break-word' }}>Sub-Account Name</th>
                      <th>Adjustment Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sgTopAccounts.length > 0 ? sgTopAccounts.map((acc, i) => (
                      <tr key={i}>
                        <td style={{ width: '160px', minWidth: '160px', maxWidth: '160px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          <strong>{acc.sub_account}</strong>
                        </td>
                        <td>{acc.request_count}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="2" style={{ textAlign: 'center' }}>No recent data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom Graph Section */}
            <div style={{ flex: '2', minWidth: '300px', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ color: '#475569', marginBottom: '1rem', textAlign: 'center' }}>Total Credits Increased (Last 6 Months)</h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '180px', paddingTop: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                {sgGraphData.length > 0 ? sgGraphData.map((data, idx) => {
                  const heightPercent = Math.max((Number(data.total_increased) / maxGraphTotal) * 100, 2);
                  const isLarge = Number(data.total_increased) >= 1000;
                  const displayVal = isLarge ? `+${(Number(data.total_increased)/1000).toFixed(1)}k` : `+${data.total_increased}`;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px', height: '100%' }}>
                      
                      {/* Flex Wrapper to stick the value exactly on top of the bar */}
                      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>{displayVal}</span>
                        <div style={{ 
                          height: `${heightPercent}%`, 
                          width: '100%', 
                          backgroundColor: '#10b981', 
                          backgroundImage: 'linear-gradient(to top, #059669, #34d399)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.5s ease'
                        }}></div>
                      </div>

                      <span style={{ fontSize: '0.75rem', color: '#475569', marginTop: '8px', textAlign: 'center' }}>{data.month_name}</span>
                    </div>
                  );
                }) : (
                  <div style={{ color: '#94a3b8', alignSelf: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>No data available for graph</div>
                )}
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className={styles.searchContainer} style={{ flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                className={styles.searchInput} 
                style={{ paddingLeft: '40px', width: '92%' }} 
                value={sgLogSearch} 
                onChange={(e) => setSgLogSearch(e.target.value)} 
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input type="date" className={styles.formInput} style={{ width: 'auto', margin: 0 }} value={sgLogStartDate} onChange={(e) => setSgLogStartDate(e.target.value)} title="Start Date" />
              <span style={{ color: '#94a3b8' }}>to</span>
              <input type="date" className={styles.formInput} style={{ width: 'auto', margin: 0 }} value={sgLogEndDate} onChange={(e) => setSgLogEndDate(e.target.value)} title="End Date" />
              <button 
                onClick={handleSgLogsDownload} 
                disabled={filteredSgLogs.length === 0} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  backgroundColor: filteredSgLogs.length === 0 ? '#94a3b8' : '#107c41', 
                  color: 'white', border: 'none', padding: '0.65rem 1rem', 
                  borderRadius: '6px', cursor: filteredSgLogs.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '500', transition: 'background-color 0.2s'
                }}>
                <FiFileText /> Export
              </button>
            </div>
          </div>

          {/* Logs Table */}
          {sgLogsLoading ? (
            <div className={styles.loading}>Loading logs...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    {/* Fixed width overrides nth-child CSS rule completely */}
                    <th style={{ width: '160px', minWidth: '160px', maxWidth: '160px', whiteSpace: 'normal', wordWrap: 'break-word' }}>Sub-Account Name</th>
                    <th>Credits</th>
                    <th>Date</th>
                    <th>Person Name</th>
                    <th>Username</th>
                    <th>Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSgLogs.length > 0 ? filteredSgLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ width: '160px', minWidth: '160px', maxWidth: '160px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        <strong>{log.sub_account}</strong>
                      </td>
                      <td>
                        <span style={{ color: log.credits_adjusted > 0 ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                          {log.credits_adjusted > 0 ? '+' : ''}{log.credits_adjusted}
                        </span>
                      </td>
                      <td>{new Date(log.created_at).toLocaleDateString()}</td>
                      <td>{log.person_name}</td>
                      <td>{log.username}</td>
                      <td>{log.ticket}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No logs found matching your criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGoogleConfig = () => (
    <div className={styles.awsConfigCard}>
      <div className={styles.awsConfigHeader}>
        <h3 style={{color: '#1e3a8a'}}><FiFileText /> Google Sheets Configuration</h3>
      </div>
      {googleLoading && <div className={styles.awsLoadingBar}><div className={styles.awsLoadingProgress}></div></div>}
      
      <form onSubmit={saveGoogleConfig}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>License Sheet ID</label>
          <input type="text" className={styles.formInput} value={googleConfig.license_sheet_id} onChange={(e) => setGoogleConfig({...googleConfig, license_sheet_id: e.target.value})} placeholder="Enter Google Sheet ID" required />
        </div>
        <div className={styles.awsFormActions}>
          <button type="button" onClick={fetchGoogleConfig} className={styles.btnSecondary} disabled={googleLoading}>Reset</button>
          <button type="submit" className={styles.btnPrimary} disabled={googleLoading}>{googleLoading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );

  const renderUrlConfig = () => (
    <div className={styles.awsConfigCard}>
      <div className={styles.awsConfigHeader}>
        <h3 style={{color: '#1e3a8a'}}><FiGlobe /> Base URL Configuration</h3>
      </div>
      {urlLoading && <div className={styles.awsLoadingBar}><div className={styles.awsLoadingProgress}></div></div>}
      
      <form onSubmit={saveUrlConfig}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Base URL</label>
          <input type="url" className={styles.formInput} value={urlConfig.base_url} onChange={(e) => setUrlConfig({...urlConfig, base_url: e.target.value})} placeholder="https://api.yourdomain.com" required />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Environment</label>
          <select className={styles.formSelect} value={urlConfig.environment} onChange={(e) => setUrlConfig({...urlConfig, environment: e.target.value})} required>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
        <div className={styles.awsFormActions}>
          <button type="button" onClick={fetchUrlConfig} className={styles.btnSecondary} disabled={urlLoading}>Reset</button>
          <button type="submit" className={styles.btnPrimary} disabled={urlLoading}>{urlLoading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );

  if (loading) return <div className={styles.adminContainer}><div className={styles.loading}>Loading Admin Panel...</div></div>;

  return (
    <div className={styles.adminContainer}>
      <Head>
        <title>Admin Dashboard</title>
      </Head>

      <Layout>
        <div className={styles.adminHeader}>
          <div>
            <h1 className={styles.adminTitle}><FiSettings className={styles.adminIcon} size={32} /> Admin Dashboard</h1>
            <p className={styles.adminSubtitle}>Manage users, configurations, and system settings</p>
          </div>
          <div><button className={styles.btnSecondary} onClick={() => router.push('/home')}>Back to Home</button></div>
        </div>

        {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '6px', margin: '1rem', borderLeft: '4px solid #ef4444' }}><strong>Error:</strong> {error}</div>}
        {notification.show && <div className={`${styles.notification} ${styles[notification.type]}`}>{notification.message}</div>}
        {awsNotification.show && <div className={`${styles.awsNotification} ${styles[awsNotification.type]}`}>{awsNotification.message}</div>}

        {isModalOpen && <UserModal mode={modalMode} user={currentUser} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} />}

        <div className={styles.adminNav}>
          <button className={`${styles.navButton} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => handleTabChange('dashboard')}><FiBarChart2 /> Dashboard</button>
          <button className={`${styles.navButton} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => handleTabChange('users')}><FiUsers /> Users</button>
          <button className={`${styles.navButton} ${activeTab === 'aws' ? styles.active : ''}`} onClick={() => handleTabChange('aws')}><FiSettings /> AWS Config</button>
          <button className={`${styles.navButton} ${activeTab === 'sendgrid' ? styles.active : ''}`} onClick={() => handleTabChange('sendgrid')}><FiMail /> SendGrid</button>
          <button className={`${styles.navButton} ${activeTab === 'google' ? styles.active : ''}`} onClick={() => handleTabChange('google')}><FiFileText /> Google Sheets</button>
          <button className={`${styles.navButton} ${activeTab === 'url' ? styles.active : ''}`} onClick={() => handleTabChange('url')}><FiGlobe /> Base URL</button>
          <button className={`${styles.navButton} ${activeTab === 'license' ? styles.active : ''}`} onClick={() => handleTabChange('license')}><FiKey /> License</button>
        </div>

        <div className={styles.adminContent}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'aws' && renderAWSConfig()}
          {activeTab === 'sendgrid' && renderSendGridConfig()}
          {activeTab === 'google' && renderGoogleConfig()}
          {activeTab === 'url' && renderUrlConfig()}
          {activeTab === 'license' && (
            <div className={styles.alert}>
              <FiSettings /> License Manager configuration coming soon...
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '/pages/components/Layout.js';
import styles from '/styles/Home.module.css';
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js";


export default function SendgridLimits() {
  const [subAccounts, setSubAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [tempLimit, setTempLimit] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  //const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [username, setUsername] = useState('');
  const [fdTicket, setFdTicket] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showSuppressions, setShowSuppressions] = useState(false);
  const [activeTab, setActiveTab] = useState('bounces');
  const [suppressionData, setSuppressionData] = useState({
    bounces: [],
    invalids: [],
    blocks: [],
    spam_reports: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [suppressionLoading, setSuppressionLoading] = useState(false);
  const [suppressionError, setSuppressionError] = useState('');
  const [showSenderAuth, setShowSenderAuth] = useState(false);
  const [senderAuthData, setSenderAuthData] = useState({
    domains: [],
    links: []
  });
  const [senderAuthLoading, setSenderAuthLoading] = useState(false);
  const [senderAuthError, setSenderAuthError] = useState('');
  const [activeAuthTab, setActiveAuthTab] = useState('domains');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');


  useEffect(() => {
    fetchSubAccounts();
  }, []);

  useEffect(() => {
    if (result) {
      setShowPopup(true);
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [result]);


  useEffect(() => {
  if (showSuppressions) {
    // Reset suppression data when account changes
    setSuppressionData({ bounces: [], invalids: [], blocks: [], spam_reports: [] });
    // Reload data for current tab
    fetchSuppressionData(activeTab);
  }
}, [selectedAccount?.username]);


const fetchSenderAuthData = async (type) => {
  if (!selectedAccount?.username) return;
  
  setSenderAuthLoading(true);
  setSenderAuthError('');
  
  try {
    const encodedUsername = encodeURIComponent(selectedAccount.username);
    const response = await fetch(
      `/api/sendgridlimit/sender-auth?type=${type}&username=${encodedUsername}`
    );

    // Add JSON parsing with error handling
    const textResponse = await response.text();
    let data;
    
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      console.error('Invalid JSON response:', textResponse);
      throw new Error('Received invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch data');
    }

    setSenderAuthData(prev => ({
      ...prev,
      [type]: data.data
    }));
    
  } catch (err) {
    setSenderAuthError(err.message || 'Failed to fetch data');
  }
  
  setSenderAuthLoading(false);
};


  const handleSelectEmail = (email) => {
    setSelectedEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email) 
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectAll || selectedEmails.length > 0) {
      setSelectedEmails([]);
      setSelectAll(false);
    } else {
      const allEmails = suppressionData[activeTab].map(item => item.email);
      setSelectedEmails(allEmails);
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/suppressiondelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          username: selectedAccount.username,
          emails: selectedEmails
        })
      });

      const result = await response.json();
      if (response.ok) {
        // Reload data after successful deletion
        fetchSuppressionData(activeTab);
        setSelectedEmails([]);
        setSelectAll(false);
        setResult(`Deleted ${selectedEmails.length} emails successfully`);
      } else {
        setError(result.error || 'Failed to delete selected emails');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
    setDeleteLoading(false);
    setShowDeleteConfirmation(false);
  };

  // Fetch activity feed data
  const fetchActivityData = async () => {
    if (!selectedAccount?.username) return;
    
    setActivityLoading(true);
    setActivityError('');
    
    try {
      const encodedUsername = encodeURIComponent(selectedAccount.username);
      const response = await fetch(
        `/api/sendgridactivity?username=${encodedUsername}`
      );

      const data = await response.json();
      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(data.error || 'Failed to fetch activity data');
      }

      setActivityData(data.messages || []);
      
    } catch (err) {
      console.error('Fetch Activity Error:', err);
      setActivityError(err.message || 'Failed to fetch activity data');
    }
    
    setActivityLoading(false);
  };


  const fetchSuppressionData = async (type) => {
    if (!selectedAccount?.username) return;
    
    setSuppressionLoading(true);
    setSuppressionError('');
    
    try {
      console.log(`Fetching suppression data for type: ${type}`);
      let apiUrl;

      if (type === 'spam_reports') {
        // Use the new endpoint for spam reports
        apiUrl = `/api/sendgridspamreports?username=${selectedAccount.username}`;
      } else {
        // Use existing endpoint for other types
        apiUrl = `/api/sendgridlimit/suppressions?type=${type}&username=${selectedAccount.username}&limit=500&ts=${Date.now()}`;
      }

      const response = await fetch(apiUrl);
      const textResponse = await response.text();
      console.log(`API response: ${textResponse.substring(0, 100)}...`);
        

      let data;
      
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error('Invalid JSON response:', textResponse);
        throw new Error('Received invalid response from server');
      }

      // IMPORTANT: Keep error handling uncommented
      if (!response.ok) {
        console.error(`API error: ${data.error || 'Unknown error'}`);
        throw new Error(data.error || 'Failed to fetch suppression data');
      }

      setSuppressionData(prev => ({
        ...prev,
        [type]: data.data || []
      }));
      
    } catch (err) {
      console.error('Fetch error:', err);
      setSuppressionError(err.message || 'Failed to fetch suppression data');
      setSuppressionData(prev => ({
        ...prev,
        [type]: []
      }));
    }
    
    setSuppressionLoading(false);
  };

  const fetchSubAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sendgridlimit');
      const data = await response.json();
      console.log('Fetched subAccounts:', data.subusers); // Add this line
      if (response.ok) {
        setSubAccounts(data.subusers);
      } else {
        setError(data.error || 'Failed to fetch sub-accounts');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
    setLoading(false);
  };


  // Add this function to handle CSV download
  const handleDownload = () => {
    const type = activeTab;
    const data = suppressionData[type];
    const username = selectedAccount.username;

    // Create CSV content
    let csvContent = `Sendgrid ${type.charAt(0).toUpperCase() + type.slice(1)} Data - ${username}\n`;
    
    // Add headers based on suppression type
    if (type === 'spam_reports') {
      csvContent += 'Email,Date/Time\n';
    } else {
      csvContent += 'Email,Date/Time,Reason\n';
    }
    
    // Add data rows
    data.forEach(item => {
      const row = [
        `"${item.email}"`,
        `"${new Date(item.created * 1000).toLocaleString()}"`
      ];
      
      if (type !== 'spam_reports') {
        row.push(`"${item.reason || ''}"`);
      }
      
      csvContent += row.join(',') + '\n';
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${username}_${type}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add placeholder delete function
  const handleDelete = () => {
    alert('Delete functionality will be implemented in the next phase');
  };


  const handleAccountSelect = async (username) => {
    try {
      const response = await fetch(`/api/sendgridlimit?username=${username}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedAccount(data.subuser);
      } else {
        setError(data.error || 'Failed to fetch account details');
      }
    } catch (err) {
      setError('Failed to fetch account details');
    }
  };

  const handleLimitSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/sendgridlimit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: selectedAccount.username,
            newLimit: tempLimit,
            usernameInput: username,
            userPassword: userPassword,
            fdTicket: fdTicket
        })
      });

      const result = await response.json();
      if (response.ok) {
        const action = Number(tempLimit) > 0 ? 'increased' : 'decreased';
        const amount = Math.abs(Number(tempLimit));
        setResult(`The temporary limit of ${selectedAccount.username} is ${action} by ${amount} successfully`);

        setSelectedAccount(prev => ({
          ...prev,
          ...result.updatedAccount
        }));
        setShowLimitForm(false);
        setShowConfirmation(false);
        setTempLimit('');
        setUsername('');
        setUserPassword('');
        setFdTicket('');
        setError('');

      } else {
        setError(result.error || 'Limit update failed');
      }
    } catch (err) {
      setError('Failed to update limit');
    }
    setLoading(false);
  };

  const filteredAccounts = (subAccounts || []).filter(account =>
    (account.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className={styles.body}>
      <Head>
        <title>SendGrid Limits Management</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <Layout>
        <div className={styles.CSRContainer}>
          <div className={styles.licenseContent}>
            <div className={styles.licenseHeader}>
              <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex' }}>
                SendGrid Sub-Account Management
              </h1>
              <Tooltip text="Modify Recurring and Temporary limits for any SendGrid sub-account.">
                <Link href="/files/help" legacyBehavior>
                  <a className={styles.tooltip}>
                    <HelpCircle size={24} color="#64748b" />
                  </a>
                </Link>
              </Tooltip>
            </div>

            <p className={styles.licenseDescription}>
            You can view, increase, or decrease the Recurring and Temporary limits for any SendGrid sub-account. 
            The maximum adjustment allowed at a time is 10,000.
              </p>

            {error && <div className={styles.notification}>{error}</div>}


            <div className={styles.licenseDescription}>
              <div className={styles.mainbox}>
                <label>Search Sub-Accounts:</label>
                <input
                  type="text"
                  placeholder="Search sub-accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.styledselecttempmargin}
                  style={{ width: '97%', margin: '10px 0' }}
                />
                

                {loading ? (
                  <div style={{ textAlign: 'center', margin: '30px 0' }}>
                    <img src="/spinner3.gif" alt="Loading..." style={{ width: '200px' }} />
                    
                  </div>
                ) : (

                <div className={styles.box1} style={{ maxHeight: '250px', width: '97%', overflowY: 'auto' }}>
                {filteredAccounts.map(account => (
                <div
                    key={account.username}
                    onClick={() => handleAccountSelect(account.username)}
                    style={{
                    padding: '8px',
                    cursor: 'pointer',

                    backgroundColor: selectedAccount?.username === account.username ? '#f0f4ff' : 'transparent',
                    borderBottom: '1px solid #eee'
                    }}
                >
                    {account.username}
                  </div>
                  ))}
                </div>
                )}
              </div>

              {selectedAccount && (
                <div className={styles.mainbox} style={{ marginTop: '20px' }}>
                  <h3>Account Details: {selectedAccount.username}</h3>
                  
                  {selectedAccount.disabled ? (
                    <div className={styles.contentbox}>
                      <p>The Sub-Account: <strong>{selectedAccount.username}</strong> is disabled.</p>
                    </div>
                  ) : (
                    <>
                      <div className={styles.contentbox}>
                        <p>Monthly Recurring Limit (Permanent): {selectedAccount.monthly_limit || 'Not available'}</p>
                        <p>
                          Remaining Credit: {
                            selectedAccount.remaining == null
                              ? 'Not available'
                              : selectedAccount.remaining < 0
                              ? 0
                              : selectedAccount.remaining
                          }
                        </p>
                      </div>

                      {!showLimitForm ? (

                        <div className={styles.buttonGroup}>
                          <button
                            onClick={() => setShowLimitForm(true)}
                            className={styles.btndescription}
                          >
                            Update Temporary Limit
                          </button>
                          <button
                            onClick={() => {
                              setShowSuppressions(true);
                              // Reset data and load bounces immediately
                              setSuppressionData({ bounces: [], invalids: [], blocks: [], spam_reports: [] });
                              fetchSuppressionData('bounces');
                              fetchSuppressionData('invalids');
                              fetchSuppressionData('blocks');
                              fetchSuppressionData('spam_reports');
                            }}
                            className={styles.viewButton}
                          >
                            View Suppressions
                          </button>
                          <button
                            onClick={() => {
                              setShowSenderAuth(true);
                              setSenderAuthData({ domains: [], links: [] });
                              fetchSenderAuthData('domains');
                              fetchSenderAuthData('links');
                            }}
                            className={styles.viewButton2}
                          >
                            View Sender Authentication
                          </button>
                          <button
                            onClick={() => {
                              setShowActivityFeed(true);
                              fetchActivityData();
                            }}
                            className={styles.viewButton3}
                          >
                            View Activity Feed
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={(e) => e.preventDefault()}>
                          <div className={styles.licenseDescription}>
                            <br />
                            <strong>Note:</strong> {" "}
                            Add positive number values (100) to increase the limit and negative number values (-100) to decrease it.
                            <br />
                            <br />
                            <label>
                              <strong>Temporary Credit:</strong>
                              <input
                                type="number"
                                value={tempLimit}
                                onChange={(e) => setTempLimit(e.target.value)}
                                className={styles.styledselecttempmargin}
                                style={{ width: '97%', margin: '10px 0' }}
                                required
                              />
                            </label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                              <button
                                type="button"
                                onClick={() => setShowConfirmation(true)}
                                className={styles.btndescription}
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowLimitForm(false)}
                                className={styles.clearbtn}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.licenseVisual}>
            <img 
              src="/Sendgridimage3.png"  // Update with appropriate image
              alt="SendGrid Management"
              className={styles.licenseImage}
            />
          </div>
        </div>

        {showActivityFeed && selectedAccount && !selectedAccount.disabled && (
          <div className={styles.suppressionContainer}>
            <div className={styles.suppressionHeader}>
              <h3>Activity Feed for {selectedAccount.username}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowActivityFeed(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search by Email, Subject, or Status..."
                value={activitySearchTerm}
                onChange={(e) => setActivitySearchTerm(e.target.value)}
                className={styles.suppressionSearch}
              />
              <button 
                onClick={fetchActivityData}
                className={styles.refreshButton}
              >
                Refresh
              </button>
            </div>

            {activityLoading ? (
              <div className={styles.suppressionLoading}>
                <img src="/spinner3.gif" alt="Loading..." style={{ width: '200px' }} />
              </div>
            ) : activityError ? (
              <div className={styles.suppressionError}>{activityError}</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.suppressionTable}>
                  <thead>
                    <tr>
                      <th>From Email</th>
                      <th>To Email</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Last Event</th>
                      <th>Opens</th>
                      <th>Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityData
                      .filter(item => {
                        const searchLower = activitySearchTerm.toLowerCase();
                        return (
                          (item.from_email?.toLowerCase().includes(searchLower) || '') ||
                          (item.to_email?.toLowerCase().includes(searchLower) || '') ||
                          (item.subject?.toLowerCase().includes(searchLower) || '') ||
                          (item.status?.toLowerCase().includes(searchLower) || '')
                        );
                      })
                      .map((item, index) => (
                        <tr key={index}>
                          <td>{item.from_email || 'N/A'}</td>
                          <td>{item.to_email || 'N/A'}</td>
                          <td>{item.subject || 'N/A'}</td>
                          <td>{item.status || 'N/A'}</td>
                          <td>{item.last_event_time ? new Date(item.last_event_time).toLocaleString() : 'N/A'}</td>
                          <td>{item.opens_count || 0}</td>
                          <td>{item.clicks_count || 0}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {activityData.length === 0 && !activityLoading && (
                  <div className={styles.noData}>No activity data found</div>
                )}
              </div>
            )}
          </div>
        )}

        {showConfirmation && (
          <div className={styles.popupContainer}>
            <div className={styles.popupBox}>
              <h3>Confirm Limit Adjustment</h3>
              <p><strong>Sub-Account:</strong> {selectedAccount?.username}</p>
              <p><strong>Temporary Limit:</strong> {tempLimit}</p>
              <div className={styles.licenseDescription}
               style={{ textAlign:'left'}}
              >
                <label>
                  Username:
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.styledselecttempmargin}
                    style={{ width: '96%', margin: '10px 0' }}
                    required
                  />
                </label>
                <label>
                  Password:
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className={styles.styledselecttempmargin}
                    style={{ width: '96%', margin: '10px 0' }}
                    required
                  />
                </label>
                <label>
                  FD/Mantis Ticket:
                  <input
                    type="text"
                    value={fdTicket}
                    onChange={(e) => setFdTicket(e.target.value)}
                    className={styles.styledselecttempmargin}
                    style={{ width: '96%', margin: '10px 0' }}
                    required
                  />
                </label>
              </div>
              <div className={styles.popupButtons}>
                <button
                  onClick={handleLimitSubmit}
                  className={styles.yesButton}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className={styles.noButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pop-up Notification */}
        {showPopup && (
        <div className={styles.notification}>
            {result}
        </div>
        )}

        {showSuppressions && selectedAccount && !selectedAccount.disabled && (
          <div className={styles.suppressionContainer}>
            <div className={styles.suppressionHeader}>
              <h3>Suppressions for {selectedAccount.username}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSuppressions(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.tabContainer}>
              <button
                className={`${styles.tabButton} ${activeTab === 'bounces' ? styles.activeTab : ''}`}
                onClick={() => {
                  setActiveTab('bounces');
                  if (suppressionData.bounces.length === 0 || 
                      suppressionData.bounces[0]?.username !== selectedAccount.username) {
                    fetchSuppressionData('bounces');
                  }
                }}
              >
                Bounces
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'invalids' ? styles.activeTab : ''}`}
                onClick={() => {
                  setActiveTab('invalids');
                  if (suppressionData.invalids.length === 0 || 
                      suppressionData.invalids[0]?.username !== selectedAccount.username) {
                    fetchSuppressionData('invalids');
                  }
                }}
              >
                Invalids
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'blocks' ? styles.activeTab : ''}`}
                onClick={() => {
                  setActiveTab('blocks');
                  if (suppressionData.blocks.length === 0 || 
                      suppressionData.blocks[0]?.username !== selectedAccount.username) {
                    fetchSuppressionData('blocks');
                  }
                }}
              >
                Blocks
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'spam_reports' ? styles.activeTab : ''}`}
                onClick={() => {
                  setActiveTab('spam_reports');
                  if (suppressionData.spam_reports.length === 0 || 
                      suppressionData.spam_reports[0]?.username !== selectedAccount.username) {
                    fetchSuppressionData('spam_reports');
                  }
                }}
              >
                Spam Reports
              </button>
            </div>

            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search by Email or Date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.suppressionSearch}
              />
              <div className={styles.actionButtons}>
                <button 
                  onClick={handleDownload}
                  className={styles.downloadButton}
                  disabled={suppressionData[activeTab].length === 0}
                >
                  Download
                </button>
                <button 
                  onClick={() => setShowDeleteConfirmation(true)}
                  className={styles.deleteButton}
                  disabled={selectedEmails.length === 0 || suppressionLoading}
                >
                  Delete
                </button>
              </div>                      
            </div>

            
            {showDeleteConfirmation && (
              <div className={styles.popupContainer}>
                <div className={styles.popupBox}>
                  <h3>Confirm Deletion</h3>
                  <p>Are you sure you want to delete the following emails?</p>
                  
                  <div className={styles.emailList}>
                    {selectedEmails.slice(0, 5).map(email => (
                      <div key={email} className={styles.emailItem}>
                        {email}
                      </div>
                    ))}
                    {selectedEmails.length > 5 && (
                      <div className={styles.emailItem}>
                        and {selectedEmails.length - 5} more...
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.popupButtons}>
                    <button
                      onClick={handleDeleteSelected}
                      className={styles.yesButton}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting...' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirmation(false)}
                      className={styles.noButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {suppressionLoading ? (
              <div className={styles.suppressionLoading}>
                <img src="/spinner3.gif" alt="Loading..." style={{ width: '200px' }} />
              </div>
            ) : suppressionError ? (
              <div className={styles.suppressionError}>{suppressionError}</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.suppressionTable}>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectAll || selectedEmails.length === suppressionData[activeTab]?.length}
                          onChange={handleSelectAll}
                          disabled={suppressionLoading || suppressionData[activeTab]?.length === 0}
                        />
                      </th>
                      <th>Email</th>
                      <th>Date/Time</th>
                      {activeTab !== 'spam_reports' && <th>Reason</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {suppressionData[activeTab]
                      .filter(item => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          item.email.toLowerCase().includes(searchLower) ||
                          new Date(item.created * 1000).toLocaleString().includes(searchTerm)
                        );
                      })
                      .map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedEmails.includes(item.email)}
                              onChange={() => handleSelectEmail(item.email)}
                              disabled={suppressionLoading}
                            />
                          </td>
                          <td>{item.email}</td>
                          <td>{new Date(item.created * 1000).toLocaleString()}</td>
                          {activeTab !== 'spam_reports' && <td>{item.reason}</td>}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {showSenderAuth && selectedAccount && !selectedAccount.disabled && (
          <div className={styles.suppressionContainer}>
            <div className={styles.suppressionHeader}>
              <h3>Sender Authentication for {selectedAccount.username}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSenderAuth(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.tabContainer}>
              <button
                className={`${styles.tabButton} ${activeAuthTab === 'domains' ? styles.activeTab : ''}`}
                onClick={() => setActiveAuthTab('domains')}
              >
                Domain Authentication
              </button>
              <button
                className={`${styles.tabButton} ${activeAuthTab === 'links' ? styles.activeTab : ''}`}
                onClick={() => setActiveAuthTab('links')}
              >
                Link Branding
              </button>
            </div>

            {senderAuthLoading ? (
              <div className={styles.suppressionLoading}>
                <img src="/spinner3.gif" alt="Loading..." style={{ width: '200px' }} />
              </div>
            ) : senderAuthError ? (
              <div className={styles.suppressionError}>{senderAuthError}</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.suppressionTable}>
                  <thead>
                    <tr>
                      {activeAuthTab === 'domains' ? (
                        <>
                          <th>Domain</th>
                          <th>Valid</th>
                          <th>Default</th>
                          <th>Subdomain</th>
                          <th>DNS Validation</th>
                        </>
                      ) : (
                        <>
                          <th>Links</th>
                          <th>Valid</th>
                          <th>Default</th>
                          <th>Subdomain</th>
                          <th>DNS Validation</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeAuthTab === 'domains' ? (
                      senderAuthData.domains.map((domain, index) => (
                        <tr key={index}>
                          <td>{domain.domain}</td>
                          <td>{domain.valid ? 'Yes' : 'No'}</td>
                          <td>{domain.default ? 'Yes' : 'No'}</td>
                          <td>{domain.subdomain}</td>
                          <td>
                            <span style={{ color: domain.dns?.mail_cname?.valid ? 'green' : 'red' }}>
                              {domain.dns?.mail_cname?.valid ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      senderAuthData.links.map((link, index) => (
                        <tr key={index}>
                          <td>{link.domain}</td>
                          <td>{link.valid ? 'Yes' : 'No'}</td>
                          <td>{link.default ? 'Yes' : 'No'}</td>
                          <td>{link.subdomain}</td>
                          <td>
                            <span style={{ color: link.dns?.domain_cname?.valid ? 'green' : 'red' }}>
                              {link.dns?.domain_cname?.valid ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {activeAuthTab === 'domains' && senderAuthData.domains.length === 0 && (
                  <div className={styles.noData}>No domains found</div>
                )}
                {activeAuthTab === 'links' && senderAuthData.links.length === 0 && (
                  <div className={styles.noData}>No link brandings found</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.Installerhomebtn}>
          <button style={{ marginBottom: '1rem' }}><Link href="/home">Back to Home</Link></button>
        </div>

        <footer className={styles.footer}>
        <div className={styles.footerRow}>
          <a
            href="https://www.globalnorthstar.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by{' '} Northstar Technologies
            <img src="/northstar.jpg" alt="Northstar" className={styles.logonew} />
          </a>
          
        </div>
        <div className={styles.footerRow}>
        <a
            href="https://www.globalnorthstar.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            |
          </a>
        </div>
        <div className={styles.footerRow}>
          <a
            href="https://github.com/mubi7070/SSLAutomationApp/tree/master"
            target="_blank"
            rel="noopener noreferrer"
          >
            By: Mubashir Ahmed (DevOps)
            <img src="/dev.svg" alt="DevOps" className={styles.logonew} />
          </a>
        </div>
      </footer>
      </Layout>
    </main>
  );
}
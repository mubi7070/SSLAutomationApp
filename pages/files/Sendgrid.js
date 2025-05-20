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
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [suppressionLoading, setSuppressionLoading] = useState(false);
  const [suppressionError, setSuppressionError] = useState('');




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
    setSuppressionData({ bounces: [], invalids: [], blocks: [] });
    // Reload data for current tab
    fetchSuppressionData(activeTab);
  }
}, [selectedAccount?.username]);


  const fetchSuppressionData = async (type) => {
    if (!selectedAccount?.username) return;
    
    setSuppressionLoading(true);
    setSuppressionError('');
    
    try {
      const response = await fetch(
        `/api/sendgridlimit/suppressions?type=${type}&username=${selectedAccount.username}&limit=500&ts=${Date.now()}`
      );

      const textResponse = await response.text();
      let data;
      
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error('Invalid JSON response:', textResponse);
        throw new Error('Received invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suppression data');
      }

      setSuppressionData(prev => ({
        ...prev,
        [type]: data.data
      }));
      
    } catch (err) {
      setSuppressionError(err.message || 'Failed to fetch suppression data');
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
                              setSuppressionData({ bounces: [], invalids: [], blocks: [] });
                              fetchSuppressionData('bounces');
                              fetchSuppressionData('invalids');
                              fetchSuppressionData('blocks');
                            }}
                            className={styles.viewButton}
                          >
                            View Suppressions
                          </button>
                          <button
                            onClick={() => {
                              // setShowSuppressions(true);
                              // // Reset data and load bounces immediately
                              // setSuppressionData({ bounces: [], invalids: [], blocks: [] });
                              // fetchSuppressionData('bounces');
                              // fetchSuppressionData('invalids');
                              // fetchSuppressionData('blocks');
                            }}
                            className={styles.viewButton2}
                          >
                            Sender Authentication
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
            </div>

            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search by Email or Date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.suppressionSearch}
              />
            </div>

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
                      <th>Email</th>
                      <th>Date/Time</th>
                      <th>Reason</th>
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
                          <td>{item.email}</td>
                          <td>{new Date(item.created * 1000).toLocaleString()}</td>
                          <td>{item.reason || 'N/A'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
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
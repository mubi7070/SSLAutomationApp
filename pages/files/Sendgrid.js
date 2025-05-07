import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '/pages/components/Layout.js';
import styles from '/styles/Home.module.css';
import Link from "next/link";

export default function SendgridLimits() {
  const [subAccounts, setSubAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [tempLimit, setTempLimit] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubAccounts();
  }, []);

  const fetchSubAccounts = async () => {
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
            password
        })
      });

      const result = await response.json();
      if (response.ok) {
        // Update local state with new credit information
        setSelectedAccount(prev => ({
          ...prev,
          ...result.updatedAccount
        }));
        setShowLimitForm(false);
        setShowConfirmation(false);
        setTempLimit('');
        setPassword('');
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
            </div>

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
              </div>

              {selectedAccount && (
                <div className={styles.mainbox} style={{ marginTop: '20px' }}>
                  <h3>Account Details: {selectedAccount.username}</h3>
                  <div className={styles.contentbox}>
                    <p>Monthly Recurring Limit: {selectedAccount.monthly_limit || 'Not available'}</p>
                    <p>Remaining Credit: {selectedAccount.remaining || 'Not available'}</p>
                    <p>
                        Used Credits: {
                            selectedAccount.used == null
                            ? 'Not available'
                            : selectedAccount.used < 0
                            ? 0
                            : selectedAccount.used
                        }
                    </p>
                </div>

                  {!showLimitForm ? (
                    <button
                      onClick={() => setShowLimitForm(true)}
                      className={styles.btndescription}
                      style={{ marginTop: '10px' }}
                    >
                      Update Temporary Limit
                    </button>
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
              <h3>Confirm Limit Increase</h3>
              <p>Sub-Account: {selectedAccount?.username}</p>
              <p>Temporary Limit: {tempLimit}</p>
              <div className={styles.licenseDescription}>
                <label>
                  Enter Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.styledselecttempmargin}
                    style={{ width: '90%', margin: '10px 0' }}
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
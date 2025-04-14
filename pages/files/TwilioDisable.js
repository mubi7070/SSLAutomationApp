import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Layout from '/pages/components/Layout.js';
import styles from "/styles/Home.module.css";
import Tooltip from "/pages/components/Tooltip.js";
import { HelpCircle } from "lucide-react";

export default function TwilioDisable() {
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);

  useEffect(() => {
    if (result) {
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    }
  }, [result]);

  const handleDisable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/disable-twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountSid, authToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to disable account');
      
      setResult(data.message || 'Account suspended successfully');
    } catch (error) {
      setResult(error.message || 'An error occurred');
    } finally {
      setLoading(false);
      setShowConfirmPopup(false);
    }
  };

  const handleClear = () => {
    setAccountSid('');
    setAuthToken('');
  };

  return (
    <main className={styles.body}>
      <Head>
        <title>Disable Twilio</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <Layout>
        <div className={styles.CSRContainer}>
          <div className={styles.licenseContent}>
            <div className={styles.licenseHeader}>
              <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex' }}>
                Disable Twilio Account
              </h1>
              <Tooltip text="You can disable any twilio account by just entering it's Account SID & Auth Token.">
                <Link href="/files/help" legacyBehavior>
                  <a className={styles.tooltip}>
                    <HelpCircle size={24} color="#64748b" />
                  </a>
                </Link>
              </Tooltip>
            </div>

            <p className={styles.licenseDescription}>
              Enter your Twilio Account SID and Auth Token to suspend the account.
              This action is irreversible and will immediately suspend all services.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); setShowConfirmPopup(true); }}>
              <div className={styles.licenseDescription}>
                <label>
                  Account SID:
                  <input
                    type="text"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxx"
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                    className={styles.styledselecttempmargin}
                    required
                    style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                  />
                </label>
              </div>

              <div className={styles.licenseDescription}>
                <label>
                  Auth Token:
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                      type={showAuthToken ? 'text' : 'password'}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxx"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className={styles.styledselecttempmargin}
                      required
                      style={{
                        flex: 1,
                        padding: '7px',
                        margin: '10px 0',
                        borderRight: 'none',
                        borderRadius: '5px 0 0 5px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthToken(!showAuthToken)}
                      style={{
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderLeft: 'none',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc',
                        borderRadius: '0 4px 4px 0',
                        height: '34px',
                      }}
                    >
                      {showAuthToken ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.btndescription}
                >
                  {loading ? 'Disabling...' : 'Disable'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className={styles.clearbtn}
                >
                  Clear
                </button>
              </div>
            </form>

            {showPopup && (
              <div className={styles.notification}>
                {result}
              </div>
            )}
          </div>

          <div className={styles.licenseVisual}>
            <img 
              src="/deleteaccount3.png"
              alt="Twilio Account Preview"
              className={styles.licenseImage}
            />
          </div>
        </div>

        {showConfirmPopup && (
          <div className={styles.popupContainer}>
            <div className={styles.popupBox}>
              <h3>Confirmation</h3>
              <p>Are you sure you want to disable this Twilio account?</p>
              <div className={styles.popupButtons}>
                <button 
                  className={styles.yesButton}
                  onClick={handleDisable}
                >
                  Yes, Disable
                </button>
                <button 
                  className={styles.noButton}
                  onClick={() => setShowConfirmPopup(false)}
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
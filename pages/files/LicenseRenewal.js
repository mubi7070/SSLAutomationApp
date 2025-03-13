import { useState, useEffect } from "react";
import axios from 'axios';
import Layout from '/pages/components/Layout.js';
import styles from "/styles/Home.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { HelpCircle } from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js"; // Import Tooltip
import Link from "next/link";


const LicenseRenewal = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [option, setOption] = useState('1');

  useEffect(() => {
      if (message) {
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 10000); // Hide after 3 seconds
      }
    }, [message]);

  const handleExecute = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('/api/get-license');
      
      if (response.data.success) {
        setMessage(`Success: ${response.data.message}`);
      } else {
        setMessage(`Error: ${response.data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
    <div className="license-renewal-container">
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <h2 style={{ margin: 0 }}>License Renewal Automation</h2>
    
        <Tooltip text="Select the No. Of months of which you want to get the license expiry data in the sheet and click of Execute.">
          <Link href="/files/help" legacyBehavior>
            <a className={styles.tooltip}>
              <HelpCircle size={20} />
            </a>
          </Link>
        </Tooltip>
      </div>
      <p className="description">
        This feature automatically fetches expiring licenses from the database and updates
        the Google Sheet with the latest data. Existing sheet data will be preserved, and
        new records will be appended.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label className={styles.description}>
          No. Of Months: {" "}
          <select value={option} className={styles.styledselecttempmargin} onChange={(e) => setOption(e.target.value)}>
            <option value="1">1 Month</option>
            <option value="2">2 Months</option>
            <option value="3">3 Months</option>
            <option value="4">4 Months</option>
            <option value="5">5 Months</option>
            <option value="6">6 Months</option>
          </select>
        </label>
      </div>
      
      <button 
        onClick={handleExecute}
        disabled={loading}
        className={styles.btndescription}
        type="submit"
      >
        {loading ? 'Processing...' : 'Execute'}
      </button>
      

      {/* Pop-up Notification */}
        {showPopup && (
        <div className={styles.notification}>
            {message}
        </div>
      )}

      <style jsx>{`
        .license-renewal-container {
          max-width: 1000px;
          margin: 2rem auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .description {
          color: #666;
          margin: 1rem 0;
        }
        .execute-btn {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: opacity 0.3s;
        }
        .execute-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .message {
          margin-top: 1rem;
          padding: 10px;
          border-radius: 5px;
        }
        .success {
          background: #e6ffed;
          color: #2d773d;
        }
        .error {
          background: #fff0f0;
          color: #dc3545;
        }
      `}</style>
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
  );
};

export default LicenseRenewal;
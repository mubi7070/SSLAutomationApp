import { useState, useEffect } from "react";
import Head from "next/head";
import axios from 'axios';
import Layout from '/pages/components/Layout.js';
import styles from "/styles/Home.module.css";
import { HelpCircle } from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js";
import Link from "next/link";

const LicenseRenewal = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState('2');

  useEffect(() => {
    if (message) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 10000);
    }
  }, [message]);

  const handleExecute = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('/api/get-license', {
        months: selectedMonths
      });
      
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
    <>
    <main className={styles.body}>
      <Head>
        <title>CSR Generator</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
    <Layout>
      <div className={styles.licenseContainer}>
        <div className={styles.licenseContent}>
          <div className={styles.licenseHeader}>
            
            <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex'}}>License Renewal Automation</h1>
            <Tooltip text="Select months range and click execute to update Google Sheet">
              <Link href="/files/help" legacyBehavior>
                <a className={styles.tooltip}>
                  <HelpCircle size={24} color="#64748b" />
                </a>
              </Link>
            </Tooltip>
          </div>
          
          <p className={styles.licenseDescription}>
            Automatically fetch and update expiring licenses in Google Sheets 
            while preserving the previous sheet data. Select the monitoring period below as per your requirement.
          </p>

          <div>
            <label className={styles.licenseDescription}>
              Monitoring Period:
              <select 
                value={selectedMonths} 
                onChange={(e) => setSelectedMonths(e.target.value)}
                className={styles.licenseSelect}
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>
                    {num} Month{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <button 
            onClick={handleExecute}
            disabled={loading}
            className={styles.licenseButton}
          >
            {loading ? 'Processing...' : 'Execute Update'}
          </button>
        </div>

        <div className={styles.licenseVisual}>
          <img 
            src="/license-dashboard.png"
            alt="License Management Preview"
            className={styles.licenseImage}
          />
        </div>
      </div>

      {showPopup && (
        <div className={`${styles.licenseNotification} ${
          message.includes('Success') ? styles.licenseSuccess : styles.licenseError
        }`}>
          {message}
        </div>
      )}
    
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
    </>
  );
  
};

export default LicenseRenewal;
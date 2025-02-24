import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from '/styles/Home.module.css';
import { HelpCircle } from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js"; // Import Tooltip
import DownloadFiles from "/pages/components/DownloadFiles.js";
import FileUpload from "/pages/components/FileUpload.js";

const baseCertDir = 'Certs/';

export default function SSLInstaller() {
  const [formData, setFormData] = useState({
    certPaths: [
      {
        alias: 'root',
        label: 'Certificate 1 (alias: Root, i.e. AAACertificateServices):',
        path: 'AAACertificateServices.crt',
        enabled: true,
      },
      {
        alias: 'cross',
        label: 'Certificate 2 (alias: Cross, i.e. USERTrustRSAAAACA):',
        path: 'USERTrustRSAAAACA.crt',
        enabled: true,
      },
      {
        alias: 'intermed',
        label: 'Certificate 3 (alias: Intermed, i.e. SectigoRSADomainValidationSecureServerCA):',
        path: 'SectigoRSADomainValidationSecureServerCA.crt',
        enabled: true,
      },
      {
        alias: 'godaddy',
        label: 'Certificate 4 (alias: Godaddy, i.e. Main Certificate):',
        path: '',
        enabled: true,
      },
    ],
    keystoreName: '',
    keystorePassword: 'sibisoft',
  });

  const [responseResults, setResponseResults] = useState([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [keystoreFiles, setKeystoreFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [filteredcerts, setfilteredcerts] = useState([]);
  const [CertFiles, setCertFiles] = useState([]);
  const [files, setFiles] = useState([]);
  useEffect(() => {
    fetch('/api/install-ssl')
      .then((response) => response.json())
      .then((data) => {
        setKeystoreFiles(data.files || []);
        setFilteredFiles(data.files || []);
      })
      .catch((error) => console.error('Error fetching keystore files:', error));
  }, []);

  useEffect(() => {
    fetch('/api/get-bundle')
      .then((response) => response.json())
      .then((data) => {
        setfilteredcerts(data.files || []);
        setCertFiles(data.files || []);
      })
      .catch((error) => console.error('Error fetching Certificate files:', error));
  }, []);

  useEffect(() => {
    if (responseMessage) {
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 5000); // Hide after 5 seconds
    }
  }, [responseMessage]);


  const handleCertPathChange = (index, value) => {
    const updatedCertPaths = [...formData.certPaths];
    updatedCertPaths[index].path = value;
    setFormData({ ...formData, certPaths: updatedCertPaths });
  };

  const refreshCertificates = () => {
    fetch('/api/get-bundle')
      .then((response) => response.json())
      .then((data) => {
        setfilteredcerts(data.files || []);
        setCertFiles(data.files || []);
      })
      .catch((error) => console.error('Error refreshing certificates:', error));
  };

  const toggleCertEnabled = (index) => {
    const updatedCertPaths = [...formData.certPaths];
    updatedCertPaths[index].enabled = !updatedCertPaths[index].enabled;
    setFormData({ ...formData, certPaths: updatedCertPaths });
  };

  const handleKeystoreChange = (value) => {
    setFormData({ ...formData, keystoreName: value });
    setFilteredFiles(keystoreFiles.filter((file) => file.toLowerCase().includes(value.toLowerCase())));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage('Installing certificates...');
    setResponseResults([]);

    try {
      const response = await fetch('/api/install-ssl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setResponseResults(result.results);
        console.log(`The keystore return name is: ${result.file}`);
        setFiles([`${result.file}`]);
        setResponseMessage('');
      } else {
        setResponseMessage(`${result.message}`);
      }
    } catch (error) {
      setResponseMessage(`${error.message}`);
    }
  };

  const handleClear = () => {
    window.location.reload();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
    <main className={styles.body}>
      <Head>
        <title>SSL Installer</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <div style={{ padding: '20px' }}>
        <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex', justifyContent: 'center' }}>
          SSL Installer
        </h1>
        <form onSubmit={handleSubmit} style={{ margin: '10px auto' }}>
          {/* Add FileUpload component here */}
          <FileUpload 
            styles={styles}
            setResponseMessage={setResponseMessage}
            setShowPopup={setShowPopup}
            refreshCertificates={refreshCertificates}
          />

          {formData.certPaths.map((cert, index) => (
            <div key={cert.alias} style={{ marginBottom: '10px', paddingLeft: '15%' }}>
              <label className={styles.description}>{cert.label}</label>
              {/* Help Icon with Tooltip */}
              <Tooltip text="You need add the certificate file paths on the relevent Alias to add that in the keystore. Click for more details.">
                <Link href="/files/help" legacyBehavior>
                  <a className={styles.tooltip}>
                    <HelpCircle size={20} />
                  </a>
                </Link>
              </Tooltip>
              <input
                className={styles.styledselecttempmargin}
                type="text"
                placeholder="Type Here..."
                value={cert.path}
                onChange={(e) => handleCertPathChange(index, e.target.value)}
                required={cert.enabled}
                list="certOptions" // Add datalist reference
                style={{ width: '70%', padding: '7px', margin: '10px 0' }}
              />
              <label className={styles.customCheckbox}>
                <input
                  type="checkbox"
                  checked={cert.enabled}
                  onChange={() => toggleCertEnabled(index)}
                />
                <span className="checkboxLabel">Enable</span>
              </label>
            </div>
          ))}
          <datalist id="certOptions">
            {CertFiles.map((file, index) => (
              <option key={index} value={file} />
            ))}
          </datalist>

          <div style={{ marginBottom: '10px', paddingLeft: '15%' }}>
            <label className={styles.description}>Keystore File Name:</label> 
            
            {/* Help Icon with Tooltip */}
            <Tooltip text="Here, you have to select the keystore file name that is already present in the app in which you want to install the SSL certificates.">
              <Link href="/files/help" legacyBehavior>
                <a className={styles.tooltip}>
                  <HelpCircle size={20} />
                </a>
              </Link>
            </Tooltip>
            
            <br />
            <input
              className={styles.styledselecttempmargin}
              type="text"
              placeholder="Type to search or select"
              value={formData.keystoreName}
              onChange={(e) => handleKeystoreChange(e.target.value)}
              list="keystoreOptions"
              required
              style={{ width: '50%', padding: '7px', margin: '10px 0' }}
            />
            <datalist id="keystoreOptions">
              {filteredFiles.map((file, index) => (
                <option key={index} value={file} />
              ))}
            </datalist> 
            <label className={styles.notedescription}> Note: </label>
            <label className={styles.notedescription} style={{ color: 'red' }}>
              The keystore file should be present in the Application
            </label>
          </div>
          <div style={{ marginBottom: '20px', paddingLeft: '15%' }}>
            <label className={styles.description}>Keystore password:</label> 

            {/* Help Icon with Tooltip */}
            <Tooltip text="Please enter the password you set when creating the CSR and keystore.">
              <Link href="/files/help" legacyBehavior>
                <a className={styles.tooltip}>
                  <HelpCircle size={20} />
                </a>
              </Link>
            </Tooltip>
            
            
            <br />
            <div style={{ display: 'flex', alignItems: 'center', width: '50%' }}>
              <input
                className={styles.styledselecttempmargin}
                type={showPassword ? 'text' : 'password'}
                placeholder="Type Here..."
                value={formData.keystorePassword}
                onChange={(e) => setFormData({ ...formData, keystorePassword: e.target.value })}
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
                onClick={togglePasswordVisibility}
                style={{
                  padding: '7px',
                  borderLeft: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '0 5px 5px 0',
                  border: '1px solid #ccc',
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button type="submit" className={styles.btndescription}>
              Install Certificates
            </button>
            <button type="button" onClick={handleClear} className={styles.clearbtn}>
              Clear
            </button>
          </div>
        </form>
        {responseMessage && <p>{responseMessage}</p>}
        {/* 
        Pop-up Notification
        {showPopup && (
        <div className={styles.notification}>
            {responseMessage}
        </div>
      )}
        */}
        {responseResults.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ textAlign: 'left', margin: '20px auto', width: '60%' }}>Installation Results:</h3>
            <ul style={{ textAlign: 'left', margin: '20px auto', width: '60%' }}>
              {responseResults.map((result, index) => (
                <li key={index}>
                  <strong>Alias {result.alias}:</strong> {result.output}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Pop-up Notification */}
        {showPopup && (
          <div className={styles.notification}>
            {responseMessage}
            {responseResults.length > 0 && (
              <ul>
                {responseResults.map((result, index) => (
                  <li key={index}>
                    <strong>Alias {result.alias}:</strong> {"Installed"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      <div>
        <DownloadFiles filePaths={files} /> {/* Auto-downloads all files */}
      </div>
      </div>
      


      <div className={styles.Installerhomebtn}>
        <button>
          <Link href="/">Back to Home</Link>
        </button>
      </div>
      </main>

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
      
    </>
  );
}

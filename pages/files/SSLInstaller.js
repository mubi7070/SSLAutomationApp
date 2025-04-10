import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from '/styles/Home.module.css';
import { HelpCircle } from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js"; // Import Tooltip
import DownloadFiles from "/pages/components/DownloadFiles.js";
import FileUpload from "/pages/components/FileUpload.js";
import Layout from '/pages/components/Layout.js';

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
        label: 'Certificate 3 (alias: Intermed, i.e. SectigoRSADomain...):',
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
      <Layout>
        <div className={styles.CSRContainer}>
          <div className={styles.licenseContent}>
            <div className={styles.licenseHeader}>
              <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex' }}>
                SSL Certificate Installer
              </h1>
              <Tooltip text="Install SSL certificates into existing keystores. Upload certificates and configure installation parameters.">
                <Link href="/files/help" legacyBehavior>
                  <a className={styles.tooltip}>
                    <HelpCircle size={24} color="#64748b" />
                  </a>
                </Link>
              </Tooltip>
            </div>

            <p className={styles.licenseDescription}>
              Upload your certificate files, configure the installation parameters, and click{' '}
              <strong>Install Certificates</strong>. Ensure the keystore file exists in the application 
              and the correct password is provided.
            </p>

            <form onSubmit={handleSubmit} >
              <div className={styles.licenseDescription}>
                <FileUpload 
                  styles={styles}
                  setResponseMessage={setResponseMessage}
                  setShowPopup={setShowPopup}
                  refreshCertificates={refreshCertificates}
                />
              </div>

              {formData.certPaths.map((cert, index) => (
                <div key={cert.alias} className={styles.licenseDescription}>
                  <label className={styles.licenseDescription}>
                    {cert.label}
                    <Tooltip text="Certificate file name for this alias. Use uploaded files or existing certificates.">
                      <Link href="/files/help" legacyBehavior>
                        <a className={styles.tooltip}>
                          <HelpCircle size={20} />
                        </a>
                      </Link>
                    </Tooltip>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Type Here..."
                        value={cert.path}
                        onChange={(e) => handleCertPathChange(index, e.target.value)}
                        required={cert.enabled}
                        list="certOptions"
                        className={styles.styledselecttempmargin}
                        style={{ width: '100%', padding: '7px', margin: '10px 0' }}
                      />
                      <label className={styles.customCheckbox} style={{ marginLeft: '10px' }}>
                        <input
                          type="checkbox"
                          checked={cert.enabled}
                          onChange={() => toggleCertEnabled(index)}
                        />
                        <span className="checkboxLabel">Enable</span>
                      </label>
                    </div>
                  </label>
                </div>
              ))}
              <datalist id="certOptions">
                {CertFiles.map((file, index) => (
                  <option key={index} value={file} />
                ))}
              </datalist>

              <div className={styles.licenseDescription}>
                <label>
                  Keystore File Name:
                  <Tooltip text="Select or type the name of an existing keystore file">
                    <Link href="/files/help" legacyBehavior>
                      <a className={styles.tooltip}>
                        <HelpCircle size={20} />
                      </a>
                    </Link>
                  </Tooltip>
                  <input
                    className={styles.styledselecttempmargin}
                    type="text"
                    placeholder="Type to search or select"
                    value={formData.keystoreName}
                    onChange={(e) => handleKeystoreChange(e.target.value)}
                    list="keystoreOptions"
                    required
                    style={{ width: '87%', padding: '7px', margin: '10px 0' }}
                  />
                  <datalist id="keystoreOptions">
                    {filteredFiles.map((file, index) => (
                      <option key={index} value={file} />
                    ))}
                  </datalist>
                </label>
                <br />
                <label className={styles.notedescription}>
                  <strong>Note:</strong>{' '}
                  <span style={{ color: 'red' }}>Keystore must exist in the application</span>
                </label>
              </div>

              <div className={styles.licenseDescription}>
                <label>
                  Keystore Password:
                  <Tooltip text="Enter the password used when creating the keystore">
                    <Link href="/files/help" legacyBehavior>
                      <a className={styles.tooltip}>
                        <HelpCircle size={20} />
                      </a>
                    </Link>
                  </Tooltip>
                  <div style={{ display: 'flex', alignItems: 'center', width: '89%' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.keystorePassword}
                      onChange={(e) => setFormData({ ...formData, keystorePassword: e.target.value })}
                      className={styles.styledselecttempmargin}
                      style={{
                        flex: 1,
                        padding: '8px',
                        margin: '10px 0',
                        borderRight: 'none',
                        borderRadius: '5px 0 0 5px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      style={{
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderLeft: 'none',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc',
                        borderRadius: '0 4px 4px 0',
                      }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className={styles.btndescription}>
                  Install Certificates
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
                {responseMessage}
                {responseResults.length > 0 && (
                  <ul style={{ marginTop: '10px' }}>
                    {responseResults.map((result, index) => (
                      <li key={index}>
                        <strong>Alias {result.alias}:</strong> Installed
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div>
              <DownloadFiles filePaths={files} />
            </div>
          </div>

          <div className={styles.licenseVisual}>
            <img 
              src="/lock3.jpg"  // Update with your SSL installer image
              alt="SSL Installation Preview"
              className={styles.licenseImage}
            />
          </div>
        </div>

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
    </>
  );
}

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from '/styles/Home.module.css';

export default function SSLInstaller() {
  const [formData, setFormData] = useState({
    certPaths: [
      {
        alias: 'root',
        label: 'Enter Path Here (alias: Root, i.e. AAACertificateServices):',
        path: 'D:\\SSLAutomationApp\\Certs\\AAACertificateServices.crt',
        enabled: true,
      },
      {
        alias: 'cross',
        label: 'Enter Path Here (alias: Cross, i.e. USERTrustRSAAAACA):',
        path: 'D:\\SSLAutomationApp\\Certs\\USERTrustRSAAAACA.crt',
        enabled: true,
      },
      {
        alias: 'intermed',
        label: 'Enter Path Here (alias: Intermed, i.e. SectigoRSADomainValidationSecureServerCA):',
        path: 'D:\\SSLAutomationApp\\Certs\\SectigoRSADomainValidationSecureServerCA.crt',
        enabled: true,
      },
      {
        alias: 'godaddy',
        label: 'Enter Path Here (alias: Godaddy, i.e. Main Certificate):',
        path: 'D:\\SSLAutomationApp\\Certs\\',
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

  useEffect(() => {
    fetch('/api/install-ssl')
      .then((response) => response.json())
      .then((data) => {
        setKeystoreFiles(data.files || []);
        setFilteredFiles(data.files || []);
      })
      .catch((error) => console.error('Error fetching keystore files:', error));
  }, []);

  const handleCertPathChange = (index, value) => {
    const updatedCertPaths = [...formData.certPaths];
    updatedCertPaths[index].path = value;
    setFormData({ ...formData, certPaths: updatedCertPaths });
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
        setResponseMessage('');
      } else {
        setResponseMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setResponseMessage(`Error: ${error.message}`);
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
      <Head>
        <title>SSL Installer</title>
        <link rel="icon" href="./ssl2white.svg" />
      </Head>
      <div style={{ padding: '20px' }}>
        <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex', justifyContent: 'center' }}>
          SSL Installer
        </h1>
        <form onSubmit={handleSubmit} style={{ margin: '10px auto' }}>
          {formData.certPaths.map((cert, index) => (
            <div key={cert.alias} style={{ marginBottom: '10px', paddingLeft: '15%' }}>
              <label className={styles.description}>{cert.label}</label>
              <input
                className={styles.styledselecttempmargin}
                type="text"
                placeholder="Type Here..."
                value={cert.path}
                onChange={(e) => handleCertPathChange(index, e.target.value)}
                required={cert.enabled}
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
          <div style={{ marginBottom: '10px', paddingLeft: '15%' }}>
            <label className={styles.description}>Keystore File Name:</label> <br />
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
              The keystore file should be present in the Files folder
            </label>
          </div>
          <div style={{ marginBottom: '20px', paddingLeft: '15%' }}>
            <label className={styles.description}>Keystore password:</label> <br />
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
      </div>
      <div className={styles.Installerhomebtn}>
        <button>
          <Link href="/">Back to Home</Link>
        </button>
      </div>
    </>
  );
}

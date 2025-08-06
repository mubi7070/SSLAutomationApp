import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from '/pages/components/Layout.js';
import styles from "/styles/Home.module.css";
import Tooltip from "/pages/components/Tooltip.js";
import { HelpCircle } from "lucide-react";

export default function ServerMigration() {
  const [sourceDrive, setSourceDrive] = useState('D');
  const [destinationDrive, setDestinationDrive] = useState('D');
  const [clientName, setClientName] = useState('');
  const [tomcatPath, setTomcatPath] = useState('');
  const [jdkPath, setJdkPath] = useState('');
  const [mysqlPath, setMysqlPath] = useState('');
  const [sourceStatus, setSourceStatus] = useState('');
  const [destinationStatus, setDestinationStatus] = useState('');
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingDestination, setLoadingDestination] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [excludePaths, setExcludePaths] = useState([
    'pagefile.sys',
    'System Volume Information',
    '$RECYCLE.BIN'
  ]);
  const [newExcludePath, setNewExcludePath] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const driveLetters = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  useEffect(() => {
    if (popupMessage) {
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        setPopupMessage('');
      }, 5000);
    }
  }, [popupMessage]);

  const handleGenerateSourceScript = async () => {
    if (!clientName) {
      setPopupMessage('Please enter client name');
      return;
    }
    
    setLoadingSource(true);
    try {
      const response = await fetch('/api/generate-source-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          drive: sourceDrive, 
          clientName,
          excludePaths
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate script');
      }

      // Get password from response header
      const password = response.headers.get('X-Password');
      setGeneratedPassword(password);
      
      // Trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration-source-${clientName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSourceStatus('ZIP file downloaded. Password required to extract script.');
      setPopupMessage(`Source script generated. Password: ${password}`);
    } catch (error) {
      setPopupMessage(error.message || 'An error occurred');
    } finally {
      setLoadingSource(false);
    }
  };

  const handleGenerateDestinationScript = async () => {
    if (!clientName) {
      setPopupMessage('Please enter client name');
      return;
    }
    
    if (!tomcatPath || !jdkPath || !mysqlPath) {
      setPopupMessage('Please provide all required paths');
      return;
    }
    
    setLoadingDestination(true);
    try {
      const response = await fetch('/api/generate-destination-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          drive: destinationDrive, 
          clientName,
          tomcatPath,
          jdkPath,
          mysqlPath
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate script');
      
      // Trigger download
      const element = document.createElement('a');
      element.href = `data:application/octet-stream;base64,${btoa(data.script)}`;
      element.download = `migration-destination-${clientName}.ps1`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setDestinationStatus('Script downloaded. Please run as administrator on destination server.');
      setPopupMessage('Destination script generated successfully');
    } catch (error) {
      setPopupMessage(error.message || 'An error occurred');
    } finally {
      setLoadingDestination(false);
    }
  };

  const addExcludePath = () => {
    if (newExcludePath.trim()) {
      setExcludePaths([...excludePaths, newExcludePath.trim()]);
      setNewExcludePath('');
    }
  };

  const removeExcludePath = (index) => {
    const updatedPaths = [...excludePaths];
    updatedPaths.splice(index, 1);
    setExcludePaths(updatedPaths);
  };

  return (
    <main className={styles.body}>
      <Head>
        <title>Server Migration</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <Layout>
        <div className={styles.CSRContainer}>
          <div className={styles.licenseContent}>
            <div className={styles.licenseHeader}>
              <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex' }}>
                Server Migration
              </h1>
              <Tooltip text="Migrate server data between Windows servers using S3 bucket">
                <Link href="/files/help" legacyBehavior>
                  <a className={styles.tooltip}>
                    <HelpCircle size={24} color="#64748b" />
                  </a>
                </Link>
              </Tooltip>
            </div>

            <p className={styles.licenseDescription}>
              Migrate all data from a source server to a destination server using S3 bucket as intermediary storage.
            </p>

            <div className={styles.licenseDescription} >
              <p style={{ color: 'red' }}>
                <strong>Important:</strong> Both servers must have 7-Zip installed. 
                <a href="https://www.7-zip.org/download.html" target="_blank" rel="noopener noreferrer">
                  {" "} Download 7-Zip
                </a>
              </p>
              <p>
                <strong>Note:</strong> The script will skip locked files during archiving.
              </p>
            </div>

            <div className={styles.mainContainer2}>
              {/* Source Server Section */}
              <div className={styles.mainbox2} style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'rgb(16, 31, 118)', marginBottom: '1rem' }}>Source Server</h2>
                
                <div className={styles.licenseDescription}>
                  <label>
                    Drive Letter:
                    <select
                      value={sourceDrive}
                      onChange={(e) => setSourceDrive(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '100%', padding: '7px', margin: '10px 0' }}
                    >
                      {driveLetters.map(letter => (
                        <option key={letter} value={letter}>{letter}</option>
                      ))}
                    </select>
                  </label>
                </div>
                
                <div className={styles.licenseDescription}>
                  <label>
                    Client Name:
                    <input
                      type="text"
                      placeholder="Enter client name (e.g., Alpha Club)"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                      required
                    />
                  </label>
                </div>

                <div className={styles.licenseDescription}>
                  <label>
                    Paths to Exclude:
                    <div style={{ margin: '10px 0' }}>
                      <div className={styles.pathInputContainer}>
                        <input
                          type="text"
                          value={newExcludePath}
                          onChange={(e) => setNewExcludePath(e.target.value)}
                          placeholder="Add new path to exclude (e.g., D:\data)"
                          className={styles.styledselecttempmargin}
                          style={{ 
                            width: 'calc(100% - 100px)', 
                            padding: '7px', 
                            marginRight: '10px'
                          }}
                        />
                        <button 
                          onClick={addExcludePath}
                          className={styles.addPathButton}
                        >
                          Add Path
                        </button>
                      </div>
                      
                      <div className={styles.pathList}>
                        {excludePaths.map((path, index) => (
                          <div key={index} className={styles.pathItem}>
                            <span>{path}</span>
                            <button 
                              onClick={() => removeExcludePath(index)}
                              className={styles.removePathButton}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </label>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    Default exclusions: pagefile.sys, System Volume Information, $RECYCLE.BIN
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleGenerateSourceScript}
                    disabled={loadingSource}
                    className={styles.btndescription}
                  >
                    {loadingSource ? 'Generating...' : 'Generate Source Script'}
                  </button>
                </div>
                
                {sourceStatus && (
                  <div style={{ marginTop: '1rem', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '5px', borderLeft: '4px solid #10b981' }}>
                    {sourceStatus}
                  </div>
                )}
              </div>

              {/* Destination Server Section */}
              <div className={styles.mainbox2}>
                <h2 style={{ color: 'rgb(16, 31, 118)', marginBottom: '1rem' }}>Destination Server</h2>
                
                <div className={styles.licenseDescription}>
                  <label>
                    Client Name:
                    <input
                      type="text"
                      placeholder="Must match source client name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                      required
                    />
                  </label>
                </div>
                
                <div className={styles.licenseDescription}>
                  <label>
                    Drive Letter:
                    <select
                      value={destinationDrive}
                      onChange={(e) => setDestinationDrive(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '100%', padding: '7px', margin: '10px 0' }}
                    >
                      {driveLetters.map(letter => (
                        <option key={letter} value={letter}>{letter}</option>
                      ))}
                    </select>
                  </label>
                </div>
                
                <div className={styles.licenseDescription}>
                  <label>
                    Tomcat Path:
                    <input
                      type="text"
                      placeholder="D:\Northstar\Tomcat9 ..."
                      value={tomcatPath}
                      onChange={(e) => setTomcatPath(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                      required
                    />
                  </label>
                </div>
                
                <div className={styles.licenseDescription}>
                  <label>
                    JDK Path:
                    <input
                      type="text"
                      placeholder="D:\jdk1.8.0_181 ..."
                      value={jdkPath}
                      onChange={(e) => setJdkPath(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                      required
                    />
                  </label>
                </div>
                
                <div className={styles.licenseDescription}>
                  <label>
                    MySQL Path:
                    <input
                      type="text"
                      placeholder="D:\MySQL8 ..."
                      value={mysqlPath}
                      onChange={(e) => setMysqlPath(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                      required
                    />
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleGenerateDestinationScript}
                    disabled={loadingDestination}
                    className={styles.btndescription}
                  >
                    {loadingDestination ? 'Generating...' : 'Generate Destination Script'}
                  </button>
                </div>
                
                {destinationStatus && (
                  <div style={{ marginTop: '1rem', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '5px', borderLeft: '4px solid #10b981' }}>
                    {destinationStatus}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.licenseVisual}>
            <img 
              src="/servermigration.jpg"
              alt="Server Migration Preview"
              className={styles.licenseImage}
            />
          </div>
        </div>

        {showPopup && (
          <div className={styles.notification}>
            {popupMessage}
          </div>
        )}

        {generatedPassword && (
        <div className={styles.passwordSection}>
          <h3>Generated Password</h3>
          <div className={styles.passwordBox}>
            <code>{generatedPassword}</code>
            <button 
              onClick={() => navigator.clipboard.writeText(generatedPassword)}
              className={styles.copyButton}
            >
              Copy
            </button>
          </div>
          <p className={styles.passwordNote}>
            This password is required to run the script and will not be shown again.
          </p>
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
              Powered by Northstar Technologies
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
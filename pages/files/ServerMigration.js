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
  const [excludePaths, setExcludePaths] = useState([]);
  const [newExcludePath, setNewExcludePath] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [downloadMethod, setDownloadMethod] = useState('direct');
  const [copied, setCopied] = useState(false);
  const [pathMode, setPathMode] = useState('include'); // 'include' or 'exclude'
  const [includePaths, setIncludePaths] = useState([]);
  const [newIncludePath, setNewIncludePath] = useState('');


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

  const addIncludePath = () => {
    if (newIncludePath.trim()) {
      setIncludePaths([...includePaths, newIncludePath.trim()]);
      setNewIncludePath('');
    }
  };

  const removeIncludePath = (index) => {
    const updatedPaths = [...includePaths];
    updatedPaths.splice(index, 1);
    setIncludePaths(updatedPaths);
  };

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedPassword).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => console.error("Failed to copy:", err));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = generatedPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateSourceScript = async () => {
    if (!clientName) {
      setPopupMessage('Please enter client name');
      return;
    }
    // Validate include paths in include mode
    if (pathMode === 'include' && includePaths.length === 0) {
      setPopupMessage('Please add at least one path to include');
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
          excludePaths,
          includePaths: pathMode === 'include' ? includePaths : [],
          mode: pathMode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate script');
      }

      // Get password from response header
      const password = response.headers.get('X-Password');
      setGeneratedPassword(password);
      
      // Trigger RAR download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration-source-${clientName}.rar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSourceStatus('RAR file downloaded. Password required to extract script.');
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
        <div className={styles.CSRContainerNew}>
          {/* Left Column - Content */}
          <div className={styles.licenseContent}>
            <div className={styles.licenseHeader}>
              <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex' }}>
                Server Migration
              </h1>
              <Tooltip text="Migrate server data seamlessly between Windows-based servers.">
                <Link href="/files/help" legacyBehavior>
                  <a className={styles.tooltip}>
                    <HelpCircle size={24} color="#64748b" />
                  </a>
                </Link>
              </Tooltip>
            </div>

            <p className={styles.licenseDescription}>
              Streamline your server migration process with a powerful feature that transfers all data quickly, securely, and automatically.
            </p>

            <div className={styles.licenseDescription} >
              <p style={{ color: 'red' }}>
                <strong>Important:</strong> Both servers must have WinRAR installed. 
                <a href="https://www.rarlab.com/download.htm" target="_blank" rel="noopener noreferrer">
                  {" "} Download WinRAR
                </a>
              </p>
              <p>
                <strong>Note:</strong> The script will skip locked files during archiving.
              </p>
              <p style={{ fontSize: '1.2rem', color: '#666' }}>
                  <strong>For folders:</strong> avoid trailing backslash (e.g. D:\data)<br/>
                  <strong>For faster execution:</strong> Empty the Recycle Bin before running the source script.
              </p>
            </div>

            {/* Left Column - Source Server */}
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
                
                {/* Radio Buttons */}
                <div className={styles.licenseDescription}>
                  <label>
                    Selection Mode:
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          value="include"
                          checked={pathMode === 'include'}
                          onChange={() => setPathMode('include')}
                          className={styles.radioInput}
                        />
                        Include Specific Paths
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          value="exclude"
                          checked={pathMode === 'exclude'}
                          onChange={() => setPathMode('exclude')}
                          className={styles.radioInput}
                        />
                        Exclude Specific Paths
                      </label>
                    </div>
                  </label>
                </div>
                {/* Include Paths Section */}
                {pathMode === 'include' && (
                  <div className={styles.licenseDescription}>
                    <label>
                      Paths to Include:
                      <div style={{ margin: '10px 0' }}>
                        <div className={styles.pathInputContainer}>
                          <input
                            type="text"
                            value={newIncludePath}
                            onChange={(e) => setNewIncludePath(e.target.value)}
                            placeholder="Add path to include (e.g., D:\data)"
                            className={styles.styledselecttempmargin}
                            style={{ 
                              width: 'calc(100% - 100px)', 
                              padding: '7px', 
                              marginRight: '10px'
                            }}
                          />
                          <button 
                            onClick={addIncludePath}
                            className={styles.addPathButton}
                          >
                            Add Path
                          </button>
                        </div>
                        
                        <div className={styles.pathList}>
                          {includePaths.map((path, index) => (
                            <div key={index} className={styles.pathItem}>
                              <span>{path}</span>
                              <button 
                                onClick={() => removeIncludePath(index)}
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
                      <strong>Note:</strong> Only the above paths will be included in the archive.
                    </p>
                  </div>
                )}

                {/* Exclude Paths Section */}
                <div className={styles.licenseDescription}>
                  <label>
                    {pathMode === 'include' 
                      ? 'Paths to Exclude (within included paths):' 
                      : 'Paths to Exclude:'}
                    <div style={{ margin: '10px 0' }}>
                      <div className={styles.pathInputContainer}>
                        <input
                          type="text"
                          value={newExcludePath}
                          onChange={(e) => setNewExcludePath(e.target.value)}
                          placeholder={pathMode === 'include' 
                            ? "Add path to exclude from included paths" 
                            : "Add path to exclude (e.g., D:\\data)"}
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
                    <strong>Exclusions:</strong> {pathMode === 'include' 
                      ? 'The above paths will be excluded from the included paths' 
                      : 'The above paths will be excluded automatically'}
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

              {generatedPassword && (
                <div className={styles.passwordSection}>
                  <h3>RAR File Password</h3>
                  <div className={styles.passwordBox}>
                    <code>{generatedPassword}</code>
                    <button 
                      onClick={handleCopy}
                      className={styles.copyButton}
                      style={{
                        color: copied ? "green" : "black",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                      />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className={styles.passwordNote}>
                    This password is required to extract the PowerShell script
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Destination Server */}
            <div className={styles.rightColumn}>
            <div className={styles.licenseVisualNew}>
              <img 
                src="/servermigration.jpg"
                alt="Server Migration Preview"
                className={styles.licenseImageNew}
              />
            </div>

                <div className={styles.mainbox2}>

                <h2 style={{ color: 'rgb(16, 31, 118)', marginBottom: '1rem' }}>Destination Server</h2>
                
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
        

          
        

        {showPopup && (
          <div className={styles.notification}>
            {popupMessage}
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
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
  const [generatedPassword2, setGeneratedPassword2] = useState('');
  const [copied, setCopied] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const [pathMode, setPathMode] = useState('include'); // 'include' or 'exclude'
  const [includePaths, setIncludePaths] = useState([]);
  const [newIncludePath, setNewIncludePath] = useState('');
  const [installMySQL, setInstallMySQL] = useState(false);
  const [installTomcat, setInstallTomcat] = useState(false);
  const [copyFonts, setCopyFonts] = useState(false);
  const [ramAllocation, setRamAllocation] = useState(false);
  const [mysqlServiceName, setMysqlServiceName] = useState('MySQL8');
  const [tomcatServiceName, setTomcatServiceName] = useState('Tomcat9');
  const [tomcatDependency, setTomcatDependency] = useState(false);
  const [tomcatInitialMemory, setTomcatInitialMemory] = useState('1024');
  const [tomcatMaxMemory, setTomcatMaxMemory] = useState('2048');
  const [mysqlRamAllocation, setMysqlRamAllocation] = useState(false);
  const [mysqlRamSize, setMysqlRamSize] = useState('4096');
  const [unarchiveOption, setUnarchiveOption] = useState('driveRoot');
  const [unarchivePath, setUnarchivePath] = useState('');

  const [enablePerformanceOptions, setEnablePerformanceOptions] = useState(false);
  const [performanceOptions, setPerformanceOptions] = useState([
    '-Djava.awt.headless=false',
    '-Dfile.encoding=UTF8',
    '-XX:MaxPermSize=1024m',
    '-XX:ReservedCodeCacheSize=128m',
    '-XX:+UseCodeCacheFlushing',
    '-XX:-CreateMinidumpOnCrash',
    '-Xverify:none'
  ]);
  const [newPerformanceOption, setNewPerformanceOption] = useState('');

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

  // Sanitize client name by removing spaces
  const sanitizeClientName = (name) => {
    return name.replace(/\s+/g, '');
  };

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

  const addPerformanceOption = () => {
    if (newPerformanceOption.trim()) {
      setPerformanceOptions([...performanceOptions, newPerformanceOption.trim()]);
      setNewPerformanceOption('');
    }
  };

  const removePerformanceOption = (index) => {
    const updatedOptions = [...performanceOptions];
    updatedOptions.splice(index, 1);
    setPerformanceOptions(updatedOptions);
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

  const handleCopy2 = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedPassword2).then(() => {
        setCopied2(true);
        setTimeout(() => setCopied2(false), 2000);
      }).catch(err => console.error("Failed to copy:", err));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = generatedPassword2;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied2(true);
      setTimeout(() => setCopied2(false), 2000);
    }
  };


  // Clear all form fields
  const handleClearForm = () => {
    setSourceDrive('D');
    setDestinationDrive('D');
    setClientName('');
    setTomcatPath('');
    setJdkPath('');
    setMysqlPath('');
    setSourceStatus('');
    setDestinationStatus('');
    setExcludePaths([]);
    setNewExcludePath('');
    setGeneratedPassword('');
    setGeneratedPassword2('');
    setPathMode('include');
    setIncludePaths([]);
    setNewIncludePath('');
    setInstallMySQL(false);
    setInstallTomcat(false);
    setCopyFonts(false);
    setRamAllocation(false);
    setMysqlServiceName('MySQL8');
    setTomcatServiceName('Tomcat9');
    setTomcatDependency(false);
    setTomcatInitialMemory('1024');
    setTomcatMaxMemory('2048');
    setMysqlRamAllocation(false);
    setMysqlRamSize('4096');
    setUnarchiveOption('driveRoot');
    setUnarchivePath('');
    setEnablePerformanceOptions(false);
    setPerformanceOptions([
      '-Djava.awt.headless=false',
      '-Dfile.encoding=UTF8',
      '-XX:MaxPermSize=1024m',
      '-XX:ReservedCodeCacheSize=128m',
      '-XX:+UseCodeCacheFlushing',
      '-XX:-CreateMinidumpOnCrash',
      '-Xverify:none'
    ]);
    setNewPerformanceOption('');
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
      // Sanitize client name by removing spaces
      const sanitizedClientName = sanitizeClientName(clientName);
      
      const response = await fetch('/api/generate-source-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          drive: sourceDrive, 
          clientName: sanitizedClientName,
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
      a.download = `migration-source-${sanitizedClientName}.rar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSourceStatus('Source RAR file downloaded. Password required to extract script.');
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

    if (installMySQL && (!mysqlPath || !mysqlServiceName)) {
      setPopupMessage('Please provide MySQL path & service name');
      return;
    }

    if (mysqlRamAllocation && !mysqlRamSize) {
      setPopupMessage('Please provide MySQL RAM Size (MBs)');
      return;
    }
    
    if (installTomcat && (!tomcatPath || !jdkPath)) {
      setPopupMessage('Please provide Tomcat and JDK paths');
      return;
    }

    if (installTomcat && !tomcatServiceName) {
      setPopupMessage('Please provide Tomcat service name');
      return;
    }

    if (ramAllocation && (!tomcatInitialMemory || !tomcatMaxMemory)) {
      setPopupMessage('Please provide Tomcat Service Initial & Maximum Memory');
      return;
    }

    setLoadingDestination(true);
    try {
      // Sanitize client name by removing spaces
      const sanitizedClientName = sanitizeClientName(clientName);

      const response = await fetch('/api/generate-destination-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          drive: destinationDrive, 
          clientName: sanitizedClientName,
          tomcatPath,
          jdkPath,
          mysqlPath,
          installMySQL,
          installTomcat,
          copyFonts,
          ramAllocation,
          mysqlServiceName,
          tomcatDependency,
          tomcatInitialMemory,
          tomcatMaxMemory,
          tomcatServiceName,
          enablePerformanceOptions,
          performanceOptions: performanceOptions.join(';'),
          mysqlRamAllocation,
          mysqlRamSize,
          unarchiveOption,
          unarchivePath: unarchiveOption === 'specificPath' ? unarchivePath : ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate script');
      }

      // Get password from response header
      const password = response.headers.get('X-Password');
      setGeneratedPassword2(password);
      
      // Trigger RAR download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration-destination-${sanitizedClientName}.rar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDestinationStatus('Destination RAR file downloaded. Password required to extract script.');
      setPopupMessage(`Destination script generated. Password: ${password}`);

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
                <strong>Important:</strong> Both servers must have <strong>WinRAR</strong> and <strong>NodeJS</strong> installed. 
                <br />
                <a 
                href="https://www.rarlab.com/download.htm" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.winrarBtn}
                >
                  Download WinRAR
                </a>

                <a 
                href="https://nodejs.org/en/download" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.nodeBtn}
                >
                  Download NodeJS
                </a>
              </p>
              <p>
                <strong>Note:</strong> The script will automatically skip any locked files during archiving. Please ensure that the generated PowerShell script is not saved on the same drive (e.g., D, E, etc.).
              </p>
              <p style={{ fontSize: '1.2rem', color: '#666' }}>
                  <strong>For Faster Execution:</strong> Empty the Recycle Bin before running the source script.
              </p>

              <p>
                <strong>Steps to run the script:</strong>
              </p>
              <ul>
                <li>Open PowerShell as Administrator.</li>
                <li>Go to the script path.</li>
                <li>
                  Run the script (e.g: <em>.\migration-source-ClientName.ps1</em>)
                </li>
              </ul>
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
                  <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1px' }}>
                    <strong>Note:</strong> Spaces will be automatically removed from the client name.
                  </p>
                </div>
                
                {/* Radio Buttons */}
                <div className={styles.licenseDescription}>
                  <label>
                    Archive Mode:
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
                        <Tooltip text="Select the paths you wish to migrate, and the system will archive only those items while applying the defined exclusions.">
                          <Link href="/files/help" legacyBehavior>
                            <a className={styles.tooltip}>
                              <HelpCircle size={20} />
                            </a>
                          </Link>
                        </Tooltip>
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
                        <Tooltip text="Select the paths you wish to exclude, and the system will archive all remaining items in the drive.">
                          <Link href="/files/help" legacyBehavior>
                            <a className={styles.tooltip}>
                              <HelpCircle size={20} />
                            </a>
                          </Link>
                        </Tooltip>
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
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1px' }}>
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
                  <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1px' }}>
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
                <div className={styles.passwordSection}
                style={{
                        marginTop: "-18px",
                      }}
                >
                  <h3>Source RAR File Password</h3>
                  <div className={styles.passwordBox}>
                    <code>{generatedPassword}</code>
                    <button 
                      onClick={handleCopy}
                      className={styles.handlecopy}
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
                    This password is required to extract the Source PowerShell script
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
                  <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1px' }}>
                    <strong>Note:</strong> Spaces will be automatically removed from the client name.
                  </p>
                  
                </div>

                <div className={styles.licenseDescription}>
                  <label>
                    Unarchive Location:
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          value="driveRoot"
                          checked={unarchiveOption === 'driveRoot'}
                          onChange={() => setUnarchiveOption('driveRoot')}
                          className={styles.radioInput}
                        />
                        Drive Root
                        <Tooltip text="The App will unarchive all the stuff in the main selected drive.">
                          <Link href="/files/help" legacyBehavior>
                            <a className={styles.tooltip}>
                              <HelpCircle size={20} />
                            </a>
                          </Link>
                        </Tooltip>
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          value="specificPath"
                          checked={unarchiveOption === 'specificPath'}
                          onChange={() => setUnarchiveOption('specificPath')}
                          className={styles.radioInput}
                        />
                        Specific Path
                        <Tooltip text="The App will unarchive all the stuff in a specific path in the selected drive which you have to add below.">
                          <Link href="/files/help" legacyBehavior>
                            <a className={styles.tooltip}>
                              <HelpCircle size={20} />
                            </a>
                          </Link>
                        </Tooltip>
                      </label>
                    </div>
                  </label>
                </div>

                {unarchiveOption === 'specificPath' && (
                  <div className={styles.licenseDescription}>
                    <label>
                      Path to Unarchive:
                      <input
                        type="text"
                        value={unarchivePath}
                        onChange={(e) => setUnarchivePath(e.target.value)}
                        placeholder="e.g., D:\mydata"
                        className={styles.styledselecttempmargin}
                        style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                      />
                    </label>
                  </div>
                )}
                

                <h3 className={styles.additionalOptionsHeader}>Advanced Options</h3>

                <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>
                  <input 
                    type="checkbox" 
                    checked={installMySQL} 
                    onChange={(e) => setInstallMySQL(e.target.checked)} 
                    className={styles.optionCheckbox}
                  />
                  Install MySQL Service
                </label>
                {installMySQL && (
                  <>
                  <div className={styles.optionInput}>
                    <label>
                      MySQL Path:
                      <input
                        type="text"
                        placeholder="D:\MySQL8 ..."
                        value={mysqlPath}
                        onChange={(e) => setMysqlPath(e.target.value)}
                        className={styles.styledselecttempmargin}
                        style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                      />
                    </label>
                  </div>
                  <div className={styles.optionInput}>
                    <label>MySQL Service Name:</label>
                    <input
                      type="text"
                      value={mysqlServiceName}
                      onChange={(e) => setMysqlServiceName(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '93%', padding: '7px', margin: '10px 0' }}
                    />
                  </div>

                  {/* MySQL RAM Allocation Checkbox */}
                  <div className={styles.optionInput}>
                    <label className={styles.optionLabel}>
                      <input 
                        type="checkbox" 
                        checked={mysqlRamAllocation} 
                        onChange={(e) => setMysqlRamAllocation(e.target.checked)} 
                        className={styles.optionCheckbox}
                      />
                      MySQL RAM Allocation
                    </label>
                  </div>

                  {/* MySQL RAM Input (only shown when MySQL RAM Allocation is checked) */}
                  {mysqlRamAllocation && (
                    <div className={styles.optionInput}>
                      <label>MySQL RAM Size (MB):</label>
                      <input
                        type="number"
                        value={mysqlRamSize}
                        onChange={(e) => setMysqlRamSize(e.target.value)}
                        className={styles.styledselecttempmargin}
                        style={{ width: '93%', padding: '7px', margin: '10px 0' }}
                      />
                      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                        The app will set the Data Drive automatically based on the MySQL path.
                      </p>
                    </div>
                  )}
                  </>
                )}
              </div>
              

              <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>
                <input 
                  type="checkbox" 
                  checked={installTomcat} 
                  onChange={(e) => setInstallTomcat(e.target.checked)} 
                  className={styles.optionCheckbox}
                />
                Install Tomcat Service
              </label>
              {installTomcat && (
                <>
                  {/* Add Tomcat Service Name Input */}

                  <div className={styles.optionInput}>
                    <label>Tomcat Path:</label>
                    <input
                      type="text"
                      placeholder="D:\Northstar\Tomcat9 ..."
                      value={tomcatPath}
                      onChange={(e) => setTomcatPath(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '93%', padding: '7px', margin: '10px 0' }}
                    />
                  </div>
                  
                  <div className={styles.optionInput}>
                    <label>JDK Path:</label>
                    <input
                      type="text"
                      placeholder="D:\jdk1.8.0_181 ..."
                      value={jdkPath}
                      onChange={(e) => setJdkPath(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '93%', padding: '7px', margin: '10px 0' }}
                    />
                  </div>

                  <div className={styles.optionInput}>
                    <label>Tomcat Service Name:</label>
                    <input
                      type="text"
                      value={tomcatServiceName}
                      onChange={(e) => setTomcatServiceName(e.target.value)}
                      className={styles.styledselecttempmargin}
                      style={{ width: '93%', padding: '7px', margin: '10px 0' }}
                      placeholder="Tomcat9"
                    />
                  </div>
                  
                  {/* RAM Allocation Checkbox */}
                  <div className={styles.optionInput}>
                    <label className={styles.optionLabel}>
                      <input 
                        type="checkbox" 
                        checked={ramAllocation} 
                        onChange={(e) => setRamAllocation(e.target.checked)} 
                        className={styles.optionCheckbox}
                      />
                      Tomcat RAM Allocation
                    </label>
                  </div>
                  
                  
                  {/* Memory Inputs (only shown when RAM Allocation is checked) */}
                  {ramAllocation && (
                    <>
                      <div className={styles.optionInput}>
                        <label>Initial Memory (MB):</label>
                        <input
                          type="number"
                          value={tomcatInitialMemory}
                          onChange={(e) => setTomcatInitialMemory(e.target.value)}
                          className={styles.styledselecttempmargin}
                          style={{ width: '93%', padding: '7px', margin: '10px 0' }}
                        />
                      </div>
                      <div className={styles.optionInput}>
                        <label>Max Memory (MB):</label>
                        <input
                          type="number"
                          value={tomcatMaxMemory}
                          onChange={(e) => setTomcatMaxMemory(e.target.value)}
                          className={styles.styledselecttempmargin}
                          style={{ width: '93%', padding: '7px', margin: '10px 0' }}
                        />
                      </div>
                    </>
                  )}

                  {/* Performance Options Section */}

                  <div className={styles.optionInput}>
                  <label className={styles.optionLabel}>
                    <input 
                      type="checkbox" 
                      checked={enablePerformanceOptions} 
                      onChange={(e) => setEnablePerformanceOptions(e.target.checked)} 
                      className={styles.optionCheckbox}
                    />
                    Enable Performance Options
                  </label>
                  </div>

                  {enablePerformanceOptions && (
                    <div className={styles.optionInput}>
                      <label>Performance Options:</label>
                      <div className={styles.performanceOptionsList}>
                        {performanceOptions.map((option, index) => (
                          <div key={index} className={styles.performanceOptionItem}>
                            <span>{option}</span>
                            <button 
                              onClick={() => removePerformanceOption(index)}
                              className={styles.removePathButton}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className={styles.pathInputContainer}>
                        <input
                          type="text"
                          value={newPerformanceOption}
                          onChange={(e) => setNewPerformanceOption(e.target.value)}
                          placeholder="Add new performance option (e.g., -Dsome.option=value)"
                          className={styles.styledselecttempmargin}
                          style={{ 
                            width: 'calc(100% - 100px)', 
                            padding: '7px', 
                            marginRight: '10px',
                            marginTop: '10px'
                          }}
                        />
                        <button 
                          onClick={addPerformanceOption}
                          className={styles.addPathButton}
                          style={{ marginTop: '10px' }}
                        >
                          Add Option
                        </button>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                        These options will be added to the Java Options in Tomcat Service
                      </p>
                    </div>
                  )}
                
                  
                  {/* Dependency Checkbox */}
                  <div className={styles.optionInput}>
                    <label className={styles.optionLabel}>
                      <input 
                        type="checkbox" 
                        checked={tomcatDependency} 
                        onChange={(e) => setTomcatDependency(e.target.checked)} 
                        className={styles.optionCheckbox}
                      />
                      Tomcat Dependency on MySQL
                    </label>
                  </div>

                  <div className={styles.optionInput}>
                    <label className={styles.optionLabel}>
                      <input 
                        type="checkbox" 
                        checked={copyFonts} 
                        onChange={(e) => setCopyFonts(e.target.checked)} 
                        className={styles.optionCheckbox}
                      />
                      Copy Fonts
                    </label>
                  </div>
                </>
              )}
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

              {generatedPassword2 && (
                <div className={styles.passwordSection}>
                  <h3>Destination RAR File Password</h3>
                  <div className={styles.passwordBox}>
                    <code>{generatedPassword2}</code>
                    <button 
                      onClick={handleCopy2}
                      className={styles.handlecopy}
                      style={{
                        color: copied2 ? "green" : "black",
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
                      {copied2 ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className={styles.passwordNote}>
                    This password is required to extract the Destination PowerShell script
                  </p>
                </div>
              )}

              
            </div>
            
          </div>
            {/* Clear Button */}
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <button
                onClick={handleClearForm}
                className={styles.clearbtn}
              >
                Clear Form
              </button>
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
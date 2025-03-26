import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { HelpCircle } from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js"; // Import Tooltip
import styles from "/styles/Home.module.css";
import DownloadFiles from "/pages/components/DownloadFiles.js"; 
import Layout from '/pages/components/Layout.js';


export default function Home() {
  const [domains, setDomains] = useState('');
  const [password, setPassword] = useState('sibisoft');
  const [option, setOption] = useState('Tomcat');
  const [result, setResult] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (result) {
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 5000); // Hide after 3 seconds
    }
  }, [result]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  const renameExistingFiles = (filesDir, baseName, extensions) => {
    const files = fs.readdirSync(filesDir);
    let maxVersion = 0;
  
    const regexPattern = new RegExp(
      `^${escapeRegExp(baseName)}-old-(\\d+)\\.(${extensions.join('|')})$`
    );
  
    files.forEach(file => {
      const match = file.match(regexPattern);
      if (match) {
        const version = parseInt(match[1], 10);
        if (version > maxVersion) {
          maxVersion = version;
        }
      }
    });
  
    const nextVersion = maxVersion + 1;
  
    extensions.forEach(ext => {
      const oldPath = path.join(filesDir, `${baseName}.${ext}`);
      if (fs.existsSync(oldPath)) {
        const newPath = path.join(filesDir, `${baseName}-old-${nextVersion}.${ext}`);
        fs.renameSync(oldPath, newPath);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    const domainArray = domains.split(',').map((d) => d.trim());

    try {
      const response = await fetch('/api/csr-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: domainArray, option, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle HTTP error statuses (4xx/5xx)
        throw new Error(data.error || 'Server error occurred');
      }
  
      if (!data.success) {
        // Handle business logic errors
        throw new Error(data.error || 'Request failed');
      }
  
      // Ensure results exists and is array
      if (Array.isArray(data.results)) {
        setFiles(data.files);
        setResult(data.results.join('\n'));
      } else {
        //setResult(data.error || 'Something went wrong');
        throw new Error('Invalid response format from server. Something went wrong');
      }
    } catch (error) {
      // Handle all errors in one place
      setResult(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setDomains('');
  };

  return (
    <>
    <main className={styles.body}>
      <Head>
        <title>CSR Generator</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <Layout>
        <div className={styles.CSRContainer}>
          <div className={styles.licenseContent}>
            <div className={styles.licenseHeader}>
              <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex' }}>
                CSR and Keystore Generator
              </h1>
              <Tooltip text="Enter all domains (comma-separated), select the type, and click 'Generate'. If a CSR for the same domain exists this year, it will be renamed 'abc.com-old-1.csr', and a new one will be generated.">
                <Link href="/files/help" legacyBehavior>
                  <a className={styles.tooltip}>
                    <HelpCircle size={24} color="#64748b" />
                  </a>
                </Link>
              </Tooltip>
            </div>

            <p className={styles.licenseDescription}>
            Enter all domains (comma-separated), select the type, and click  <strong>Generate</strong>. 
            If a CSR for the same domain exists this year, it will be renamed <strong>abc.com-old-1.csr</strong>, 
            and a new one will be generated.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.licenseDescription}>
                <label>
                Enter Domains (comma-separated):{" "}   <br />
                </label>
                <input
                    type="text"
                    placeholder="example.com, www.example.com"
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                    className={styles.styledselecttempmargin}
                    required
                    style={{ width: '98%', padding: '7px', margin: '10px 0' }}
                  />
                  {/* Help Icon with Tooltip */}
                  
      
                  <label className={styles.notedescription}> <strong>Note:</strong>  </label>
                  <label className={styles.notedescription} style={{ color: 'red' }}> Avoid blank spaces</label>
                  <br />
              </div>

              <div className={styles.licenseDescription}>
                <label>
                  Password:
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={styles.styledselecttempmargin}
                      //style={{ flex: 1, borderRight: 'none' }}
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

              <div className={styles.licenseDescription}>
                <label>
                  Server Type:
                  <select
                    value={option}
                    onChange={(e) => setOption(e.target.value)}
                    className={styles.licenseSelect}
                  >
                    <option value="Tomcat">Tomcat</option>
                    <option value="Apache">Apache</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.btndescription}
                >
                  {loading ? 'Generating...' : 'Generate'}
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

            {/* Pop-up Notification */}
            {showPopup && (
            <div className={styles.notification}>
                {result}
            </div>
          )}

            <div>
              <DownloadFiles filePaths={files} /> {/* Auto-downloads all files */}
            </div>
          </div>

          <div className={styles.licenseVisual}>
            <img 
              src="/csr-dashboard.png"  // Update with your CSR-related image
              alt="CSR Generation Preview"
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

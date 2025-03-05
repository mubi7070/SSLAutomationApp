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
    window.location.reload();
  };

  return (
    <>
    <main className={styles.body}>
      <Head>
        <title>CSR Generator</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <Layout>
      <div style={{ padding: '20px' }}>
        <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex', justifyContent: 'center'}}>CSR and Keystore Generator</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px', paddingLeft: '5%'}}>
            <label className={styles.description}>
            Domains (comma-separated):{" "} 
            </label>

              <input className={styles.styledselecttempmargin}
                type="text" placeholder='Type comma-separated domains here...'
                value={domains}  
                onChange={(e) => setDomains(e.target.value)}
                required  
                style={{ width: '60%', padding: '7px', margin: '10px 0' }}
              />
            {/* Help Icon with Tooltip */}
            <Tooltip text="Enter all domains (comma-separated), select the type, and click 'Generate'. If a CSR for the same domain exists this year, it will be renamed 'abc.com-old-1.csr', and a new one will be generated.">
              <Link href="/files/help" legacyBehavior>
                <a className={styles.tooltip}>
                  <HelpCircle size={20} />
                </a>
              </Link>
            </Tooltip>

            <label className={styles.notedescription}> Note: </label>
            <label className={styles.notedescription} style={{ color: 'red' }}> Avoid blank spaces</label>
            <br />
          </div>

          <div style={{ marginBottom: '10px', paddingLeft: '38%' }}>
            <label className={styles.description}>
               Password: 
                <input className={styles.styledselecttempmargin}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              
            </label>
          </div>

          <div style={{ marginBottom: '40px', paddingLeft: '45%' }}>
            <label className={styles.description}>
              Option: 
              <select value={option} className={styles.styledselecttempmargin} onChange={(e) => setOption(e.target.value)}>
                <option value="Tomcat">Tomcat</option>
                <option value="Apache">Apache</option>
              </select>
            </label>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button type="submit" className={styles.btndescription} disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
            <button type="button" onClick={handleClear} className={styles.clearbtn}>
              Clear
            </button>
          </div>
        </form>

        <div>
        {/* Results Display */}
        {result && (
          <div style={{ marginTop: '20px', paddingLeft: '5%' }}>
            <h2>Results:</h2>
            <pre>{result}</pre>
          </div>
        )}

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


      </div>

      <div className={styles.Installerhomebtn}>
        <button><Link href="/home">Back to Home</Link></button>
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

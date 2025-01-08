import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from '/styles/Home.module.css';

export default function Home() {
  const [domains, setDomains] = useState('');
  const [password, setPassword] = useState('sibisoft');
  const [option, setOption] = useState('Tomcat');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
      if (response.ok) {
        setResult(data.results.join('\n'));
      } else {
        setResult(data.error || 'Something went wrong');
      }
    } catch (error) {
      setResult('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    window.location.reload();
  };

  return (
    <>
      <Head>
        <title>CSR Generator</title>
        <link rel="icon" href="./ssl2white.svg" />
      </Head>
      <main>
      <div style={{ padding: '20px' }}>
        <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex', justifyContent: 'center'}}>CSR and Keystore Generator</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px', paddingLeft: '5%'}}>
            <label className={styles.description}>
              Domains (comma-separated): 
              <input className={styles.styledselecttempmargin}
                type="text" placeholder='Type Here...'
                value={domains}  
                onChange={(e) => setDomains(e.target.value)}
                required  
                style={{ width: '60%', padding: '7px', margin: '10px 0' }}
              />
            </label>
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

        {result && (
          <div style={{ marginTop: '20px', paddingLeft: '5%' }}>
            <h2>Results:</h2>
            <pre>{result}</pre>
          </div>
        )}
      </div>

      <div className={styles.Installerhomebtn}>
        <button><Link href="/">Back to Home</Link></button>
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

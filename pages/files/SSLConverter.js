import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from '/styles/Home.module.css';

export default function SSLConverter() {
  const [selectedOption, setSelectedOption] = useState('');
  const [filteredCerts, setFilteredCerts] = useState([]);
  const [CertFiles, setCertFiles] = useState([]);

  const [filteredKeys, setfilteredKeys] = useState([]);
  const [keyFiles, setkeyFiles] = useState([]);
  
  const [filteredBundle, setfilteredBundle] = useState([]);
  const [BundleFiles, setBundleFiles] = useState([]);

  const [filteredkeystore, setfilteredkeystore] = useState([]);
  const [keystoreFiles, setkeystoreFiles] = useState([]);
  //const [keystoreFiles, setKeystoreFiles] = useState([]);
  const [KeystoreName, setKeystoreName] = useState('');
  const [KeystorePassword, setKeystorePassword] = useState('sibisoft');

  const [Keystore2Name, setKeystore2Name] = useState('');
  const [Keystore2Password, setKeystore2Password] = useState('sibisoft');

  const [formData, setFormData] = useState({
    certFileName: '',
    keyFileName: '',
    bundleFileName: '',
    p12FileName: '',
    password: 'sibisoft',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    fetch('/api/get-cert')
      .then((response) => response.json())
      .then((data) => {
        setFilteredCerts(data.files || []);
        setCertFiles(data.files || []);
      })
      .catch((error) => console.error('Error fetching Certificate files:', error));
  }, []);

  useEffect(() => {
      fetch('/api/get-keys')
        .then((response) => response.json())
        .then((data) => {
          setfilteredKeys(data.files || []);
          setkeyFiles(data.files || []);
        })
        .catch((error) => console.error('Error fetching Certificate files:', error));
    }, []);

    useEffect(() => {
      fetch('/api/get-bundle')
        .then((response) => response.json())
        .then((data) => {
          setfilteredBundle(data.files || []);
          setBundleFiles(data.files || []);
        })
        .catch((error) => console.error('Error fetching Certificate files:', error));
    }, []);

    useEffect(() => {
      fetch('/api/get-keystore')
        .then((response) => response.json())
        .then((data) => {
          setfilteredkeystore(data.files || []);
          setkeystoreFiles(data.files || []);
        })
        .catch((error) => console.error('Error fetching Certificate files:', error));
    }, []);



  const handleOptionChange = (option) => {
    setSelectedOption(option);
    setFormData({
      certFileName: '',
      keyFileName: '',
      bundleFileName: '',
      p12FileName: '',
      password: 'sibisoft',
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleClear = () => {
    window.location.reload();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    console.log('Form data submitted:', { selectedOption, formData });
    // Add submission logic here.
    e.preventDefault();
    setResult('');
    console.log(`selectedoption: ${selectedOption}`);
    if (selectedOption === 'P12Creation') {
      try {
        const response = await fetch('/api/ssl-converter-option1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        console.log(`The response: ${response}`);
        const data = await response.json();
        console.log('API Response:', data);
        if (response.ok) {
          //setResult(data.results.join('\n'));
          setResult(Array.isArray(data.results) ? data.results.join('\n') : data.results);
        } else {
          setResult(data.error || 'Something went wrong. Kindly recheck the password or the same name file is already present in the Files Folder and try again');
        }
      } catch (error) {
        setResult('An error occurred');
      } 
    } 
    else if (selectedOption === 'KeystoreToKey') {
      try {
        console.log(`
          Keystore Name: ${KeystoreName}
          Keystore Password: ${KeystorePassword}`);
        
        // Make the API call
        const response = await fetch('/api/ssl-converter-option2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keystoreName: KeystoreName,
            keystorePassword: KeystorePassword,
          }),
        });
    
        const data = await response.json();
    
        if (response.ok) {
          setResult(Array.isArray(data.results) ? data.results.join('\n') : data.results.message);
        } else {
          setResult(data.error || 'Something went wrong. Kindly recheck the password or the same name file is already present in the Files Folder and try again');
        }
      } catch (error) {
        console.error('Error occurred:', error);
        setResult('An error occurred while processing your request');
      }
    }
    
    else if (selectedOption === 'KeystoreToP12') {
      //Login yaha likhni he
      
      try {
        console.log(`
          Keystore Name: ${Keystore2Name}
          Keystore Password: ${Keystore2Password}`);
        
        // Make the API call
        const response = await fetch('/api/ssl-converter-option3', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keystoreName: Keystore2Name,
            keystorePassword: Keystore2Password,
          }),
        });
    
        const data = await response.json();
    
        if (response.ok) {
          setResult(Array.isArray(data.results) ? data.results.join('\n') : data.results.message);
        } else {
          console.log(`Data error: ${data.error}`);
          
          setResult(data.error || 'Something went wrong. Kindly recheck the password or the same name file is already present in the Files Folder and try again');
        }
      } catch (error) {
        console.error('Error occurred: ', error);
        setResult('An error occurred while processing your request');
      }
    }
    else{
      console.log('No Option Selected');
      
    }





  }; 

  return (
    <>
      <Head>
        <title>SSL Converter</title>
      </Head>
      <div style={{ padding: '20px' }}>
        <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', textAlign: 'center' }}>
          SSL Converter
        </h1>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <label className={styles.description}>Select Conversion Type:</label>
          <select
            value={selectedOption}
            onChange={(e) => handleOptionChange(e.target.value)}
            className={styles.styledselecttempmargin}
            style={{ marginLeft: '10px', padding: '7px' }}
          >
            <option value="Select">-- Select --</option>
            <option value="P12Creation">P12 Creation (Apache → Tomcat)</option>
            <option value="KeystoreToKey">Keystore → Key (Tomcat → Apache)</option>
            <option value="KeystoreToP12">Keystore → P12</option>
          </select>
        </div>

        {selectedOption && (
          <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
            {selectedOption === 'Select' && (
              <>
              <h2 className={styles.headingnew}>Choose the option you want to convert.</h2>
              </>
            )}
            {selectedOption === 'P12Creation' && (
              <>
                <h2 className={styles.headingnew}>P12 Creation (Apache → Tomcat)</h2>
                <div className={styles.inputGroup}>
                  <label className={styles.description}>Certificate File Name:</label>
                  <input
                    type="text"
                    value={formData.certFileName}
                    onChange={(e) => handleInputChange('certFileName', e.target.value)}
                    placeholder="Type to search or select"
                    list="CertsOptions"
                    className={styles.styledselecttempmargin}
                    style={{ width: '100%', padding: '7px' }}
                  />
                  <datalist id="CertsOptions">
                    {filteredCerts.map((file, index) => (
                      <option key={index} value={file} />
                    ))}
                  </datalist>
                  <label className={styles.notedescription}> Note: </label>
                  <label className={styles.notedescription} style={{ color: 'red' }}>
                    The Cert file should be present in the Certs folder
                  </label>
                  <br />
                  <br />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.description}>Key File Name:</label>
                  <input
                    type="text"
                    value={formData.keyFileName}
                    onChange={(e) => handleInputChange('keyFileName', e.target.value)}
                    placeholder="Type to search or select"
                    list="keyFileSuggestions"
                    className={styles.styledselecttempmargin}
                    style={{ width: '100%', padding: '7px' }}
                  />
                  <datalist id="keyFileSuggestions">
                    {filteredKeys.map((file, index) => (
                      <option key={index} value={file} />
                    ))}
                  </datalist>
                  <label className={styles.notedescription}> Note: </label>
                  <label className={styles.notedescription} style={{ color: 'red' }}>
                    The key file should be present in the Files folder
                  </label>
                  <br />
                  <br />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.description}>Bundle File Name:</label>
                  <input
                    type="text"
                    value={formData.bundleFileName}
                    onChange={(e) => handleInputChange('bundleFileName', e.target.value)}
                    placeholder="Type to search or select"
                    list="bundleFileSuggestions"
                    className={styles.styledselecttempmargin}
                    style={{ width: '100%', padding: '7px' }}
                  />
                  <datalist id="bundleFileSuggestions">
                    {filteredBundle.map((file, index) => (
                      <option key={index} value={file} />
                    ))}
                  </datalist>
                  <label className={styles.notedescription}> Note: </label>
                  <label className={styles.notedescription} style={{ color: 'red' }}>
                    The bundle file should be present in the Certs folder
                  </label>
                  <br />
                  <br />
                </div>

                <div className={styles.inputGroup}>
              <label className={styles.description}>P12 File Name:</label>
              <input
                type="text"
                value={formData.p12FileName}
                onChange={(e) => handleInputChange('p12FileName', e.target.value)}
                placeholder="Type Here..."
                className={styles.styledselecttempmargin}
                style={{ width: '100%', padding: '7px' }}
              />
              <label className={styles.notedescription}> Note: </label>
                  <label className={styles.notedescription} style={{ color: 'red' }}>
                    Do not enter the file extension (.p12) in the file name
                  </label>
            </div>
            <br />
            <div className={styles.inputGroup}>
            <label className={styles.description}>Password:</label> <br />
            <div style={{ display: 'flex', alignItems: 'center', width: '50%' }}>
              <input
                className={styles.styledselecttempmargin}
                type={showPassword ? 'text' : 'password'}
                placeholder="Type Here..."
                //defaultValue={'sibisoft'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
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

              </>
            )}

            {selectedOption === 'KeystoreToKey' && (
              <>
                <h2 className={styles.headingnew}>Keystore → Key (Tomcat → Apache)</h2>

              <div className={styles.inputGroup}>
                  <label className={styles.description}>Keystore File Name:</label>
                  <input
                    type="text"
                    value={KeystoreName}
                    onChange={(e) => setKeystoreName(e.target.value)}
                    //onChange={(e) => handleInputChange('certFileName', e.target.value)}
                    placeholder="Type to search or select"
                    list="KeystoreOptions"
                    className={styles.styledselecttempmargin}
                    style={{ width: '100%', padding: '7px' }}
                  />
                  <datalist id="KeystoreOptions">
                    {filteredkeystore.map((file, index) => (
                      <option key={index} value={file} />
                    ))}
                  </datalist>
                  <label className={styles.notedescription}> Note: </label>
                  <label className={styles.notedescription} style={{ color: 'red' }}>
                    The keystore file should be present in the Files folder
                  </label>
                  <br />
                  <br />
            <div className={styles.inputGroup}>
            <label className={styles.description}>Password:</label> <br />
            <div style={{ display: 'flex', alignItems: 'center', width: '50%' }}>
              <input
                className={styles.styledselecttempmargin}
                type={showPassword ? 'text' : 'password'}
                placeholder="Type Here..."
                value={KeystorePassword}
                onChange={(e) => setKeystorePassword(e.target.value)}
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
                </div>

              </>
            )}
            {selectedOption === 'KeystoreToP12' && (
              <>
              <h2 className={styles.headingnew}>Keystore → P12</h2>
              <div className={styles.inputGroup}>
                  <label className={styles.description}>Keystore File Name:</label>
                  <input
                    type="text"
                    value={Keystore2Name}
                    onChange={(e) => setKeystore2Name(e.target.value)}
                    //onChange={(e) => handleInputChange('certFileName', e.target.value)}
                    placeholder="Type to search or select"
                    list="KeystoreOptions"
                    className={styles.styledselecttempmargin}
                    style={{ width: '100%', padding: '7px' }}
                  />
                  <datalist id="KeystoreOptions">
                    {filteredkeystore.map((file, index) => (
                      <option key={index} value={file} />
                    ))}
                  </datalist>
                  <label className={styles.notedescription}> Note: </label>
                  <label className={styles.notedescription} style={{ color: 'red' }}>
                    The keystore file should be present in the Files folder
                  </label>
                  <br />
                  <br />
            <div className={styles.inputGroup}>
            <label className={styles.description}>Password:</label> <br />
            <div style={{ display: 'flex', alignItems: 'center', width: '50%' }}>
              <input
                className={styles.styledselecttempmargin}
                type={showPassword ? 'text' : 'password'}
                placeholder="Type Here..."
                value={Keystore2Password}
                onChange={(e) => setKeystore2Password(e.target.value)}
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
                </div>

              </>
            )}


            <br />

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button type="submit" className={styles.btndescription}>
                Convert
              </button>
              <button
                type="button"
                onClick={handleClear}
                className={styles.clearbtn}
                style={{ marginLeft: '10px' }}
              >
                Clear
              </button>
            </div>
          </form>
        )}
        <div>
        {result && (
          <div style={{ marginTop: '20px', paddingLeft: '5%' }}>
            <h2>Results:</h2>
            <pre>{result}</pre>
          </div>
        )}
          
        </div>
        <br />
        <div className={styles.Installerhomebtn} style={{ marginTop: '20px' }}>
          <button>
            <Link href="/">Back to Home</Link>
          </button>
        </div>
      </div>
    </>
  );
}
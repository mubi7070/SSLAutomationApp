import { useState } from 'react';
import axios from 'axios';

const LicenseRenewal = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleExecute = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('/api/get-license');
      
      if (response.data.success) {
        setMessage(`Success: ${response.data.message}`);
      } else {
        setMessage(`Error: ${response.data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="license-renewal-container">
      <h2>License Renewal Automation</h2>
      <p className="description">
        This feature automatically fetches expiring licenses from the database and updates
        the Google Sheet with the latest data. Existing sheet data will be preserved, and
        new records will be appended.
      </p>
      
      <button 
        onClick={handleExecute}
        disabled={loading}
        className="execute-btn"
      >
        {loading ? 'Processing...' : 'Execute Renewal Update'}
      </button>
      
      {message && (
        <div className={`message ${message.includes('Success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <style jsx>{`
        .license-renewal-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .description {
          color: #666;
          margin: 1rem 0;
        }
        .execute-btn {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: opacity 0.3s;
        }
        .execute-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .message {
          margin-top: 1rem;
          padding: 10px;
          border-radius: 5px;
        }
        .success {
          background: #e6ffed;
          color: #2d773d;
        }
        .error {
          background: #fff0f0;
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default LicenseRenewal;
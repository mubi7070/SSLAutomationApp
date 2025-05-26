import { useState } from 'react';
import style from '/styles/Home.module.css';
import Tooltip from "/pages/components/Tooltip.js"; // Import Tooltip
import Link from 'next/link';
import { HelpCircle } from "lucide-react";


const allowedExtensions = ['.key', '.pem', '.keystore', '.p12', '.pfx'];

export default function KeyUpload({ styles, setResponseMessage, setShowPopup, refreshCertificates }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleKeyUpload = async (e) => {
    e.preventDefault();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file extensions
    const invalidFiles = Array.from(files).filter(file => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return !allowedExtensions.includes(ext);
    });

    if (invalidFiles.length > 0) {
      alert('Only .key, .pem, .keystore, .p12, and .pfx files are allowed!');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('certificates', file));

    try {
      const response = await fetch('/api/upload-keys', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setResponseMessage(`Total: ${result.uploadedCount} files uploaded successfully`);
        setShowPopup(true);
        refreshCertificates(); // Refresh the certificate list
      } else {
        setResponseMessage(result.message || 'Upload failed');
        setShowPopup(true);
      }
    } catch (error) {
      setResponseMessage('Error uploading files');
      setShowPopup(true);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Clear file input
      setTimeout(() => {
        setResponseMessage('');
      }, 5000); // Hide after 5 seconds
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label className={style.customfileupload}>
      <label className={style.description}>Upload Key Files: </label>
        <input
          type="file"
          multiple
          onChange={handleKeyUpload}
          accept=".key,.pem,.keystore,.p12,.pfx"
          disabled={isUploading}
          style={{ display: 'none' }}
          id="keyFileInput"
        />
        <button 
          type="button"
          className={isUploading ? style.uploadBtnDisabled : style.uploadBtn}
          onClick={() => document.getElementById('keyFileInput').click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </label>
        <Tooltip text="
        You need to add the key files which you want to add. It only allows you to add the files with extension: .key, .pem, .keystore, .p12, .pfx
        ">
            <Link href="/files/help" legacyBehavior>
                <a className={style.tooltip}>
                <HelpCircle size={20} />
                </a>
            </Link>
        </Tooltip>
    </div>
  );
}
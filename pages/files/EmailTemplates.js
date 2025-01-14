import React, { useState } from "react";
import Head from 'next/head';
import styles from '/styles/Home.module.css';
import Link from 'next/link';

const defaultClubName = "Club Name";
const defaultExpiryDate = "Expiry Date";
const defaultDNS = " - ";
const defaultHostName = " - ";
const defaultValue = " - ";
const defaultDomain = " - ";



const emailTemplates = [
  {
    heading: "For SSL Managed By NS for CNAME record",
    subject: `SSL Renewal - ${defaultClubName} - ${defaultExpiryDate}`,
    content: `Hello Team,

I hope this email finds you well! I just wanted to give you a heads-up that the SSL cert for "${defaultClubName}" is expiring on ${defaultExpiryDate}. It's important that we renew the certificate as soon as possible.

To get started, could you please share the below CNAME records with the club's IT Administrator? They'll need to add these to their DNS for SSL validation:

DNS: ${defaultDNS}
Alias / Host Name: ${defaultHostName}
Value:  ${defaultValue}
Record Type: CNAME

Once the records are added, please let us know so we can complete the validation on our end.

Thank you.`,
  },
  {
    heading: "For SSL Managed By Club That we need to share CSR with them for the Certs",
    subject: `SSL Renewal - ${defaultClubName} - ${defaultExpiryDate}`,
    content: `Hello Team,

I hope this email finds you well! I just wanted to give you a heads-up that the SSL certs for "${defaultClubName}" are expiring on ${defaultExpiryDate}. It's important that we renew the certificate as soon as possible.

To get started, could you please share the below attached CSR (Certificate Signing Request) with the club's IT Administrator? They'll need to generate SSL certificates against this CSR.

Domain: ${defaultDomain}

Please share the SSL certificates with us once you receive them.

Thank you.`,
  },
  {
    heading: "For SAN SSL Managed By Club",
    subject: `SSL Renewal - ${defaultClubName} - ${defaultExpiryDate}`,
    content: `Hello Team,

I hope this email finds you well! I just wanted to give you a heads-up that the SAN SSL certs for "${defaultClubName}" are expiring on ${defaultExpiryDate}. It's important that we renew the certificate as soon as possible.

To get started, could you please share the below attached CSR (Certificate Signing Request) with the club's IT Administrator? They'll need to generate SAN SSL certificates against this CSR and also include the below mentioned domains in it.

Additional Domains,
DNS Name: -- Add SAN Domains Here --
DNS Name: -- Add SAN Domains Here --
DNS Name: -- Add SAN Domains Here --
DNS Name: -- Add SAN Domains Here --

Please share the SSL certificates with us once you receive them.

Thank you.`,
  },
  {
    heading: "For Print Server SSL",
    subject: `SSL Renewal - Print Server - ${defaultClubName} - ${defaultExpiryDate}`,
    content: `Hello Team,

I hope this email finds you well! I just wanted to give you a heads-up that the SSL certs for "${defaultClubName}" print server are expiring on ${defaultExpiryDate}. It's important that we renew the certificate as soon as possible.

To get started, could you please share the below CNAME records with the club's IT Administrator? They'll need to add these to their DNS for SSL validation:

Domain: ${defaultDomain}

DNS: ${defaultDNS}
Alias / Host Name: ${defaultHostName}
Value:  ${defaultValue}
Record Type: CNAME

Once the records are added, please let us know so we can complete the validation on our end.

Thank you.`,
  },
];

const handleClear = () => {
    window.location.reload();
};

const EmailTemplates = () => {
  const [templates, setTemplates] = useState(emailTemplates);
  const [clubName, setClubName] = useState(defaultClubName);

  const [dns, setdns] = useState(defaultDNS);
  const [HostName, setHostName] = useState(defaultHostName);
  const [Value, setValue] = useState(defaultValue);

  const [Domain, setDomain] = useState(defaultDomain);

  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = () => {
    const updatedTemplates = emailTemplates.map((template) => {
      if (template.heading === "For SSL Managed By NS for CNAME record") {
        return {
          ...template,
          subject: template.subject
            .replace(defaultClubName, clubName || defaultClubName)
            .replace(defaultExpiryDate, expiryDate || defaultExpiryDate),
          content: template.content
            .replace(defaultClubName, clubName || defaultClubName)
            .replace(defaultExpiryDate, expiryDate || defaultExpiryDate)
            // Add other replacements if needed
            .replace(defaultDNS, dns || defaultDNS)
            .replace(defaultHostName, HostName || defaultHostName)
            .replace(defaultValue, Value || defaultValue),
            // .replace(defaultDomain, Domain),
        };
      } else {
        console.log("No Change");
        return template; // Return the original template unchanged
      }
    });
  
    console.log("Generated Templates:", updatedTemplates);
    setTemplates(updatedTemplates);
  };
  

  const handleCopy = (content, index, type) => {
    const key = `${type}-${index}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(() => {
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <>
    <main className={styles.body}>
    <Head>
        <title>Email Templates</title>
        <link rel="icon" href="./ssl2white.svg" />
    </Head>
    <div style={{ padding: "20px", fontFamily: "Times New Roman" }}>
      <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex', justifyContent: 'center' }}>Email Templates</h1>

      {/* Input Fields */}
      <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
        <div>
            <label className={styles.description}>
            Club Name:
            <input
                className={styles.styledselecttempmargin}
                type="text"
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Enter Club Name"
                style={{
                marginLeft: "5px",
                padding: "5px",
                width: "400px",
                fontFamily: "Times New Roman",
                }}
            />
            </label>
        </div>
        <div style={{ marginLeft: "70px" }} >
            <label className={styles.description}>
            Expiry Date:
            <input
                className={styles.styledselecttempmargin}
                type="date"
                onChange={(e) =>
                setExpiryDate(
                    new Date(e.target.value).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    })
                )
                }
                style={{
                marginLeft: "5px",
                padding: "5px",
                width: "400px",
                fontFamily: "Times New Roman",
                }}
            />
            </label>
        </div>
        </div>

        {/* DNS & Details Input Fields */}
        <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
        <div>
            <label className={styles.description} style={{
                marginLeft: "50px",
                }}>
            DNS: 
            <input
                className={styles.styledselecttempmargin}
                type="text"
                onChange={(e) => setdns(e.target.value)}
                placeholder="Enter Domain Name"
                style={{
                marginLeft: "5px",
                padding: "5px",
                width: "400px",
                fontFamily: "Times New Roman",
                }}
            />
            </label>
        </div>
        <div style={{ marginLeft: "20px" }}>
            <label className={styles.description}>
            Alias / Host Name: 
            <input
                className={styles.styledselecttempmargin}
                type="text"
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter Host Name"
                style={{
                marginLeft: "5px",
                padding: "5px",
                width: "400px",
                fontFamily: "Times New Roman",
                }}
            />
            </label>
        </div>
        </div>
        <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
        <div style={{ marginLeft: "20px" }}>
            <label className={styles.description} style={{
                marginLeft: "25px",
                }}>
            Value:  
            <input
                className={styles.styledselecttempmargin}
                type="text"
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter Value"
                style={{
                marginLeft: "5px",
                padding: "5px",
                width: "400px",
                fontFamily: "Times New Roman",
                }}
            />
            </label>
        </div>
        <div style={{ marginLeft: "100px" }}>
            <label className={styles.description}>
            Domain:  
            <input
                className={styles.styledselecttempmargin}
                type="text"
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter Domain Name"
                style={{
                marginLeft: "5px",
                padding: "5px",
                width: "400px",
                fontFamily: "Times New Roman",
                }}
            />
            </label>
        </div>
        </div>
        
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "20px" }}>
        <button
            className={styles.btndescription}
            onClick={handleGenerate}
            style={{ marginRight: "10px" }}
        >
            Generate
        </button>
        <button
            type="button"
            onClick={handleClear}
            className={styles.clearbtn}
        >
            Clear
        </button>
        </div>


      {/* Templates */}
      {templates.map((template, index) => (
        console.log("Rendering Template:", template),

        <div
          key={index}
          style={{
            marginBottom: "20px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "10px",
          }}
        >
          <h2 style={{ color: 'rgb(16, 31, 118)'}}>{template.heading}</h2>

          {/* Subject Box */}
          <div
            style={{
              border: "1px solid #e0e0e0",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "10px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Subject</h3>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontFamily:'Times New Roman' }}>{template.subject}</p>
              <button
                onClick={() => handleCopy(template.subject, index, "subject")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: copied === `subject-${index}` ? "green" : "black",
                }}
              >
                <img
                  src="/copy-icon.svg"
                  alt="Copy"
                  style={{ width: "20px", height: "20px" }}
                />
                {copied === `subject-${index}` ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Content Box */}
          <div
            style={{
              border: "1px solid #e0e0e0",
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Content</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                margin: 0,
                marginBottom: "-10px",
                fontFamily:'Times New Roman',
              }} 
            >
              {template.content}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => handleCopy(template.content, index, "content")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: copied === `content-${index}` ? "green" : "black",
                }}
              >
                <img
                  src="/copy-icon.svg"
                  alt="Copy"
                  style={{ width: "20px", height: "20px" }}
                />
                {copied === `content-${index}` ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className={styles.Installerhomebtn}>
        <button><Link href="/">Back to Home</Link></button>
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
    </main>

    </>
  );
};

export default EmailTemplates;

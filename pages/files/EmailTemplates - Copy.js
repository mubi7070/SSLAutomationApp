import React, { useState } from "react";

const emailTemplates = [
  {
    heading: "For SSL Managed By NS for CNAME record",
    content: `Hello Team,

I hope this email finds you well! I just wanted to give you a heads-up that the SSL cert for "Club Name" is expiring on January 9, 2025 (SSL Expiry Date). It's important that we renew the certificate as soon as possible.

To get started, could you please share the below CNAME records with the club's IT Administrator? They'll need to add these to their DNS for SSL validation:

DNS: 
Alias / Host Name: 
Value:  
Record Type: CNAME

Once the records are added, please let us know so we can complete the validation on our end.

Thank you.`,
  },
  {
    heading: "For SSL Managed By Club That we need to share CSR with them for the Certs",
    content: `Hello Team,

I hope this email finds you well! I just wanted to give you a heads-up that the SSL certs for "Club Name" are expiring on January 9, 2025 (SSL Expiry Date). It's important that we renew the certificate as soon as possible.

To get started, could you please share the below attached CSR (Certificate Signing Request) with the club's IT Administrator? They'll need to generate SSL certificates against this CSR.

Domain: 

Please share the SSL certificates with us once you receive them.

Thank you.`,
  },
  {
    heading: "For SAN SSL Managed By Club",
    content: `Hello Team,

I hope this email finds you well! I just wanted to give you a heads-up that the SAN SSL certs for "Club Name" are expiring on January 9, 2025 (SSL Expiry Date). It's important that we renew the certificate as soon as possible.

To get started, could you please share the below attached CSR (Certificate Signing Request) with the club's IT Administrator? They'll need to generate SAN SSL certificates against this CSR and also include the below mentioned domains in it.

Additional Domains,
DNS Name: 
DNS Name: 
DNS Name: 
DNS Name: 

Please share the SSL certificates with us once you receive them.

Thank you.`,
  },
  {
    heading: "For Print Server SSL",
    content: `Hello Team,

I hope this email finds you well! I just wanted to give you a heads-up that the SSL certs for "Club Name" print server are expiring on January 9, 2025 (SSL Expiry Date). It's important that we renew the certificate as soon as possible.

To get started, could you please share the below CNAME records with the club's IT Administrator? They'll need to add these to their DNS for SSL validation:

Domain: 

DNS: 
Alias / Host Name: 
Value: 
Record Type: CNAME

Once the records are added, please let us know so we can complete the validation on our end.

Thank you.`,
  },
];

const EmailTemplates = () => {
  const [copied, setCopied] = useState(null);

  const handleCopy = (content, index) => {
    // Use Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(() => {
        setCopied(index);
        setTimeout(() => setCopied(null), 2000); // Reset after 2 seconds
      }).catch((err) => {
        console.error("Failed to copy using clipboard API:", err);
      });
    } else {
      // Fallback for insecure environments
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.style.position = "fixed"; // Avoid scrolling issues
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(index);
        setTimeout(() => setCopied(null), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error("Fallback: Unable to copy text:", err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Email Templates</h1>
      {emailTemplates.map((template, index) => (
        <div
          key={index}
          style={{
            marginBottom: "20px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "10px",
          }}
        >
          <h2>{template.heading}</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {template.content}
          </pre>
          <button
            onClick={() => handleCopy(template.content, index)}
            style={{
              background: copied === index ? "green" : "#007bff",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {copied === index ? "Copied!" : "Copy"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default EmailTemplates;

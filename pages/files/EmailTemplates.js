import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '/styles/Home.module.css';

const defaultClubName = "Club Name";
const defaultExpiryDate = "Expiry Date";
const defaultDNS = "";
const defaultHostName = "";
const defaultValue = "";
const defaultDomain = "";
const defaultAdditionalDomains = [""];

const toEmails = ["cst.compliance@globalnorthstar.com", "rockstars@globalnorthstar.com"];

const ccEmails = ["devops@globalnorthstar.com"];



let updatedTemplate = null;

export default function EmailTemplateFunction() {
  const [selectedOption, setSelectedOption] = useState('');
  const [clubName, setClubName] = useState(defaultClubName);

  const [dns, setdns] = useState(defaultDNS);
  const [HostName, setHostName] = useState(defaultHostName);
  const [Value, setValue] = useState(defaultValue);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [Domain, setDomain] = useState(defaultDomain);
  const [AdditionalDomains, setAdditionalDomains] = useState(defaultAdditionalDomains);
  

  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);
  const [copied, setCopied] = useState(null);

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  const handleClear = () => {
    window.location.reload();
  };

  const handleSubmitEmail = async () => {
    if (!generatedTemplate) {
      alert("No email template generated.");
      return;
    }

    try {
      const response = await fetch("/api/handleEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generatedTemplate),
      });

      if (response.ok) {
        const { mailtoLink } = await response.json();
        window.location.href = mailtoLink; // Opens the draft email
      } else {
        alert("Failed to create email draft.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while sending the email.");
    }
  };

  

  const handleCopy = (content, type) => {
    const key = `${type}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(content).then(() => {
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        }).catch(err => console.error("Failed to copy:", err));
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



  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneratedTemplate(null); 
    updatedTemplate = null;

    if (selectedOption === 'For SSL Managed By NS for CNAME record') {
      updatedTemplate = {
          to: `${toEmails}`,
          cc: `${ccEmails}`,
          heading: "For SSL Managed By NS for CNAME record",
          subject: `SSL Renewal - ${clubName} - ${expiryDate}`,
          content: 
`Hello Team,
  
I hope this email finds you well! I just wanted to give you a heads-up that the SSL cert for "${clubName}" is expiring on ${expiryDate}. It's important that we renew the certificate as soon as possible.
  
To get started, could you please share the below CNAME records with the club's IT Administrator? They'll need to add these to their DNS for SSL validation:
  
DNS: ${dns}
Alias / Host Name: ${HostName}
Value: ${Value}
Record Type: CNAME
  
Once the records are added, please let us know so we can complete the validation on our end.
  
Thank you.`
      };
  } 
  else if (selectedOption === 'For SSL Managed By Club') {
    updatedTemplate = {
        to: `${toEmails}`,
        cc: `${ccEmails}`,
      heading: "For SSL Managed By Club",
      subject: `SSL Renewal - ${clubName} - ${expiryDate}`,
      content: 
`Hello Team,
  
I hope this email finds you well! I just wanted to give you a heads-up that the SSL certs for "${clubName}" are expiring on ${expiryDate}. It's important that we renew the certificate as soon as possible.
  
To get started, could you please share the below attached CSR (Certificate Signing Request) with the club's IT Administrator? They'll need to generate SSL certificates against this CSR.
  
Domain: ${Domain}
  
Please share the SSL certificates with us once you receive them.
  
Thank you.`
    };

  }
  
    else if (selectedOption === 'For SAN SSL Managed By Club') {
      updatedTemplate = {
        to: `${toEmails}`,
          cc: `${ccEmails}`,
        heading: "For SAN SSL Managed By Club",
        subject: `SSL Renewal - ${clubName} - ${expiryDate}`,
        content: 
`Hello Team,
    
I hope this email finds you well! I just wanted to give you a heads-up that the SAN SSL certs for "${clubName}" are expiring on ${expiryDate}. It's important that we renew the certificate as soon as possible.
    
To get started, could you please share the below attached CSR (Certificate Signing Request) with the club's IT Administrator? They'll need to generate SAN SSL certificates against this CSR and also include the below mentioned domains in it.
    
Additional Domains,
${AdditionalDomains.map((domain, index) => `${index + 1}. ${domain}`).join("\n")}
    
Please share the SSL certificates with us once you receive them.
    
Thank you.`
      };

     console.log(`
      Additional Domains: ${AdditionalDomains};
      `);
     
      
    }
    else if (selectedOption === 'For Print Server SSL Managed By NS') {
      updatedTemplate = {
        to: `${toEmails}`,
        cc: `${ccEmails}`,
        heading: "For Print Server SSL Managed By NS",
        subject: `SSL Renewal - Print Server - ${clubName} - ${expiryDate}`,
        content: 
`Hello Team,
    
I hope this email finds you well! I just wanted to give you a heads-up that the SSL certs for "${clubName}" print server are expiring on ${expiryDate}. It's important that we renew the certificate as soon as possible.
    
To get started, could you please share the below CNAME records with the club's IT Administrator? They'll need to add these to their DNS for SSL validation:
    
Domain: ${Domain}
    
DNS: ${dns}
Alias / Host Name: ${HostName}
Value: ${Value}
Record Type: CNAME
    
Once the records are added, please let us know so we can complete the validation on our end.
    
Thank you.`
      }
      
    }
    else{
      console.log('No Option Selected');
    }

    if (updatedTemplate) {
      setGeneratedTemplate(updatedTemplate);
  }

  

  }; 

  return (
    <>
    <main className={styles.body}>
      <Head>
        <title>Email Templates</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <div style={{ padding: '20px' }}>
        <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', textAlign: 'center' }}>
        Email Templates
        </h1>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <label className={styles.description}>Select Template:</label>
          <select
            value={selectedOption}
            onChange={(e) => handleOptionChange(e.target.value)}
            className={styles.styledselecttempmargin}
            style={{ marginLeft: '10px', padding: '7px' }}
          >
            <option value="Select">-- Select --</option>
            <option value="For SSL Managed By NS for CNAME record">For SSL Managed By NS for CNAME record</option>
            <option value="For SSL Managed By Club">For SSL Managed By Club</option>
            <option value="For SAN SSL Managed By Club">For SAN SSL Managed By Club</option>
            <option value="For Print Server SSL Managed By NS">For Print Server SSL Managed By NS</option>
          </select>
        </div>

        {selectedOption && (
          <form onSubmit={handleSubmit} >
            {selectedOption === 'Select' && (
              <>
              <h2 className={styles.headingnew}>Choose the template you want to generate.</h2>
              </>
            )}
            {selectedOption === 'For SSL Managed By NS for CNAME record' && (
              <>
          <div style={{ padding: "20px", fontFamily: "Times New Roman" }}>

      {/* Input Fields */}
      <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
        <div>
            <label className={styles.description}>
            Club Name:
            <input className={styles.box1}
                type="text"
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Enter Club Name..."
                required
            />
            </label>
        </div>
        <div style={{ marginLeft: "70px" }} >
            <label className={styles.description}>
            Expiry Date:
            <input
                className={styles.box1}
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
                required
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
                className={styles.box1}
                type="text"
                onChange={(e) => setdns(e.target.value)}
                placeholder="Enter Domain Name..."
                required
            />
            </label>
        </div>
        <div style={{ marginLeft: "20px" }}>
            <label className={styles.description}>
            Alias / Host Name: 
            <input
                className={styles.box1}
                type="text"
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter Host Name..."
                required
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
                className={styles.box1}
                type="text"
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter Value..."
                required
            />
            </label>
        </div>
        
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "20px" }}>
        <button
            className={styles.btndescription}
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

        <div>
        {generatedTemplate && (
    <div className={styles.mainbox}
    >
        <h2 style={{ color: 'rgb(16, 31, 118)'}}>{generatedTemplate.heading}</h2>
        {/* Email to*/}
        <div className={styles.contentbox2}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email to:</h3>
            <pre className={styles.contentboxinside2}
            >
              <b>To: </b>{generatedTemplate.to}
                <br />
            <b>cc: </b> {generatedTemplate.cc}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => handleCopy(generatedTemplate.to + "," + generatedTemplate.cc, "to")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `to` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `to` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>

        {/* Subject Box */}
        <div className={styles.subjectbox}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Subject</h3>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontFamily:'Times New Roman' }}>{generatedTemplate.subject}</p>
                <button
                    onClick={() => handleCopy(generatedTemplate.subject, "subject")}
                    className={styles.handlecopy}
                    style={{
                        color: copied === `subject` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `subject` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>

        {/* Content Box */}
        <div className={styles.contentbox}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Content</h3>
            <pre className={styles.contentboxinside} 
            >
                {generatedTemplate.content}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => handleCopy(generatedTemplate.content, "content")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `content` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `content` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
            className={styles.btndescription}
            style={{ marginRight: "10px", marginTop: "10px" }}
            onClick={handleSubmitEmail}
        >
            Send Email
        </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
        <label className={styles.notedescription}>
            <span style={{ color: 'blue' }}>(Attach the CSR & Keystore in separate email for DevOps Team)</span> 
            <br />
        </label>
        </div>



    </div>
    
)}

        </div>




    </div>
        </>
            )}

            {selectedOption === 'For SSL Managed By Club' && (
              <>
              <div style={{ padding: "20px", fontFamily: "Times New Roman" }}>
      
          {/* Input Fields */}
          <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
            <div>
                <label className={styles.description}>
                Club Name:
                <input
                    className={styles.box1}
                    type="text"
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Enter Club Name..."
                    required
                />
                </label>
            </div>
            <div style={{ marginLeft: "70px" }} >
                <label className={styles.description}>
                Expiry Date:
                <input
                    className={styles.box1}
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
                    required
                />
                </label>
            </div>
            </div>
      
            {/* DNS & Details Input Fields */}
            <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
            
            <div>
                <label className={styles.description}>
                Domain:  
                <input
                    className={styles.box1}
                    type="text"
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Enter Domain Name..."
                    required
                />
                </label>
            </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "20px" }}>
        <button
            className={styles.btndescription}
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

        <div>
        {generatedTemplate && (
    <div className={styles.mainbox}
    >
        <h2 style={{ color: 'rgb(16, 31, 118)'}}>{generatedTemplate.heading}</h2>
        
        {/* Email to*/}
        <div className={styles.contentbox2}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email to:</h3>
            <pre className={styles.contentboxinside2}
            >
                <b>To: </b>{generatedTemplate.to}
                <br />
            <b>cc: </b> {generatedTemplate.cc}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => handleCopy(generatedTemplate.to + "," + generatedTemplate.cc, "to")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `to` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `to` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>

        {/* Subject Box */}
        <div className={styles.subjectbox}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Subject</h3>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontFamily:'Times New Roman' }}>{generatedTemplate.subject}</p>
                <button
                    onClick={() => handleCopy(generatedTemplate.subject, "subject")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `subject` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `subject` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>

        {/* Content Box */}
        <div className={styles.contentbox}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Content</h3>
            <pre className={styles.contentboxinside}
            >
                {generatedTemplate.content}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => handleCopy(generatedTemplate.content, "content")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `content` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `content` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
            className={styles.btndescription}
            style={{ marginRight: "10px", marginTop: "10px" }}
            onClick={handleSubmitEmail}
        >
            Send Email
        </button>
        
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
        <label className={styles.notedescription}>
            Note: <span style={{ color: 'red' }}>Make sure to attach the CSR file in this email.</span> 
            <br />
        </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
        <label className={styles.notedescription}>
            <span style={{ color: 'blue' }}>(Attach the Keystore in separate email for DevOps Team)</span> 
            <br />
        </label>
        </div>

    </div>
)}

        </div>
            
          
        </div>
            </>
            )}
            {selectedOption === 'For SAN SSL Managed By Club' && (
              <>
              <div style={{ padding: "20px", fontFamily: "Times New Roman" }}>
      
          {/* Input Fields */}
          <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
            <div>
                <label className={styles.description}>
                Club Name:
                <input
                    className={styles.box1}
                    type="text"
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Enter Club Name..."
                    required
                />
                </label>
            </div>
            <div style={{ marginLeft: "70px" }} >
                <label className={styles.description}>
                Expiry Date:
                <input
                    className={styles.box1}
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
                    required
                />
                </label>
            </div>
            </div>
      
            {/* DNS & Details Input Fields */}
            <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
            
            <div>
                <label className={styles.description}>
                Additional Domains:  
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <textarea
                    className={styles.box2}
                    rows="5"   // We can update the number of rows which we want
                    type="text"
                    onChange={(e) => setAdditionalDomains(e.target.value.split("\n"))}
                    placeholder="Enter Addtional DNS Names..."
                    style={{resize: "vertical" }}
                    required
                />
                </div>
                </label>
            </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "20px" }}>
        <button
            className={styles.btndescription}
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

        <div>
        {generatedTemplate && (
    <div className={styles.mainbox}
    >
        <h2 style={{ color: 'rgb(16, 31, 118)'}}>{generatedTemplate.heading}</h2>

        {/* Email to*/}
        <div className={styles.contentbox2}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email to:</h3>
            <pre className={styles.contentboxinside2}
            >
                <b>To: </b>{generatedTemplate.to}
                <br />
                <b>cc: </b> {generatedTemplate.cc}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => handleCopy(generatedTemplate.to + "," + generatedTemplate.cc, "to")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `to` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `to` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>

        {/* Subject Box */}
        <div className={styles.subjectbox}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Subject</h3>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontFamily:'Times New Roman' }}>{generatedTemplate.subject}</p>
                <button
                    onClick={() => handleCopy(generatedTemplate.subject, "subject")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `subject` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `subject` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>

        {/* Content Box */}
        <div className={styles.contentbox}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Content</h3>
            <pre className={styles.contentboxinside}
            >
                {generatedTemplate.content}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => handleCopy(generatedTemplate.content, "content")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `content` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `content` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
            className={styles.btndescription}
            style={{ marginRight: "10px", marginTop: "10px" }}
            onClick={handleSubmitEmail}
        >
            Send Email
        </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
        <label className={styles.notedescription}>
            Note: <span style={{ color: 'red' }}>Make sure to attach the CSR file in this email.</span> 
            <br />
        </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
        <label className={styles.notedescription}>
            <span style={{ color: 'blue' }}>(Attach the Keystore in separate email for DevOps Team)</span> 
            <br />
        </label>
        </div>

        
    </div>
)}

        </div>
            
          
        </div>
            </>
            )}
            {selectedOption === 'For Print Server SSL Managed By NS' && (
              <>
              <div style={{ padding: "20px", fontFamily: "Times New Roman" }}>
      
          {/* Input Fields */}
          <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'center' }}>
            <div>
                <label className={styles.description}>
                Club Name:
                <input
                    className={styles.box1}
                    type="text"
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Enter Club Name..."
                    required
                />
                </label>
            </div>
            <div style={{ marginLeft: "70px" }} >
                <label className={styles.description}>
                Expiry Date:
                <input
                    className={styles.box1}
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
                    required
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
                    className={styles.box1}
                    type="text"
                    onChange={(e) => setdns(e.target.value)}
                    placeholder="Enter Domain Name..."
                    required
                />
                </label>
            </div>
            <div style={{ marginLeft: "20px" }}>
                <label className={styles.description}>
                Alias / Host Name: 
                <input
                    className={styles.box1}
                    type="text"
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Enter Host Name..."
                    required
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
                    className={styles.box1}
                    type="text"
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter Value..."
                    required
                />
                </label>
            </div>
            <div style={{ marginLeft: "100px" }}>
                <label className={styles.description}>
                Domain:  
                <input
                    className={styles.box1}
                    type="text"
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Enter Domain Name..."
                    required
                />
                </label>
            </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "20px" }}>
        <button
            className={styles.btndescription}
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

        <div>
        {generatedTemplate && (
    <div className={styles.mainbox}
    >
        <h2 style={{ color: 'rgb(16, 31, 118)'}}>{generatedTemplate.heading}</h2>
        {/* Email to*/}
        <div className={styles.contentbox2}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email to:</h3>
            <pre className={styles.contentboxinside2}
            >
                <b>To: </b>{generatedTemplate.to}
                <br />
                <b>cc: </b> {generatedTemplate.cc}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => handleCopy(generatedTemplate.to + "," + generatedTemplate.cc, "to")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `to` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `to` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>

        {/* Subject Box */}
        <div className={styles.subjectbox}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Subject</h3>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{margin: 0, fontFamily:'Times New Roman' }}>{generatedTemplate.subject}</p>
                <button
                    onClick={() => handleCopy(generatedTemplate.subject, "subject")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `subject` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `subject` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>

        {/* Content Box */}
        <div className={styles.contentbox}
        >
            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px'}}>Email Content</h3>
            <pre className={styles.contentboxinside}
            >
                {generatedTemplate.content}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={() => handleCopy(generatedTemplate.content, "content")}
                    className={styles.handlecopy}
                    style={{
                     color: copied === `content` ? "green" : "black",
                    }}
                >
                    <img
                        src="/copy-icon.svg"
                        alt="Copy"
                        style={{ width: "20px", height: "20px" }}
                    />
                    {copied === `content` ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
            className={styles.btndescription}
            style={{ marginRight: "10px", marginTop: "10px" }}
            onClick={handleSubmitEmail}
        >
            Send Email
        </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
        <label className={styles.notedescription}>
            <span style={{ color: 'blue' }}>(Attach the CSR & Keystore in separate email for DevOps Team)</span> 
            <br />
        </label>
        </div>

    </div>
)}

        </div>
            
        </div>
            </>
            )}


          </form>
        )}
        
        
        <br />
        <div className={styles.Installerhomebtn} style={{ marginTop: '20px' }}>
          <button>
            <Link href="/">Back to Home</Link>
          </button>
        </div>
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
    </>
  );
}
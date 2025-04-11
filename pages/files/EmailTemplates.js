import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '/styles/Home.module.css';
import { HelpCircle } from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js"; // Import Tooltip
import Layout from '/pages/components/Layout.js';

const defaultClubName = "";
const defaultExpiryDate = "";
const defaultDNS = "";
const defaultHostName = "";
const defaultValue = "";
const defaultDomain = "";
const defaultAdditionalDomains = [""];

const toEmails = ["cst.compliance@globalnorthstar.com", "rockstars@globalnorthstar.com"]; // We can add more to: Emails Here.

const ccEmails = ["devops@globalnorthstar.com"]; // We can add more cc: Emails Here.

const EmailSender = [   // We can add more DevOps Folks Names Here.
    { name: "Mubashir Ahmed", email: "mubashir.ahmed@globalnorthstar.com" },
    { name: "Syed Shahzaib Hussain", email: "shahzaib.hussain@globalnorthstar.com" },
    { name: "Arsalan Ahmed", email: "arsalanjamil.ahmed@globalnorthstar.com" },
    { name: "Taimur Alvi", email: "taimur.alvi@globalnorthstar.com" },
    { name: "Hamza Iqbal", email: "hamza.iqbal@globalnorthstar.com" },
    { name: "Muhammad Abdullah Waseem", email: "abdullah.waseem@globalnorthstar.com" },
    { name: "Abdul Samad Qureshi", email: "abdul.samad@globalnorthstar.com" },
    { name: "Abdullah Arif", email: "abdullah.arif@globalnorthstar.com" },
    { name: "Jibran Ghafoor", email: "jibran.ghafoor@globalnorthstar.com" }
  ];
    

let updatedTemplate = null;

export default function EmailTemplateFunction() {
  const [selectedOption, setSelectedOption] = useState('');
  const [clubName, setClubName] = useState(defaultClubName);
  const [selectedSender, setSelectedSender] = useState("");
  const [dns, setdns] = useState(defaultDNS);
  const [HostName, setHostName] = useState(defaultHostName);
  const [Value, setValue] = useState(defaultValue);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [Domain, setDomain] = useState(defaultDomain);
  const [AdditionalDomains, setAdditionalDomains] = useState(defaultAdditionalDomains);
  
  const [sentEmails, setSentEmails] = useState([]); // Array to store sent email subjects
  const [showPopup, setShowPopup] = useState(false); // State for confirmation popup

  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);
  const [formattedExpiryDate, setFormattedExpiryDate] = useState('');
  const [copied, setCopied] = useState(null);

  const handleSenderChange = (event) => {
    setSelectedSender(event.target.value);
  };

  const handleSendClick = () => {
    setShowPopup(true); // Show the popup
    handleSubmitEmail();
    };

    const handlePopupResponse = (response, senderName, senderEmail) => {
        
        if (response === "yes") {
            setSentEmails([...sentEmails, generatedTemplate.subject]); // Save email subject
            console.log(sentEmails);
            handleUpdateGoogleSheet(senderName, senderEmail);
            handleClear(); // Clear the form
        }
        setShowPopup(false); // Close the popup
    };

  const handleOptionChange = (option) => {
    setSelectedOption(option);
    setGeneratedTemplate(null);
    setClubName('');
    setExpiryDate('');
    setFormattedExpiryDate('');
    setdns('');
    setHostName('');
    setValue('');
    setDomain('');
    setSelectedSender('');
    setAdditionalDomains(defaultAdditionalDomains);
  };

  const handleClear = () => {
    setGeneratedTemplate(null);
    setClubName('');
    setExpiryDate('');
    setFormattedExpiryDate('');
    setdns('');
    setHostName('');
    setValue('');
    setDomain('');
    setSelectedSender('');
    setAdditionalDomains(defaultAdditionalDomains);
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
  
  const handleUpdateGoogleSheet = async (senderName, senderEmail) => {
    if (!senderName || !senderEmail) {
      alert("Please select an Email Sender.");
      return;
    }
  
    try {
      await fetch("/api/googleSheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName,
          formattedExpiryDate,
          emailSubject: generatedTemplate.subject,
          senderName, 
          senderEmail,
          currentDate: new Date().toLocaleDateString("en-US"),
        }),
      });
  
      console.log("Google Sheet updated successfully.");
    } catch (error) {
      console.error("Error updating Google Sheet:", error);
      alert("An error occurred while updating the Google Sheet.");
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
          subject: `SSL Renewal - ${clubName} - ${formattedExpiryDate}`,
          content: 
`Hello Team,
  
I hope this email finds you well! I just wanted to give you a heads-up that the SSL cert for "${clubName}" is expiring on ${formattedExpiryDate}. It's important that we renew the certificate as soon as possible.
  
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
      subject: `SSL Renewal - ${clubName} - ${formattedExpiryDate}`,
      content: 
`Hello Team,
  
I hope this email finds you well! I just wanted to give you a heads-up that the SSL certs for "${clubName}" are expiring on ${formattedExpiryDate}. It's important that we renew the certificate as soon as possible.
  
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
        subject: `SSL Renewal - ${clubName} - ${formattedExpiryDate}`,
        content: 
`Hello Team,
    
I hope this email finds you well! I just wanted to give you a heads-up that the SAN SSL certs for "${clubName}" are expiring on ${formattedExpiryDate}. It's important that we renew the certificate as soon as possible.
    
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
        subject: `SSL Renewal - Print Server - ${clubName} - ${formattedExpiryDate}`,
        content: 
`Hello Team,
    
I hope this email finds you well! I just wanted to give you a heads-up that the SSL certs for "${clubName}" print server are expiring on ${formattedExpiryDate}. It's important that we renew the certificate as soon as possible.
    
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
    else if (selectedOption === 'For Cloudflare On BackOffice') {
        updatedTemplate = {
            to: `${toEmails}`,
            cc: `${ccEmails}`,
          heading: "For Cloudflare On BackOffice",
          subject: `Cloudflare Implementation - BackOffice - ${clubName} - ${formattedExpiryDate}`,
          content: 
`Hello Team,
      
We hope this email finds you well! We want to move the club's BackOffice App to our Cloudflare for better security and performance. We need to do this activity as soon as possible.
      
Club name: ${clubName}
Expiry Date: ${formattedExpiryDate}
      
Domain: ${Domain}
      
Procedure,
You have to schedule a date for this activity with the club and update us accordingly so that we can make the configurations and the club will make changes on the specified date and time.
      
Steps,
- Kindly delete the current entry of A record of "${Domain}" from DNS
- Then, kindly have the domain: "${Domain}" created as A record and mapped to our Cloudflare IP: 104.24.9.63
      
Note: Kindly ask the club to avoid making uninformed changes as it can cause irrelevant downtime.
      
Thank you.`
        };
    
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
        <Layout>
            <div className={styles.CSRContainer}>
                <div className={styles.licenseContent}>
                    <div className={styles.licenseHeader}>
                        <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex' }}>
                            Email Template Generator
                        </h1>
                        <Tooltip text="Generate standardized email templates for SSL-related communications">
                            <Link href="/files/help" legacyBehavior>
                                <a className={styles.tooltip}>
                                    <HelpCircle size={24} color="#64748b" />
                                </a>
                            </Link>
                        </Tooltip>
                    </div>

                    <p className={styles.licenseDescription}>
                        Select template type, provide required information, and click{' '}
                        <strong>Generate</strong>. Generated emails will include all necessary technical details.
                    </p>

                    <div className={styles.licenseDescription}>
                        <label>
                            Template Type:
                            <Tooltip text="Select the type of email template you need to generate">
                                <Link href="/files/help" legacyBehavior>
                                    <a className={styles.tooltip}>
                                        <HelpCircle size={20} />
                                    </a>
                                </Link>
                            </Tooltip>
                            <select
                                value={selectedOption}
                                onChange={(e) => handleOptionChange(e.target.value)}
                                className={styles.styledselecttempmargin}
                                style={{ width: '100%', margin: '10px 0' }}
                            >
                                <option value="Select">-- Select --</option>
                                <option value="For SSL Managed By NS for CNAME record">For SSL Managed By NS for CNAME record</option>
                                <option value="For SSL Managed By Club">For SSL Managed By Club</option>
                                <option value="For SAN SSL Managed By Club">For SAN SSL Managed By Club</option>
                                <option value="For Print Server SSL Managed By NS">For Print Server SSL Managed By NS</option>
                                <option value="For Cloudflare On BackOffice">For Cloudflare On BackOffice</option>
                            </select>
                        </label>
                    </div>

                    {selectedOption && (
                        <form onSubmit={handleSubmit}>
                            {selectedOption === 'Select' && (
                            <>
                            <h2 className={styles.headingnew}>Choose the template you want to generate.</h2>
                            <br />
                            </>
                            )}

                            {selectedOption === 'For SSL Managed By NS for CNAME record' && (
                            <>
                            <h2 className={styles.headingnew}>For SSL Managed By NS for CNAME record</h2>
                            <div className={styles.licenseDescription}>
                            <label>
                                Club Name:
                                <input 
                                type="text"
                                value={clubName}
                                onChange={(e) => setClubName(e.target.value)}
                                className={styles.styledselecttempmargin}
                                placeholder="Enter Club Name..."
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                            <label>
                                Expiry Date:
                                <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => {
                                    const rawDate = e.target.value;
                                    setExpiryDate(rawDate);
                                    setFormattedExpiryDate(
                                    new Date(rawDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    );
                                }}
                                className={styles.styledselecttempmargin}
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                                <label>
                                DNS:
                                <input
                                    type="text"
                                    value={dns}
                                    onChange={(e) => setdns(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter DNS..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            <div className={styles.licenseDescription}>
                                <label>
                                Alias / Host Name:
                                <input
                                    type="text"
                                    value={HostName}
                                    onChange={(e) => setHostName(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter Host Name..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            <div className={styles.licenseDescription}>
                                <label>
                                Value:
                                <input
                                    type="text"
                                    value={Value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter Value..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className={styles.btndescription}>
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
                            
                            </>
                            )}
                            {selectedOption === 'For SSL Managed By Club' && (
                            <>
                            <h2 className={styles.headingnew}>For SSL Managed By Club</h2>
                            <div className={styles.licenseDescription}>
                            <label>
                                Club Name:
                                <input 
                                type="text"
                                value={clubName}
                                onChange={(e) => setClubName(e.target.value)}
                                className={styles.styledselecttempmargin}
                                placeholder="Enter Club Name..."
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                            <label>
                                Expiry Date:
                                <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => {
                                    const rawDate = e.target.value;
                                    setExpiryDate(rawDate);
                                    setFormattedExpiryDate(
                                    new Date(rawDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    );
                                }}
                                className={styles.styledselecttempmargin}
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                                <label>
                                Domain:
                                <input
                                    type="text"
                                    value={Domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter Domain Name..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className={styles.btndescription}>
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

                            </>
                            )}
                            {selectedOption === 'For SAN SSL Managed By Club' && (
                            <>
                            <h2 className={styles.headingnew}>For SAN SSL Managed By Club</h2>
                            <div className={styles.licenseDescription}>
                            <label>
                                Club Name:
                                <input 
                                type="text"
                                value={clubName}
                                onChange={(e) => setClubName(e.target.value)}
                                className={styles.styledselecttempmargin}
                                placeholder="Enter Club Name..."
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                            <label>
                                Expiry Date:
                                <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => {
                                    const rawDate = e.target.value;
                                    setExpiryDate(rawDate);
                                    setFormattedExpiryDate(
                                    new Date(rawDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    );
                                }}
                                className={styles.styledselecttempmargin}
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                                <label>
                                Additional Domains:
                                <textarea
                                    className={styles.styledselecttempmargin}
                                    type="text"
                                    rows="5"
                                    value={AdditionalDomains.join("\n")}
                                    onChange={(e) => setAdditionalDomains(e.target.value.split("\n"))}
                                    placeholder="Enter Addtional DNS Names..."
                                    required
                                    style={{ resize: "vertical", width: '97.5%' }}
                                />
                                </label>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className={styles.btndescription}>
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

                            </>
                            )}
                            {selectedOption === 'For Print Server SSL Managed By NS' && (
                            <>
                            <h2 className={styles.headingnew}>For Print Server SSL Managed By NS</h2>
                            <div className={styles.licenseDescription}>
                            <label>
                                Club Name:
                                <input 
                                type="text"
                                value={clubName}
                                onChange={(e) => setClubName(e.target.value)}
                                className={styles.styledselecttempmargin}
                                placeholder="Enter Club Name..."
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                            <label>
                                Expiry Date:
                                <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => {
                                    const rawDate = e.target.value;
                                    setExpiryDate(rawDate);
                                    setFormattedExpiryDate(
                                    new Date(rawDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    );
                                }}
                                className={styles.styledselecttempmargin}
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                                <label>
                                DNS:
                                <input
                                    type="text"
                                    value={dns}
                                    onChange={(e) => setdns(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter DNS..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            <div className={styles.licenseDescription}>
                                <label>
                                Alias / Host Name:
                                <input
                                    type="text"
                                    value={HostName}
                                    onChange={(e) => setHostName(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter Host Name..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            <div className={styles.licenseDescription}>
                                <label>
                                Value:
                                <input
                                    type="text"
                                    value={Value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter Value..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            <div className={styles.licenseDescription}>
                                <label>
                                Domain:
                                <input
                                    type="text"
                                    value={Domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter Domain Name..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className={styles.btndescription}>
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
                            
                            </>
                            )}
                            {selectedOption === 'For Cloudflare On BackOffice' && (
                            <>
                            <h2 className={styles.headingnew}>For Cloudflare On BackOffice</h2>
                            <div className={styles.licenseDescription}>
                            <label>
                                Club Name:
                                <input 
                                type="text"
                                value={clubName}
                                onChange={(e) => setClubName(e.target.value)}
                                className={styles.styledselecttempmargin}
                                placeholder="Enter Club Name..."
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                            <label>
                                Expiry Date:
                                <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => {
                                    const rawDate = e.target.value;
                                    setExpiryDate(rawDate);
                                    setFormattedExpiryDate(
                                    new Date(rawDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    );
                                }}
                                className={styles.styledselecttempmargin}
                                required
                                style={{ width: '97.5%' }}
                                />
                            </label>
                            </div>

                            <div className={styles.licenseDescription}>
                                <label>
                                Domain:
                                <input
                                    type="text"
                                    value={Domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className={styles.styledselecttempmargin}
                                    placeholder="Enter Domain Name..."
                                    required
                                    style={{ width: '97.5%' }}
                                />
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className={styles.btndescription}>
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
                            
                            </>
                            )}






                        </form>
                    )}
                </div>

                <div className={styles.licenseVisual}>
                    <img 
                        src="/email_template2.png"
                        alt="Email Template Preview"
                        className={styles.licenseImage}
                    />
                </div>
            </div>

            {/* New Template Preview Container */}
            {generatedTemplate && (
                            <div className={styles.CSRContainer} style={{ marginTop: '2rem', gridTemplateColumns: '1fr' }}>
                                <div className={styles.licenseContent}>
                                    <div className={styles.mainbox}>
                                        <h2 style={{ color: 'rgb(16, 31, 118)' }}>{generatedTemplate.heading}</h2>
                                        {/* Email to*/}
                                        <div className={styles.contentbox2}>
                                            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px' }}>Email Recipients</h3>
                                            <pre className={styles.contentboxinside2}>
                                                <b>To:</b> {generatedTemplate.to}
                                                <br />
                                                <b>CC:</b> {generatedTemplate.cc}
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
                                        <div className={styles.subjectbox}>
                                            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px' }}>Email Subject</h3>
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
                                        <div className={styles.contentbox}>
                                            <h3 style={{ color: 'rgb(16, 31, 118)', margin: '0', marginBottom: '15px', marginTop: '5px' }}>Email Content</h3>
                                            <pre className={styles.contentboxinside}>
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

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                                            <button
                                                className={styles.btndescription}
                                                onClick={handleSendClick}
                                            >
                                                Send Email
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
                                        <label className={styles.notedescription}>
                                            <span style={{ color: 'blue' }}>(Must attach the CSR & Keystore in the email for NS Support & DevOps Team)</span> 
                                            <br />
                                        </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}

{showPopup && (
      <div className={styles.popupContainer}>
        <div className={styles.popupBox}>
          <div>
            <label className={styles.description}>Sender Name:</label>
            <select
              value={selectedSender}
              onChange={handleSenderChange}
              className={styles.styledselecttempmargin2}
              style={{ marginLeft: '10px', padding: '7px' }}
              required
            >
              <option value="">-- Select --</option>
              {EmailSender.map((sender, index) => (
                <option key={index} value={sender.name}>
                  {sender.name}
                </option>
              ))}
            </select>
          </div>

          <p>Have you sent the email to support (Attaching the CSR and Keystore Files)?</p>
          <div className={styles.popupButtons}>
            <button
              onClick={() => {
                if (selectedSender) {
                  const senderEmail = EmailSender.find(sender => sender.name === selectedSender)?.email;
                  handlePopupResponse("yes", selectedSender, senderEmail);
                } else {
                  alert("Please select an Email Sender!");
                }
              }}
              className={styles.yesButton}
            >
              Yes
            </button>
            <button onClick={() => handlePopupResponse("no")} className={styles.noButton}>
              No
            </button>
          </div>
        </div>
      </div>
)}

            <div className={styles.Installerhomebtn}>
                <button style={{ marginBottom: '1rem' }}>
                    <Link href="/home">Back to Home</Link>
                </button>
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
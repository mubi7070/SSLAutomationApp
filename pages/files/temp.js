{selectedOption && (
    <form onSubmit={handleGenerate} style={{ maxWidth: '600px', margin: '0 auto' }}>
      {selectedOption === 'Select' && (
        <>
        <h2 className={styles.headingnew}>Choose the template you want to generate.</h2>
        </>
      )}
      {selectedOption === 'For SSL Managed By NS for CNAME record' && (
        <>
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
                //defaultValue={defaultDNS}
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
                //defaultValue={defaultHostName}
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
                //defaultValue={defaultValue}
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
                //defaultValue={defaultDomain}
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
        </>
      )}

      {selectedOption === 'For SSL Managed By Club' && (
        <>
          

        </>
      )}
      {selectedOption === 'For SAN SSL Managed By Club' && (
        <>
        
        

        </>
      )}
      {selectedOption === 'For Print Server SSL' && (
        <>
    
        

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
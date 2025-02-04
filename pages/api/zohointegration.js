const submitFormToZoho = async () => {
    const accessToken = "1000.XGOWVMTTFSYTTTDWG4IAJMFBUEXFDK"; // Use the token you got
    const formLinkName = "AppointmentBookingForm"; // Form link name from Zoho
    const apiURL = `https://www.zohoapis.com/forms/v2/${formLinkName}/submit`;
  
    const formData = {
      data: {
        clubName: "Test Club",
        expiryDate: "2025-12-31",
        dns: "test.example.com",
        HostName: "TestHost",
        Value: "12345"
      }
    };
  
    try {
      const response = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
      console.log("Form Submission Response:", result);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  
  // Call the function to test
  submitFormToZoho();
  
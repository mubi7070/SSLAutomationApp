import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        // Load service account credentials
        const credentialsPath = path.join(process.cwd(), "google-service-account.json");
        const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));

        // Authenticate with Google Sheets API
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });

        const { clubName, formattedExpiryDate, emailSubject, currentDate } = req.body;

        if (!clubName || !formattedExpiryDate || !emailSubject || !currentDate) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const spreadsheetId = "1yVCinTBlCnvv1CYWFjSsfpLjvUcQONJAuBLRoBc4rfE"; // Replace with your actual sheet ID
        const range = "SSL!A:D"; // Data will be stored in columns A to D

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            requestBody: {
                values: [[clubName, formattedExpiryDate, emailSubject, currentDate]],
            },
        });

        res.status(200).json({ success: true, message: "Data added to Google Sheet" });
    } catch (error) {
        console.error("Error adding data to Google Sheet:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

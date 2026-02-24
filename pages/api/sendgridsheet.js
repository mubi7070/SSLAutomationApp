import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";
import { getConfig } from '../lib/config';

export async function updateGoogleSheet(data) {
    const config = await getConfig();
    
    // Auto-extract the ID if the user accidentally saved the full URL in the Admin Panel
    let spreadsheetId = config.GOOGLE_LICENSE_SHEET_ID;
    if (spreadsheetId && spreadsheetId.includes('/d/')) {
        const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
            spreadsheetId = match[1];
        }
    }

    if (!spreadsheetId) {
        throw new Error("Google Sheet ID is missing in the configuration.");
    }

    const credentialsPath = path.join(process.cwd(), "google-service-account.json");
    
    // Check if the service account file actually exists
    try {
        await fs.access(credentialsPath);
    } catch (e) {
        throw new Error(`Service account file not found at: ${credentialsPath}`);
    }

    const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const { subAccount, credits, date, personName, username, fdTicket } = data;

    await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: "Sendgrid!A:F", // Make sure your tab in the Google Sheet is strictly named "Sendgrid"
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[
                subAccount,
                credits,
                date,
                personName,
                username,
                fdTicket
            ]],
        },
    });
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        await updateGoogleSheet(req.body);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Google Sheet API Error details:", error.message || error);
        res.status(500).json({ error: error.message || "Failed to update Google Sheet" });
    }
}
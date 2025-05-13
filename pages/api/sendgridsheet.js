import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const credentialsPath = path.join(process.cwd(), "google-service-account.json");
        const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const { subAccount, credits, date, personName, username, fdTicket } = req.body;

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_LICENSE_SHEET_ID,
            range: "Sendgrid!A:F",
            valueInputOption: "RAW",
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

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Google Sheet Error:", error);
        res.status(500).json({ error: "Failed to update Google Sheet" });
    }
}
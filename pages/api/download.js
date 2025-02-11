import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { filePath } = req.query; // Now, this is just a filename, not a full path

  if (!filePath) {
    return res.status(400).json({ error: "File path is required" });
  }

  const fullPath = path.join(process.cwd(), "Files", filePath); // 🔹 Corrected path

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Disposition", `attachment; filename="${filePath}"`);
  res.setHeader("Content-Type", "application/octet-stream");

  const fileStream = fs.createReadStream(fullPath);
  fileStream.pipe(res);
}

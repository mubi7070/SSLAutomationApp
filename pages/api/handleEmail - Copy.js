export default function handler(req, res) {
    if (req.method === "POST") {
      const { to, cc, subject, content } = req.body;
  
      if (!to || !subject || !content) {
        return res.status(400).json({ error: "Missing required fields." });
      }
  
      const mailtoLink = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
  
      res.status(200).json({ mailtoLink });
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
    }
  }
  
import { useEffect } from "react";

const DownloadFiles = ({ filePaths }) => {
  useEffect(() => {
    const downloadFiles = async () => {
      for (const fileName of filePaths) { // 🔹 Only sending the filename now
        try {
          const downloadUrl = `/api/download?filePath=${encodeURIComponent(fileName)}`;

          const response = await fetch(downloadUrl);
          if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Download error:", error);
        }
      }
    };

    if (filePaths?.length > 0) {
      downloadFiles();
    }
  }, [filePaths]);

  return null; // No UI needed
};

export default DownloadFiles;

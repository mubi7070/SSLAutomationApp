import { useState } from "react";

const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block", cursor: "pointer" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
        style={{
            position: "absolute",
            bottom: "120%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "300px", // Added "px" for proper width
            backgroundColor: "rgb(16, 31, 118)", // A professional dark blue shade
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "6px",
            whiteSpace: "normal", // Allows text to wrap properly
            wordWrap: "break-word", // Ensures text wraps within the tooltip
            fontSize: "15px",
            fontWeight: "500",
            textAlign: "center", // Center align the tooltip text
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Soft shadow for depth
            transition: "opacity 0.3s ease-in-out, transform 0.2s ease-in-out",
            opacity: show ? 1 : 0,
            visibility: show ? "visible" : "hidden",
            zIndex: 1000
          }}
          
        >
          {text}
        </span>
      )}
    </span>
  );
};

export default Tooltip;

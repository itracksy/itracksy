import React from "react";
import ReactDOM from "react-dom/client";
import ClockApp from "./ClockApp";
import "./clock.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(container);
root.render(<ClockApp />);

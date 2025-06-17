import React from "react";
import { createRoot } from "react-dom/client";
import BlockingNotificationApp from "./BlockingNotificationApp";

const container = document.getElementById("blocking-notification-root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <BlockingNotificationApp />
  </React.StrictMode>
);

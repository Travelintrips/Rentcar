import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import "./lib/i18n";

import { TempoDevtools } from "tempo-devtools";
// Initialize Tempo with error handling
try {
  TempoDevtools.init();
} catch (error) {
  console.error("Failed to initialize Tempo devtools:", error);
}

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

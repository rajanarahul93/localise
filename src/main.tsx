import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ensureSession } from "./lib/supabase";
import "./index.css";

// Ensure user has a session before rendering
ensureSession().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
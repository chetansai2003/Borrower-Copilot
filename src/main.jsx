import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.jsx";
import { AssessmentProvider } from "./state/AssessmentContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AssessmentProvider>
      <App />
    </AssessmentProvider>
  </StrictMode>
);

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Debug logging for React mounting
console.log('PharmaCost Pro - React main.tsx loaded');
console.log('DOM ready state:', document.readyState);

const rootElement = document.getElementById("root");
console.log('Root element found:', !!rootElement, rootElement);

if (!rootElement) {
  console.error('CRITICAL: Root element not found!');
  document.body.innerHTML = `<div style="padding:20px;background:red;color:white;">
    <h1>Error: Root Element Missing</h1>
    <p>The React app cannot mount because the root element is missing from the HTML.</p>
  </div>`;
} else {
  try {
    console.log('Creating React root and rendering App...');
    createRoot(rootElement).render(<App />);
    console.log('React app rendered successfully!');
  } catch (error) {
    console.error('React rendering error:', error);
    rootElement.innerHTML = `<div style="padding:20px;background:orange;color:black;">
      <h1>React Rendering Error</h1>
      <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
    </div>`;
  }
}

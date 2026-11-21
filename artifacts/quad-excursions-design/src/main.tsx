import { createRoot } from 'react-dom/client';

import App from './App';
import "./styles/behavior.css";
import "./styles/approved.css";
import "./styles/functional.css";

// Enhance real prerendered HTML. React never replaces imported page content.
const host = document.createElement("div");
host.id = "qe-enhance-host";
document.body.append(host);
createRoot(host, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <App />,
);

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// The imported static DOM inside #migration-root is never re-rendered.
// React mounts into a separate, empty host node and only attaches behavior.
const host = document.createElement('div');
host.id = 'qe-enhance-host';
document.body.appendChild(host);
createRoot(host).render(<App />);

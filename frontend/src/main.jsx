import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Strip double leading slashes from URL (nginx proxy artifact)
if (window.location.pathname.startsWith('//')) {
  window.history.replaceState(
    null, '',
    window.location.pathname.replace(/^\/\//, '/') + window.location.search + window.location.hash
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
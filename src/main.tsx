import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import StorefrontErrorBoundary from './components/StorefrontErrorBoundary.tsx';
import './index.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StorefrontErrorBoundary><App /></StorefrontErrorBoundary>
  </StrictMode>,
);

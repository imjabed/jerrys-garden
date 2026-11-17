import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import StorefrontErrorBoundary from './components/StorefrontErrorBoundary.tsx';
import './index.css';
import { scheduleSplashDismiss } from './services/storefrontBoot';

// The loader clears even if the theme/catalogue API is still warming up.
scheduleSplashDismiss();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StorefrontErrorBoundary><App /></StorefrontErrorBoundary>
  </StrictMode>,
);

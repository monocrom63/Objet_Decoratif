import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${import.meta.env.BASE_URL}sign-in`}
      signUpUrl={`${import.meta.env.BASE_URL}sign-up`}
      afterSignOutUrl={import.meta.env.BASE_URL}
      appearance={{
        variables: {
          colorPrimary: '#171814',
          colorForeground: '#171814',
          colorMutedForeground: '#777369',
          colorBackground: '#fbfaf6',
          colorInput: '#ffffff',
          colorInputForeground: '#171814',
          fontFamily: 'Arial, sans-serif',
          borderRadius: '10px',
        },
      }}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to manage your Objet Décoratif account' } },
        signUp: { start: { title: 'Create your account', subtitle: 'Save and review your Objet Décoratif orders' } },
      }}
    >
      <App />
    </ClerkProvider>
  </ErrorBoundary>,
);

import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { Router as WouterRouter, useLocation } from "wouter";

import App from "./App";
import { ErrorBoundary } from "@/components/error-boundary";
import { LanguageProvider, useLanguage } from "@/lib/language";
import { deDE, enUS } from "@clerk/localizations";

import "./index.css";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const localization = language === "DE" ? deDE : enUS;

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      afterSignOutUrl={basePath || "/"}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      appearance={{
        variables: {
          colorPrimary: "#171814",
          colorForeground: "#171814",
          colorMutedForeground: "#777369",
          colorBackground: "#fbfaf6",
          colorInput: "#ffffff",
          colorInputForeground: "#171814",
          fontFamily: "Arial, sans-serif",
          borderRadius: "10px",
        },
      }}
      localization={{
        ...localization,
        signIn: {
          ...localization.signIn,
          start: {
            ...localization.signIn?.start,
            title: language === "DE" ? "Willkommen zurück" : "Welcome back",
            subtitle: language === "DE" ? "Melde dich an, um dein Objet Décoratif Konto zu verwalten" : "Sign in to manage your Objet Décoratif account",
          },
        },
        signUp: {
          ...localization.signUp,
          start: {
            ...localization.signUp?.start,
            title: language === "DE" ? "Erstelle dein Konto" : "Create your account",
            subtitle: language === "DE" ? "Speichere und verwalte deine Objet Décoratif Bestellungen" : "Save and review your Objet Décoratif orders",
          },
        },
      }}
    >
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <WouterRouter base={basePath}>
      <LanguageProvider>
        <ClerkProviderWithRoutes />
      </LanguageProvider>
    </WouterRouter>
  </ErrorBoundary>,
);

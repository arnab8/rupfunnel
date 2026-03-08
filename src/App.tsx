import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ServerConfig, defaultServerConfig } from "@/types/config";
import Index from "./pages/Index";
import Training from "./pages/Training";
import Book from "./pages/Book";
import Congrats from "./pages/Congrats";

// Lazy load non-critical pages
const Admin = lazy(() => import("./pages/Admin"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const maxRetries = 3;
      let retries = 0;

      while (retries < maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

          const res = await fetch("/.netlify/functions/config", {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`Config endpoint returned ${res.status}`);
          }

          const data = await res.json();
          console.log("Config loaded:", data);
          
          // Use config directly without strict validation for now
          setConfig({
            metaPixelId: data.metaPixelId || "",
            headerCodeBlock: data.headerCodeBlock || "",
            capiEnabled: data.capiEnabled || false,
            mailerLiteApiKeyPresent: data.mailerLiteApiKeyPresent || false,
            mailerLiteGroupId: data.mailerLiteGroupId || "",
            wistiaEmbedCode: data.wistiaEmbedCode || "",
            calComBookingSlug: data.calComBookingSlug || "",
            homeThumbnailUrl: data.homeThumbnailUrl || "",
            version: data.version || "1.0.0",
          } as ServerConfig);

          // If headerCodeBlock is present, inject it
          if (data.headerCodeBlock) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.headerCodeBlock;
            const scripts = tempDiv.querySelectorAll('script');
            scripts.forEach(oldScript => {
              const newScript = document.createElement('script');
              Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
              });
              if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
              }
              document.head.appendChild(newScript);
            });
          }

          return;
        } catch (e) {
          retries++;
          console.warn(`Config load attempt ${retries} failed:`, e);
          
          if (retries < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries - 1) * 1000));
          }
        }
      }

      // After all retries, use default config but show error
      console.error("Failed to load config after 3 retries; using defaults");
      setConfigError("Unable to load server configuration. Some features may be unavailable.");
      setConfig(defaultServerConfig);
    };

    loadConfig();
  }, []);

  if (config === null) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider initialServerConfig={config}>
        <UserProvider>
          <TooltipProvider>
            {configError && (
              <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 p-3 text-sm text-yellow-800 z-50">
                {configError}
              </div>
            )}
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/training" element={<Training />} />
                <Route path="/book" element={<Book />} />
                <Route path="/congrats" element={<Congrats />} />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                      <Admin />
                    </Suspense>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                      <Privacy />
                    </Suspense>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                      <Terms />
                    </Suspense>
                  }
                />
                <Route
                  path="*"
                  element={
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                      <NotFound />
                    </Suspense>
                  }
                />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </UserProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
};

export default App;

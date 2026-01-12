import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { initializeMetaPixel } from "@/lib/tracking";
import { siteConfig } from "@/config/site";
import Index from "./pages/Index";
import Training from "./pages/Training";
import Book from "./pages/Book";
import Congrats from "./pages/Congrats";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Initialize Meta Pixel if pixelId is available
  if (siteConfig.metaPixelId) {
    initializeMetaPixel(siteConfig.metaPixelId);
  }

  // Inject header code block if present
  if (siteConfig.headerCodeBlock) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = siteConfig.headerCodeBlock;
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

  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/training" element={<Training />} />
                <Route path="/book" element={<Book />} />
                <Route path="/congrats" element={<Congrats />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </UserProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
};

export default App;

import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Index from "./pages/Index";
import Training from "./pages/Training";
import Book from "./pages/Book";
import Congrats from "./pages/Congrats";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [config, setConfig] = useState<any | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/.netlify/functions/config");
        const data = await res.json();
        setConfig(data);
      } catch (e) {
        console.error("Failed to load config", e);
      }
    };
    loadConfig();
  }, []);

  if (!config) {
    return <div>Loading...</div>;
  }

  // later you can pass `config` into providers or pages if needed
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
                <Route path="/admin" element={<Admin />} />
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

import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import Footer from "@/components/Footer";

const Book: React.FC = () => {
  const { userData } = useUser();
  const { config } = useAdmin();
  const navigate = useNavigate();
  const embedContainerRef = useRef<HTMLDivElement>(null);

  // Listen for Cal.com booking events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Cal.com sends booking completion via postMessage
      if (event.data?.event === "booking_complete" || event.data?.action === "booking.created") {
        navigate("/congrats");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  // Check if the calComBookingSlug looks like embed code (contains HTML tags)
  const isEmbedCode =
    config.calComBookingSlug?.includes("<") &&
    config.calComBookingSlug?.includes(">");

  // Execute Cal.com embed code scripts when config changes
  useEffect(() => {
    if (isEmbedCode && config.calComBookingSlug && embedContainerRef.current) {
      try {
        embedContainerRef.current.innerHTML = config.calComBookingSlug;
      } catch (error) {
        console.error("Error injecting embed code:", error);
      }
    }
  }, [config.calComBookingSlug, isEmbedCode]);

  // Build Cal.com URL with prefilled data (only used when not embed code)
  const calComUrl = useMemo(() => {
    if (!config.calComBookingSlug || isEmbedCode) return "";

    const baseUrl = `https://cal.com/${config.calComBookingSlug}`;
    const params = new URLSearchParams();

    if (userData?.fullName) params.set("name", userData.fullName);
    if (userData?.email) params.set("email", userData.email);
    if (userData?.phone) params.set("phone", userData.phone);
    
    // Add redirect URL to go to congrats page after booking
    const redirectUrl = `${window.location.origin}/congrats`;
    params.set("redirectUrl", redirectUrl);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [config.calComBookingSlug, userData, isEmbedCode]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4">
          {isEmbedCode ? (
            // Render raw embed code with script execution
            <div
              ref={embedContainerRef}
              className="bg-card rounded-lg shadow-lg overflow-hidden min-h-[700px]"
            />
          ) : calComUrl ? (
            <div className="bg-card rounded-lg shadow-lg overflow-hidden">
              <iframe
                src={calComUrl}
                width="100%"
                height="700"
                frameBorder="0"
                title="Schedule a call"
                className="w-full"
              />
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Apply to Work with The First Time CEO
              </h2>
              <p className="text-muted-foreground mb-6">
                Please configure the Cal.com booking slug in the admin dashboard
                to enable scheduling.
              </p>

              {/* Placeholder calendar UI */}
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    Apply to Work with The First Time CEO
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>🕐</span> 60 Mins
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please Select Your Preferred Date & Complete The Application
                    To Reserve 20 Min Strategy Session
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Note: Your time is valuable to us. Please book a slot that
                    has 100% guarantee of your availability to ensure the time
                    of both (yours and ours) is utilized effectively.
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-6">
                  <p className="text-center text-muted-foreground">
                    Calendar widget will appear here when configured.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Book;

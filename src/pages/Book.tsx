import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import Footer from "@/components/Footer";

const inferTrafficCountry = (): "IN" | "US" => {
  if (typeof window === "undefined") return "IN";

  const browserLanguages = [navigator.language, ...(navigator.languages || [])]
    .filter(Boolean)
    .join(",");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  const isIndiaTraffic =
    /(^|,)[a-z]{2}-IN\b/i.test(browserLanguages) ||
    timezone === "Asia/Kolkata";

  return isIndiaTraffic ? "IN" : "US";
};

const normalizePhoneForCal = (phone: string, trafficCountry: "IN" | "US"): string => {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  // If user already typed India country code without "+", preserve it.
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  // Default to traffic country when no explicit country code is provided.
  if (digits.length === 10) {
    return trafficCountry === "IN" ? `+91${digits}` : `+1${digits}`;
  }

  return `+${digits}`;
};

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
    if (userData?.phone) {
      const trafficCountry = inferTrafficCountry();
      const normalizedPhone = normalizePhoneForCal(userData.phone, trafficCountry);

      // Keep legacy key and add Cal.com's documented phone-question key.
      params.set("phone", normalizedPhone);
      params.set("attendeePhoneNumber", normalizedPhone);

      // For custom booking questions (e.g. text notifications), Cal.com expects the field identifier.
      const textNotificationIdentifier = config.calComTextNotificationFieldIdentifier?.trim();
      if (textNotificationIdentifier) {
        params.set(textNotificationIdentifier, normalizedPhone);
      }

      // For custom booking questions (e.g. a WhatsApp field), Cal.com expects the field identifier.
      const whatsappIdentifier = config.calComWhatsAppFieldIdentifier?.trim();
      if (whatsappIdentifier) {
        params.set(whatsappIdentifier, normalizedPhone);
      }
    }

    // Add redirect URL to go to congrats page after booking
    const redirectUrl = `${window.location.origin}/congrats`;
    params.set("redirectUrl", redirectUrl);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [
    config.calComBookingSlug,
    config.calComTextNotificationFieldIdentifier,
    config.calComWhatsAppFieldIdentifier,
    userData,
    isEmbedCode,
  ]);

  const hasCalendarEmbed = isEmbedCode || Boolean(calComUrl);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={`flex-1 ${hasCalendarEmbed ? "py-0 sm:py-8" : "py-8 sm:py-12"}`}>
        <div className={`${hasCalendarEmbed ? "max-w-none px-0 sm:max-w-5xl sm:mx-auto sm:px-4" : "max-w-5xl mx-auto px-4"}`}>
          {isEmbedCode ? (
            // Render raw embed code with script execution
            <div
              ref={embedContainerRef}
              className="bg-card overflow-hidden min-h-[100dvh] sm:min-h-[800px] sm:rounded-lg sm:shadow-lg [&_iframe]:w-full [&_iframe]:min-h-[100dvh] sm:[&_iframe]:min-h-[800px]"
            />
          ) : calComUrl ? (
            <div className="bg-card overflow-hidden min-h-[100dvh] sm:min-h-0 sm:rounded-lg sm:shadow-lg">
              <iframe
                src={calComUrl}
                frameBorder="0"
                title="Schedule a call"
                className="w-full h-[100dvh] sm:h-[850px]"
                allow="camera; microphone; fullscreen; clipboard-read; clipboard-write"
              />
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Apply to Work with Arnab Sinha
              </h2>
              <p className="text-muted-foreground mb-6">
                Please configure the Cal.com booking slug in the admin dashboard
                to enable scheduling.
              </p>

              {/* Placeholder calendar UI */}
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    Apply to Work with The Arnab Sinha
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

          {!isEmbedCode && calComUrl && (
            <div className="sm:hidden px-4 py-3 border-t border-border bg-background">
              <a
                href={calComUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm font-medium text-foreground"
              >
                Open booking in full-screen
              </a>
            </div>
          )}
        </div>
      </main>

      {!hasCalendarEmbed && <Footer />}
    </div>
  );
};

export default Book;

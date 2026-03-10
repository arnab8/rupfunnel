import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const DEFAULT_WISTIA_EMBED_CODE = `<script src="https://fast.wistia.com/player.js" async></script><script src="https://fast.wistia.com/embed/w0o07rdsuc.js" async type="module"></script><style>wistia-player[media-id='w0o07rdsuc']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/w0o07rdsuc/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style><wistia-player media-id="w0o07rdsuc" aspect="1.7777777777777777"></wistia-player>`;

const Training: React.FC = () => {
  const [showButton, setShowButton] = useState(false);
  const { userData, isLoaded } = useUser();
  const { config } = useAdmin();
  const navigate = useNavigate();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Redirect if no user data
    if (isLoaded && !userData) {
      navigate("/");
    }
  }, [isLoaded, userData, navigate]);

  useEffect(() => {
    // Show Apply Now button immediately on page load
    setShowButton(true);
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.text = "fbq('track', 'Lead');";
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleApplyNow = () => {
    navigate("/book");
  };

  // Execute Wistia embed code scripts when config changes.
  // Uses admin-provided code when set, otherwise falls back to the default embed.
  useEffect(() => {
    const embedCode = config.wistiaEmbedCode || DEFAULT_WISTIA_EMBED_CODE;

    if (embedCode && videoContainerRef.current) {
      // Clear existing content
      videoContainerRef.current.innerHTML = embedCode;

      // Find and execute any script tags
      const scripts = videoContainerRef.current.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");

        // Copy all attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Copy inline script content
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }

        // Replace old script with new one to trigger execution
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [config.wistiaEmbedCode]);

  // Default Wistia embed or custom embed code
  const renderVideoPlayer = () => {
    return (
      <div
        ref={videoContainerRef}
        className="aspect-video w-full [&_.wistia_responsive_padding]:!p-0 [&_.wistia_responsive_wrapper]:!relative [&_iframe]:!w-full [&_iframe]:!h-full"
      />
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 py-8 sm:py-12">
        <div className="executive-container">
          <section className="py-2 sm:py-4 lg:py-6">
            <div className="text-center">
              <h1 className="executive-heading mb-4">
                The protocol that separates leaders who degrade under pressure from those whose system holds when the load peaks
              </h1>
              <p className="executive-subheading max-w-3xl mx-auto mb-0">
                By the end of this video, you will understand exactly why your system degrades under pressure — and the
                three-phase protocol that trains your biology to hold when it matters most.
              </p>
            </div>
          </section>

          {/* Video Player */}
          <div className="max-w-4xl mx-auto mb-8">{renderVideoPlayer()}</div>

          {/* Apply Now Button */}
          <div className="text-center">
            <div
              className={`transition-all duration-500 ${
                showButton
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-4"
              }`}
            >
              <Button
                onClick={handleApplyNow}
                className="executive-button"
                disabled={!showButton}
              >
                Apply Now
              </Button>
            </div>

            {!showButton && (
              <p className="text-muted-foreground text-sm mt-4">
                Watch the video to unlock the application...
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Training;

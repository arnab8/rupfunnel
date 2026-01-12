import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

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
    // Show Apply Now button after delay
    const timer = setTimeout(() => {
      setShowButton(true);
    }, config.vslButtonDelay * 1000);

    return () => clearTimeout(timer);
  }, [config.vslButtonDelay]);

  const handleApplyNow = () => {
    navigate("/book");
  };

  // Execute Wistia embed code scripts when config changes
  useEffect(() => {
    if (config.wistiaEmbedCode && videoContainerRef.current) {
      // Clear existing content
      videoContainerRef.current.innerHTML = config.wistiaEmbedCode;

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
    if (config.wistiaEmbedCode) {
      return (
        <div
          ref={videoContainerRef}
          className="aspect-video w-full [&_.wistia_responsive_padding]:!p-0 [&_.wistia_responsive_wrapper]:!relative [&_iframe]:!w-full [&_iframe]:!h-full"
        />
      );
    }

    // Placeholder video player
    return (
      <div className="aspect-video w-full bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          {/* CEO Logo */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                1
              </span>
            </div>
            <div className="text-primary">
              <span className="text-xs font-medium">THE FIRST TIME</span>
              <span className="text-2xl font-bold block -mt-1">CEO</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary text-center leading-tight mt-8">
            How to Unlock C-Suite, V-Suite or D-Suite Opportunities & Get Rid
            of Your Career Plateau in 12 Weeks
          </h2>
          <p className="text-primary/80 text-center mt-4 text-sm sm:text-base">
            Without Endless Certifications, Networking, Working Endlessly, or
            Hoping & Praying for the Leadership Sun to Shine on You
          </p>

          {/* Play button indicator */}
          <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
            </div>
          </div>
        </div>

        {/* Video controls mockup */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4 text-white">
            <button className="w-8 h-8 flex items-center justify-center">
              <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent"></div>
            </button>
            <span className="text-sm font-medium">36:48</span>
            <div className="flex-1 h-1 bg-white/30 rounded-full">
              <div className="w-0 h-full bg-white rounded-full"></div>
            </div>
            <span className="text-xs font-semibold">wistia</span>
          </div>
        </div>
      </div>
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

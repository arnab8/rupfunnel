import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import { captureUtmParams, triggerPixelEvent, getCookie, sendCapiEvent } from "@/lib/tracking";
import { OptInFormData } from "@/lib/validation";
import OptInPopup from "@/components/OptInPopup";
import VideoThumbnail from "@/components/VideoThumbnail";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData, setUserData, isLoaded } = useUser();
  const { config } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  // NOTE: Removed auto-redirect to /training when userData exists
  // This allows returning users to access the opt-in page
  // They can watch the video again or click through to /training manually

  useEffect(() => {
    // Show popup after configurable delay (default 30 seconds)
    const delay = (config.popupDelay || 30) * 1000;
    const timer = setTimeout(() => {
      if (!userData) {
        setIsPopupOpen(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [config.popupDelay, userData]);

  const handleCtaClick = () => {
    setIsPopupOpen(true);
  };

  const handleFormSubmit = async (formData: OptInFormData) => {
    setIsSubmitting(true);

    try {
      // Capture UTM parameters and Facebook cookies
      const utmParams = captureUtmParams();
      const fbp = getCookie("_fbp");
      const fbc = getCookie("_fbc");

      const fullUserData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        jobRole: formData.jobRole,
        utmCampaign: utmParams.utmCampaign,
        utmContent: utmParams.utmContent,
        fbp,
        fbc,
      };

      // Send to MailerLite via Netlify Function
      // The MAILERLITE_API_KEY must be set in Netlify Dashboard → Site Settings → Environment Variables
      const subscribeResponse = await fetch("/.netlify/functions/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          designation: formData.jobRole,
          utmCampaign: utmParams.utmCampaign || "",
          utmContent: utmParams.utmContent || "",
          tags: ["Lead"],
          groupId: config.mailerLiteGroupId || "",
        }),
      });

      const subscribeResult = await subscribeResponse.json();

      if (!subscribeResponse.ok) {
        console.error("MailerLite subscription error:", subscribeResult);
        // Show error but don't block the user from continuing
        toast({
          title: "Subscription Notice",
          description:
            "We couldn't add you to our list, but you can still watch the video.",
          variant: "destructive",
        });
      } else {
        console.log("MailerLite subscription successful:", subscribeResult);
      }

      // Save to context and localStorage
      setUserData(fullUserData);

      // Trigger browser Lead event with enhanced matching fields
      triggerPixelEvent("Lead", {
        content_name: "VSL Opt-in",
        content_category: "Executive Training",
        value: 0,
        currency: "USD",
        // Advanced matching fields
        email: formData.email,
        phone: formData.phone,
        first_name: formData.fullName.split(" ")[0],
        last_name: formData.fullName.split(" ").slice(1).join(" "),
        ...(utmParams.utmCampaign && { utm_campaign: utmParams.utmCampaign }),
        ...(utmParams.utmContent && { utm_content: utmParams.utmContent }),
      });

      // Send to CAPI for server-side matching and deduplication
      if (config.metaPixelId) {
        await sendCapiEvent(
          "Lead",
          fullUserData,
          config.metaPixelId,
          config.leadCapiTestEnabled ? config.leadCapiTestEventCode : undefined
        );
      }

      // Navigate to training page
      navigate("/training");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    "Why Most High Performers Stay Trapped in Burnout Without Realizing It",
    "The 3 Costly Mistakes That Keep You Exhausted and Unfocused",
    "The 3-Layer Recovery Framework to Rebuild Calm Energy and Fog",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="executive-container text-center">
            <p className="text-primary font-semibold text-lg mb-4">
              Executive Briefing for Founders & Senior Corporate Leaders
            </p>
            <h1 className="executive-heading mb-4">
              The Neuroscience of Optimal Leadership Performance: How Great Leaders Stay Clear Under Pressure
            </h1>
            <p className="executive-subheading max-w-3xl mx-auto mb-0">
              If you've been running on caffeine, pressure, and sheer willpower this training reveals how to reset your brain, recharge your focus, and feel like yourself again.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="pt-8 pb-12 sm:pb-16 lg:pb-20">
          <div className="executive-container">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* Video Thumbnail */}
              <div className="relative">
                <VideoThumbnail 
                  onClick={handleCtaClick}
                  thumbnailUrl={config.homeThumbnailUrl || undefined}
                />
              </div>

              {/* Benefits List */}
              <div className="space-y-6">
                <p className="text-xl font-medium text-foreground">
                  In this training you'll discover:
                </p>
                <ul className="space-y-5">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                      <span className="text-lg text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button onClick={handleCtaClick} className="executive-button mt-8">
                  Click Here to Get Access
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <OptInPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Index;

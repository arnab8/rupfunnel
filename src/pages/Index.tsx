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
  const { userData, setUserData } = useUser();
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
        externalId: formData.externalId,
      };

      // Send to MailerLite via Netlify Function
      // The MAILERLITE_API_KEY must be set in Netlify Dashboard â†’ Site Settings â†’ Environment Variables
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
          ...(formData.externalId && { externalId: formData.externalId }),
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

      const leadEventData = {
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
      };

      // Trigger browser Lead event with enhanced matching fields
      const leadEventId = triggerPixelEvent("Lead", leadEventData);

      // Send to CAPI for server-side matching and deduplication.
      // Fallback pixel ID keeps CAPI active even if admin/server config field is empty.
      const capiPixelId = config.metaPixelId || "907493832199906";
      await sendCapiEvent(
        "Lead",
        fullUserData,
        capiPixelId,
        config.leadCapiTestEnabled ? config.leadCapiTestEventCode : undefined,
        leadEventId || undefined,
        leadEventData
      );

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
    "Why performance volatility is a hardware failure and why willpower will never fix it",
    "The reason your existing solutions collapse under maximum load",
    "The three-phase engineering protocol that raises your ceiling permanently",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="executive-container text-center">
            <p className="text-primary font-semibold text-lg mb-4">
              Executive Briefing  for Founders, CXOs & Senior Leaders Operating Under Constant Pressure & Global Schedules
            </p>
            <h1 className="executive-heading mb-4">
              How Founders, Leaders & CXOs Can Stop Their Judgment From Failing At Highest‑Stakes Moments In 10-12 Weeks – Without Willpower, Therapy, or Mindset Hacks
            </h1>
            <p className="executive-subheading max-w-3xl mx-auto mb-0">
              If your role puts money, people, reputation, or strategic outcomes at risk, this briefing explains how elite leaders maintain clarity, authority, and decision quality when the system turns hostile.
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


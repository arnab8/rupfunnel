import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useAdmin } from '@/contexts/AdminContext';
import { captureUtmParams, triggerPixelEvent, getCookie } from '@/lib/tracking';
import { OptInFormData } from '@/lib/validation';
import OptInPopup from '@/components/OptInPopup';
import VideoThumbnail from '@/components/VideoThumbnail';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Index: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData, setUserData, isLoaded } = useUser();
  const { config } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If user already exists, redirect to training
    if (isLoaded && userData) {
      navigate('/training');
    }
  }, [isLoaded, userData, navigate]);

  useEffect(() => {
    // Show popup after delay
    const timer = setTimeout(() => {
      if (!userData) {
        setIsPopupOpen(true);
      }
    }, config.popupDelay * 1000);

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
      const fbp = getCookie('_fbp');
      const fbc = getCookie('_fbc');

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
      const subscribeResponse = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          designation: formData.jobRole,
          utmCampaign: utmParams.utmCampaign || '',
          utmContent: utmParams.utmContent || '',
          tags: ['Lead'],
          groupId: config.mailerLiteGroupId || '',
        }),
      });

      const subscribeResult = await subscribeResponse.json();

      if (!subscribeResponse.ok) {
        console.error('MailerLite subscription error:', subscribeResult);
        // Show error but don't block the user from continuing
        toast({
          title: "Subscription Notice",
          description: "We couldn't add you to our list, but you can still watch the video.",
          variant: "destructive",
        });
      } else {
        console.log('MailerLite subscription successful:', subscribeResult);
      }

      // Save to context and localStorage
      setUserData(fullUserData);

      // Trigger browser Lead event
      triggerPixelEvent('Lead', {
        content_name: 'VSL Opt-in',
        content_category: 'Executive Training',
      });

      // Navigate to training page
      navigate('/training');
    } catch (error) {
      console.error('Form submission error:', error);
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
    '5 Secrets that most corporate leadership experts hide from you',
    '8 Detailed case studies of executives taking bigger and more strategic roles',
    "Discover the unique, science-backed system that's designed to elevate your executive presence, improve strategic decision-making, and position you for leadership roles in record time, without guesswork or frustration.",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="executive-container text-center">
            <p className="text-primary font-semibold text-lg mb-4">
              For Directors, AVPs, VPs & CXOs
            </p>
            <h1 className="executive-heading mb-4">
              How to Unlock High Value Leadership Opportunities & Get Rid of Your Career Plateau in 12 Weeks
            </h1>
            <p className="executive-subheading max-w-3xl mx-auto mb-12">
              Without Endless Certifications, Networking, Working Endlessly, or Hoping & Praying for the Leadership Sun to Shine on You
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-12 sm:pb-16 lg:pb-20">
          <div className="executive-container">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Video Thumbnail */}
              <div className="relative">
                <VideoThumbnail onClick={handleCtaClick} />
              </div>

              {/* Benefits List */}
              <div className="space-y-6">
                <p className="text-lg font-medium text-foreground">
                  In this short and to-the-point video, you're going to learn:
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={handleCtaClick}
                  className="executive-button mt-8"
                >
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

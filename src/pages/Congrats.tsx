import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useAdmin } from '@/contexts/AdminContext';
import { triggerPixelEvent, sendCapiEvent } from '@/lib/tracking';
import Footer from '@/components/Footer';

const Congrats: React.FC = () => {
  const { userData, isLoaded } = useUser();
  const { config } = useAdmin();
  const navigate = useNavigate();
  const [profileSrc, setProfileSrc] = useState('/profile.jpg');

  useEffect(() => {
    // Redirect if no user data
    if (isLoaded && !userData) {
      navigate('/');
      return;
    }
  }, [isLoaded, userData, navigate]);

  useEffect(() => {
    if (!isLoaded || !userData) return;

    const emailKey = userData.email?.toLowerCase().trim();
    const idempotencyKey = emailKey ? `executive_funnel_submit_application_sent_${emailKey}` : null;

    if (idempotencyKey) {
      try {
        const alreadySent = localStorage.getItem(idempotencyKey);
        if (alreadySent) {
          return;
        }
        localStorage.setItem(idempotencyKey, String(Date.now()));
      } catch (error) {
        console.warn('Unable to access localStorage for idempotency:', error);
      }
    }

    // Trigger SubmitApplication event
    if (isLoaded && userData) {
      // Browser pixel event with enhanced matching fields
      triggerPixelEvent('SubmitApplication', {
        content_name: 'Booking Completed',
        content_category: 'Executive Training',
        value: 0,
        currency: 'USD',
        // Advanced matching
        email: userData.email,
        phone: userData.phone,
        first_name: userData.fullName.split(' ')[0],
        last_name: userData.fullName.split(' ').slice(1).join(' '),
      });

      // CAPI event for server-side matching and deduplication
      if (config.metaPixelId) {
        sendCapiEvent(
          'SubmitApplication',
          userData,
          config.metaPixelId,
          config.applicationCapiTestEnabled ? config.applicationCapiTestEventCode : undefined
        );
      }

      // Update MailerLite tag from "Lead" to "Application"
      fetch('/.netlify/functions/update-subscriber-tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          removeFromGroup: 'Lead',
          addToGroup: 'Application',
        }),
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            console.log('MailerLite tag updated: Lead → Application');
          } else {
            console.warn('Failed to update MailerLite tag:', result.error);
          }
        })
        .catch(error => {
          console.warn('Error updating MailerLite tag:', error);
        });
    }
  }, [isLoaded, userData, config]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <div className="executive-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image placeholder */}
            <div className="aspect-[4/5] bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden">
              <img
                src={profileSrc}
                alt="Arnab Sinha"
                className="w-full h-full object-cover"
                onError={() => {
                  if (profileSrc !== '/thumbnail.png') {
                    setProfileSrc('/thumbnail.png');
                  }
                }}
              />
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-600">Booking Confirmed</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Congratulations, your application is being reviewed.
                </h1>
              </div>

              <div className="space-y-6 mt-8">
                <div className="p-6 bg-accent/50 border-l-4 border-primary rounded-r-lg">
                  <h3 className="font-bold text-foreground mb-2">Confirmation Email</h3>
                  <p className="text-foreground/80">
                    You'll receive an email shortly with your appointment details. Make sure to add it to your calendar.
                  </p>
                </div>

                <div className="p-6 bg-accent/50 border-l-4 border-primary rounded-r-lg">
                  <h3 className="font-bold text-foreground mb-2">Meeting Link</h3>
                  <p className="text-foreground/80">
                    Since your appointment is virtual, the confirmation email will include a meeting link.
                  </p>
                  <p className="text-foreground/80 mt-2">
                    Please test your internet, audio and video before the call.
                  </p>
                </div>
              </div>

              {userData && (
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Confirmation sent to: <span className="font-medium text-foreground">{userData.email}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Congrats;

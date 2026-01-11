import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { triggerPixelEvent } from '@/lib/tracking';
import Footer from '@/components/Footer';
import { CheckCircle } from 'lucide-react';

const Congrats: React.FC = () => {
  const { userData, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if no user data
    if (isLoaded && !userData) {
      navigate('/');
      return;
    }

    // Trigger SubmitApplication event
    if (isLoaded && userData) {
      triggerPixelEvent('SubmitApplication', {
        content_name: 'Booking Completed',
        content_category: 'Executive Training',
      });
    }
  }, [isLoaded, userData, navigate]);

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
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Profile Image</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Congratulations, your application is being reviewed.
              </h1>

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

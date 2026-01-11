import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 py-12">
        <div className="executive-container">
          <Link to="/" className="text-primary hover:underline mb-8 inline-block">
            ← Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-foreground/80">
            <p>
              Your privacy is important to us. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website.
            </p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including your name, 
              email address, phone number, and job role when you fill out our opt-in form.
            </p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, 
              send you marketing communications, and respond to your inquiries.
            </p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">Third-Party Services</h2>
            <p>
              We may share your information with third-party service providers to help us 
              operate our business, including email marketing platforms and analytics services.
            </p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;

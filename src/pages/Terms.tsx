import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 py-12">
        <div className="executive-container">
          <Link to="/" className="text-primary hover:underline mb-8 inline-block">
            ← Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-foreground/80">
            <p>
              By accessing and using this website, you accept and agree to be bound by 
              the terms and provision of this agreement.
            </p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">Use of Service</h2>
            <p>
              Our services are provided for informational and educational purposes. 
              Results may vary and are not guaranteed.
            </p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">Intellectual Property</h2>
            <p>
              All content, including but not limited to text, graphics, images, and videos, 
              is the property of The First Time CEO and is protected by copyright laws.
            </p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">Limitation of Liability</h2>
            <p>
              We shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages resulting from your use of our services.
            </p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Your continued use 
              of the website constitutes acceptance of any changes.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;

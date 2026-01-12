import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-6 mt-12">
      <div className="executive-container text-center text-sm text-muted-foreground">
        <div className="mb-4">
          © {currentYear} Arnab Sinha
        </div>
        <div className="flex justify-center space-x-6">
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);

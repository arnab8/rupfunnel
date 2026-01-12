import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-4 border-t border-border bg-background">
      <div className="executive-container">
        <div className="space-y-3">
          <p className="footer-text">
            © {currentYear} Arnab Sinha
          </p>
          <p className="footer-text">
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            {' | '}
            <Link to="/terms" className="footer-link">Terms</Link>
          </p>
          <div className="space-y-1 mt-4">
            <p className="footer-text">
              This site is not a part of the Facebook website or Facebook Inc.
            </p>
            <p className="footer-text">
              Additionally, This site is NOT endorsed by Facebook in any way.
            </p>
            <p className="footer-text">
              FACEBOOK is a trademark of FACEBOOK, Inc.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

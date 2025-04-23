import React from 'react';
import '../styles/Footer.scss';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <p className="footer__copyright">
        © {currentYear} Курсы валют
      </p>
    </footer>
  );
};

export default Footer; 
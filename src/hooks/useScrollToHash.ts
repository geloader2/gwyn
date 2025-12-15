import { useNavigate, useLocation } from 'react-router-dom';

export const useScrollToHash = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToHash = (hash: string) => {
    // Remove # if present
    const cleanHash = hash.replace('#', '');
    
    // If we're on the home page, just scroll
    if (location.pathname === '/') {
      const element = document.getElementById(cleanHash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to home page with hash
      navigate(`/#${cleanHash}`);
      
      // Scroll after a short delay to ensure the page is loaded
      setTimeout(() => {
        const element = document.getElementById(cleanHash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return scrollToHash;
};
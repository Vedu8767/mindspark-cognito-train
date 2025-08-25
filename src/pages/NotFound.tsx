import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
      <div className="glass-card-strong p-8 text-center max-w-md w-full">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <a 
          href="/" 
          className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-primary-foreground bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary transition-all duration-200 hover:scale-105"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;

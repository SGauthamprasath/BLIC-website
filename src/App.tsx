// src/App.tsx
import { useEffect, useState } from 'react';
import HeroSection from './components/HeroSection';
import EventsCarousel from './components/EventsCarousel';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';

function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Simple routing based on URL hash
    const checkRoute = () => {
      setIsAdminRoute(window.location.hash === '#admin');
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <EventsCarousel />
      <ContactForm />
      <Footer />
    </div>
  );
}

export default App;
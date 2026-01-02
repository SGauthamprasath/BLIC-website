import { useEffect } from 'react';
import HeroSection from './components/HeroSection';
import EventsCarousel from './components/EventsCarousel';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';

function App() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

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

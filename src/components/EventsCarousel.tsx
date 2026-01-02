import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { eventsData, type Event } from '../data/eventsData';

const EventsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoRotateInterval = useRef<number | null>(null);

  const itemsPerView = {
    mobile: 1,
    desktop: 3
  };

  const [currentItemsPerView, setCurrentItemsPerView] = useState(
    window.innerWidth >= 768 ? itemsPerView.desktop : itemsPerView.mobile
  );

  useEffect(() => {
    const handleResize = () => {
      setCurrentItemsPerView(
        window.innerWidth >= 768 ? itemsPerView.desktop : itemsPerView.mobile
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = eventsData.length - currentItemsPerView;

  const startAutoRotate = () => {
    if (autoRotateInterval.current) {
      clearInterval(autoRotateInterval.current);
    }
    autoRotateInterval.current = window.setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= maxIndex) {
          return 0;
        }
        return prevIndex + 1;
      });
    }, 4000);
  };

  useEffect(() => {
    if (!isHovered) {
      startAutoRotate();
    }

    return () => {
      if (autoRotateInterval.current) {
        clearInterval(autoRotateInterval.current);
      }
    };
  }, [isHovered, maxIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex <= 0) {
        return maxIndex;
      }
      return prevIndex - 1;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex >= maxIndex) {
        return 0;
      }
      return prevIndex + 1;
    });
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      handleNext();
    }

    if (touchStart - touchEnd < -75) {
      handlePrevious();
    }
  };

  return (
    <section id="events" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Events & Highlights
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Recent conferences, workshops, and speaking engagements
          </p>
        </div>

        <div
          className="relative max-w-7xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / currentItemsPerView)}%)`
              }}
            >
              {eventsData.map((event: Event) => (
                <div
                  key={event.id}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / currentItemsPerView}%` }}
                >
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-full">
                    <div className="relative h-64 md:h-72 overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow-md">
                        {event.date}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsCarousel;

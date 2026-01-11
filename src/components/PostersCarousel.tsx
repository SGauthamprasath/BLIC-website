// src/components/PostersCarousel.tsx
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Poster {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
}

const PostersCarousel = () => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set());
  const autoRotateInterval = useRef<number | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  const itemsPerView = {
    mobile: 1,
    desktop: 3
  };

  const [currentItemsPerView, setCurrentItemsPerView] = useState(
    window.innerWidth >= 768 ? itemsPerView.desktop : itemsPerView.mobile
  );

  useEffect(() => {
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosters(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching posters:', err);
      setError('Failed to load posters. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setCurrentItemsPerView(
        window.innerWidth >= 768 ? itemsPerView.desktop : itemsPerView.mobile
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, posters.length - currentItemsPerView);

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
    }, 5000);
  };

  useEffect(() => {
    if (!isHovered && posters.length > 0) {
      startAutoRotate();
    }

    return () => {
      if (autoRotateInterval.current) {
        clearInterval(autoRotateInterval.current);
      }
    };
  }, [isHovered, maxIndex, posters.length]);

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

  const toggleVideoPlayback = (posterId: number) => {
    const video = videoRefs.current.get(posterId);
    if (!video) return;

    if (playingVideos.has(posterId)) {
      video.pause();
      setPlayingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(posterId);
        return newSet;
      });
    } else {
      video.play();
      setPlayingVideos(prev => new Set(prev).add(posterId));
    }
  };

  if (loading) {
    return (
      <section id="posters" className="py-20 md:py-28 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Posters & Media
            </h2>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="posters" className="py-20 md:py-28 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Posters & Media
            </h2>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchPosters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (posters.length === 0) {
    return null; // Don't show section if no posters
  }

  return (
    <section id="posters" className="py-20 md:py-28 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Posters & Media
          </h2>
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
              {posters.map((poster) => (
                <div
                  key={poster.id}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / currentItemsPerView}%` }}
                >
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-full">
                    <div className="relative h-96 md:h-[500px] overflow-hidden bg-gray-900">
                      {poster.media_type === 'video' ? (
                        <>
                          <video
                            ref={(el) => {
                              if (el) videoRefs.current.set(poster.id, el);
                            }}
                            src={poster.media_url}
                            className="w-full h-full object-contain"
                            loop
                            playsInline
                            preload="metadata"
                            onPlay={() => setPlayingVideos(prev => new Set(prev).add(poster.id))}
                            onPause={() => setPlayingVideos(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(poster.id);
                              return newSet;
                            })}
                          />
                          <button
                            onClick={() => toggleVideoPlayback(poster.id)}
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 group"
                          >
                            <div className="bg-white bg-opacity-90 group-hover:bg-opacity-100 p-4 rounded-full shadow-lg transition-all duration-300">
                              {playingVideos.has(poster.id) ? (
                                <Pause className="w-8 h-8 text-gray-900" />
                              ) : (
                                <Play className="w-8 h-8 text-gray-900 ml-1" />
                              )}
                            </div>
                          </button>
                        </>
                      ) : (
                        <img
                          src={poster.media_url}
                          alt="Poster"
                          className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {posters.length > currentItemsPerView && (
            <>
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
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default PostersCarousel;
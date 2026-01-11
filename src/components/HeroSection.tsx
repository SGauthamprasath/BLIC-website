import { Mail, Linkedin, Twitter } from 'lucide-react';

const HeroSection = () => {
  return (
    <section id="hero" className="min-h-screen flex items-center bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16 max-w-6xl mx-auto">
          <div className="w-full md:w-5/12 flex justify-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-2xl blur-2xl opacity-20"></div>
              <img
                src="../WhatsApp Image 2025-12-29 at 10.49.11 PM.jpeg"
                alt="Professional profile"
                className="relative w-72 h-72 md:w-96 md:h-96 object-cover rounded-2xl shadow-2xl"
                loading="eager"
              />
            </div>
          </div>

          <div className="w-full md:w-7/12 text-center md:text-left animate-slide-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Mr. K Boopathi 
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-6 font-light">
            Development Officer, LIC of India
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mb-8 mx-auto md:mx-0"></div>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
              A Retired Air Force veteran and current Development Officer for LIC of India in Sulur, Coimbatore, combines the integrity of his military background with advanced analytical skills earned through MBA and LLB degrees. Specializing in building and leading high-performing teams, he is recognized for his professional ethics, resilience, and commitment to financial empowerment. He also holds an Associate designation from the III.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <a
                href="mailto:kboopathi1907@gmail.com"
                className="p-3 bg-white hover:bg-blue-50 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                aria-label="Email"
              >
                <Mail className="w-6 h-6 text-gray-700" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white hover:bg-blue-50 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6 text-gray-700" />
              </a>
              
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white hover:bg-blue-50 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6 text-gray-700" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <a
                    href="mailto:sarah.mitchell@example.com"
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    kboopathi@rediff.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Phone</p>
                  <a
                    href="tel:+1234567890"
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    +91 9741453384
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Location</p>
                  <p className="text-white">
                    Computer Science Department<br />
                    University Campus, Building A<br />
                    City, State 12345
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">Location</h3>
            <div className="rounded-xl overflow-hidden shadow-lg h-64 md:h-80">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=-122.4194%2C37.7749%2C-122.4094%2C37.7849&layer=mapnik"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Office location map"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Mr. K Boopathi . All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#hero" className="hover:text-blue-400 transition-colors">
                Home
              </a>
              <a href="#events" className="hover:text-blue-400 transition-colors">
                Events
              </a>
              <a href="#contact" className="hover:text-blue-400 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

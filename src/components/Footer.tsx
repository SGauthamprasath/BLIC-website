import { Mail, Phone, MapPin } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa'
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
                    k.boopathi9@licindia.com
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
                    href="tel:+919741453384"
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    +91 9741453384
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <FaWhatsapp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">WhatsApp</p>
                  <a
                    href="tel:+918860714533"
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    +91 8860714533
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
                    2, Railway Feeder Road, P.B.NO.6<br />
                    SULUR, Coimbatore<br />
                    Tamil Nadu 641402
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">Location</h3>
            <div className="rounded-xl overflow-hidden shadow-lg h-64 md:h-80">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d244.76096262434055!2d77.11957880823005!3d11.025463208548576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba855cc07b4dbd9%3A0xee50c2007cb75d32!2sLIC%20of%20India%2C%20Branch%20Office!5e0!3m2!1sen!2sin!4v1767732250050!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
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

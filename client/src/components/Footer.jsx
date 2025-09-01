import {
  FaFacebook,
  FaWhatsapp,
  FaTwitter,
  FaInstagram,
  FaGooglePlus,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const isStorePage = location.pathname === "/store";

  const headingStyle = "text-lg font-semibold uppercase mb-3 text-white";

  return (
    <footer
      className={`w-full ${
        isStorePage
          ? "bg-gray-900 text-gray-300 py-6 md:py-8"
          : "bg-gray-800 text-gray-300 py-8 md:py-10"
      } border-t border-gray-700`}
    >
      <div
        className={`max-w-7xl mx-auto grid gap-4 px-4 sm:px-6 lg:px-8 ${
          isStorePage
            ? "grid-cols-2 md:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {!isStorePage && (
          <>
            <div className="text-center md:text-left">
              <h3 className={headingStyle}>Quick Links</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-blue-400 transition-colors"
                  >
                    JBM Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/quality"
                    className="hover:text-blue-400 transition-colors"
                  >
                    JBM Quality Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h3 className={headingStyle}>Contact Us</h3>
              <p className="text-sm">123 JBM Street, City, Nigeria</p>
              <p className="text-sm">Phone: +234 800 123 4567</p>
              <p className="text-sm">Email: info@jbm.com</p>
            </div>
          </>
        )}

        <div className="text-center md:text-left">
          <h3 className={headingStyle}>Follow Us</h3>
          <div className="flex justify-center md:justify-start space-x-4 text-xl">
            <a
              href="#"
              className="hover:text-blue-500 transition-transform hover:scale-110"
            >
              <FaFacebook />
            </a>
            <a
              href="#"
              className="hover:text-green-500 transition-transform hover:scale-110"
            >
              <FaWhatsapp />
            </a>
            <a
              href="#"
              className="hover:text-blue-400 transition-transform hover:scale-110"
            >
              <FaTwitter />
            </a>
            <a
              href="#"
              className="hover:text-pink-500 transition-transform hover:scale-110"
            >
              <FaInstagram />
            </a>
            <a
              href="#"
              className="hover:text-red-500 transition-transform hover:scale-110"
            >
              <FaGooglePlus />
            </a>
          </div>
        </div>

        <div className="text-center md:text-left">
          <h3 className={headingStyle}>About Us</h3>
          <p className="text-sm leading-relaxed mb-3 max-w-sm">
            JBM is one of the best trading and repair companies. We also conduct
            IT training in programming, computer and gadget repairs.
          </p>
          <Link to="/about">
            <button className="bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded-md text-xs font-semibold text-white transition-colors">
              Learn More
            </button>
          </Link>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-700 pt-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} JBMTECH. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

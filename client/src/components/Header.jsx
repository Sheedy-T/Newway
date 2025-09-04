import { useState, useEffect, useRef } from "react";
import { FaBars } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api"; // ✅ Use your custom API client

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // ✅ Updated logic to check both storage options
  const user = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));
  const isLoggedIn = !!(localStorage.getItem("token") || sessionStorage.getItem("token"));
  
  const userFirstName = user?.fullName?.split(" ")[0] || "";

  const handleLogout = async () => {
    try {
      await API.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // ✅ Clear from both storage options to be safe
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      navigate("/signin");
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pageClass = location.pathname.replace("/", "") || "home";

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-purple-700/90 shadow-md ${pageClass}-header`}
    >
      <nav className="flex items-center justify-between px-4 md:px-6 h-[75px]">
        <p className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wide text-red-600">
          JBMTECH
        </p>

        <ul className="hidden md:flex items-center space-x-8 relative">
          <li>
            <Link
              to="/"
              className="text-black hover:text-white transition-colors duration-300"
            >
              HOME
            </Link>
          </li>
          <li>
            <Link
              to="/store"
              className="text-black hover:text-white transition-colors duration-300"
            >
              STORE
            </Link>
          </li>
          <li>
            <Link
              to="/training"
              className="text-black hover:text-white transition-colors duration-300"
            >
              IT TRAINING
            </Link>
          </li>

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition-colors duration-300"
              >
                {userFirstName} ▼
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-[999]">
                  <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Profile
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <li>
                <Link
                  to="/signin"
                  className="text-black hover:text-white transition-colors duration-300"
                >
                  SIGN IN
                </Link>
              </li>
              <li>
                <Link
                  to="/sign-up"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors duration-300"
                >
                  SIGN UP
                </Link>
              </li>
            </>
          )}
        </ul>

        <button
          className="md:hidden text-black text-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FaBars />
        </button>

        {isOpen && (
          <ul
            className="md:hidden flex flex-col items-center 
                        bg-purple-700 absolute top-[75px] left-0 
                        w-full py-6 space-y-6 text-lg font-medium 
                        z-[9999] shadow-lg"
          >
            <li>
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                HOME
              </Link>
            </li>
            <li>
              <Link
                to="/store"
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                STORE
              </Link>
            </li>
            <li>
              <Link
                to="/training"
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                IT TRAINING
              </Link>
            </li>

            {isLoggedIn ? (
              <li className="w-full text-center" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full text-white hover:text-gray-200"
                >
                  {userFirstName} ▼
                </button>
                {showDropdown && (
                  <div className="mt-2 bg-purple-600 rounded-md shadow-lg py-2 z-[9999] w-full">
                    <button className="block w-full text-white text-left px-4 py-2 hover:bg-purple-700">
                      Profile
                    </button>
                    <button className="block w-full text-white text-left px-4 py-2 hover:bg-purple-700">
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="block w-full text-white text-left px-4 py-2 hover:bg-purple-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <>
                <li>
                  <Link
                    to="/signin"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-gray-200"
                  >
                    SIGN IN
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sign-up"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-gray-200"
                  >
                    SIGN UP
                  </Link>
                </li>
              </>
            )}
          </ul>
        )}
      </nav>
    </header>
  );
};

export default Header;
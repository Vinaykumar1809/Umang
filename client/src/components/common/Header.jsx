import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/authContext';
import NotificationDropdown from './NotificationDropdown';
import { useSocket } from '../../../context/socketContext';
import { FaBell, FaUser, FaBars, FaTimes, FaMoon, FaSun } from 'react-icons/fa';
import axios from 'axios';
import api from '../../utils/api';


import UmangLogoLight from '../../assets/umang-logo-light.png';
import UmangLogoDark from '../../assets/umang-logo-dark.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

   const { socket } = useSocket();

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

   // Listen for real-time notification socket event
  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleNewNotification = (notification) => {
        // increment unread count by 1
        setUnreadCount(prev => prev + 1);
      };

      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket, isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      // Using axios and relative path — your dev proxy should forward this to the API
      const res = await api.get('/notifications/unread/count');
      setUnreadCount(res.data.count ?? 0);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // close dropdowns when clicking outside (simple window listener)
  useEffect(() => {
    const handleClickOutside = (e) => {
      // if clicked outside notification dropdown, close it
      const notifEl = document.getElementById('notification-dropdown-root');
      if (notifEl && !notifEl.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  //Select logo based on theme
  const currentLogo = isDarkMode ? UmangLogoDark : UmangLogoLight;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-300">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
          >
            {/* Logo Image - Responsive and Theme-aware */}
            <img
              src={currentLogo}
              alt="Umang Logo"
              className="h-12 sm:h-16 md:h-20 w-auto object-contain transition-all duration-300"
            />
          </Link>



          {/* Desktop Navigation (kept) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              Home
            </Link>
            <Link
              to="/blog"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              Posts
            </Link>
            <Link
              to="/announcements"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              Announcements
            </Link>
            <Link
              to="/about"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              About Us
            </Link>
            <Link
              to="/gallery"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              Gallery
            </Link>
          </div>

          {/* Right side: theme toggle, notifications, user menu (visible on all sizes) */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle - visible on all screens */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle theme"
              title={isDarkMode ? 'Switch to light' : 'Switch to dark'}
            >
              {isDarkMode ? (
                <FaSun className="text-yellow-400 text-xl" />
              ) : (
                <FaMoon className="text-gray-600 text-xl" />
              )}
            </button>

            {/* Notifications - visible on all screens */}
            {isAuthenticated && (
              <div className="relative" id="notification-dropdown-root">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(prev => !prev);
                    if (unreadCount > 0) setUnreadCount(0);
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <FaBell className="text-gray-600 dark:text-gray-300 text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown (positioned responsively) */}
                {showNotifications && (
                  // Box styled to sit nicely on mobile and desktop
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50">
                    <NotificationDropdown
                      onClose={() => setShowNotifications(false)}
                      onUpdateCount={setUnreadCount}
                    />
                  </div>
                )}
              </div>
            )}

            {/* User / Auth UI */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-gray-600 dark:text-gray-300" />
                  )}
                  <span className="hidden sm:inline text-gray-700 dark:text-gray-300">{user?.username}</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user?.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Role: {user?.role}</p>
                  </div>
                 
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Profile
                  </Link>
                  {(user?.role === 'MEMBER' || user?.role === 'ADMIN') && (
                    <>
                      <Link
                        to="/member"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Member Dashboard
                      </Link>
                      <Link
                        to="/member/create-post"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Create Post
                      </Link>
                    </>
                  )}
                  {user?.role === 'ADMIN' && (
                    <>
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Admin Panel
                      </Link>
                      <Link
                        to="/admin/create-announcement"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Create Announcement
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-gray-700 dark:text-gray-300 ml-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation (slide-down) */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 animate-slide-up">
            <Link
              to="/"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/blog"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={toggleMenu}
            >
              Posts
            </Link>
            <Link
              to="/announcements"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={toggleMenu}
            >
              Announcements
            </Link>
            <Link
              to="/about"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={toggleMenu}
            >
              About Us
            </Link>
             <Link
              to="/gallery"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={toggleMenu}
            >
             Gallery
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={toggleMenu}
                >
                  Profile
                </Link>

               

                {(user?.role === 'MEMBER' || user?.role === 'ADMIN') && (
                  <>
                    <Link
                      to="/member"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={toggleMenu}
                    >
                      Member Dashboard
                    </Link>
                    <Link
                      to="/member/create-post"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={toggleMenu}
                    >
                      Create Post
                    </Link>
                  </>
                )}

                {user?.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={toggleMenu}
                    >
                      Admin Panel
                    </Link>
                    <Link
                      to="/admin/create-announcement"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={toggleMenu}
                    >
                      Create Announcement
                    </Link>
                  </>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                  className="block w-full text-left py-2 text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700"
                  onClick={toggleMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

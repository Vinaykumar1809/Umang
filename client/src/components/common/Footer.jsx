import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaGithub,FaWhatsapp,FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">उमंग</h3>
            <p className="text-gray-400 text-sm">
              A comprehensive blogging platform for sharing knowledge, connecting, and staying updated with announcements.
            </p>
          </div>

          {/* Responsive Quick Links & Resources */}
          <div className="col-span-2 flex flex-col xs:flex-row sm:flex-row gap-8">
            {/* Quick Links */}
            <div className="flex-1 min-w-[135px]">
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog" className="text-gray-400 hover:text-white transition">
                    Posts
                  </Link>
                </li>
                <li>
                  <Link to="/announcements" className="text-gray-400 hover:text-white transition">
                    Announcements
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white transition">
                    About Us
                  </Link>
                </li>
                 <li>
                  <Link to="/gallery" className="text-gray-400 hover:text-white transition">
                    Gallery
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="flex-1 min-w-[135px]">
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                
                <li>
                  <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="text-gray-400 hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="https://mail.google.com/mail/?view=cm&fs=1&to=umang.official.nitw@gmail.com"  title="Contact Us" className="text-gray-400 hover:text-white transition">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              
              <a
                href="https://www.instagram.com/umang.ldc_nitw/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
                aria-label="Instagram"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={24} />
              </a>

              {/* <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=team.codemate@gmail.com" 
                title="Contact Us"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
                aria-label="Email"
              >
                <FaEnvelope size={24} />
              </a> */}
             
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} उमंग. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
  Developed with ♥ by{" "}
  <a
    target="_blank"
    href="https://www.linkedin.com/in/vinay-kumar-231b4a283"
    className="text-blue-400 underline hover:text-blue-500"
  >
    Vinay
  </a>
</p>

<p  className="text-gray-400 text-sm">
  Maintained by Tech Team,{" "}
  <a
    target="_blank"
    href="/"
    className="text-blue-400 underline hover:text-blue-500"
  >
  Literary & Debating Club (Hindi),NITW
  </a>
</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

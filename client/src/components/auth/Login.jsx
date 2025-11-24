import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/authContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [emailStatus, setEmailStatus] = useState(null);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Dynamic email format and availability validation
  useEffect(() => {
    if (!formData.email) {
      setEmailStatus(null);
      setErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailStatus('invalid');
      setErrors(prev => ({ ...prev, email: 'Email is invalid' }));
      return;
    } else {
      const checkEmail = async () => {
        setCheckingEmail(true);
        try {
          const response = await api.get(`/users/check/email?email=${encodeURIComponent(formData.email)}`);
          if (response.data.available === false) {
            setEmailStatus('valid');
            setErrors(prev => {
              const { email, ...rest } = prev;
              return rest;
            });
          } else {
            setEmailStatus('taken');
            setErrors(prev => ({ ...prev, email: 'Email not registered' }));
          }
        } catch {
          setEmailStatus('invalid');
          setErrors(prev => ({ ...prev, email: 'Error checking email' }));
        } finally {
          setCheckingEmail(false);
        }
      };
      checkEmail();
    }
  }, [formData.email]);

  // Dynamic password length validation
  useEffect(() => {
    if (!formData.password) {
      setPasswordStatus(null);
      setErrors(prev => {
        const { password, ...rest } = prev;
        return rest;
      });
      return;
    }

    if (formData.password.length < 6) {
      setPasswordStatus('invalid');
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
    } else {
      setPasswordStatus('valid');
      setErrors(prev => {
        const { password, ...rest } = prev;
        return rest;
      });
    }
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0 && emailStatus === 'valid' && passwordStatus === 'valid';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Show specific toast for missing or invalid inputs instead of generic
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    if (emailStatus !== 'valid') {
      toast.error(errors.email || 'Please enter a valid email');
      return;
    }
    if (!formData.password) {
      toast.error('Password is required');
      return;
    }
    if (passwordStatus !== 'valid') {
      toast.error(errors.password || 'Password must be at least 6 characters');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors above');
      return;
    }

    try {
      const result = await login(formData);
      if (result.success) {
        toast.success('Login successful! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        const message = (result.message || '').toLowerCase();
        if (message.includes('password')) {
          setErrors(prev => ({ ...prev, password: 'Incorrect password' }));
          toast.error('Incorrect password');
        } else if (message.includes('email')) {
          setErrors(prev => ({ ...prev, email: 'Email not found' }));
          toast.error('Email not found');
        } else {
          toast.error(result.message || 'Login failed');
        }
      }
    } catch (error) {
      toast.error('An error occurred during login');
    }
  };

  // Disable sign in button if email or password is invalid or loading
  const isSignInDisabled = loading || emailStatus !== 'valid' || passwordStatus !== 'valid';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                  errors.email ? 'border-red-500' : emailStatus === 'valid' ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
                placeholder="you@example.com"
              />
            </div>
            {checkingEmail && <p className="mt-1 text-sm text-gray-500">Checking email...</p>}
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                  errors.password ? 'border-red-500' : passwordStatus === 'valid' ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>
          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot password?
              </Link>
            </div>
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

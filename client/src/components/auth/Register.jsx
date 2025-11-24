import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/authContext';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dynamic validation states
  const [usernameStatus, setUsernameStatus] = useState(null); // 'valid', 'invalid', 'taken', null
  const [emailStatus, setEmailStatus] = useState(null);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Real-time username validation & availability
  useEffect(() => {
    if (formData.username.length === 0) {
      setUsernameStatus(null);
      return;
    }

    if (formData.username.length < 4) {
      setUsernameStatus('invalid');
      return;
    }

    if (!/^[a-zA-Z0-9@$_-]+$/.test(formData.username)) {
      setUsernameStatus('invalid');
      return;
    }

    const checkUsername = async () => {
      setCheckingUsername(true);
      try {
        const response = await api.get(`/users/check/username?username=${formData.username}`);
        setUsernameStatus(response.data.available ? 'valid' : 'taken');
      } catch {
        setUsernameStatus('invalid');
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  // Real-time email validation & availability
  useEffect(() => {
    if (formData.email.length === 0) {
      setEmailStatus(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailStatus('invalid');
      return;
    }

    const checkEmail = async () => {
      setCheckingEmail(true);
      try {
        const response = await api.get(`/users/check/email?email=${formData.email}`);
        setEmailStatus(response.data.available ? 'valid' : 'taken');
      } catch {
        setEmailStatus('invalid');
      } finally {
        setCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [formData.email]);

  // Real-time password requirement check
  useEffect(() => {
    if (formData.password.length === 0) {
      setPasswordStatus(null);
      return;
    }

    const requirements = {
      minLength: formData.password.length >= 6,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasLowerCase: /[a-z]/.test(formData.password),
      hasNumber: /[0-9]/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password),
    };

    setPasswordRequirements(requirements);

    const allMet = Object.values(requirements).every(Boolean);
    setPasswordStatus(allMet ? 'valid' : 'invalid');
  }, [formData.password]);

  // Dynamic confirmPassword validation
  useEffect(() => {
    if (formData.confirmPassword.length === 0) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (usernameStatus !== 'valid') {
      newErrors.username = usernameStatus === 'taken' ? 'Username already taken' : 'Invalid username';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (emailStatus !== 'valid') {
      newErrors.email = emailStatus === 'taken' ? 'Email already registered' : 'Invalid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordStatus !== 'valid') {
      newErrors.password = 'Password does not meet requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.termsAccepted) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors above');
      return;
    }

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    if (result.success) {
      toast.success('Registration successful! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } else {
      toast.error(result.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                  usernameStatus === 'valid'
                    ? 'border-green-500'
                    : usernameStatus === 'invalid' || usernameStatus === 'taken'
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
              />
            </div>
            {usernameStatus === 'taken' && (
              <p className="mt-1 text-sm text-red-600">Username already taken</p>
            )}
            {usernameStatus === 'invalid' && formData.username && (
              <p className="mt-1 text-sm text-red-600">Username must be 4+ characters and contain only letters, numbers, @, $, _, or -</p>
            )}
            {usernameStatus === 'valid' && (
              <p className="mt-1 text-sm text-green-600">✓ Username available</p>
            )}
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

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
                placeholder="you@example.com"
                className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                  emailStatus === 'valid'
                    ? 'border-green-500'
                    : emailStatus === 'invalid' || emailStatus === 'taken'
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
              />
            </div>
            {emailStatus === 'taken' && (
              <p className="mt-1 text-sm text-red-600">Email already registered</p>
            )}
            {emailStatus === 'invalid' && formData.email && (
              <p className="mt-1 text-sm text-red-600">Invalid email format</p>
            )}
            {emailStatus === 'valid' && (
              <p className="mt-1 text-sm text-green-600">✓ Email available</p>
            )}
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                  passwordStatus === 'valid'
                    ? 'border-green-500'
                    : passwordStatus === 'invalid' && formData.password
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
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

            {/* Password Requirements Checklist */}
            {formData.password && (
              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.minLength ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                    At least 6 characters
                  </div>
                  <div className={`flex items-center ${passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.hasUpperCase ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                    At least one uppercase letter (A-Z)
                  </div>
                  <div className={`flex items-center ${passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.hasLowerCase ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                    At least one lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.hasNumber ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                    At least one number (0-9)
                  </div>
                  <div className={`flex items-center ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordRequirements.hasSpecialChar ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                    At least one special character (!@#$%^&* etc)
                  </div>
                </div>
              </div>
            )}
            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              onChange={(e) =>
                setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))
              }
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              I agree to the{' '}
              <Link to="/terms-of-service" className="text-primary-600 hover:text-primary-500">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && <p className="mt-1 text-sm text-red-600">{errors.terms}</p>}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={
                loading ||
                usernameStatus !== 'valid' ||
                emailStatus !== 'valid' ||
                passwordStatus !== 'valid' ||
                formData.password !== formData.confirmPassword ||
                !formData.termsAccepted
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

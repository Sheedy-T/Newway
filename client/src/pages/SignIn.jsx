import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
//import axios from 'axios';
import API from "../api";

const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/';

  useEffect(() => {
    if (location.state?.message) {
      setAuthError(location.state.message);
    }
    if (location.state?.registeredEmail) {
      setFormData(prev => ({ ...prev, email: location.state.registeredEmail }));
    }
  }, [location.state]);

  const validateForm = () => {
    const newErrors = {};
    const { email, password } = formData;

    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setErrors({});

    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await API.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        },
        {
          withCredentials: true, 
        }
      );

      if (response.data.success) {
        if (rememberMe) {
        
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem('rememberMe', 'true');
        
      } else {
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
     }
      navigate('/');
      } else {
        setAuthError(response.data.error || "Authentication failed");
      }
    
    } catch (error) {
      setAuthError('Login failed. ' + (error.response?.data?.error || 'Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <div className="signin-left">
          <h1>Welcome to JBM TECH SERVICES</h1>
          <p>Learn Core I.T Skills with our expert training programs</p>
        </div>

        <div className="signin-right">
          <div className="signin-card">
            <h2>Sign In</h2>
            <p>Access your account to continue</p>
            {authError && <div className="auth-message error">{authError}</div>}

            <form onSubmit={handleSubmit} className="signin-form" noValidate>
              <div className={`form-group ${errors.email ? 'error' : ''}`}>
                <label>Email Address</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className={`form-group ${errors.password ? 'error' : ''}`}>
                <label>Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <button type="submit" disabled={isLoading} className="signin-button">
                {isLoading ? <><FaSpinner className="spinner-icon" /> Signing In...</> : 'Sign In'}
              </button>

              <div className="signup-link">
                Don't have an account? <Link to="/sign-up">Sign up</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    userType: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Valid phone number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailBlur = async () => {
    if (formData.email && !errors.email) {
      const normalizedEmail = formData.email.toLowerCase().trim();
      try {
        const response = await axios.get(`${API_BASE_URL}/check-email?email=${encodeURIComponent(normalizedEmail)}`);
        if (response.data.exists) {
          setErrors(prev => ({ ...prev, email: 'Email already registered' }));
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setErrors(prev => ({ ...prev, email: 'Error checking email availability' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        fullName: formData.fullName,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        phone: formData.phone,
        userType: formData.userType
      });

      if (response.data.success) {
        navigate('/verify-otp', {
          state: {
            email:response.data.email,
            
            fullName: formData.fullName,
            password: formData.password,
            phone: formData.phone,
            userType: formData.userType,

            message: 'Registration successful! Please sign in.'
          }
        });
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ server: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-left">
          <div className="welcome-message">
            <h1>Join JBM TECH SERVICES</h1>
            <p>Start your journey in tech with our expert training programs</p>
          </div>
        </div>

        <div className="signup-right">
          <div className="signup-card">
            <h2>Create Account</h2>
            <p>Fill in your details to get started</p>

            {errors.server && <div className="error-message-server">{errors.server}</div>}

            <form onSubmit={handleSubmit} className="signup-form">
              <div className={`form-group ${errors.fullName ? 'error' : ''}`}>
                <label>Full Name</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className={`form-group ${errors.email ? 'error' : ''}`}>
                <label>Email Address</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleEmailBlur}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                <label>Phone Number</label>
                <PhoneInput
                  defaultCountry="NG"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className={`form-group ${errors.password ? 'error' : ''}`}>
                <label>Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a password (min 8 chars)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group">
                <label>I am a</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="userType"
                      value="student"
                      checked={formData.userType === 'student'}
                      onChange={handleChange}
                    />
                    Student
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="userType"
                      value="professional"
                      checked={formData.userType === 'professional'}
                      onChange={handleChange}
                    />
                    Professional
                  </label>
                  <label>
  <input
    type="radio"
    name="userType"
    value="admin" 
    checked={formData.userType === 'admin'}
    onChange={handleChange}
               />
               Admin
              </label>
                </div>
              </div>

              <button
                type="submit"
                className="signup-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="login-link">
                Already have an account? <Link to="/signin">Sign in</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

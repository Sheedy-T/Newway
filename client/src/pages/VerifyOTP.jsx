import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
//import './VerifyOTP.css'; // Import CSS file

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { email, fullName, password, phone, userType } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/verify-otp', {
        email,
        otp,
        fullName,
        password,
        phone,
        userType
      });
      navigate('/signin');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    }
  };

  return (
    <div className="otp-container">
      <form onSubmit={handleSubmit} className="otp-form">
        <h2>Verify Your Email ✉️</h2>
        <p className="subtitle">
          Enter the OTP sent to <strong>{email}</strong>
        </p>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="otp-input"
          maxLength={6}
        />
        <button type="submit" className="verify-btn">
          Verify 
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default VerifyOTP;

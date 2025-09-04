import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api"; // ✅ import your axios instance

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { email, fullName, password, phone, userType } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/api/auth/verify-otp", {
        email,
        otp,
        fullName,
        password,
        phone,
        userType,
      });

      // ✅ If server returns token on verification
      if (res.data?.token) {
        sessionStorage.setItem("token", res.data.token);
      }

      toast.success("OTP verified successfully!");
      navigate("/signin");
    } catch (err) {
      console.error("OTP verify error:", err);
      setError(err.response?.data?.error || "OTP verification failed");
      toast.error(err.response?.data?.error || "OTP verification failed");
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

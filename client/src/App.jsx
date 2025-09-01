import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BackgroundAnimation from './components/BackgroundAnimation';
import Store from './pages/Store';
import PaymentPage from './pages/PaymentPage';
import Training from './pages/Training';
import SignIn from './pages/SignIn';
import Header from './components/Header';
import Footer from './components/Footer';
import SignUp from './pages/SignUp';
import VerifyOTP from './pages/VerifyOTP';  // ✅ OTP Verification Page
import ProductUploadForm from './pages/ProductUploadForm';
import OrderSuccess from "./pages/OrderSuccess";
import CourseUploadForm from './pages/CourseUploadForm';
import LiveRoom from './pages/LiveRoom'
function App() {
  return (
    
      <BackgroundAnimation>
        <div className="app">
          <Header />
          <main className='content-over'>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<ProductUploadForm />} />
              <Route path="/store" element={<Store />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/training" element={<Training />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/upload-course" element={<CourseUploadForm />} />
              <Route path="/live/:roomId" element={<LiveRoom />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BackgroundAnimation>
    
  );
}

export default App;

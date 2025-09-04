import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api"; // ✅ use axios instance

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const reference = searchParams.get("reference");

  useEffect(() => {
    const checkAuthAndVerifyPayment = async () => {
      try {
        // ✅ check auth with token
        await api.get("/api/profile");

        if (!reference) {
          toast.error("Missing transaction reference.");
          setLoading(false);
          return;
        }

        // ✅ verify payment with token
        const res = await api.get(`/api/paystack/verify/${reference}`);

        setOrder(res.data.order);
        localStorage.removeItem("cart");
      } catch (err) {
        console.error("Verify payment error:", err);

        if (err.response?.status === 401) {
          toast.error("You must be logged in.");
          navigate("/signin");
          return;
        }

        toast.error(
          err.response?.data?.message || "Payment verification failed."
        );
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndVerifyPayment();
  }, [reference, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Verifying payment...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          Payment Successful!
        </h1>
        {order ? (
          <>
            <p className="mb-2">
              Order ID: <strong>{order._id}</strong>
            </p>
            <p className="mb-4">
              Total Paid: <strong>${order.totalAmount.toFixed(2)}</strong>
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => navigate("/store")}
            >
              Continue Shopping
            </button>
          </>
        ) : (
          <p className="text-red-500">Order not found.</p>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;

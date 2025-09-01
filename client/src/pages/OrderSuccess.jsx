import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const reference = searchParams.get("reference");

  useEffect(() => {
    const checkAuthAndVerifyPayment = async () => {
      try {
        
        const authRes = await fetch(`${API_BASE_URL}/api/profile`, {
          credentials: "include",
        });

        if (!authRes.ok) {
          if (authRes.status === 401) {
            toast.error("You must be logged in.");
            navigate("/signin");
            return;
          }
          throw new Error("Authentication check failed.");
        }

        
        if (!reference) {
          toast.error("Missing transaction reference.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/paystack/verify/${reference}`, {
          credentials: "include",
        });

        const data = await res.json();
        if (res.ok) {
          setOrder(data.order);
          localStorage.removeItem("cart");
        } else {
          toast.error(data.message || "Payment verification failed.");
        }
      } catch (err) {
        console.error("Verify payment error:", err);
        toast.error("Network error verifying payment.");
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
        <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful!</h1>
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

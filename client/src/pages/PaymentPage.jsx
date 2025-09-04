import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api"; // ✅ central axios instance

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [shippingAddress, setShippingAddress] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryAndBankChargeFee, setDeliveryAndBankChargeFee] = useState(50);
  const [totalPrice, setTotalPrice] = useState(0);

  const [cartType, setCartType] = useState("product");

  useEffect(() => {
    // ✅ Load cart from state or localStorage
    const stateCart =
      location.state?.cart || JSON.parse(localStorage.getItem("cart")) || [];
    const stateType = location.state?.type || "product";
    setCartItems(stateCart);
    setCartType(stateType);

    const fee = stateType === "product" ? 50 : 0;
    setDeliveryAndBankChargeFee(fee);

    const calculatedSubtotal = stateCart.reduce(
      (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0),
      0
    );
    setSubtotal(calculatedSubtotal);
    setTotalPrice(calculatedSubtotal + fee);

    // ✅ Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const res = await API.get("/api/profile");
        const userData = res.data;

        setFullName(userData.fullName || userData.name || "");
        setEmail(userData.email || "");
        setPhoneNumber(userData.phone || "");
        setShippingAddress(userData.address || "");
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Please sign in to proceed.");
        navigate("/signin");
      }
    };

    fetchUserProfile();
  }, [location.state, navigate]);

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleCardPayment = async () => {
    setLoading(true);

    if (cartType === "product" && !shippingAddress.trim()) {
      toast.error("Please enter your shipping address.");
      setLoading(false);
      return;
    }

    try {
      const isProductOrder = cartType === "product";
      const backendEndpoint = isProductOrder
        ? "/api/orders"
        : "/api/bookings";

      const payload = {
        fullName,
        email,
        phoneNumber,
        shippingAddress: isProductOrder ? shippingAddress : "",
        items: cartItems.map((item) => ({
          [isProductOrder ? "productId" : "itemId"]: item.product?._id,
          name: item.product?.name,
          price: item.product?.price,
          quantity: item.quantity,
        })),
        subtotal,
        deliveryAndBankChargeFee,
        totalAmount: totalPrice,
        paymentMethod: "card",
        ...(!isProductOrder && { bookingType: cartType }),
      };

      // ✅ Step 1: Create order/booking record
      const res = await API.post(backendEndpoint, payload);
      const data = res.data;
      const recordId = isProductOrder ? data.order?._id : data.booking?._id;
      if (!recordId) throw new Error("Failed to create order/booking record.");

      // ✅ Step 2: Initialize Paystack
      const paystackRes = await API.post("/api/paystack/initialize", {
        amount: totalPrice,
        email,
        orderId: recordId,
        type: cartType,
      });

      const paystackData = paystackRes.data;
      if (!paystackData.authorization_url)
        throw new Error("Paystack initialization failed.");

      // ✅ Redirect user to Paystack payment page
      window.location.href = paystackData.authorization_url;
    } catch (err) {
      console.error("Payment processing error:", err);
      toast.error(err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalPrice === 0) {
      toast.error("Cart is empty. Please add items.");
      return;
    }
    if (paymentMethod === "card") {
      handleCardPayment();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">
          {cartType === "product"
            ? "Product Checkout"
            : "Course Booking Checkout"}
        </h2>

        {/* Customer Info */}
        <div className="mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">
            Customer Information
          </h3>
          <p><strong>Name:</strong> {fullName}</p>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Phone:</strong> {phoneNumber}</p>

          {cartType === "product" && (
            <div className="mt-4">
              <label
                htmlFor="shippingAddress"
                className="block text-sm font-bold mb-2"
              >
                Shipping Address:
              </label>
              <textarea
                id="shippingAddress"
                name="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your full shipping address"
                rows="3"
                className="shadow border rounded w-full py-2 px-3"
                required
              ></textarea>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">
            {cartType === "product" ? "Order Summary" : "Course Summary"}
          </h3>
          <ul className="space-y-2 mb-4">
            {cartItems.map((item, index) => (
              <li key={index} className="flex justify-between text-gray-700">
                <span>
                  {item.product?.name}{" "}
                  {item.product?.mode
                    ? `(${item.product.mode})`
                    : item.product?.size
                    ? `(${item.product.size})`
                    : ""}{" "}
                  x {item.quantity}
                </span>
                <span>
                  $
                  {(
                    (item.product?.price || 0) * (item.quantity || 0)
                  ).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {cartType === "product" && (
            <div className="flex justify-between">
              <span>Delivery & Fee:</span>
              <span>${deliveryAndBankChargeFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-green-700 mt-2">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Select Payment Method
            </h3>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={handlePaymentMethodChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">
                Pay with Card (Paystack)
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
            disabled={loading || totalPrice === 0}
          >
            {loading ? "Processing..." : `Pay $${totalPrice.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProductUploadForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    size: "",
    description: "",
    image: null,
    isFeatured: false,
    isPromoted: false,
    promoExpiresAt: "",
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  // Admin check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    if (!token) {
      alert("⛔ Please login first");
      navigate("/signin");
      return;
    }

    let user = null;
    try {
      user = JSON.parse(userRaw);
    } catch (err) {
      console.error("Error parsing user:", err);
    }

    if (!user || user.role !== "admin") {
      alert("⛔ Admin access required.");
      navigate("/signin");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    }));
  };

  // Upload to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
          setMessage(`Uploading image... ${percent}%`);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.secure_url);
        } else {
          reject(new Error("Cloudinary upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgress(0);
    setMessage("");

    try {
      
      let imageUrl = "";
      if (form.image) {
        imageUrl = await uploadToCloudinary(form.image);
      }

      
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          price: form.price,
          size: form.size,
          description: form.description,
          imageUrl,
          isFeatured: form.isFeatured,
          isPromoted: form.isPromoted,
          promoExpiresAt: form.isPromoted ? form.promoExpiresAt : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Product uploaded successfully!");
        setForm({
          name: "",
          category: "",
          price: "",
          size: "",
          description: "",
          image: null,
          isFeatured: false,
          isPromoted: false,
          promoExpiresAt: "",
        });
        e.target.reset();
      } else {
        setMessage(`❌ Upload failed: ${data.message || "Server error"}`);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-upload-page flex flex-col md:flex-row bg-gray-50 min-h-screen">
      
      <div className="product-upload-left flex-1 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-10 text-white">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-4">Add New Product</h1>
          <p className="text-lg opacity-90">
            Showcase your latest offerings to the world! Upload product details,
            mark it as featured or promoted, and manage your store easily.
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="product-upload-right flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Upload Product Details
          </h2>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.startsWith("✅")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Product Name"
              required
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Category"
              required
              className="w-full border p-3 rounded"
            />
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Price"
              required
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="size"
              value={form.size}
              onChange={handleChange}
              placeholder="Size (optional)"
              className="w-full border p-3 rounded"
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              rows="3"
              className="w-full border p-3 rounded"
            />

            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              required
              className="w-full"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
              />
              Featured on Homepage
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPromoted"
                checked={form.isPromoted}
                onChange={handleChange}
              />
              Add to Promo Section
            </label>

            {form.isPromoted && (
              <input
                type="date"
                name="promoExpiresAt"
                value={form.promoExpiresAt}
                onChange={handleChange}
                required
                className="w-full border p-3 rounded"
              />
            )}

            {loading && (
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-indigo-600 h-3 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 transition"
            >
              {loading ? "Uploading..." : "Upload Product"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductUploadForm;

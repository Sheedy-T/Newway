import React, { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CourseUploadForm = () => {
  const [form, setForm] = useState({
    name: "",
    type: [{ mode: "Online", price: "" }],
    description: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (index, field, value) => {
    const updatedTypes = [...form.type];
    updatedTypes[index][field] = value;
    setForm({ ...form, type: updatedTypes });
  };

  const handleAddType = () => {
    setForm({ ...form, type: [...form.type, { mode: "Online", price: "" }] });
  };

  const handleRemoveType = (index) => {
    setForm({ ...form, type: form.type.filter((_, i) => i !== index) });
  };

  const handleImageChange = (e) => {
    setForm({ ...form, image: e.target.files[0] });
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
          setMessage(`Uploading image... ${percent}%`);
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const res = JSON.parse(xhr.responseText);
            resolve(res.secure_url);
          } else {
            reject(new Error("Image upload failed"));
          }
        }
      };

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
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
      const res = await fetch(`${API_BASE_URL}/api/courses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          type: form.type,
          imageUrl,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Course uploaded successfully!");
        setForm({
          name: "",
          type: [{ mode: "Online", price: "" }],
          description: "",
          image: null,
        });
        setProgress(0);
        e.target.reset();
      } else {
        setMessage(`❌ Failed: ${data.message || "Server error"}`);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">
        Upload New Course
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

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div>
          <label className="block font-medium mb-1">Course Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        
        <div>
          <label className="block font-medium mb-2">Training Options</label>
          {form.type.map((type, index) => (
            <div key={index} className="flex items-center gap-4 mb-3">
              <select
                value={type.mode}
                onChange={(e) =>
                  handleTypeChange(index, "mode", e.target.value)
                }
                className="border p-2 rounded w-1/2"
                required
              >
                <option value="Online">Online</option>
                <option value="Physical">Physical</option>
              </select>
              <input
                type="number"
                placeholder="₦ Price"
                value={type.price}
                onChange={(e) =>
                  handleTypeChange(index, "price", e.target.value)
                }
                className="border p-2 rounded w-1/3"
                required
              />
              {form.type.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveType(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddType}
            className="text-blue-600 hover:underline text-sm mt-2"
          >
            + Add Another Type
          </button>
        </div>

        
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className="w-full border p-2 rounded"
          />
        </div>

        
        <div>
          <label className="block font-medium mb-1">Course Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        
        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

  
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Course"}
        </button>
      </form>
    </div>
  );
};

export default CourseUploadForm;

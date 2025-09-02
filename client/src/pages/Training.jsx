import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ProgrammingCourses from '../components/ProgrammingCourses';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Training = () => {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [cart, setCart] = useState([]);
  const [dropdowns, setDropdowns] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/courses`);
        setAvailableCourses(response.data || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    };
    fetchCourses();
  }, []);

  const handleAddToCart = (course, modeObj) => {
    const itemKey = `${course._id}-${modeObj.mode}`;
    if (!cart.some((item) => item.key === itemKey)) {
      setCart([...cart, { ...course, ...modeObj, key: itemKey }]);
    }
  };

  const handleRemoveFromCart = (key) => {
    setCart(cart.filter((course) => course.key !== key));
  };

  const totalPrice = cart.reduce((sum, course) => sum + (course.price || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-800">

      {/* SLIDESHOW BOXES */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Physical Box */}
        <div className="rounded-xl shadow-md overflow-hidden bg-white">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000 }}
            loop
            className="w-full h-40 sm:h-56 lg:h-72"
          >
            <SwiperSlide>
              <img
                src="/images/slidepic2.png"
                alt="Physical 1"
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
            <SwiperSlide>
              <img
                src="/images/slidepic5.png"
                alt="Physical 2"
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
            <SwiperSlide>
              <img
                src="/images/slidepic4.png"
                alt="Physical 3"
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
          </Swiper>
          <div className="p-4">
            <h2 className="text-xl font-semibold text-indigo-700 mb-2">Physical Classes</h2>
            <p className="text-gray-600 text-sm">
              One can choose to attend physical classes if they live close to our offices or
              branch locations. This option allows face-to-face learning with our instructors.
            </p>
          </div>
        </div>

        {/* Online Box */}
        <div className="rounded-xl shadow-md overflow-hidden bg-white">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000 }}
            loop
            className="w-full h-40 sm:h-56 lg:h-72"
          >
            <SwiperSlide>
              <img
                src="/images/slidepic3.png"
                alt="Online 1"
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
            <SwiperSlide>
              <img
                src="/images/slidepic1.png"
                alt="Online 2"
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
            <SwiperSlide>
              <img
                src="/images/slidepic6.png"
                alt="Online 3"
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
          </Swiper>
          <div className="p-4">
            <h2 className="text-xl font-semibold text-indigo-700 mb-2">Online Classes</h2>
            <p className="text-gray-600 text-sm">
              Online classes are conducted virtually and can be joined from anywhere in the
              world. Flexible and convenient, you can learn at your own pace and location.
            </p>
          </div>
        </div>
      </div>

      {/* Programming Courses Section */}
      <ProgrammingCourses wide compactMargin />

      {/* Courses Section */}
      <h1 className="text-4xl font-bold mb-10 text-center text-indigo-800 mt-5">
        Available Courses
      </h1>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
        {availableCourses.map((course) => (
          <div
            key={course._id || course.id}
            className="rounded-xl overflow-hidden shadow-md bg-blue-800 group hover:shadow-xl transition duration-300"
          >
            <div className="relative h-48">
              <img
                src={course.imageUrl}
                alt={course.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{course.name}</span>
              </div>
            </div>
            <div className="p-4 relative">
              <p className="text-sm text-gray-200 mb-2">{course.description}</p>
              <div>
                <button
                  onClick={() => {
                    const idKey = course._id || course.id;
                    setDropdowns((prev) => ({
                      ...prev,
                      [idKey]: !prev[idKey],
                    }));
                  }}
                  className="flex items-center justify-between w-full border p-2 rounded mb-2 text-left hover:bg-gray-50 bg-white"
                >
                  <span>Type & Options</span>
                  <ChevronDown size={18} />
                </button>
                {dropdowns[course._id || course.id] && (
                  <div className="z-10 w-full bg-white border rounded shadow-md">
                    {Array.isArray(course.type) &&
                      course.type.map((modeObj, idx) => (
                        <button
                          key={`${course._id || course.id}-${idx}`}
                          onClick={() => handleAddToCart(course, modeObj)}
                          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                        >
                          {modeObj.mode} - ₦
                          {typeof modeObj.price === 'number'
                            ? modeObj.price.toLocaleString()
                            : 'N/A'}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Section */}
      <div className="mt-16 border-t pt-6">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">
          Cart Summary
        </h2>
        {cart.length === 0 ? (
          <p className="text-gray-600">No courses added yet.</p>
        ) : (
          <>
            <ul className="mb-4 divide-y">
              {cart.map((item) => (
                <li key={item.key} className="flex justify-between items-center py-3">
                  <span>
                    {item.name} -{' '}
                    <span className="text-sm text-gray-600">
                      ({item.mode})
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-medium">
                      ₦
                      {typeof item.price === 'number'
                        ? item.price.toLocaleString()
                        : 'N/A'}
                    </span>
                    <button
                      onClick={() => handleRemoveFromCart(item.key)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="font-semibold text-lg mb-4">
              Total: ₦{totalPrice.toLocaleString()}
            </p>
            <button
              onClick={() =>
                navigate("/payment", {
                  state: {
                    cart: cart.map(item => ({
                      product: {
                        _id: item._id || item.id,
                        name: item.name,
                        price: item.price
                      },
                      quantity: 1
                    })),
                    type: "course"
                  }
                })
              }
              className="inline-block bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
            >
              Proceed to Payment
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Training;

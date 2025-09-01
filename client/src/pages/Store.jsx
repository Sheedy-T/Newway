
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";


const hiddenProducts = [
  { id: 101, name: "MacBook M3 Pro", size: "large", category: "Laptops", price: 2600, description: "Powerful M3 Pro MacBook for creators.", image: "/images/macbook_m3_pro.jpg", isFeatured: false, isPromoted: false, promoExpiresAt: null },
  { id: 102, name: "Samsung S25 Ultra", size: "medium", category: "Phones", price: 1100, description: "Next-gen Samsung flagship smartphone.", image: "/images/samsung_s25_ultra.jpg", isFeatured: false, isPromoted: false, promoExpiresAt: null },
  { id: 103, name: "Beats Studio Buds+", size: "small", category: "Earbuds/Airpods", price: 249, description: "Studio Buds+ with spatial audio.", image: "/images/beats_studio_buds.jpg", isFeatured: false, isPromoted: false, promoExpiresAt: null },
  { id: 104, name: "Dell XPS 15", size: "large", category: "Laptops", price: 1800, description: "High-performance Dell laptop.", image: "/images/dell_xps.jpg", isFeatured: false, isPromoted: false, promoExpiresAt: null },
  { id: 105, name: "Google Pixel 9", size: "medium", category: "Phones", price: 899, description: "Latest Pixel phone with AI features.", image: "/images/google_pixel_9.jpg", isFeatured: false, isPromoted: false, promoExpiresAt: null },
  { id: 106, name: "AirPods Pro 3", size: "small", category: "Earbuds/Airpods", price: 279, description: "Advanced noise cancellation.", image: "/images/airpods_pro_3.jpg", isFeatured: false, isPromoted: false, promoExpiresAt: null },
  { id: 107, name: "HP Spectre x360", size: "large", category: "Laptops", price: 1500, description: "Versatile 2-in-1 laptop.", image: "/images/hp_spectre.jpg", isFeatured: false, isPromoted: false, promoExpiresAt: null },
];
const slides = [
  { id: 1, image: "/public/images/yoyo1.png", alt: "Mega Discount on Power Banks!" },
  { id: 2, image: "/public/images/yoyo2.png", alt: "Get Latest Phones at Great Prices!" },
  { id: 3, image: "/public/images/yoyo3.png", alt: "Work Smarter with Laptop Workstations!" },
];

const Store = () => {
  
  const [cart, setCart] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [products, setProducts] = useState([]);
  const [showPromoGrid, setShowPromoGrid] = useState(false);

  const categories = ["Laptops", "Phones", "Accessories", "iWatch", "Earbuds/Airpods"];
  const navigate = useNavigate();

  const allProducts = [...products, ...hiddenProducts];

  
  const keyOf = (p) => p?._id || p?.id;
  const imgOf = (p) => p?.image || p?.imageUrl || "/images/placeholder.jpg";

  
  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart"));
      if (storedCart) setCart(storedCart);
    } catch (error) {
      console.error("Failed to parse cart from localStorage:", error);
      
    }
  }, []);

  
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
    
  }, [cart]);

  
  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    loadProducts();
    
    const onVisible = () => document.visibilityState === "visible" && loadProducts();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []); 

 
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

 
  const addToCart = (productToAdd) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => keyOf(item.product) === keyOf(productToAdd)
      );

      if (existingItemIndex !== -1) {
        
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += 1;
        toast.info(
          `Increased quantity of ${productToAdd.name} to ${updatedCart[existingItemIndex].quantity}`
        );
        return updatedCart;
      } else {
      
        toast.success(`${productToAdd.name} added to cart!`);
        return [...prevCart, { product: productToAdd, quantity: 1 }];
      }
    });
  };

  
  const incrementQuantity = (productId) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        keyOf(item.product) === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  
  const decrementQuantity = (productId) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          keyOf(item.product) === productId
            ? { ...item, quantity: Math.max(1, item.quantity - 1) } 
            : item
        )
        .filter((item) => item.quantity > 0) 
    );
  };

 
  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => keyOf(item.product) !== productId)
    );
    toast.error("Item removed from cart!");
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setSelectedCategory("ALL");
  };

  const randomColor = () => {
    const colors = ["#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D", "#845EC2", "#00C9A7"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const filteredAndSearchedProducts = allProducts.filter((p) => {
    const matchesSearch =
      searchQuery.trim() &&
      ((p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory !== "ALL" &&
      (p.category || "").trim() === selectedCategory;

    return matchesSearch || matchesCategory;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getActivePromoProducts = (list) => {
    const now = new Date();
    return list.filter(
      (p) =>
        !!p.isPromoted &&
        p.promoExpiresAt &&
        new Date(p.promoExpiresAt) > now
    );
  };

  
  const handleProceedToPay = () => {
    if (cart.length > 0) {
      navigate("/payment", { state: { cart: cart } });
    } else {
      toast.error("Your cart is empty. Please add items before proceeding to payment.");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Search Bar */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full max-w-md border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSearchQuery("");
            }}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === category
                ? "bg-red-600 text-white"
                : "bg-gray-500 text-gray-1000 hover:bg-red-300"
            }`}
          >
            {category}
          </button>
        ))}
        <button
          onClick={() => {
            setSelectedCategory("ALL");
            setSearchQuery("");
          }}
          className={`px-4 py-2 rounded-lg ${
            selectedCategory === "ALL" && !searchQuery.trim()
              ? "bg-blue-600 text-white"
              : "bg-blue-200 text-blue-800 hover:bg-blue-400"
          }`}
        >
          Show All
        </button>
      </div>

      {/* Results (Show only when searching or a specific category is selected) */}
      {searchQuery.trim() || selectedCategory !== "ALL" ? (
        <>
          <h2 className="text-xl font-bold text-blue-700 text-center">
            Showing results for "{searchQuery.trim() ? searchQuery : selectedCategory}"
          </h2>
          {filteredAndSearchedProducts.length === 0 ? (
            <p className="text-gray-600 text-center">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAndSearchedProducts.map((product) => (
                <Card key={keyOf(product)} className="rounded-2xl shadow-lg">
                  <CardContent className="p-4 flex flex-col items-center">
                    <div className="w-full h-40 bg-gray-200 rounded-md mb-4 overflow-hidden">
                      <img src={imgOf(product)} alt={product.name} className="object-cover w-full h-full" />
                    </div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">${product.price}</p>
                    <p className="text-gray-500 text-xs mt-1 text-center">{product.description}</p>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-3 w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors duration-300"
                    >
                      Add to Cart
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/*  Slides - Only show when not in search/filtered mode */}
               <div className="h-40 md:h-64 lg:h-80 rounded-xl overflow-hidden shadow-md relative">
  {slides.map((slide, index) => {
    let position = "translate-x-full"; 

    if (index === currentSlide) {
      position = "translate-x-0"; 
    } else if (
      index === (currentSlide - 1 + slides.length) % slides.length
    ) {
      position = "-translate-x-full"; 
    }

    return (
      <div
        key={slide.id}
        className={`absolute top-0 left-0 w-full h-full transition-transform duration-700 ease-in-out ${position}`}
      >
        <img
          src={slide.image}
          alt={slide.alt}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-center p-2">
          {slide.alt}
        </div>
      </div>
    );
  })}
</div>
      {/* Grid and Promo - Only show when not in search/filtered mode */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Categories Grid (LIMITED to isFeatured products) */}
            <div className="flex-1 space-y-10">
              {["Laptops", "Phones", "Accessories"].map((category) => {
                const featuredItems = products.filter(
                  (p) => (p.category || "").trim() === category && !!p.isFeatured
                );
                return (
                  <div key={category}>
                    <h2 className="text-xl font-bold mb-4 text-blue-700">{category}</h2>
                    {featuredItems.length === 0 ? (
                      <p className="text-gray-600">No featured products in this category to display.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {featuredItems.map((product) => (
                          <Card key={keyOf(product)} className="rounded-xl shadow">
                            <CardContent className="p-3 flex flex-col items-center">
                              <div className="w-full h-55 bg-gray-200 rounded mb-2 overflow-hidden">
                                <img src={imgOf(product)} alt={product.name} className="object-cover w-full h-full" />
                              </div>
                              <h3 className="text-md font-semibold">{product.name}</h3>
                              <p className="text-sm text-gray-600">${product.price}</p>
                              <p className="text-xs text-gray-500 text-center">{product.description}</p>
                              <button
                                onClick={() => addToCart(product)}
                                className="mt-2 w-full text-xs bg-blue-600 text-white px-4 py-1 rounded hover:bg-red-700 transition-colors duration-300"
                              >
                                Add to Cart
                              </button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Promo (Now filtering by isPromoted and promoExpiresAt) */}
            <div className="w-full lg:w-[280px] flex flex-col gap-6">
              <div className="relative h-48 border-4 border-dashed border-gray-400 rounded-xl overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-16 h-16 rounded-md"
                    style={{
                      top: `${Math.random() * 80}%`,
                      left: `${Math.random() * 80}%`,
                      backgroundColor: randomColor(),
                      animation: `floatBox ${5 + i}s ease-in-out infinite alternate`,
                    }}
                  ></div>
                ))}
              </div>
              <div className="border-4 border-dashed border-gray-500 rounded-xl p-3">
                <h3 className="text-lg font-bold text-center text-blue-700">🔥 Promo Offer</h3>
                <div className="flex flex-wrap justify-center gap-0 mt-3">
                  {/* Filter by isPromoted and active promo date */}
                  {getActivePromoProducts(products).slice(0, 2).map((product) => (
                    <div key={keyOf(product)} className="w-24 h-24 bg-gray-200 rounded-md shadow overflow-hidden flex flex-col items-center">
                      <img
                        src={imgOf(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Note: tiny cards are tight; name/price will wrap below the image area */}
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <button
                    onClick={() => setShowPromoGrid(!showPromoGrid)}
                    className="block mt-2 mx-auto bg-blue-600 text-white text-xs px-4 py-2 rounded hover:bg-blue-800"
                  >
                    {showPromoGrid ? "Hide Offer" : "View Offer"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showPromoGrid && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4 text-blue-700 text-center">🔥 Limited Promo Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {/* Filter by isPromoted and active promo date */}
                {getActivePromoProducts(products).slice(0, 4).map((product) => (
                  <Card key={keyOf(product)} className="rounded-xl shadow-lg">
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="w-full h-40 bg-gray-200 rounded mb-2 overflow-hidden">
                        <img
                          src={imgOf(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-md font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">${product.price}</p>
                      {product.promoExpiresAt && (
                        <p className="text-red-500 text-xs mt-1">
                          Ends: {formatDate(product.promoExpiresAt)}
                        </p>
                      )}
                      <button
                        onClick={() => addToCart(product)}
                        className="mt-2 w-full text-xs bg-blue-600 text-white px-4 py-1 rounded hover:bg-red-700 transition-colors duration-300"
                      >
                        Add to Cart
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* iWatch Section */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 text-blue-700">iWatch</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {products
                .filter((p) => (p.category || "").trim() === "iWatch" && !!p.isFeatured)
                .map((product) => (
                  <div key={keyOf(product)} className="w-1/2 sm:w-1/3 md:w-1/4 flex flex-col items-center">
                    <div className="w-full aspect-square bg-gray-200 rounded-full shadow-lg overflow-hidden">
                      <img
                        src={imgOf(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-semibold mt-1">{product.name}</span>
                    <span className="text-xs text-gray-500">${product.price}</span>
                    <p className="text-xs text-center text-gray-500">{product.description}</p>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-2 text-xs bg-blue-600 text-white px-4 py-1 rounded hover:bg-red-700 transition-colors duration-300"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Earbuds/Airpods Section */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Earbuds/Airpods</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {products
                .filter((p) => (p.category || "").trim() === "Earbuds/Airpods" && !!p.isFeatured)
                .map((product, i) => (
                  <div key={keyOf(product)} className="w-1/2 sm:w-1/3 md:w-1/5 flex flex-col items-center">
                    <div className={`w-full aspect-square overflow-hidden bg-gray-200 ${i % 2 === 0 ? "rounded-lg" : "rounded-full"} shadow`}>
                      <img
                        src={imgOf(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-semibold mt-1">{product.name}</span>
                    <span className="text-xs text-gray-500">${product.price}</span>
                    <p className="text-xs text-center text-gray-500">{product.description}</p>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-2 text-xs bg-blue-600 text-white px-4 py-1 rounded hover:bg-red-700 transition-colors duration-300"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Video Section */}
          <div className="mt-10 mb-2">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Advertisement</h2>
            <div className="w-full h-64 rounded-xl overflow-hidden bg-black">
              <video className="w-full h-full object-cover" controls autoPlay muted loop>
                <source src="/videos/sample-ad.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </>
      )}

      {/* Cart Section */}
      <div className="fixed bottom-5 right-5 bg-white shadow-lg border p-4 rounded-xl w-64 z-50">
        <h3 className="text-lg font-bold mb-2 text-red-500">🛒 Cart</h3>
        {cart.length === 0 ? (
          <p className="text-gray-600">Cart is empty</p>
        ) : (
          <ul className="space-y-2 text-sm max-h-40 overflow-y-auto">
            {cart.map((item) => (
              <li key={keyOf(item.product)} className="flex justify-between items-center">
                <span>{item.product.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => decrementQuantity(keyOf(item.product))}
                    className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => incrementQuantity(keyOf(item.product))}
                    className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>

                  {/* ✨ Remove button */}
                  <button
                    onClick={() => removeFromCart(keyOf(item.product))}
                    className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs ml-2"
                  >
                    ✖
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {cart.length > 0 && (
          <button
            onClick={handleProceedToPay}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 w-full"
          >
            Proceed to Pay
          </button>
        )}
      </div>
    </div>
  );
};

export default Store;

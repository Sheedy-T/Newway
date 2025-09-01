const MapLocation = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-16">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d8069790.435797271!2d8.677456999999999!3d9.0338725!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sng!4v1644423990887!5m2!1sen!2sng"
        className="w-full h-[400px] md:h-[500px] rounded-lg shadow-lg"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
      ></iframe>
    </div>
  );
};

export default MapLocation;

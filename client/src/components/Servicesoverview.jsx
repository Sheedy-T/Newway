const ServicesOverview = () => {
  const services = [
    {
      title: "BUY YOUR GADGETS",
      image: "gadget.jpg",
      description:
        "We bring to you the best gadgets. Buy your gadget with JBM, explore the world with us, and become great.",
    },
    {
      title: "ACQUIRE A SKILL",
      image: "skill.jpg",
      description:
        "JBM offers you a chance to acquire a skill. Apply now for an internship in computer knowledge and repairs.",
    },
    {
      title: "REPAIR GADGET",
      image: "skill2.webp",
      description:
        "We ensure your gadgets have a long lifespan. Repair your gadget with JBM.",
    },
  ];

  return (
    <section className="w-full py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto grid gap-8 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <div
            key={index}
            className="flex flex-col items-center bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-center"
          >
            <h1 className="text-xl font-bold mb-4">{service.title}</h1>
            <img
              src={`/images/${service.image}`}
              alt={service.title}
              className="w-full h-56 rounded-lg object-cover mb-4"
            />
            <p className="text-gray-600">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesOverview;

import {
  FaHtml5,
  FaCss3,
  FaSass,
  FaBootstrap,
  FaPhp,
  FaJs,
  FaPython,
  FaGithub,
} from "react-icons/fa";

const ProgrammingCourses = ({ wide = false, compactMargin = false }) => {
  return (
    <section
      className={`w-full bg-[#484872] py-12 text-center 
        ${wide ? "max-w-7xl mx-auto px-6" : "w-full"}
        ${compactMargin ? "mt-6" : "mt-10"}`}
    >
      <h2 className="uppercase font-extrabold text-3xl md:text-4xl text-black/80 mb-6 tracking-wide">
        Programming Courses
      </h2>

      <div className="flex flex-wrap justify-center items-center gap-10 text-5xl md:text-6xl text-black/70">
        <FaHtml5 className="hover:text-orange-500 transition-colors" />
        <FaCss3 className="hover:text-blue-500 transition-colors" />
        <FaSass className="hover:text-pink-500 transition-colors" />
        <FaBootstrap className="hover:text-purple-500 transition-colors" />
        <FaPhp className="hover:text-indigo-600 transition-colors" />
        <FaJs className="hover:text-yellow-400 transition-colors" />
        <FaPython className="hover:text-green-500 transition-colors" />
        <FaGithub className="hover:text-gray-700 transition-colors" />
      </div>
    </section>
  );
};

export default ProgrammingCourses;

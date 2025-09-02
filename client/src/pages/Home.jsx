import BackgroundAnimation from '../components/BackgroundAnimation';
import ServicesOverview from '../components/ServicesOverview';
import ProgrammingCourses from '../components/ProgrammingCourses';
import MapLocation from '../components/MapLocation';

const Home = () => {
  return (
    <div className="home-page">
      <BackgroundAnimation>
        <div className="flex flex-col items-center justify-center h-full text-black">
         <h1 className="text-5xl font-bold">Welcome to JBM</h1>
          <p className="mt-4 text-xl">The best gadgets and services await you.</p>
        </div>
      </BackgroundAnimation>

      <ServicesOverview />
      <ProgrammingCourses />
      <MapLocation />
    </div>
  );
};

export default Home;

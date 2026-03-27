import Navbar from "@web/components/Navbar";
import Hero from "@web/components/Hero";
import Gallery from "@web/components/Gallery";
import InstagramFeed from "@web/components/InstagramFeed";
import StudioInfo from "@web/components/StudioInfo";
import Footer from "@web/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Gallery />
      <InstagramFeed />
      <StudioInfo />
      <Footer />
    </div>
  );
};

export default Index;

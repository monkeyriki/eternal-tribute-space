import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import RecentMemorials from "@/components/RecentMemorials";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Eternal Memory – Online Memorials</title>
        <meta
          name="description"
          content="Create online memorials to honor and remember your loved ones. A respectful space to preserve memories."
        />
      </Helmet>

      <Layout>
        <HeroSection />
        <RecentMemorials />
        <FeaturesSection />
        <TestimonialsSection />
      </Layout>
    </>
  );
};

export default Index;

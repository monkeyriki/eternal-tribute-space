import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import AboutSection from "@/components/AboutSection";

const AboutUs = () => {
  return (
    <>
      <Helmet>
        <title>About Us – Eternal Memory</title>
        <meta
          name="description"
          content="We believe every life deserves to be remembered. A respectful digital space to preserve and share memories of loved ones."
        />
      </Helmet>
      <Layout>
        <AboutSection asPageTitle />
      </Layout>
    </>
  );
};

export default AboutUs;

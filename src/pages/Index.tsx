import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import FeaturedPosts from "@/components/home/FeaturedPosts";
import BusinessShowcase from "@/components/home/BusinessShowcase";

const Index = () => {
  return (
    <Layout>
      <Hero />
      
      {/* Business Showcases */}
      <BusinessShowcase
        title="Empreendedoras Destaque"
        subtitle="Conheça as empreendedoras dos planos intermediário e master"
        featured={true}
        className="bg-tertiary/10"
      />
      
      <BusinessShowcase
        title="Nossos Negócios"
        subtitle="Descubra a diversidade de empreendimentos em nossa rede"
        featured={false}
      />
      
      <FeaturedPosts />
    </Layout>
  );
};

export default Index;

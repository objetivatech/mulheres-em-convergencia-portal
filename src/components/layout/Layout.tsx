import { ReactNode } from 'react';
import { Header } from './Header';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import { SiteSchemaOrg } from '@/components/seo/SiteSchemaOrg';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteSchemaOrg />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Layout;
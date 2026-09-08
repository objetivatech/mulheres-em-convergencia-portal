import { ReactNode } from 'react';
import SiteLayout from '@/components/site/SiteLayout';
import WhatsAppButton from './WhatsAppButton';
import { SiteSchemaOrg } from '@/components/seo/SiteSchemaOrg';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SiteLayout>
      <SiteSchemaOrg />
      {children}
      <WhatsAppButton />
    </SiteLayout>
  );
};

export default Layout;

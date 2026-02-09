import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunitiesManagement } from '@/components/admin/CommunitiesManagement';
import { AdminBackButton } from '@/components/admin/AdminBackButton';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const AdminRegistrations = () => {
  return (
    <>
      <Helmet>
        <title>Cadastros - Admin - Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/cadastros`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <AdminBackButton />
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Cadastros</h1>
              <p className="text-muted-foreground">
                Gerencie comunidades, coletivos e solicitações
              </p>
            </div>

            <Tabs defaultValue="communities" className="w-full">
              <TabsList>
                <TabsTrigger value="communities">Comunidades</TabsTrigger>
              </TabsList>

              <TabsContent value="communities" className="mt-6">
                <CommunitiesManagement />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default AdminRegistrations;

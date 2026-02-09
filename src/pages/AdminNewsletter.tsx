import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Mail, Users, Send, BarChart3 } from 'lucide-react';
import { AdminBackButton } from '@/components/admin/AdminBackButton';
import { NewsletterDashboard } from '@/components/admin/newsletter/NewsletterDashboard';
import { SubscribersList } from '@/components/admin/newsletter/SubscribersList';
import { CampaignsList } from '@/components/admin/newsletter/CampaignsList';
import { CampaignReports } from '@/components/admin/newsletter/CampaignReports';

const AdminNewsletter = () => {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Newsletter - Administração</title>
        <meta name="description" content="Gestão de newsletter e campanhas de email" />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <AdminBackButton label="Voltar ao Admin" />
            <header className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Mail className="h-8 w-8 text-primary" />
                Gestão de Newsletter
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie inscritos, crie campanhas e acompanhe resultados
              </p>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="subscribers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contatos
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Campanhas
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Relatórios
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <NewsletterDashboard />
              </TabsContent>

              <TabsContent value="subscribers">
                <SubscribersList />
              </TabsContent>

              <TabsContent value="campaigns">
                <CampaignsList />
              </TabsContent>

              <TabsContent value="reports">
                <CampaignReports />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminNewsletter;

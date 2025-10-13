import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JourneyFunnel } from './journey/JourneyFunnel';
import { UserStageList } from './journey/UserStageList';
import { JourneyAnalytics } from './journey/JourneyAnalytics';
import { EmailTemplateManager } from './journey/EmailTemplateManager';
import { ABTestManager } from './journey/ABTestManager';
import { AdvancedAnalytics } from './journey/AdvancedAnalytics';

export const UserJourneyDashboard = () => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="mt-6">
          <JourneyFunnel onStageClick={setSelectedStage} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserStageList initialStage={selectedStage} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <JourneyAnalytics />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <EmailTemplateManager />
        </TabsContent>

        <TabsContent value="abtests" className="mt-6">
          <ABTestManager />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <AdvancedAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JourneyFunnel } from './journey/JourneyFunnel';
import { UserStageList } from './journey/UserStageList';
import { JourneyAnalytics } from './journey/JourneyAnalytics';

export const UserJourneyDashboard = () => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
          <TabsTrigger value="users">Lista de Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

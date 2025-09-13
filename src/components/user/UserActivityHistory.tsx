import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Building, Star, CreditCard, Settings, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserActivity {
  id: string;
  activity_type: string;
  activity_description: string;
  metadata: any;
  created_at: string;
}

const activityIcons: Record<string, React.ComponentType<any>> = {
  subscription_created: CreditCard,
  subscription_cancelled: CreditCard,
  business_created: Building,
  business_updated: Building,
  review_submitted: Star,
  profile_updated: User,
  default: History
};

const UserActivityHistory: React.FC = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserActivities();
  }, []);

  const fetchUserActivities = async () => {
    try {
      // Filter activities from the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar seu histórico de atividades.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    const IconComponent = activityIcons[activityType] || activityIcons.default;
    return IconComponent;
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'subscription_created':
        return 'text-green-600';
      case 'subscription_cancelled':
        return 'text-red-600';
      case 'business_created':
        return 'text-blue-600';
      case 'business_updated':
        return 'text-amber-600';
      case 'review_submitted':
        return 'text-purple-600';
      case 'profile_updated':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-4 border rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma atividade registrada ainda</p>
        <p className="text-sm text-muted-foreground mt-2">
          Suas ações no portal aparecerão aqui automaticamente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const IconComponent = getActivityIcon(activity.activity_type);
        const iconColor = getActivityColor(activity.activity_type);
        
        return (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-relaxed">
                {activity.activity_description}
              </p>
              
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="mt-2">
                  {activity.metadata.plan_name && (
                    <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded mr-2">
                      {activity.metadata.plan_name}
                    </span>
                  )}
                  {activity.metadata.billing_cycle && (
                    <span className="inline-block text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded mr-2">
                      {activity.metadata.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                    </span>
                  )}
                  {activity.metadata.business_name && (
                    <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded mr-2">
                      {activity.metadata.business_name}
                    </span>
                  )}
                  {activity.metadata.rating && (
                    <span className="inline-block text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                      {activity.metadata.rating} ⭐
                    </span>
                  )}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(activity.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR
                })}
              </p>
            </div>
          </div>
        );
      })}
      
      {activities.length >= 50 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Mostrando as 50 atividades mais recentes
        </p>
      )}
    </div>
  );
};

export default UserActivityHistory;
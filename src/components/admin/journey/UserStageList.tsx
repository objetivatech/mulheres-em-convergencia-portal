import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Clock, User, Users } from 'lucide-react';
import { SendReminderDialog } from './SendReminderDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserJourneyData {
  user_id: string;
  email: string;
  full_name: string;
  journey_stage: string;
  stage_completed: boolean;
  created_at: string;
  hours_in_stage: number;
  metadata: any;
}

const STAGE_OPTIONS = [
  { value: 'all', label: 'Todos os Estágios' },
  { value: 'signup', label: 'Cadastro Inicial' },
  { value: 'profile_completed', label: 'Perfil Completo' },
  { value: 'plan_selected', label: 'Plano Escolhido' },
  { value: 'payment_pending', label: 'Pagamento Pendente' },
  { value: 'payment_confirmed', label: 'Pagamento Confirmado' },
  { value: 'active', label: 'Usuário Ativo' }
];

const STAGE_COLORS: Record<string, string> = {
  signup: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  profile_completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  plan_selected: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  payment_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  payment_confirmed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
};

interface UserStageListProps {
  initialStage?: string | null;
}

export const UserStageList = ({ initialStage }: UserStageListProps) => {
  const [selectedStage, setSelectedStage] = useState<string>(initialStage || 'all');
  const [selectedUser, setSelectedUser] = useState<UserJourneyData | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-by-journey-stage', selectedStage],
    queryFn: async () => {
      const stage = selectedStage === 'all' ? null : selectedStage;
      const { data, error } = await supabase.rpc('get_users_by_journey_stage', {
        p_stage: stage,
        p_limit: 100,
        p_offset: 0
      });
      if (error) throw error;
      return data as UserJourneyData[];
    }
  });

  const handleSendReminder = (user: UserJourneyData) => {
    setSelectedUser(user);
    setReminderDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Usuários por Estágio</h2>
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione um estágio" />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {users && users.length > 0 ? (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.user_id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{user.full_name || 'Sem nome'}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <Badge className={STAGE_COLORS[user.journey_stage]}>
                        {STAGE_OPTIONS.find(s => s.value === user.journey_stage)?.label}
                      </Badge>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {Math.floor(user.hours_in_stage)}h neste estágio
                          {user.hours_in_stage > 48 && (
                            <span className="ml-2 text-yellow-600 font-semibold">
                              ⚠️ Atenção necessária
                            </span>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Desde {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminder(user)}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Enviar Lembrete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado neste estágio</p>
          </div>
        )}
      </Card>

      {selectedUser && (
        <SendReminderDialog
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          user={selectedUser}
        />
      )}
    </>
  );
};

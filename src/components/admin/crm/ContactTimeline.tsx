import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  FileText, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Gift,
  Megaphone
} from 'lucide-react';
import { CRMInteraction, CRMConversionMilestone } from '@/hooks/useCRM';
import { Badge } from '@/components/ui/badge';

interface TimelineItem {
  id: string;
  type: 'interaction' | 'milestone';
  date: string;
  data: CRMInteraction | CRMConversionMilestone;
}

interface ContactTimelineProps {
  interactions: CRMInteraction[];
  milestones: CRMConversionMilestone[];
}

const interactionIcons: Record<string, React.ElementType> = {
  email_sent: Mail,
  email_opened: Mail,
  phone_call: Phone,
  event_registration: Calendar,
  purchase: DollarSign,
  signup: UserPlus,
  form_submit: FileText,
  message: MessageSquare,
  donation: Gift,
  campaign: Megaphone,
  other: Clock,
};

const interactionLabels: Record<string, string> = {
  email_sent: 'Email enviado',
  email_opened: 'Email aberto',
  email_clicked: 'Email clicado',
  phone_call: 'Ligação',
  event_registration: 'Inscrição em evento',
  purchase: 'Compra',
  signup: 'Cadastro',
  form_submit: 'Formulário enviado',
  message: 'Mensagem',
  donation: 'Doação',
  campaign: 'Campanha',
  other: 'Outro',
};

const milestoneLabels: Record<string, string> = {
  first_contact: 'Primeiro Contato',
  first_event: 'Primeiro Evento',
  first_purchase: 'Primeira Compra',
  became_subscriber: 'Tornou-se Assinante',
  became_ambassador: 'Tornou-se Embaixadora',
  lead_converted: 'Lead Convertido',
};

export const ContactTimeline = ({ interactions, milestones }: ContactTimelineProps) => {
  // Combinar interações e milestones em uma timeline ordenada
  const timelineItems: TimelineItem[] = [
    ...interactions.map(i => ({
      id: i.id,
      type: 'interaction' as const,
      date: i.created_at,
      data: i,
    })),
    ...milestones.map(m => ({
      id: m.id,
      type: 'milestone' as const,
      date: m.milestone_date,
      data: m,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma atividade registrada ainda
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Linha vertical */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {timelineItems.map((item) => {
          if (item.type === 'milestone') {
            const milestone = item.data as CRMConversionMilestone;
            return (
              <div key={item.id} className="relative pl-10">
                {/* Ícone do milestone */}
                <div className="absolute left-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-500 text-white">
                      {milestoneLabels[milestone.milestone_type] || milestone.milestone_name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(milestone.milestone_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{milestone.milestone_name}</p>
                  {milestone.activities_count > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {milestone.activities_count} atividades até este marco
                      {milestone.days_from_first_contact && ` • ${milestone.days_from_first_contact} dias desde o primeiro contato`}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          const interaction = item.data as CRMInteraction;
          const Icon = interactionIcons[interaction.interaction_type] || Clock;

          return (
            <div key={item.id} className="relative pl-10">
              {/* Ícone da interação */}
              <div className="absolute left-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {interactionLabels[interaction.interaction_type] || interaction.interaction_type}
                    </span>
                    {interaction.channel && (
                      <Badge variant="outline" className="text-xs">
                        {interaction.channel}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(interaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                
                {interaction.description && (
                  <p className="text-sm text-muted-foreground">{interaction.description}</p>
                )}
                
                {interaction.activity_name && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Atividade:</span>
                    <span className="text-xs font-medium">{interaction.activity_name}</span>
                    {interaction.activity_paid && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                        Paga
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { useMeetingGuests } from '@/hooks/useMeetingGuests';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface MeetingGuestsListProps {
  meetingId: string;
  meetingTitle: string;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  accepted: { label: 'Cadastrada', variant: 'default' },
  expired: { label: 'Expirado', variant: 'secondary' },
};

export default function MeetingGuestsList({ meetingId, meetingTitle }: MeetingGuestsListProps) {
  const { data: guests, isLoading } = useMeetingGuests(meetingId);
  const [expanded, setExpanded] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) return <div className="p-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>;
  if (!guests?.length) return <p className="text-sm text-muted-foreground p-4">Nenhuma convidada registrada neste encontro.</p>;

  return (
    <div className="border-t mt-3 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline w-full"
      >
        <Users className="w-4 h-4" />
        Convidadas ({guests.length})
        {expanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {guests.map(guest => {
            const status = statusMap[guest.status] || statusMap.pending;
            const displayName = guest.guest_profile?.full_name || guest.name || 'Convidada';
            const hasProfile = !!guest.accepted_by;

            return (
              <div key={guest.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={guest.guest_profile?.avatar_url || ''} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {hasProfile ? (
                      <Link
                        to={`/conecta/membros`}
                        className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {displayName}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="font-medium text-sm">{displayName}</span>
                    )}
                    <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {guest.email && <span>{guest.email}</span>}
                    <span>• Convidada por {guest.inviter?.full_name || 'Membro'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

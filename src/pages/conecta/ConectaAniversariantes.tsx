import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Cake, PartyPopper } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface BirthdayMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  company: string | null;
  position: string | null;
  birthday: string;
}

export default function ConectaAniversariantes() {
  const { user } = useAuth();
  const currentMonth = new Date().getMonth();

  const { data: members, isLoading } = useQuery({
    queryKey: ['conecta-birthdays'],
    queryFn: async () => {
      // conecta_profiles has birthday but not full_name/avatar_url — join with profiles
      const { data, error } = await supabase
        .from('conecta_profiles')
        .select('id, company, position, birthday, profiles:id(full_name, avatar_url)')
        .eq('is_active', true)
        .not('birthday', 'is', null);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        full_name: row.profiles?.full_name || 'Sem nome',
        avatar_url: row.profiles?.avatar_url || null,
        company: row.company,
        position: row.position,
        birthday: row.birthday,
      })) as BirthdayMember[];
    },
    enabled: !!user,
  });

  const grouped = useMemo(() => {
    if (!members) return {};
    const map: Record<number, BirthdayMember[]> = {};
    for (const m of members) {
      if (!m.birthday) continue;
      const month = parseInt(m.birthday.split('-')[1], 10) - 1;
      if (!map[month]) map[month] = [];
      map[month].push(m);
    }
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) => {
        const dayA = parseInt(a.birthday.split('-')[2], 10);
        const dayB = parseInt(b.birthday.split('-')[2], 10);
        return dayA - dayB;
      });
    }
    return map;
  }, [members]);

  const formatBirthdayDisplay = (birthday: string) => {
    try {
      const date = parse(birthday, 'yyyy-MM-dd', new Date());
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return birthday;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const orderedMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push((currentMonth + i) % 12);
    }
    return months;
  }, [currentMonth]);

  return (
    <ConectaLayout>
      <Helmet>
        <title>Aniversariantes - CONECTA+</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Cake className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Aniversariantes</h1>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Carregando...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orderedMonths.map((monthIdx) => {
              const monthMembers = grouped[monthIdx];
              if (!monthMembers || monthMembers.length === 0) return null;
              const isCurrentMonth = monthIdx === currentMonth;

              return (
                <Card
                  key={monthIdx}
                  className={isCurrentMonth ? 'border-primary/40 shadow-md ring-1 ring-primary/20' : ''}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {isCurrentMonth && <PartyPopper className="h-5 w-5 text-primary" />}
                      <span className={isCurrentMonth ? 'text-primary' : ''}>
                        {MONTH_NAMES[monthIdx]}
                      </span>
                      <Badge variant={isCurrentMonth ? 'default' : 'secondary'} className="ml-2">
                        {monthMembers.length}
                      </Badge>
                      {isCurrentMonth && (
                        <Badge variant="outline" className="ml-1 text-primary border-primary/30">
                          Mês atual
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {monthMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{member.full_name}</p>
                            {member.company && (
                              <p className="text-xs text-muted-foreground truncate">
                                {member.position ? `${member.position} - ` : ''}{member.company}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Cake className="h-3.5 w-3.5" />
                            {formatBirthdayDisplay(member.birthday)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {Object.keys(grouped).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum membro cadastrou data de aniversário ainda.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ConectaLayout>
  );
}

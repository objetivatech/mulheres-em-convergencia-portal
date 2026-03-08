import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaMembers, ConectaMember, ConectaMembersByTeam } from '@/hooks/useConectaMembers';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RankBadge from '@/components/conecta/RankBadge';
import { 
  Users, Search, Building2, Mail, Phone, Globe, Linkedin, Instagram,
  User, ExternalLink, ChevronDown, UsersRound, X, Store
} from 'lucide-react';
import { Link } from 'react-router-dom';

function MemberCard({ member, onViewProfile }: { member: ConectaMember; onViewProfile: () => void }) {
  const initials = member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{member.full_name}</h3>
              <RankBadge rank={member.rank as any} size="sm" />
            </div>
            {member.position && <p className="text-sm text-muted-foreground truncate">{member.position}</p>}
            {member.company && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Building2 className="h-3 w-3" /><span className="truncate">{member.company}</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={onViewProfile}>
          <User className="h-4 w-4 mr-2" />Ver Perfil
        </Button>
      </CardContent>
    </Card>
  );
}

function MemberProfileModal({ member }: { member: ConectaMember }) {
  const initials = member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{member.full_name}</h2>
            <RankBadge rank={member.rank as any} />
          </div>
          {member.position && <p className="text-muted-foreground">{member.position}</p>}
          {member.company && (
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <Building2 className="h-4 w-4" /><span>{member.company}</span>
            </div>
          )}
        </div>
      </div>

      {member.team_name && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Grupo</h4>
          <Badge variant="outline" style={{ borderColor: member.team_color || undefined, color: member.team_color || undefined }}>
            <UsersRound className="h-3 w-3 mr-1" />{member.team_name}
          </Badge>
        </div>
      )}

      {member.bio && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Sobre</h4>
          <p className="text-sm">{member.bio}</p>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Contato</h4>
        {member.email && (
          <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
            <Mail className="h-4 w-4" />{member.email}
          </a>
        )}
        {member.phone && (
          <a href={`https://wa.me/55${member.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
            <Phone className="h-4 w-4" />{member.phone}<ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {(member.linkedin_url || member.instagram_url || member.website_url) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Links</h4>
          {member.linkedin_url && (
            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
              <Linkedin className="h-4 w-4" />LinkedIn<ExternalLink className="h-3 w-3" />
            </a>
          )}
          {member.instagram_url && (
            <a href={`https://instagram.com/${member.instagram_url.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
              <Instagram className="h-4 w-4" />Instagram<ExternalLink className="h-3 w-3" />
            </a>
          )}
          {member.website_url && (
            <a href={member.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
              <Globe className="h-4 w-4" />Website<ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {member.points > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pontuação</span>
            <span className="font-semibold text-primary">{member.points} pontos</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamSection({ team, search, rankFilter, onViewProfile }: { 
  team: ConectaMembersByTeam; search: string; rankFilter: string; onViewProfile: (member: ConectaMember) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const filteredMembers = team.members.filter(member => {
    if (search) {
      const s = search.toLowerCase();
      if (!member.full_name.toLowerCase().includes(s) && !member.company?.toLowerCase().includes(s)) return false;
    }
    if (rankFilter && rankFilter !== 'all' && member.rank !== rankFilter) return false;
    return true;
  });

  if (filteredMembers.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-auto py-3 px-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.team_color }} />
            <span className="font-semibold text-lg">{team.team_name}</span>
            <Badge variant="secondary" className="ml-2">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'membro' : 'membros'}
            </Badge>
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-6">
          {filteredMembers.map(member => (
            <MemberCard key={`${member.id}-${team.team_id}`} member={member} onViewProfile={() => onViewProfile(member)} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function ConectaMembros() {
  const { members, membersByTeam, isLoading } = useConectaMembers();
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<ConectaMember | null>(null);

  const filteredTeams = useMemo(() => {
    if (teamFilter === 'all') return membersByTeam;
    if (teamFilter === 'no-team') return membersByTeam.filter(t => t.team_id === null);
    return membersByTeam.filter(t => t.team_id === teamFilter);
  }, [membersByTeam, teamFilter]);

  const hasActiveFilters = teamFilter !== 'all' || rankFilter !== 'all' || search !== '';

  return (
    <ConectaLayout requireMember>
      <Helmet><title>Membros | CONECTA+</title></Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />Membros
            </h1>
            <p className="text-muted-foreground">
              {members?.length || 0} membros na comunidade
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Grupo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Grupos</SelectItem>
              {membersByTeam.filter(t => t.team_id).map(t => (
                <SelectItem key={t.team_id!} value={t.team_id!}>{t.team_name}</SelectItem>
              ))}
              <SelectItem value="no-team">Sem Grupo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={rankFilter} onValueChange={setRankFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Rank" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Ranks</SelectItem>
              {['iniciante', 'bronze', 'prata', 'ouro', 'diamante'].map(r => (
                <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={() => { setSearch(''); setTeamFilter('all'); setRankFilter('all'); }}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          filteredTeams.map(team => (
            <TeamSection key={team.team_id || 'no-team'} team={team} search={search} rankFilter={rankFilter} onViewProfile={setSelectedMember} />
          ))
        )}

        {!isLoading && filteredTeams.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum membro encontrado</p>
          </div>
        )}

        {/* Profile Modal */}
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Perfil do Membro</DialogTitle>
            </DialogHeader>
            {selectedMember && <MemberProfileModal member={selectedMember} />}
          </DialogContent>
        </Dialog>
      </div>
    </ConectaLayout>
  );
}

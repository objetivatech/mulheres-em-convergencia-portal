import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRoles, UserRole, UserProfile } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';
import { AddUserDialog } from './AddUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { Search, UserPlus, Shield, User, Store, Mail, Crown, Users, Edit3, Edit, Trash2 } from 'lucide-react';

const roleIcons: Record<UserRole, any> = {
  admin: Shield,
  associada: Store,
  cliente_loja: User,
  assinante_newsletter: Mail,
  embaixadora: Crown,
  membro_comunidade: Users,
  autor: Edit3,
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  associada: 'Associada',
  cliente_loja: 'Cliente da Loja',
  assinante_newsletter: 'Assinante Newsletter',
  embaixadora: 'Embaixadora',
  membro_comunidade: 'Membro da Comunidade',
  autor: 'Autor',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  associada: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  cliente_loja: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  assinante_newsletter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  embaixadora: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  membro_comunidade: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  autor: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { useUserProfiles, useAddRole, useRemoveRole, useDeleteUser, useToggleAdmin, useToggleBlogEditor } = useRoles();
  const { toast } = useToast();

  const { data: users = [], isLoading, error } = useUserProfiles();
  const addRoleMutation = useAddRole();
  const removeRoleMutation = useRemoveRole();
  const deleteUserMutation = useDeleteUser();
  const toggleAdminMutation = useToggleAdmin();
  const toggleBlogEditorMutation = useToggleBlogEditor();

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.roles.includes(selectedRole as UserRole);
    return matchesSearch && matchesRole;
  });

  const handleAddRole = async (userId: string, role: UserRole) => {
    try {
      await addRoleMutation.mutateAsync({ userId, role });
      toast({
        title: 'Role adicionado',
        description: `Role ${roleLabels[role]} adicionado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o role.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: UserRole) => {
    try {
      await removeRoleMutation.mutateAsync({ userId, role });
      toast({
        title: 'Role removido',
        description: `Role ${roleLabels[role]} removido com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o role.',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast({
        title: 'Usuário removido',
        description: `Usuário ${userName} removido com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      await toggleAdminMutation.mutateAsync({ userId, newStatus: !currentStatus });
      toast({
        title: currentStatus ? 'Admin removido' : 'Admin concedido',
        description: `${userName} agora ${!currentStatus ? 'é' : 'não é'} administrador.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar status de admin.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBlogEditor = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      await toggleBlogEditorMutation.mutateAsync({ userId, newStatus: !currentStatus });
      toast({
        title: currentStatus ? 'Editor Blog removido' : 'Editor Blog concedido',
        description: `${userName} agora ${!currentStatus ? 'pode' : 'não pode'} editar blog.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar status de editor de blog.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Erro ao carregar usuários. Tente novamente.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Gestão de Usuários</span>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </CardTitle>
          <CardDescription>
            Gerencie usuários, roles e permissões do portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os roles</SelectItem>
                {Object.entries(roleLabels).map(([role, label]) => (
                  <SelectItem key={role} value={role}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-muted-foreground">Total de usuários</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('admin')).length}
                </div>
                <div className="text-sm text-muted-foreground">Administradores</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('associada')).length}
                </div>
                <div className="text-sm text-muted-foreground">Associadas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('embaixadora')).length}
                </div>
                <div className="text-sm text-muted-foreground">Embaixadoras</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de usuários */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || 'Sem nome'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="flex flex-wrap gap-1">
                         {/* System Roles */}
                         {user.is_admin && (
                           <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                             <Shield className="h-3 w-3 mr-1" />
                             Admin
                           </Badge>
                         )}
                         {user.can_edit_blog && (
                           <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                             <Edit3 className="h-3 w-3 mr-1" />
                             Editor Blog
                           </Badge>
                         )}
                         
                         {/* Custom Roles */}
                         {user.roles.map((role) => {
                           const IconComp = roleIcons[role as UserRole] ?? Users;
                           const label = roleLabels[role as UserRole] ?? role;
                           const colorClass = roleColors[role as UserRole] ?? '';
                           return (
                             <Badge key={role} className={colorClass || undefined} variant={colorClass ? 'default' : 'outline'}>
                               <IconComp className="h-3 w-3 mr-1" />
                               {label}
                             </Badge>
                           );
                         })}
                         {user.roles.length === 0 && !user.is_admin && !user.can_edit_blog && (
                           <Badge variant="outline">Nenhum role</Badge>
                         )}
                       </div>
                     </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                     <TableCell>
                       <div className="flex flex-wrap gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleEditUser(user)}
                         >
                           <Edit className="h-4 w-4 mr-1" />
                           Editar
                         </Button>

                         {/* Admin Toggle */}
                         <Button
                           variant={user.is_admin ? "destructive" : "default"}
                           size="sm"
                           onClick={() => handleToggleAdmin(user.id, user.is_admin, user.full_name || user.email)}
                         >
                           <Shield className="h-4 w-4 mr-1" />
                           {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                         </Button>

                         {/* Blog Editor Toggle */}
                         <Button
                           variant={user.can_edit_blog ? "secondary" : "outline"}
                           size="sm"
                           onClick={() => handleToggleBlogEditor(user.id, user.can_edit_blog, user.full_name || user.email)}
                         >
                           <Edit3 className="h-4 w-4 mr-1" />
                           {user.can_edit_blog ? 'Remover Editor' : 'Tornar Editor'}
                         </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <UserPlus className="h-4 w-4 mr-1" />
                              Gerenciar Roles
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Gerenciar Roles - {user.full_name || user.email}</AlertDialogTitle>
                              <AlertDialogDescription>
                                Adicione ou remova roles para este usuário.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                              {Object.entries(roleLabels).map(([role, label]) => {
                                const hasRole = user.roles.includes(role as UserRole);
                                const Icon = roleIcons[role as UserRole];
                                
                                return (
                                  <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <Icon className="h-5 w-5" />
                                      <div>
                                        <div className="font-medium">{label}</div>
                                        {hasRole && (
                                        <Badge className={roleColors[role as UserRole]}>
                                          Ativo
                                        </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant={hasRole ? "destructive" : "default"}
                                      size="sm"
                                      onClick={() => hasRole 
                                        ? handleRemoveRole(user.id, role as UserRole)
                                        : handleAddRole(user.id, role as UserRole)
                                      }
                                    >
                                      {hasRole ? 'Remover' : 'Adicionar'}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Fechar</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o usuário {user.full_name || user.email}? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddUserDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <EditUserDialog
        user={editingUser}
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            setEditingUser(null);
          }
        }}
      />
    </div>
  );
};
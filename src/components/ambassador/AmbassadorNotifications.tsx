import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck,
  DollarSign,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useAmbassadorNotifications, AmbassadorNotification } from '@/hooks/useAmbassadorNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AmbassadorNotificationsProps {
  ambassadorId: string;
  variant?: 'icon' | 'full';
}

export const AmbassadorNotifications = ({ 
  ambassadorId, 
  variant = 'icon' 
}: AmbassadorNotificationsProps) => {
  const [open, setOpen] = useState(false);
  
  const { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } = useAmbassadorNotifications();
  const { data: notifications = [], isLoading } = useNotifications(ambassadorId);
  const { data: unreadCount = 0 } = useUnreadCount(ambassadorId);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const getNotificationIcon = (type: AmbassadorNotification['type']) => {
    switch (type) {
      case 'payment_confirmed':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'payment_registered':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'commission_earned':
        return <Sparkles className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleMarkAsRead = async (notification: AmbassadorNotification) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync(ambassadorId);
  };

  if (variant === 'icon') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            {unreadCount > 0 ? (
              <>
                <BellRing className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </>
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-semibold">Notificações</h4>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto py-1 px-2 text-xs"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
          <ScrollArea className="h-80">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm",
                          !notification.read && "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }

  // Full variant - for dashboard display
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma notificação ainda</p>
            <p className="text-sm">Você será notificada sobre pagamentos e comissões</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-primary/5 border-primary/20"
                )}
                onClick={() => handleMarkAsRead(notification)}
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm",
                        !notification.read && "font-semibold"
                      )}>
                        {notification.title}
                      </p>
                      {notification.read && (
                        <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

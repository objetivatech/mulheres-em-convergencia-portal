import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Building2, User } from 'lucide-react';

interface OrganizationPage {
  id: string;
  name: string;
  vanityName?: string;
}

interface LinkedInPageSelectorProps {
  accountId: string;
  accountName: string;
  organizationPages: OrganizationPage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkedInPageSelector({
  accountId,
  accountName,
  organizationPages,
  open,
  onOpenChange,
}: LinkedInPageSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPageId, setSelectedPageId] = useState<string>('personal');

  const selectPage = useMutation({
    mutationFn: async (pageId: string | null) => {
      const { error } = await supabase
        .from('social_accounts')
        .update({ 
          platform_page_id: pageId,
          account_name: pageId ? organizationPages.find(p => p.id === pageId)?.name || accountName : accountName
        })
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Página selecionada',
        description: 'A conta foi configurada com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao selecionar página',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleConfirm = () => {
    const pageId = selectedPageId === 'personal' ? null : selectedPageId;
    selectPage.mutate(pageId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Selecionar conta LinkedIn</DialogTitle>
          <DialogDescription>
            Escolha se deseja publicar como seu perfil pessoal ou como uma página de negócio
          </DialogDescription>
        </DialogHeader>
        
        <RadioGroup value={selectedPageId} onValueChange={setSelectedPageId}>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="personal" id="personal" />
            <Label htmlFor="personal" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{accountName}</p>
                  <p className="text-sm text-muted-foreground">Perfil pessoal</p>
                </div>
              </div>
            </Label>
          </div>

          {organizationPages.map((page) => (
            <div key={page.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value={page.id} id={page.id} />
              <Label htmlFor={page.id} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{page.name}</p>
                    <p className="text-sm text-muted-foreground">Página de negócio</p>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectPage.isPending}>
            {selectPage.isPending ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

-- Adicionar política de DELETE para contact_messages
-- Data: 24 de outubro de 2025
-- Problema: Administradores não conseguem excluir mensagens de contato

-- Criar política para permitir que admins excluam mensagens
CREATE POLICY "Admins can delete contact messages" 
ON public.contact_messages 
FOR DELETE 
USING (get_current_user_admin_status());

COMMENT ON POLICY "Admins can delete contact messages" ON public.contact_messages 
IS 'Permite que administradores excluam mensagens de contato';


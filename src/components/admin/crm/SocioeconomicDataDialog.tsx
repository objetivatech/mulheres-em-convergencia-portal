import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart3 } from 'lucide-react';
import { EventRegistration } from '@/hooks/useEvents';

interface Props {
  registration: EventRegistration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RACE_OPTIONS = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar'];
const GENDER_OPTIONS = ['Mulher cisgênero', 'Mulher transgênero', 'Não-binária', 'Prefiro não informar'];
const INCOME_OPTIONS = [
  'Sem renda',
  'Até R$ 1.412 (1 SM)',
  'R$ 1.412 – R$ 2.824 (1–2 SM)',
  'R$ 2.824 – R$ 5.648 (2–4 SM)',
  'R$ 5.648 – R$ 11.296 (4–8 SM)',
  'Acima de R$ 11.296 (8+ SM)',
  'Prefiro não informar',
];
const EDUCATION_OPTIONS = [
  'Ensino fundamental incompleto',
  'Ensino fundamental completo',
  'Ensino médio incompleto',
  'Ensino médio completo',
  'Ensino superior incompleto',
  'Ensino superior completo',
  'Pós-graduação',
];
const FORMALIZATION_OPTIONS = ['MEI', 'ME', 'EPP', 'Autônoma (sem CNPJ)', 'Em processo de formalização', 'Não formalizada'];
const BUSINESS_SECTOR_OPTIONS = [
  'Alimentação e gastronomia',
  'Moda e vestuário',
  'Beleza e estética',
  'Saúde e bem-estar',
  'Educação e treinamento',
  'Tecnologia',
  'Arte e cultura',
  'Serviços gerais',
  'Comércio',
  'Outro',
];

type FormState = {
  race_ethnicity: string;
  gender_identity: string;
  monthly_income: string;
  education_level: string;
  has_business: boolean;
  business_sector: string;
  business_formalization: string;
  date_of_birth: string;
};

const EMPTY: FormState = {
  race_ethnicity: '',
  gender_identity: '',
  monthly_income: '',
  education_level: '',
  has_business: false,
  business_sector: '',
  business_formalization: '',
  date_of_birth: '',
};

const NO_VALUE = '__none__';

export const SocioeconomicDataDialog: React.FC<Props> = ({ registration, open, onOpenChange }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const anchor = registration.user_id
      ? { column: 'user_id', value: registration.user_id }
      : { column: 'registration_id', value: registration.id };

    const query = supabase
      .from('user_socioeconomic_data')
      .select('*');

    if (anchor.column === 'user_id') {
      (query as any).eq('user_id', anchor.value);
    } else {
      (query as any).eq('registration_id', anchor.value);
    }

    (query as any).maybeSingle().then(({ data }: { data: any }) => {
        if (data) {
          setExistingId(data.id);
          setForm({
            race_ethnicity: data.race_ethnicity || '',
            gender_identity: data.gender_identity || '',
            monthly_income: data.monthly_income || '',
            education_level: data.education_level || '',
            has_business: data.has_business || false,
            business_sector: data.business_sector || '',
            business_formalization: data.business_formalization || '',
            date_of_birth: data.date_of_birth || '',
          });
        } else {
          setExistingId(null);
          setForm(EMPTY);
        }
        setLoading(false);
      });
  }, [open, registration.id, registration.user_id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        race_ethnicity: form.race_ethnicity || null,
        gender_identity: form.gender_identity || null,
        monthly_income: form.monthly_income || null,
        education_level: form.education_level || null,
        has_business: form.has_business,
        business_sector: form.has_business ? form.business_sector || null : null,
        business_formalization: form.has_business ? form.business_formalization || null : null,
        date_of_birth: form.date_of_birth || null,
        updated_at: new Date().toISOString(),
      };

      if (existingId) {
        const { error } = await supabase
          .from('user_socioeconomic_data')
          .update(payload)
          .eq('id', existingId);
        if (error) throw error;
      } else {
        if (registration.user_id) {
          payload.user_id = registration.user_id;
        } else {
          payload.registration_id = registration.id;
        }
        const { error } = await supabase
          .from('user_socioeconomic_data')
          .insert(payload as any);
        if (error) throw error;
      }

      toast({ title: 'Dados socioeconômicos salvos!' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sel = (field: keyof FormState, options: string[]) => (
    <Select
      value={(form[field] as string) || NO_VALUE}
      onValueChange={(v) => setForm({ ...form, [field]: v === NO_VALUE ? '' : v })}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_VALUE}>— Não informado —</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dados Socioeconômicos
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground">{registration.full_name}</span>
          {existingId && <Badge variant="outline" className="text-xs">Já preenchido</Badge>}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Raça / Etnia</Label>
                {sel('race_ethnicity', RACE_OPTIONS)}
              </div>
              <div className="space-y-1.5">
                <Label>Identidade de gênero</Label>
                {sel('gender_identity', GENDER_OPTIONS)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Renda mensal</Label>
                {sel('monthly_income', INCOME_OPTIONS)}
              </div>
              <div className="space-y-1.5">
                <Label>Escolaridade</Label>
                {sel('education_level', EDUCATION_OPTIONS)}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Possui negócio?</Label>
                <Switch
                  checked={form.has_business}
                  onCheckedChange={(v) => setForm({ ...form, has_business: v })}
                />
              </div>

              {form.has_business && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Setor do negócio</Label>
                    {sel('business_sector', BUSINESS_SECTOR_OPTIONS)}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Formalização</Label>
                    {sel('business_formalization', FORMALIZATION_OPTIONS)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

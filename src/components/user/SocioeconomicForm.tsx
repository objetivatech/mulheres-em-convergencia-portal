import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save } from 'lucide-react';

const socioeconomicSchema = z.object({
  race_ethnicity: z.string().optional(),
  gender_identity: z.string().optional(),
  date_of_birth: z.string().optional(),
  marital_status: z.string().optional(),
  education_level: z.string().optional(),
  employment_status: z.string().optional(),
  monthly_income: z.string().optional(),
  housing_situation: z.string().optional(),
  household_size: z.coerce.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  neighborhood: z.string().optional(),
  has_business: z.boolean().optional(),
  business_sector: z.string().optional(),
  business_formalization: z.string().optional(),
  business_monthly_revenue: z.string().optional(),
  years_in_business: z.coerce.number().optional(),
  how_discovered: z.string().optional(),
  motivation: z.string().optional(),
});

type SocioeconomicFormData = z.infer<typeof socioeconomicSchema>;

const raceOptions = [
  'Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar'
];

const genderOptions = [
  'Mulher cisgênero', 'Mulher transgênero', 'Não-binário', 'Prefiro não informar'
];

const maritalOptions = [
  'Solteira', 'Casada', 'União estável', 'Divorciada', 'Viúva', 'Prefiro não informar'
];

const educationOptions = [
  'Ensino fundamental incompleto', 'Ensino fundamental completo',
  'Ensino médio incompleto', 'Ensino médio completo',
  'Ensino superior incompleto', 'Ensino superior completo',
  'Pós-graduação', 'Mestrado', 'Doutorado'
];

const employmentOptions = [
  'Empregada CLT', 'Servidora pública', 'Autônoma/Freelancer',
  'Empreendedora', 'Desempregada', 'Aposentada', 'Estudante', 'Outro'
];

const incomeOptions = [
  'Até R$ 1.412', 'R$ 1.413 a R$ 2.824', 'R$ 2.825 a R$ 5.648',
  'R$ 5.649 a R$ 11.296', 'R$ 11.297 a R$ 22.592', 'Acima de R$ 22.592',
  'Prefiro não informar'
];

const housingOptions = [
  'Casa própria', 'Aluguel', 'Financiamento', 'Cedida/Emprestada', 'Outro'
];

const formalizationOptions = [
  'MEI', 'ME', 'EPP', 'LTDA', 'SA', 'Informal', 'Outro'
];

const revenueOptions = [
  'Até R$ 5.000', 'R$ 5.001 a R$ 15.000', 'R$ 15.001 a R$ 30.000',
  'R$ 30.001 a R$ 81.000', 'Acima de R$ 81.000', 'Prefiro não informar'
];

const challengeOptions = [
  'Acesso a crédito', 'Gestão financeira', 'Marketing e vendas',
  'Capacitação técnica', 'Networking', 'Mentoria',
  'Formalização', 'Tecnologia', 'Equilíbrio vida pessoal/profissional'
];

const howDiscoveredOptions = [
  'Redes sociais', 'Indicação de amiga', 'Google/Busca',
  'Evento', 'Imprensa', 'Outro'
];

export const SocioeconomicForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, reset } = useForm<SocioeconomicFormData>({
    resolver: zodResolver(socioeconomicSchema),
  });

  const hasBusiness = watch('has_business');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_socioeconomic_data')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        reset({
          race_ethnicity: data.race_ethnicity || '',
          gender_identity: data.gender_identity || '',
          date_of_birth: data.date_of_birth || '',
          marital_status: data.marital_status || '',
          education_level: data.education_level || '',
          employment_status: data.employment_status || '',
          monthly_income: data.monthly_income || '',
          housing_situation: data.housing_situation || '',
          household_size: data.household_size || undefined,
          city: data.city || '',
          state: data.state || '',
          neighborhood: data.neighborhood || '',
          has_business: data.has_business || false,
          business_sector: data.business_sector || '',
          business_formalization: data.business_formalization || '',
          business_monthly_revenue: data.business_monthly_revenue || '',
          years_in_business: data.years_in_business || undefined,
          how_discovered: data.how_discovered || '',
          motivation: data.motivation || '',
        });
        setSelectedChallenges(data.main_challenges || []);
        setAreasOfInterest(data.areas_of_interest || []);
      }
    } catch (error) {
      console.error('Error fetching socioeconomic data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (formData: SocioeconomicFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        ...formData,
        household_size: formData.household_size || null,
        years_in_business: formData.years_in_business || null,
        main_challenges: selectedChallenges,
        areas_of_interest: areasOfInterest,
      };

      const { error } = await supabase
        .from('user_socioeconomic_data')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Dados socioeconômicos salvos com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleChallenge = (challenge: string) => {
    setSelectedChallenges(prev =>
      prev.includes(challenge) ? prev.filter(c => c !== challenge) : [...prev, challenge]
    );
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const SelectField = ({ label, name, options }: { label: string; name: keyof SocioeconomicFormData; options: string[] }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={watch(name) as string || ''} onValueChange={(v) => setValue(name, v)}>
        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
          <CardDescription>Informações de perfil demográfico</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Raça / Etnia" name="race_ethnicity" options={raceOptions} />
          <SelectField label="Identidade de Gênero" name="gender_identity" options={genderOptions} />
          <div className="space-y-1">
            <Label>Data de Nascimento</Label>
            <Input type="date" {...register('date_of_birth')} />
          </div>
          <SelectField label="Estado Civil" name="marital_status" options={maritalOptions} />
        </CardContent>
      </Card>

      {/* Educação e Trabalho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Educação e Trabalho</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Escolaridade" name="education_level" options={educationOptions} />
          <SelectField label="Situação Profissional" name="employment_status" options={employmentOptions} />
          <SelectField label="Renda Mensal" name="monthly_income" options={incomeOptions} />
        </CardContent>
      </Card>

      {/* Moradia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Moradia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Situação de Moradia" name="housing_situation" options={housingOptions} />
          <div className="space-y-1">
            <Label>Pessoas no Domicílio</Label>
            <Input type="number" min={1} max={20} {...register('household_size')} />
          </div>
          <div className="space-y-1">
            <Label>Cidade</Label>
            <Input {...register('city')} placeholder="Sua cidade" />
          </div>
          <div className="space-y-1">
            <Label>Estado</Label>
            <Input {...register('state')} placeholder="UF" maxLength={2} />
          </div>
          <div className="space-y-1">
            <Label>Bairro</Label>
            <Input {...register('neighborhood')} placeholder="Seu bairro" />
          </div>
        </CardContent>
      </Card>

      {/* Empreendedorismo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Empreendedorismo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_business"
              checked={!!hasBusiness}
              onCheckedChange={(checked) => setValue('has_business', !!checked)}
            />
            <Label htmlFor="has_business" className="cursor-pointer">Possuo um negócio</Label>
          </div>

          {hasBusiness && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <Label>Setor do Negócio</Label>
                <Input {...register('business_sector')} placeholder="Ex: Alimentação, Moda, Tecnologia..." />
              </div>
              <SelectField label="Formalização" name="business_formalization" options={formalizationOptions} />
              <SelectField label="Faturamento Mensal" name="business_monthly_revenue" options={revenueOptions} />
              <div className="space-y-1">
                <Label>Anos de Operação</Label>
                <Input type="number" min={0} max={100} {...register('years_in_business')} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desafios e Motivação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desafios e Motivação</CardTitle>
          <CardDescription>Marque seus principais desafios atuais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {challengeOptions.map(challenge => (
              <div key={challenge} className="flex items-center space-x-2">
                <Checkbox
                  id={`challenge-${challenge}`}
                  checked={selectedChallenges.includes(challenge)}
                  onCheckedChange={() => toggleChallenge(challenge)}
                />
                <Label htmlFor={`challenge-${challenge}`} className="text-sm cursor-pointer">{challenge}</Label>
              </div>
            ))}
          </div>

          <SelectField label="Como conheceu o MeC?" name="how_discovered" options={howDiscoveredOptions} />

          <div className="space-y-1">
            <Label>Motivação para participar</Label>
            <Textarea
              {...register('motivation')}
              placeholder="O que te motivou a participar da comunidade?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full md:w-auto">
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Dados Socioeconômicos</>}
      </Button>
    </form>
  );
};

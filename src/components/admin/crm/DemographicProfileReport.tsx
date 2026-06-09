import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Row {
  id: string;
  period_start: string;
  region: string | null;
  demographic: Record<string, any> | null;
  created_at: string;
}

const DIMENSIONS: Array<{ key: string; label: string }> = [
  { key: 'race_ethnicity', label: 'Raça / Etnia' },
  { key: 'gender_identity', label: 'Identidade de Gênero' },
  { key: 'education_level', label: 'Escolaridade' },
  { key: 'monthly_income', label: 'Renda Mensal' },
  { key: 'employment_status', label: 'Situação Profissional' },
  { key: 'age_range', label: 'Faixa Etária' },
];

function aggregate(rows: Row[], key: string): Array<{ label: string; count: number; pct: number }> {
  const total = rows.length;
  const counts: Record<string, number> = {};
  rows.forEach((r) => {
    const v = (r.demographic?.[key] as string) || 'Não informado';
    counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, pct: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

function downloadCsv(rows: Row[]) {
  const headers = [
    'period_start', 'region', 'user_id',
    'race_ethnicity', 'gender_identity', 'education_level',
    'monthly_income', 'employment_status', 'housing_situation',
    'has_business', 'business_sector', 'age_range',
  ];
  const lines = [headers.join(',')];
  rows.forEach((r) => {
    const d = r.demographic || {};
    lines.push(headers.map((h) => {
      const v = h === 'period_start' ? r.period_start : h === 'region' ? (r.region || '') : (d[h] ?? '');
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `perfil-socioeconomico-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const DemographicProfileReport = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('social_impact_metrics')
        .select('id, period_start, region, demographic, created_at')
        .eq('metric_type', 'demographic_profile')
        .order('period_start', { ascending: false })
        .limit(2000);
      if (error) {
        toast.error('Não foi possível carregar o perfil socioeconômico');
      } else {
        setRows((data || []) as Row[]);
      }
      setLoading(false);
    })();
  }, []);

  const total = rows.length;
  const aggregates = useMemo(
    () => DIMENSIONS.map((d) => ({ ...d, data: aggregate(rows, d.key) })),
    [rows]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Perfil Socioeconômico das Associadas
          </CardTitle>
          <CardDescription>
            Agregado a partir do formulário socioeconômico ({total} respondentes)
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCsv(rows)}
          disabled={!rows.length}
        >
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há respostas do formulário socioeconômico. Os dados aparecerão aqui assim que
            as associadas preencherem em "Meu Painel → Socioeconômico".
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aggregates.map((dim) => (
              <div key={dim.key}>
                <h4 className="font-semibold text-sm mb-2">{dim.label}</h4>
                <ul className="space-y-1.5">
                  {dim.data.map((row) => (
                    <li key={row.label} className="text-sm">
                      <div className="flex justify-between mb-0.5">
                        <span className="truncate pr-2">{row.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {row.count} ({row.pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
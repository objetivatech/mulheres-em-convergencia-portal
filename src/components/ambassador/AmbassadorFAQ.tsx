import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Loader2 } from 'lucide-react';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
};

type CategoryGroup = {
  [key: string]: FAQItem[];
};

const CATEGORY_LABELS: { [key: string]: string } = {
  'sobre': '📋 Sobre o Programa',
  'indicacao': '🔗 Como Indicar',
  'pagamento': '💰 Pagamentos e Comissões',
  'rastreamento': '📊 Rastreamento',
  'dicas': '💡 Dicas de Sucesso',
};

const CATEGORY_ORDER = ['sobre', 'indicacao', 'pagamento', 'rastreamento', 'dicas'];

export const AmbassadorFAQ = () => {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const { data, error } = await supabase
        .from('ambassador_faq_items')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setFaqItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group FAQs by category
  const groupedFAQs: CategoryGroup = faqItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as CategoryGroup);

  // Sort categories by predefined order
  const sortedCategories = CATEGORY_ORDER.filter(cat => groupedFAQs[cat]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (faqItems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma pergunta frequente disponível no momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Perguntas Frequentes</CardTitle>
            <CardDescription>
              Tire suas dúvidas sobre o programa de embaixadoras
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedCategories.map((category) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {CATEGORY_LABELS[category] || category}
              </h3>
              <Badge variant="outline" className="text-xs">
                {groupedFAQs[category].length}
              </Badge>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {groupedFAQs[category].map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-lg mb-2 px-4">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 whitespace-pre-line">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';

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
  'sobre': '📋 Sobre a Assinatura',
  'pagamento': '💳 Processo de Pagamento',
  'preenchimento': '📝 Como Preencher Corretamente',
  'erros': '🔧 Soluções para Erros Comuns',
  'especiais': '👥 Casos Especiais',
  'vantagens': '🎁 Vantagens de Ser Assinante',
};

export const FAQSection: React.FC = () => {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_items')
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando perguntas frequentes...</p>
        </div>
      </div>
    );
  }

  if (faqItems.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqItems.map((item) => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": { "@type": "Answer", "text": item.answer },
            })),
          })}
        </script>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <HelpCircle className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
          <p className="text-muted-foreground text-lg">
            Tire suas dúvidas sobre como assinar, preencher o formulário e aproveitar todos os benefícios.
          </p>
        </div>

        {/* FAQ by Category */}
        <div className="space-y-8">
          {Object.entries(groupedFAQs).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {CATEGORY_LABELS[category] || category}
                <Badge variant="secondary" className="text-xs">
                  {items.length} {items.length === 1 ? 'pergunta' : 'perguntas'}
                </Badge>
              </h3>
              
              <Accordion type="single" collapsible className="w-full">
                {items.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left hover:text-primary">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Ainda tem dúvidas?</h3>
          <p className="text-muted-foreground mb-4">
            Nossa equipe está pronta para ajudar você a escolher o melhor plano e resolver qualquer questão.
          </p>
          <a 
            href="/contato" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          >
            Falar Conosco
          </a>
        </div>
      </div>
    </div>
  );
};

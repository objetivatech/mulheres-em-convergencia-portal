import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Image as ImageIcon, Tag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessMenu } from '@/hooks/useBusinessMenu';

interface MenuDisplayProps {
  businessId: string;
  className?: string;
}

const highlightLabels: Record<string, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  popular: { label: 'Mais Vendido', color: 'bg-orange-100 text-orange-700' },
  promocao: { label: 'Promoção', color: 'bg-red-100 text-red-700' },
  destaque: { label: 'Destaque', color: 'bg-purple-100 text-purple-700' },
  vegano: { label: 'Vegano', color: 'bg-green-100 text-green-700' },
  vegetariano: { label: 'Vegetariano', color: 'bg-emerald-100 text-emerald-700' },
};

const formatPrice = (price: number | null) => {
  if (price === null) return 'Consultar';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

export const MenuDisplay: React.FC<MenuDisplayProps> = ({ businessId, className }) => {
  const { categories, items, loading, hasMenu } = useBusinessMenu(businessId);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!hasMenu) {
    return null;
  }

  // Se não houver categorias, exibir todos os itens
  if (categories.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Produtos e Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Obter itens da categoria selecionada ou todos se nenhuma selecionada
  const uncategorizedItems = items.filter(item => !item.category_id);
  const allCategoryIds = categories.map(c => c.id);
  
  // Se nenhuma categoria selecionada, selecionar a primeira
  const activeCategory = selectedCategory || categories[0]?.id;
  const filteredItems = items.filter(item => item.category_id === activeCategory);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <UtensilsCrossed className="w-5 h-5 flex-shrink-0" />
          Produtos e Serviços
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <Tabs value={activeCategory} onValueChange={setSelectedCategory} className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
            <div className="inline-flex gap-2 min-w-full sm:min-w-0">
              {categories.map((category) => {
                const itemCount = items.filter(item => item.category_id === category.id).length;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5 text-sm min-h-[36px] flex-shrink-0"
                  >
                    {category.name}
                    <Badge variant="secondary" className="ml-1.5 text-xs">
                      {itemCount}
                    </Badge>
                  </TabsTrigger>
                );
              })}
              {uncategorizedItems.length > 0 && (
                <TabsTrigger
                  value="uncategorized"
                  className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5 text-sm min-h-[36px] flex-shrink-0"
                >
                  Outros
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {uncategorizedItems.length}
                  </Badge>
                </TabsTrigger>
              )}
            </div>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4">
              {category.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">{category.description}</p>
              )}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {items
                  .filter(item => item.category_id === category.id)
                  .map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
              </div>
            </TabsContent>
          ))}

          {uncategorizedItems.length > 0 && (
            <TabsContent value="uncategorized" className="mt-4">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {uncategorizedItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Componente de Card do Item para exibição pública
const MenuItemCard: React.FC<{
  item: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    image_url: string | null;
    is_highlighted: boolean;
    highlight_label: string | null;
  };
}> = ({ item }) => {
  const highlight = item.highlight_label ? highlightLabels[item.highlight_label] : null;

  return (
    <div className="flex gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      {/* Imagem */}
      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1 flex-wrap">
            <h4 className="font-medium text-sm sm:text-base leading-tight">{item.name}</h4>
            {item.is_highlighted && highlight && (
              <Badge className={cn('text-[10px] sm:text-xs px-1.5 py-0.5', highlight.color)}>
                {highlight.label}
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {item.description}
            </p>
          )}
        </div>
        
        <div className="mt-auto pt-1">
          <span className="font-semibold text-primary text-sm sm:text-base">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MenuDisplay;

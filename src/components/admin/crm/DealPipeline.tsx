import { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Calendar, User, GripVertical } from 'lucide-react';
import { useCRM, CRMDeal } from '@/hooks/useCRM';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DealStage = 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';

const stageConfig: Record<DealStage, { label: string; color: string; bgColor: string }> = {
  lead: { label: 'Leads', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  contacted: { label: 'Contatados', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  proposal: { label: 'Proposta', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  negotiation: { label: 'Negociação', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  won: { label: 'Ganhos', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  lost: { label: 'Perdidos', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
};

const stages: DealStage[] = ['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];

interface DealCardProps {
  deal: CRMDeal;
  onClick?: () => void;
}

const DealCard = ({ deal, onClick }: DealCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button 
          className="mt-1 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{deal.title}</h4>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium text-foreground">{formatCurrency(deal.value)}</span>
          </div>
          
          {deal.expected_close_date && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(deal.expected_close_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          )}
          
          {deal.product_type && (
            <Badge variant="outline" className="mt-2 text-xs">
              {deal.product_type}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

interface StageColumnProps {
  stage: DealStage;
  deals: CRMDeal[];
  onDealClick: (deal: CRMDeal) => void;
  onAddDeal: () => void;
}

const StageColumn = ({ stage, deals, onDealClick, onAddDeal }: StageColumnProps) => {
  const config = stageConfig[stage];
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className={`flex-1 min-w-[280px] rounded-lg ${config.bgColor}`}>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
          <Badge variant="secondary">{deals.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatCurrency(totalValue)}</p>
      </div>
      
      <div className="p-2 space-y-2 min-h-[400px]">
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard 
              key={deal.id} 
              deal={deal} 
              onClick={() => onDealClick(deal)}
            />
          ))}
        </SortableContext>
        
        {stage === 'lead' && (
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground"
            onClick={onAddDeal}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar negócio
          </Button>
        )}
      </div>
    </div>
  );
};

interface DealPipelineProps {
  onDealClick?: (deal: CRMDeal) => void;
  onAddDeal?: () => void;
}

export const DealPipeline = ({ onDealClick, onAddDeal }: DealPipelineProps) => {
  const { toast } = useToast();
  const { useDeals, useUpdateDeal } = useCRM();
  const { data: deals, isLoading } = useDeals();
  const updateDeal = useUpdateDeal();
  
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getDealsByStage = (stage: DealStage) => {
    return (deals || []).filter(d => d.stage === stage);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which stage the item was dropped in
    const activeItem = deals?.find(d => d.id === activeId);
    if (!activeItem) return;

    // Determine the target stage
    let targetStage: DealStage | null = null;

    // Check if dropped on a stage column
    if (stages.includes(overId as DealStage)) {
      targetStage = overId as DealStage;
    } else {
      // Dropped on another deal - find its stage
      const overItem = deals?.find(d => d.id === overId);
      if (overItem) {
        targetStage = overItem.stage;
      }
    }

    if (targetStage && targetStage !== activeItem.stage) {
      try {
        await updateDeal.mutateAsync({
          id: activeId,
          stage: targetStage,
          won: targetStage === 'won' ? true : targetStage === 'lost' ? false : null,
          closed_at: targetStage === 'won' || targetStage === 'lost' ? new Date().toISOString() : null,
        });
        toast({ title: `Negócio movido para ${stageConfig[targetStage].label}` });
      } catch (error: any) {
        toast({ title: 'Erro ao mover negócio', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over for visual feedback
  };

  const activeDeal = deals?.find(d => d.id === activeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando pipeline...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            deals={getDealsByStage(stage)}
            onDealClick={onDealClick || (() => {})}
            onAddDeal={onAddDeal || (() => {})}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && (
          <div className="bg-card border rounded-lg p-3 shadow-lg">
            <h4 className="font-medium text-sm">{activeDeal.title}</h4>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

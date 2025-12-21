import { useState, useEffect } from 'react';
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
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, DollarSign, Calendar, GripVertical } from 'lucide-react';
import { useCRM, CRMDeal } from '@/hooks/useCRM';
import { usePipelines, PipelineStage } from '@/hooks/usePipelines';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  stage: PipelineStage;
  deals: CRMDeal[];
  onDealClick: (deal: CRMDeal) => void;
  onAddDeal: () => void;
  isFirstStage: boolean;
}

const StageColumn = ({ stage, deals, onDealClick, onAddDeal, isFirstStage }: StageColumnProps) => {
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Mapear cor do stage para classes Tailwind
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { text: string; bg: string }> = {
      '#6b7280': { text: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
      '#3b82f6': { text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      '#8b5cf6': { text: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
      '#f59e0b': { text: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
      '#22c55e': { text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
      '#ef4444': { text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    };
    return colorMap[color] || { text: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' };
  };

  const colors = getColorClasses(stage.color);

  return (
    <div className={`flex-1 min-w-[280px] rounded-lg ${colors.bg}`}>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-semibold ${colors.text}`}>{stage.name}</h3>
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
        
        {isFirstStage && (
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
  pipelineId?: string;
  onPipelineChange?: (pipelineId: string) => void;
}

export const DealPipeline = ({ onDealClick, onAddDeal, pipelineId, onPipelineChange }: DealPipelineProps) => {
  const { toast } = useToast();
  const { useDeals, useUpdateDeal } = useCRM();
  const { usePipelinesList, usePipelineById } = usePipelines();
  
  const { data: pipelines, isLoading: pipelinesLoading } = usePipelinesList();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(pipelineId || null);
  
  // Selecionar primeiro pipeline automaticamente se nenhum selecionado
  useEffect(() => {
    if (!selectedPipelineId && pipelines && pipelines.length > 0) {
      setSelectedPipelineId(pipelines[0].id);
      onPipelineChange?.(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId, onPipelineChange]);

  const { data: currentPipeline, isLoading: pipelineLoading } = usePipelineById(selectedPipelineId || '');
  const { data: allDeals, isLoading: dealsLoading } = useDeals();
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

  // Filtrar deals pelo pipeline selecionado
  const deals = (allDeals || []).filter(d => 
    d.pipeline_id === selectedPipelineId || 
    // Fallback: se deal não tem pipeline_id, mostra no primeiro pipeline
    (!d.pipeline_id && selectedPipelineId === pipelines?.[0]?.id)
  );

  const stages = currentPipeline?.stages || [];

  const getDealsByStage = (stageId: string) => {
    return deals.filter(d => d.stage === stageId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overId = over.id as string;

    const activeItem = deals.find(d => d.id === activeIdStr);
    if (!activeItem) return;

    // Determine the target stage
    let targetStage: string | null = null;
    const stageIds = stages.map(s => s.id);

    // Check if dropped on a stage column
    if (stageIds.includes(overId)) {
      targetStage = overId;
    } else {
      // Dropped on another deal - find its stage
      const overItem = deals.find(d => d.id === overId);
      if (overItem) {
        targetStage = overItem.stage;
      }
    }

    if (targetStage && targetStage !== activeItem.stage) {
      try {
        // Determinar se é estágio final (ganho/perdido)
        const stageIndex = stages.findIndex(s => s.id === targetStage);
        const isLastStage = stageIndex === stages.length - 1;
        const isSecondLastStage = stageIndex === stages.length - 2;
        
        // Para pipelines com padrão de "ganho/perdido" nos últimos 2 estágios
        const isWonStage = isSecondLastStage && stages.length > 2;
        const isLostStage = isLastStage;

        await updateDeal.mutateAsync({
          id: activeIdStr,
          stage: targetStage,
          pipeline_id: selectedPipelineId || undefined,
          won: isWonStage ? true : isLostStage ? false : null,
          closed_at: isWonStage || isLostStage ? new Date().toISOString() : null,
        });
        
        const stageName = stages.find(s => s.id === targetStage)?.name || targetStage;
        toast({ title: `Negócio movido para ${stageName}` });
      } catch (error: any) {
        toast({ title: 'Erro ao mover negócio', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over for visual feedback
  };

  const handlePipelineChange = (newPipelineId: string) => {
    setSelectedPipelineId(newPipelineId);
    onPipelineChange?.(newPipelineId);
  };

  const activeDeal = deals.find(d => d.id === activeId);

  if (pipelinesLoading || pipelineLoading || dealsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando pipeline...</div>
      </div>
    );
  }

  if (!pipelines || pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground">Nenhum pipeline configurado.</p>
        <p className="text-sm text-muted-foreground">Use o botão "Configurar Pipelines" para criar seu primeiro pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Pipeline */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Pipeline:</label>
        <Select value={selectedPipelineId || ''} onValueChange={handlePipelineChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione um pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentPipeline?.description && (
          <span className="text-sm text-muted-foreground">{currentPipeline.description}</span>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage, index) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={getDealsByStage(stage.id)}
              onDealClick={onDealClick || (() => {})}
              onAddDeal={onAddDeal || (() => {})}
              isFirstStage={index === 0}
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
    </div>
  );
};

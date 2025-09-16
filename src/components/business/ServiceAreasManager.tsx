import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBusinessServiceAreas } from '@/hooks/useBusinessServiceAreas';
import { MapPin, Plus, Trash2, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ServiceAreasManagerProps {
  businessId: string;
}

export const ServiceAreasManager: React.FC<ServiceAreasManagerProps> = ({ businessId }) => {
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaType, setNewAreaType] = useState<'city' | 'neighborhood'>('city');
  const [newAreaState, setNewAreaState] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { serviceAreas, loading, addServiceArea, removeServiceArea } = useBusinessServiceAreas(businessId);

  // Estados brasileiros
  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleAddArea = async () => {
    if (!newAreaName.trim() || !newAreaState) return;

    setIsAdding(true);
    const success = await addServiceArea({
      area_type: newAreaType,
      area_name: newAreaName.trim(),
      state: newAreaState,
    });

    if (success) {
      setNewAreaName('');
      setNewAreaType('city');
      setNewAreaState('');
    }
    setIsAdding(false);
  };

  const handleRemoveArea = async (areaId: string) => {
    await removeServiceArea(areaId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Áreas de Atendimento</span>
        </CardTitle>
        <CardDescription>
          Defina as cidades e bairros onde seu negócio atende
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar Nova Área */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium">Adicionar Nova Área</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={newAreaType} onValueChange={(value: 'city' | 'neighborhood') => setNewAreaType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="city">Cidade</SelectItem>
                <SelectItem value="neighborhood">Bairro</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={newAreaType === 'city' ? 'Nome da cidade' : 'Nome do bairro'}
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
            />

            <Select value={newAreaState} onValueChange={setNewAreaState}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAddArea} 
              disabled={!newAreaName.trim() || !newAreaState || isAdding}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>

        {/* Lista de Áreas */}
        <div>
          <h4 className="font-medium mb-4">Áreas Cadastradas</h4>
          
          {serviceAreas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {serviceAreas.map((area) => (
                <div key={area.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge variant={area.area_type === 'city' ? 'default' : 'secondary'}>
                      {area.area_type === 'city' ? 'Cidade' : 'Bairro'}
                    </Badge>
                    <div>
                      <div className="font-medium text-sm">{area.area_name}</div>
                      <div className="text-xs text-muted-foreground">{area.state}</div>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Área de Atendimento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover "{area.area_name}" das áreas de atendimento? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveArea(area.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma área de atendimento cadastrada.</p>
              <p className="text-sm">
                Adicione as cidades e bairros onde seu negócio atende para aparecer em buscas localizadas.
              </p>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 Dica Importante
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Adicione todas as cidades e bairros onde você atende para que clientes dessas regiões 
            possam encontrar seu negócio mais facilmente nas buscas do diretório.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
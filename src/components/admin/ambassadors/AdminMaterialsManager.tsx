import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Image as ImageIcon, 
  FileText, 
  MessageSquare, 
  Instagram,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
  Download
} from 'lucide-react';
import { useAmbassadorMaterials, AmbassadorMaterial, MaterialType } from '@/hooks/useAmbassadorMaterials';

const TYPE_LABELS: Record<MaterialType, { label: string; icon: React.ReactNode }> = {
  banner: { label: 'Banners', icon: <ImageIcon className="h-4 w-4" /> },
  pdf: { label: 'PDFs', icon: <FileText className="h-4 w-4" /> },
  whatsapp_template: { label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
  instagram_template: { label: 'Instagram', icon: <Instagram className="h-4 w-4" /> },
};

const CATEGORY_OPTIONS: Record<MaterialType, string[]> = {
  banner: ['horizontal', 'quadrado', 'stories', 'feed'],
  pdf: ['apresentacao', 'manual', 'guia'],
  whatsapp_template: ['convite', 'beneficios', 'pessoal', 'followup'],
  instagram_template: ['stories', 'feed', 'reels'],
};

export const AdminMaterialsManager = () => {
  const [activeTab, setActiveTab] = useState<MaterialType>('banner');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<AmbassadorMaterial | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const { 
    useAllMaterials, 
    useCreateMaterial, 
    useUpdateMaterial, 
    useDeleteMaterial,
    uploadFile,
  } = useAmbassadorMaterials();

  const { data: materials = [], isLoading } = useAllMaterials();
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'banner' as MaterialType,
    category: '',
    content: '',
    dimensions: '',
    active: true,
  });

  const filteredMaterials = materials.filter(m => m.type === activeTab);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const folder = activeTab === 'pdf' ? 'pdfs' : 'banners';
      const url = await uploadFile(file, folder);
      setUploadedFileUrl(url);
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  }, [activeTab, uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: activeTab === 'pdf' 
      ? { 'application/pdf': ['.pdf'] }
      : { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleOpenDialog = (material?: AmbassadorMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        title: material.title,
        description: material.description || '',
        type: material.type as MaterialType,
        category: material.category || '',
        content: material.content || '',
        dimensions: material.dimensions || '',
        active: material.active,
      });
      setUploadedFileUrl(material.file_url);
    } else {
      setEditingMaterial(null);
      setFormData({
        title: '',
        description: '',
        type: activeTab,
        category: '',
        content: '',
        dimensions: '',
        active: true,
      });
      setUploadedFileUrl(null);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const materialData = {
      ...formData,
      file_url: uploadedFileUrl,
      display_order: editingMaterial?.display_order ?? filteredMaterials.length,
    };

    if (editingMaterial) {
      await updateMutation.mutateAsync({ id: editingMaterial.id, ...materialData });
    } else {
      await createMutation.mutateAsync(materialData as any);
    }

    setIsDialogOpen(false);
    setEditingMaterial(null);
    setUploadedFileUrl(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const handleToggleActive = async (material: AmbassadorMaterial) => {
    await updateMutation.mutateAsync({ 
      id: material.id, 
      active: !material.active 
    });
  };

  const isFileType = activeTab === 'banner' || activeTab === 'pdf';
  const isTextType = activeTab === 'whatsapp_template' || activeTab === 'instagram_template';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Materiais Promocionais</CardTitle>
            <CardDescription>
              Gerencie banners, PDFs e templates de texto para as embaixadoras
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Material
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MaterialType)}>
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(TYPE_LABELS).map(([type, { label, icon }]) => (
              <TabsTrigger key={type} value={type} className="gap-2">
                {icon}
                <span className="hidden sm:inline">{label}</span>
                <Badge variant="secondary" className="ml-1">
                  {materials.filter(m => m.type === type).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(TYPE_LABELS).map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum material cadastrado</p>
                  <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar primeiro material
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMaterials.map((material) => (
                    <div 
                      key={material.id}
                      className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      
                      {/* Preview */}
                      {material.file_url && (
                        <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                          {material.type === 'pdf' ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          ) : (
                            <img 
                              src={material.file_url} 
                              alt={material.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{material.title}</h4>
                          {material.category && (
                            <Badge variant="outline" className="text-xs">
                              {material.category}
                            </Badge>
                          )}
                          {material.dimensions && (
                            <Badge variant="secondary" className="text-xs">
                              {material.dimensions}
                            </Badge>
                          )}
                        </div>
                        {material.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {material.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Downloads: {material.download_count}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={material.active}
                          onCheckedChange={() => handleToggleActive(material)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDialog(material)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteConfirm(material.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Editar Material' : 'Novo Material'}
            </DialogTitle>
            <DialogDescription>
              {isFileType 
                ? 'Faça upload de um arquivo e preencha as informações'
                : 'Crie um template de texto para as embaixadoras'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Banner Stories 1080x1920"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS[activeTab]?.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição do material"
              />
            </div>

            {activeTab === 'banner' && (
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensões</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                  placeholder="Ex: 1080x1920"
                />
              </div>
            )}

            {/* File Upload for banners and PDFs */}
            {isFileType && (
              <div className="space-y-2">
                <Label>Arquivo</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p>Enviando arquivo...</p>
                    </div>
                  ) : uploadedFileUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      {activeTab === 'pdf' ? (
                        <FileText className="h-12 w-12 text-primary" />
                      ) : (
                        <img 
                          src={uploadedFileUrl} 
                          alt="Preview" 
                          className="max-h-32 rounded"
                        />
                      )}
                      <p className="text-sm text-muted-foreground">
                        Clique ou arraste para substituir
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p>Arraste um arquivo ou clique para selecionar</p>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === 'pdf' ? 'PDF até 10MB' : 'PNG, JPG ou WebP até 10MB'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text content for templates */}
            {isTextType && (
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo do Template *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o template de texto. Use {{LINK}} para o link de indicação e {{CODIGO}} para o código da embaixadora."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis disponíveis: <code>{'{{LINK}}'}</code> (link completo), <code>{'{{CODIGO}}'}</code> (código de referência)
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, active: v }))}
              />
              <Label htmlFor="active">Material ativo (visível para embaixadoras)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingMaterial ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O material será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

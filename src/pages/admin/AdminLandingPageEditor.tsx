import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGetLandingPage, useCreateLandingPage, useUpdateLandingPage, LandingPageRow } from '@/hooks/useLandingPages';
import { LandingPageContent } from '@/types/landing-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, ExternalLink, Plus, Trash2, GripVertical } from 'lucide-react';
import slugify from 'slugify';
import { toast } from 'sonner';

const AdminLandingPageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'nova';

  const { data: existing, isLoading } = useGetLandingPage(isNew ? undefined : id);
  const createMutation = useCreateLandingPage();
  const updateMutation = useUpdateLandingPage();

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [active, setActive] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sectionsEnabled, setSectionsEnabled] = useState<Record<string, boolean>>({
    hero: true, painPoints: true, method: true, pillars: true,
    included: true, targetAudience: true, transformation: true,
    eventDetails: true, investment: true, testimonials: true,
  });
  const [content, setContent] = useState<LandingPageContent | null>(null);

  // Initialize from existing or URL params
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setSlug(existing.slug);
      setStatus(existing.status);
      setActive(existing.active);
      setFeatured(existing.featured);
      setSeoTitle(existing.seo_title || '');
      setSeoDescription(existing.seo_description || '');
      setImageUrl(existing.image_url || '');
      setSectionsEnabled(existing.sections_enabled || sectionsEnabled);
      setContent(existing.content);
    } else if (isNew) {
      const paramTitle = searchParams.get('title') || '';
      const paramSlug = searchParams.get('slug') || '';
      setTitle(paramTitle);
      setSlug(paramSlug);
    }
  }, [existing, isNew, searchParams]);

  const updateContent = (path: string, value: any) => {
    setContent(prev => {
      if (!prev) return prev;
      const keys = path.split('.');
      const newContent = JSON.parse(JSON.stringify(prev));
      let obj = newContent;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newContent;
    });
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Título e slug são obrigatórios');
      return;
    }

    if (isNew) {
      const result = await createMutation.mutateAsync({ title, slug });
      // After creation, update with full content
      if (content) {
        await updateMutation.mutateAsync({
          id: result.id,
          content,
          seo_title: seoTitle || null,
          seo_description: seoDescription || null,
          image_url: imageUrl || null,
          active,
          featured,
          status,
          sections_enabled: sectionsEnabled,
        } as any);
      }
      navigate(`/admin/landing-pages/${result.id}`, { replace: true });
    } else if (id) {
      updateMutation.mutate({
        id,
        title,
        slug,
        content,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        image_url: imageUrl || null,
        active,
        featured,
        status,
        sections_enabled: sectionsEnabled,
      } as any);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!isNew && isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isNew ? 'Nova LP' : `Editar: ${title}`} - Admin</title>
      </Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/landing-pages')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{isNew ? 'Nova Landing Page' : 'Editar Landing Page'}</h1>
              </div>
              <div className="flex gap-2">
                {!isNew && (
                  <Button variant="outline" onClick={() => window.open(`/lp/${slug}`, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Preview
                  </Button>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="geral">
              <TabsList className="grid grid-cols-4 lg:grid-cols-6 mb-6">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
                <TabsTrigger value="pilares">Pilares</TabsTrigger>
                <TabsTrigger value="evento">Evento</TabsTrigger>
                <TabsTrigger value="depoimentos">Depoimentos</TabsTrigger>
              </TabsList>

              {/* === ABA GERAL === */}
              <TabsContent value="geral">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader><CardTitle>Configurações Gerais</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Título</Label>
                          <Input value={title} onChange={e => { setTitle(e.target.value); if (isNew) setSlug(slugify(e.target.value, { lower: true, strict: true })); }} />
                        </div>
                        <div>
                          <Label>Slug (URL)</Label>
                          <Input value={slug} onChange={e => setSlug(e.target.value)} />
                          <p className="text-xs text-muted-foreground mt-1">/lp/{slug}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Status</Label>
                          <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="published">Publicada</SelectItem>
                              <SelectItem value="archived">Arquivada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch checked={active} onCheckedChange={setActive} />
                          <Label>Ativa</Label>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch checked={featured} onCheckedChange={setFeatured} />
                          <Label>Destaque</Label>
                        </div>
                      </div>
                      <div>
                        <Label>URL da Imagem de Capa</Label>
                        <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Título SEO</Label>
                        <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="Título para mecanismos de busca" />
                        <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/60 caracteres</p>
                      </div>
                      <div>
                        <Label>Descrição SEO</Label>
                        <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="Descrição para mecanismos de busca" />
                        <p className="text-xs text-muted-foreground mt-1">{seoDescription.length}/160 caracteres</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Produto</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nome do Produto</Label>
                          <Input value={content?.product?.name || ''} onChange={e => updateContent('product.name', e.target.value)} />
                        </div>
                        <div>
                          <Label>Tagline</Label>
                          <Input value={content?.product?.tagline || ''} onChange={e => updateContent('product.tagline', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input type="number" step="0.01" value={content?.product?.price || 0} onChange={e => updateContent('product.price', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div>
                          <Label>Formato</Label>
                          <Select value={content?.product?.eventFormat || 'online'} onValueChange={v => updateContent('product.eventFormat', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="presencial">Presencial</SelectItem>
                              <SelectItem value="hibrido">Híbrido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Descrição Pagamento</Label>
                          <Input value={content?.product?.paymentDescription || ''} onChange={e => updateContent('product.paymentDescription', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <Label>Local do Evento</Label>
                        <Input value={content?.product?.eventLocation || ''} onChange={e => updateContent('product.eventLocation', e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Seções Habilitadas</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries({
                          hero: 'Hero', painPoints: 'Pontos de Dor', method: 'Método',
                          pillars: 'Pilares', included: 'Incluído', targetAudience: 'Público-Alvo',
                          transformation: 'Transformação', eventDetails: 'Detalhes do Evento',
                          investment: 'Investimento', testimonials: 'Depoimentos',
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Switch
                              checked={sectionsEnabled[key] ?? true}
                              onCheckedChange={v => setSectionsEnabled(prev => ({ ...prev, [key]: v }))}
                              disabled={key === 'hero' || key === 'investment'}
                            />
                            <Label className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* === ABA HERO === */}
              <TabsContent value="hero">
                <Card>
                  <CardHeader><CardTitle>Seção Hero</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Headline</Label>
                      <Input value={content?.hero?.headline || ''} onChange={e => updateContent('hero.headline', e.target.value)} />
                    </div>
                    <div>
                      <Label>Subheadline</Label>
                      <Input value={content?.hero?.subheadline || ''} onChange={e => updateContent('hero.subheadline', e.target.value)} />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea value={content?.hero?.description || ''} onChange={e => updateContent('hero.description', e.target.value)} rows={4} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>CTA Primário</Label>
                        <Input value={content?.hero?.ctaPrimary || ''} onChange={e => updateContent('hero.ctaPrimary', e.target.value)} />
                      </div>
                      <div>
                        <Label>CTA Secundário</Label>
                        <Input value={content?.hero?.ctaSecondary || ''} onChange={e => updateContent('hero.ctaSecondary', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* === ABA CONTEÚDO (Pain Points, Método, Incluído, Público-Alvo, Transformação) === */}
              <TabsContent value="conteudo">
                <div className="space-y-6">
                  {/* Pain Points */}
                  <Card>
                    <CardHeader><CardTitle>Pontos de Dor</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Título</Label>
                        <Input value={content?.painPoints?.title || ''} onChange={e => updateContent('painPoints.title', e.target.value)} />
                      </div>
                      <div>
                        <Label>Pontos de Dor</Label>
                        {content?.painPoints?.painPoints?.map((pp, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <Input
                              value={pp.text}
                              onChange={e => {
                                const newPPs = [...(content.painPoints.painPoints || [])];
                                newPPs[i] = { ...newPPs[i], text: e.target.value };
                                updateContent('painPoints.painPoints', newPPs);
                              }}
                            />
                            <Button variant="ghost" size="icon" onClick={() => {
                              const newPPs = content.painPoints.painPoints.filter((_, idx) => idx !== i);
                              updateContent('painPoints.painPoints', newPPs);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => {
                          const newPPs = [...(content?.painPoints?.painPoints || []), { text: '' }];
                          updateContent('painPoints.painPoints', newPPs);
                        }}>
                          <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Texto de Fechamento</Label>
                          <Input value={content?.painPoints?.closingText || ''} onChange={e => updateContent('painPoints.closingText', e.target.value)} />
                        </div>
                        <div>
                          <Label>Destaque de Fechamento</Label>
                          <Input value={content?.painPoints?.closingHighlight || ''} onChange={e => updateContent('painPoints.closingHighlight', e.target.value)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Método */}
                  <Card>
                    <CardHeader><CardTitle>Método</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Título</Label>
                        <Input value={content?.method?.title || ''} onChange={e => updateContent('method.title', e.target.value)} />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea value={content?.method?.description || ''} onChange={e => updateContent('method.description', e.target.value)} />
                      </div>
                      <div>
                        <Label>Benefícios</Label>
                        {content?.method?.benefits?.map((b, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <Input
                              value={b}
                              onChange={e => {
                                const newB = [...(content.method.benefits || [])];
                                newB[i] = e.target.value;
                                updateContent('method.benefits', newB);
                              }}
                            />
                            <Button variant="ghost" size="icon" onClick={() => {
                              updateContent('method.benefits', content.method.benefits.filter((_, idx) => idx !== i));
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => {
                          updateContent('method.benefits', [...(content?.method?.benefits || []), '']);
                        }}>
                          <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                      <div>
                        <Label>Texto de Fechamento</Label>
                        <Input value={content?.method?.closingText || ''} onChange={e => updateContent('method.closingText', e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Incluído */}
                  <Card>
                    <CardHeader><CardTitle>O Que Está Incluído</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Título</Label>
                        <Input value={content?.included?.title || ''} onChange={e => updateContent('included.title', e.target.value)} />
                      </div>
                      <div>
                        <Label>Itens</Label>
                        {content?.included?.items?.map((item, i) => (
                          <div key={i} className="flex gap-2 mb-2 items-center">
                            <Input
                              className="flex-1"
                              value={item.text}
                              onChange={e => {
                                const newItems = [...(content.included.items || [])];
                                newItems[i] = { ...newItems[i], text: e.target.value };
                                updateContent('included.items', newItems);
                              }}
                            />
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={item.highlight || false}
                                onCheckedChange={v => {
                                  const newItems = [...(content.included.items || [])];
                                  newItems[i] = { ...newItems[i], highlight: v };
                                  updateContent('included.items', newItems);
                                }}
                              />
                              <span className="text-xs text-muted-foreground">Dest.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={item.isBonus || false}
                                onCheckedChange={v => {
                                  const newItems = [...(content.included.items || [])];
                                  newItems[i] = { ...newItems[i], isBonus: v };
                                  updateContent('included.items', newItems);
                                }}
                              />
                              <span className="text-xs text-muted-foreground">Bônus</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => {
                              updateContent('included.items', content.included.items.filter((_, idx) => idx !== i));
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => {
                          updateContent('included.items', [...(content?.included?.items || []), { text: '' }]);
                        }}>
                          <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Público-Alvo */}
                  <Card>
                    <CardHeader><CardTitle>Público-Alvo</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Título</Label>
                        <Input value={content?.targetAudience?.title || ''} onChange={e => updateContent('targetAudience.title', e.target.value)} />
                      </div>
                      <div>
                        <Label>Perfis</Label>
                        {content?.targetAudience?.profiles?.map((p, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <Input
                              value={p}
                              onChange={e => {
                                const newP = [...(content.targetAudience.profiles || [])];
                                newP[i] = e.target.value;
                                updateContent('targetAudience.profiles', newP);
                              }}
                            />
                            <Button variant="ghost" size="icon" onClick={() => {
                              updateContent('targetAudience.profiles', content.targetAudience.profiles.filter((_, idx) => idx !== i));
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => {
                          updateContent('targetAudience.profiles', [...(content?.targetAudience?.profiles || []), '']);
                        }}>
                          <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                      <div>
                        <Label>CTA</Label>
                        <Input value={content?.targetAudience?.ctaPrimary || ''} onChange={e => updateContent('targetAudience.ctaPrimary', e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transformação */}
                  <Card>
                    <CardHeader><CardTitle>Transformação</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Título</Label>
                        <Input value={content?.transformation?.title || ''} onChange={e => updateContent('transformation.title', e.target.value)} />
                      </div>
                      <div>
                        <Label>Transformações</Label>
                        {content?.transformation?.transformations?.map((t, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <Input
                              value={t.text}
                              onChange={e => {
                                const newT = [...(content.transformation.transformations || [])];
                                newT[i] = { text: e.target.value };
                                updateContent('transformation.transformations', newT);
                              }}
                            />
                            <Button variant="ghost" size="icon" onClick={() => {
                              updateContent('transformation.transformations', content.transformation.transformations.filter((_, idx) => idx !== i));
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => {
                          updateContent('transformation.transformations', [...(content?.transformation?.transformations || []), { text: '' }]);
                        }}>
                          <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                      <div>
                        <Label>CTA</Label>
                        <Input value={content?.transformation?.ctaPrimary || ''} onChange={e => updateContent('transformation.ctaPrimary', e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Investimento */}
                  <Card>
                    <CardHeader><CardTitle>Investimento</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Título</Label>
                        <Input value={content?.investment?.title || ''} onChange={e => updateContent('investment.title', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Preço Formatado</Label>
                          <Input value={content?.investment?.price || ''} onChange={e => updateContent('investment.price', e.target.value)} placeholder="R$ 297,00" />
                        </div>
                        <div>
                          <Label>Valor Numérico</Label>
                          <Input type="number" step="0.01" value={content?.investment?.priceValue || 0} onChange={e => updateContent('investment.priceValue', parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea value={content?.investment?.description || ''} onChange={e => updateContent('investment.description', e.target.value)} />
                      </div>
                      <div>
                        <Label>Texto do CTA</Label>
                        <Input value={content?.investment?.ctaText || ''} onChange={e => updateContent('investment.ctaText', e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* === ABA PILARES === */}
              <TabsContent value="pilares">
                <Card>
                  <CardHeader><CardTitle>Pilares</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Título da Seção</Label>
                      <Input value={content?.pillars?.title || ''} onChange={e => updateContent('pillars.title', e.target.value)} />
                    </div>
                    {content?.pillars?.pillars?.map((pillar, i) => (
                      <Card key={i} className="border-dashed">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">Pilar {i + 1}</span>
                            <Button variant="ghost" size="icon" onClick={() => {
                              updateContent('pillars.pillars', content.pillars.pillars.filter((_, idx) => idx !== i));
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Título</Label>
                              <Input value={pillar.title} onChange={e => {
                                const newP = [...content.pillars.pillars];
                                newP[i] = { ...newP[i], title: e.target.value };
                                updateContent('pillars.pillars', newP);
                              }} />
                            </div>
                            <div>
                              <Label>Subtítulo</Label>
                              <Input value={pillar.subtitle} onChange={e => {
                                const newP = [...content.pillars.pillars];
                                newP[i] = { ...newP[i], subtitle: e.target.value };
                                updateContent('pillars.pillars', newP);
                              }} />
                            </div>
                          </div>
                          <div>
                            <Label>Descrição</Label>
                            <Textarea value={pillar.description} onChange={e => {
                              const newP = [...content.pillars.pillars];
                              newP[i] = { ...newP[i], description: e.target.value };
                              updateContent('pillars.pillars', newP);
                            }} />
                          </div>
                          <div>
                            <Label>Ícone (nome Lucide)</Label>
                            <Input value={pillar.icon || ''} onChange={e => {
                              const newP = [...content.pillars.pillars];
                              newP[i] = { ...newP[i], icon: e.target.value };
                              updateContent('pillars.pillars', newP);
                            }} placeholder="Lightbulb, Target, Sparkles..." />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(content?.pillars?.pillars?.length || 0) < 4 && (
                      <Button variant="outline" onClick={() => {
                        const idx = (content?.pillars?.pillars?.length || 0) + 1;
                        updateContent('pillars.pillars', [
                          ...(content?.pillars?.pillars || []),
                          { id: `pilar-${idx}`, title: `Pilar 0${idx}`, subtitle: 'Subtítulo', description: 'Descrição' },
                        ]);
                      }}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Pilar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* === ABA EVENTO === */}
              <TabsContent value="evento">
                <Card>
                  <CardHeader><CardTitle>Detalhes do Evento</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Título</Label>
                      <Input value={content?.eventDetails?.title || ''} onChange={e => updateContent('eventDetails.title', e.target.value)} />
                    </div>
                    <div>
                      <Label>Datas</Label>
                      <Input value={content?.eventDetails?.dates || ''} onChange={e => updateContent('eventDetails.dates', e.target.value)} />
                    </div>
                    <div>
                      <Label>Duração</Label>
                      <Input value={content?.eventDetails?.duration || ''} onChange={e => updateContent('eventDetails.duration', e.target.value)} />
                    </div>
                    <div>
                      <Label>Formato</Label>
                      <Input value={content?.eventDetails?.format || ''} onChange={e => updateContent('eventDetails.format', e.target.value)} />
                    </div>
                    <div>
                      <Label>Local</Label>
                      <Input value={content?.eventDetails?.location || ''} onChange={e => updateContent('eventDetails.location', e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* === ABA DEPOIMENTOS === */}
              <TabsContent value="depoimentos">
                <Card>
                  <CardHeader><CardTitle>Depoimentos</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Título</Label>
                      <Input value={content?.testimonials?.title || ''} onChange={e => updateContent('testimonials.title', e.target.value)} />
                    </div>
                    <div>
                      <Label>Subtítulo</Label>
                      <Input value={content?.testimonials?.subtitle || ''} onChange={e => updateContent('testimonials.subtitle', e.target.value)} />
                    </div>
                    <div className="space-y-4">
                      {content?.testimonials?.testimonials?.map((t, i) => (
                        <Card key={i} className="border-dashed">
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">Depoimento {i + 1}</span>
                              <Button variant="ghost" size="icon" onClick={() => {
                                const newT = content.testimonials!.testimonials.filter((_, idx) => idx !== i);
                                updateContent('testimonials.testimonials', newT);
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div>
                              <Label>Tipo</Label>
                              <Select value={t.type} onValueChange={v => {
                                const newT = [...content.testimonials!.testimonials];
                                if (v === 'video') {
                                  newT[i] = { type: 'video', youtubeUrl: '', name: (t as any).name || '', role: (t as any).role || '' };
                                } else {
                                  newT[i] = { type: 'text', quote: '', name: (t as any).name || '', role: (t as any).role || '' };
                                }
                                updateContent('testimonials.testimonials', newT);
                              }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="video">Vídeo (YouTube)</SelectItem>
                                  <SelectItem value="text">Texto</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {t.type === 'video' ? (
                              <div>
                                <Label>URL YouTube</Label>
                                <Input value={t.youtubeUrl} onChange={e => {
                                  const newT = [...content.testimonials!.testimonials];
                                  newT[i] = { ...newT[i], youtubeUrl: e.target.value } as any;
                                  updateContent('testimonials.testimonials', newT);
                                }} />
                              </div>
                            ) : (
                              <div>
                                <Label>Depoimento</Label>
                                <Textarea value={(t as any).quote || ''} onChange={e => {
                                  const newT = [...content.testimonials!.testimonials];
                                  newT[i] = { ...newT[i], quote: e.target.value } as any;
                                  updateContent('testimonials.testimonials', newT);
                                }} />
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Nome</Label>
                                <Input value={(t as any).name || ''} onChange={e => {
                                  const newT = [...content.testimonials!.testimonials];
                                  newT[i] = { ...newT[i], name: e.target.value } as any;
                                  updateContent('testimonials.testimonials', newT);
                                }} />
                              </div>
                              <div>
                                <Label>Cargo/Empresa</Label>
                                <Input value={(t as any).role || ''} onChange={e => {
                                  const newT = [...content.testimonials!.testimonials];
                                  newT[i] = { ...newT[i], role: e.target.value } as any;
                                  updateContent('testimonials.testimonials', newT);
                                }} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button variant="outline" onClick={() => {
                        const newTestimonials = [
                          ...(content?.testimonials?.testimonials || []),
                          { type: 'text' as const, quote: '', name: '', role: '' },
                        ];
                        if (!content?.testimonials) {
                          updateContent('testimonials', { title: 'Depoimentos', testimonials: newTestimonials });
                        } else {
                          updateContent('testimonials.testimonials', newTestimonials);
                        }
                      }}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Depoimento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminLandingPageEditor;

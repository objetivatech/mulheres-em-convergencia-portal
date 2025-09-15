import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingReview {
  id: string;
  business_id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  created_at: string;
}

interface BusinessReviewModerationProps {
  businessId: string;
}

const BusinessReviewModeration: React.FC<BusinessReviewModerationProps> = ({ businessId }) => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingReviews();
  }, [businessId]);

  const fetchPendingReviews = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_pending_business_reviews', { business_uuid: businessId });

      if (error) {
        console.error('Error fetching pending reviews:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar avaliações pendentes.",
          variant: "destructive"
        });
        return;
      }

      setPendingReviews(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar avaliações pendentes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const moderateReview = async (reviewId: string, status: 'approved' | 'rejected') => {
    setModerating(reviewId);
    
    try {
      const { data, error } = await supabase
        .rpc('moderate_business_review', {
          review_uuid: reviewId,
          new_status: status
        });

      if (error) {
        throw error;
      }

      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error((data as any).error || 'Erro ao moderar avaliação');
      }

      const result = data as any;
      toast({
        title: "Sucesso",
        description: result?.message || `Avaliação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.`
      });

      // Remove the review from pending list
      setPendingReviews(prev => prev.filter(review => review.id !== reviewId));

    } catch (error: any) {
      console.error('Error moderating review:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao moderar avaliação.",
        variant: "destructive"
      });
    } finally {
      setModerating(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Moderação de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando avaliações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Moderação de Avaliações
          {pendingReviews.length > 0 && (
            <Badge variant="secondary">{pendingReviews.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingReviews.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma avaliação pendente</h3>
            <p className="text-muted-foreground">
              Todas as avaliações foram moderadas. Novas avaliações aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <Card key={review.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{review.reviewer_name}</span>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs">
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Pendente
                    </Badge>
                  </div>

                  {review.title && (
                    <h4 className="font-medium mb-2">{review.title}</h4>
                  )}

                  {review.comment && (
                    <p className="text-muted-foreground mb-4">{review.comment}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => moderateReview(review.id, 'approved')}
                      disabled={moderating === review.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {moderating === review.id ? 'Aprovando...' : 'Aprovar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moderateReview(review.id, 'rejected')}
                      disabled={moderating === review.id}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {moderating === review.id ? 'Rejeitando...' : 'Rejeitar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessReviewModeration;
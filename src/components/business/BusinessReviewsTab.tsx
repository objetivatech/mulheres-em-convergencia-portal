import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, AlertCircle } from 'lucide-react';

interface BusinessReviewsTabProps {
  reviews: any[];
  reviewStats: any;
  loadingReviews: boolean;
}

export const BusinessReviewsTab: React.FC<BusinessReviewsTabProps> = ({
  reviews,
  reviewStats,
  loadingReviews
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="h-5 w-5" />
          <span>Avaliações do Negócio</span>
        </CardTitle>
        <CardDescription>
          Acompanhe o feedback dos seus clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingReviews ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reviewStats ? (
          <div className="space-y-6">
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {reviewStats.averageRating || 0}
                </div>
                <div className="flex justify-center my-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(reviewStats.averageRating) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Nota Média
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {reviewStats.totalReviews}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Total de Avaliações
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Distribuição</div>
                {Object.entries(reviewStats.distribution || {})
                  .reverse()
                  .map(([stars, count]) => (
                    <div key={stars} className="flex items-center justify-between text-sm">
                      <span>{stars} ⭐</span>
                      <span>{count as number}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Lista de Avaliações */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Avaliações Recentes</h4>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {review.reviewer_name}
                              </span>
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.title && (
                              <h5 className="font-medium text-sm mb-1">
                                {review.title}
                              </h5>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma avaliação ainda.</p>
                  <p className="text-sm">
                    Compartilhe o link do seu negócio para receber as primeiras avaliações!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Dados de avaliações não disponíveis.</p>
            <p className="text-sm">
              Certifique-se de que seu negócio esteja publicado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
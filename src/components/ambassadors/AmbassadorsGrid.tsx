import { usePublicAmbassadors } from '@/hooks/usePublicAmbassadors';
import { AmbassadorCard } from './AmbassadorCard';
import { Skeleton } from '@/components/ui/skeleton';

export function AmbassadorsGrid() {
  const { data: ambassadors, isLoading, error } = usePublicAmbassadors();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <div className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Não foi possível carregar as embaixadoras. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  if (!ambassadors || ambassadors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Em breve você conhecerá nossas embaixadoras!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ambassadors.map((ambassador) => (
        <AmbassadorCard key={ambassador.id} ambassador={ambassador} />
      ))}
    </div>
  );
}

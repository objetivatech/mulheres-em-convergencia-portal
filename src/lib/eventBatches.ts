import type { EventTicketBatch } from '@/hooks/useEvents';

export type BatchStatus = 'upcoming' | 'active' | 'ended' | 'sold_out' | 'inactive';

export const getBatchStatus = (batch: EventTicketBatch, now: Date = new Date()): BatchStatus => {
  if (!batch.active) return 'inactive';
  if (batch.starts_at && new Date(batch.starts_at) > now) return 'upcoming';
  if (batch.ends_at && new Date(batch.ends_at) < now) return 'ended';
  if (batch.quantity !== null && batch.quantity !== undefined && (batch.sold_count || 0) >= batch.quantity) {
    return 'sold_out';
  }
  return 'active';
};

export const batchStatusLabel = (status: BatchStatus): string => {
  switch (status) {
    case 'upcoming': return 'Em breve';
    case 'active': return 'Disponível';
    case 'ended': return 'Encerrado';
    case 'sold_out': return 'Esgotado';
    case 'inactive': return 'Indisponível';
  }
};

/**
 * Picks the active batch (sellable now). Sorted by display_order ASC, price ASC.
 * Returns null if no batch is currently sellable.
 */
export const pickActiveBatch = (
  batches: EventTicketBatch[] | undefined | null,
  now: Date = new Date()
): EventTicketBatch | null => {
  if (!batches || batches.length === 0) return null;
  const sellable = batches
    .filter((b) => getBatchStatus(b, now) === 'active')
    .sort((a, b) => {
      const ord = (a.display_order ?? 0) - (b.display_order ?? 0);
      if (ord !== 0) return ord;
      return (a.price || 0) - (b.price || 0);
    });
  return sellable[0] || null;
};

export const sortBatchesForDisplay = (batches: EventTicketBatch[] | undefined | null): EventTicketBatch[] => {
  if (!batches) return [];
  return [...batches].sort((a, b) => {
    const ord = (a.display_order ?? 0) - (b.display_order ?? 0);
    if (ord !== 0) return ord;
    return new Date(a.starts_at || 0).getTime() - new Date(b.starts_at || 0).getTime();
  });
};

export const formatBatchPrice = (price: number): string =>
  price <= 0 ? 'Gratuito' : `R$ ${Number(price).toFixed(2)}`;
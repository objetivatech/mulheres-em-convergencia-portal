import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  views_count: number;
  clicks_count: number;
  contacts_count: number;
  reviews_count: number;
  search_appearances: number;
  map_clicks: number;
  date: string;
}

export const useBusinessAnalytics = (businessId: string | null) => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Get analytics data for the last 30 days
        const { data, error } = await supabase
          .from('business_analytics')
          .select('*')
          .eq('business_id', businessId)
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) throw error;

        setAnalytics(data || []);
      } catch (error: any) {
        console.error('Error fetching analytics:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [businessId]);

  // Track a view
  const trackView = async () => {
    if (!businessId) return;
    
    try {
      await supabase.rpc('update_business_analytics', {
        business_uuid: businessId,
        metric_name: 'views',
        increment_by: 1
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  // Track a click
  const trackClick = async (type: 'website' | 'phone' | 'whatsapp' | 'email') => {
    if (!businessId) return;
    
    try {
      await supabase.rpc('update_business_analytics', {
        business_uuid: businessId,
        metric_name: 'clicks',
        increment_by: 1
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  // Calculate totals
  const totals = analytics.reduce(
    (acc, day) => ({
      views: acc.views + day.views_count,
      clicks: acc.clicks + day.clicks_count,
      contacts: acc.contacts + day.contacts_count,
      reviews: acc.reviews + day.reviews_count,
      searchAppearances: acc.searchAppearances + day.search_appearances,
      mapClicks: acc.mapClicks + day.map_clicks,
    }),
    { views: 0, clicks: 0, contacts: 0, reviews: 0, searchAppearances: 0, mapClicks: 0 }
  );

  // Calculate percentage changes (comparing last 15 days vs previous 15 days)
  const lastPeriod = analytics.slice(0, 15);
  const previousPeriod = analytics.slice(15, 30);
  
  const lastPeriodTotals = lastPeriod.reduce(
    (acc, day) => ({
      views: acc.views + day.views_count,
      clicks: acc.clicks + day.clicks_count,
      contacts: acc.contacts + day.contacts_count,
      reviews: acc.reviews + day.reviews_count,
    }),
    { views: 0, clicks: 0, contacts: 0, reviews: 0 }
  );
  
  const previousPeriodTotals = previousPeriod.reduce(
    (acc, day) => ({
      views: acc.views + day.views_count,
      clicks: acc.clicks + day.clicks_count,
      contacts: acc.contacts + day.contacts_count,
      reviews: acc.reviews + day.reviews_count,
    }),
    { views: 0, clicks: 0, contacts: 0, reviews: 0 }
  );

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const percentageChanges = {
    views: calculatePercentageChange(lastPeriodTotals.views, previousPeriodTotals.views),
    clicks: calculatePercentageChange(lastPeriodTotals.clicks, previousPeriodTotals.clicks),
    contacts: calculatePercentageChange(lastPeriodTotals.contacts, previousPeriodTotals.contacts),
    reviews: calculatePercentageChange(lastPeriodTotals.reviews, previousPeriodTotals.reviews),
  };

  return {
    analytics,
    totals,
    percentageChanges,
    loading,
    error,
    trackView,
    trackClick,
  };
};
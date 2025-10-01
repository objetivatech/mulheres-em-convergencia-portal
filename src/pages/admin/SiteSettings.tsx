import React from 'react';
import { SiteSettingsManager } from '@/components/admin/SiteSettingsManager';
import Layout from '@/components/layout/Layout';

export default function SiteSettings() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <SiteSettingsManager />
      </div>
    </Layout>
  );
}
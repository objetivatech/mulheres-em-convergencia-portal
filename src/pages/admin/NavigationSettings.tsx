import React from 'react';
import { NavigationManager } from '@/components/admin/NavigationManager';
import Layout from '@/components/layout/Layout';
import { AdminBackButton } from '@/components/admin/AdminBackButton';

export default function NavigationSettings() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <AdminBackButton />
        <NavigationManager />
      </div>
    </Layout>
  );
}
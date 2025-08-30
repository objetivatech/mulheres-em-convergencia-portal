import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { CategoryManager } from '@/components/blog/CategoryManager';

export default function BlogCategories() {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Blog
            </Link>
          </Button>
        </div>
        
        <CategoryManager />
      </div>
    </Layout>
  );
}
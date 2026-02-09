import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AdminBackButtonProps {
  to?: string;
  label?: string;
}

export const AdminBackButton = ({ 
  to = '/admin', 
  label = 'Voltar ao Admin' 
}: AdminBackButtonProps) => {
  return (
    <Link to={to}>
      <Button variant="ghost" size="sm" className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </Link>
  );
};

export default AdminBackButton;

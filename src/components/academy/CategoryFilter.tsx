import { Button } from '@/components/ui/button';
import type { AcademyCategory } from '@/hooks/useAcademy';

interface CategoryFilterProps {
  categories: AcademyCategory[];
  selected: string | null;
  onChange: (id: string | null) => void;
  label: string;
}

export const CategoryFilter = ({ categories, selected, onChange, label }: CategoryFilterProps) => {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selected === null ? 'default' : 'outline'}
          onClick={() => onChange(null)}
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={selected === cat.id ? 'default' : 'outline'}
            onClick={() => onChange(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

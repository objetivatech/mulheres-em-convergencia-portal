import { Link } from 'react-router-dom';
import { usePopularTags } from '@/hooks/useTagCloud';

interface TagCloudProps {
  limit?: number;
  className?: string;
}

export const TagCloud = ({ limit = 15, className = '' }: TagCloudProps) => {
  const { data: tags, isLoading, error } = usePopularTags(limit);

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="h-4 bg-muted rounded animate-pulse"></div>
        <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
    );
  }

  if (error || !tags || tags.length === 0) {
    return null;
  }

  // Calculate font sizes based on usage
  const maxCount = Math.max(...tags.map(tag => Number(tag.post_count)));
  const minCount = Math.min(...tags.map(tag => Number(tag.post_count)));
  const countRange = maxCount - minCount || 1;

  const getFontSize = (count: number) => {
    const normalized = (count - minCount) / countRange;
    const minSize = 0.75; // text-xs
    const maxSize = 1.25; // text-xl
    return minSize + (maxSize - minSize) * normalized;
  };

  const getOpacity = (count: number) => {
    const normalized = (count - minCount) / countRange;
    return 0.6 + 0.4 * normalized;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="font-semibold text-foreground">Tags Populares</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const fontSize = getFontSize(Number(tag.post_count));
          const opacity = getOpacity(Number(tag.post_count));
          
          return (
            <Link
              key={tag.id}
              to={`/convergindo?tag=${tag.slug}`}
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
              style={{
                fontSize: `${fontSize}rem`,
                opacity,
              }}
              title={`${tag.post_count} post${Number(tag.post_count) > 1 ? 's' : ''}`}
            >
              #{tag.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
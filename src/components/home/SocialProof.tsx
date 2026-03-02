import { useEffect, useRef, useState } from 'react';
import { Users, Building2, BookOpen, CalendarDays } from 'lucide-react';
import { useHomepageStats } from '@/hooks/useHomepageStats';

const useCountUp = (target: number, duration = 1500, shouldStart = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart || target === 0) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, shouldStart]);

  return count;
};

const SocialProof = () => {
  const { data: stats } = useHomepageStats();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const counters = [
    { icon: Users, label: 'Empreendedoras', value: stats?.totalMembers || 0 },
    { icon: Building2, label: 'Negócios no Diretório', value: stats?.totalBusinesses || 0 },
    { icon: BookOpen, label: 'Cursos Disponíveis', value: stats?.totalCourses || 0 },
    { icon: CalendarDays, label: 'Eventos Realizados', value: stats?.totalEvents || 0 },
  ];

  return (
    <section ref={ref} className="py-16 lg:py-20 bg-gradient-to-r from-primary/5 via-background to-tertiary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-10">
          Nossos Números
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {counters.map((c) => {
            const animatedCount = useCountUp(c.value, 1200, visible);
            return (
              <div key={c.label} className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <c.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-3xl lg:text-4xl font-bold text-foreground">
                  {animatedCount}+
                </span>
                <span className="text-sm text-muted-foreground">{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;

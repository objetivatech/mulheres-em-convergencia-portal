import { EventDetailsContent } from '@/types/landing-page';
import { Calendar, Clock, MapPin, Monitor } from 'lucide-react';

interface LPEventDetailsProps {
  content: EventDetailsContent;
}

export const LPEventDetails = ({ content }: LPEventDetailsProps) => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            📅 {content.title}
          </h2>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-6 bg-background rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Datas</p>
                <p className="text-lg font-semibold text-foreground">{content.dates}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-background rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Carga Horária</p>
                <p className="text-lg font-semibold text-foreground">{content.duration}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-background rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Formato</p>
                <p className="text-lg font-semibold text-foreground">{content.format}</p>
              </div>
            </div>

            {content.location && (
              <div className="flex items-center gap-4 p-6 bg-background rounded-xl border border-border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Local</p>
                  <p className="text-lg font-semibold text-foreground">{content.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

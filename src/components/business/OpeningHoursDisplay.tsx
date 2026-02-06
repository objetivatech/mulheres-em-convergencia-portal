import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePeriod {
  start: string;
  end: string;
}

interface DaySchedule {
  open: boolean;
  periods: TimePeriod[];
}

interface OpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface OpeningHoursDisplayProps {
  hours: OpeningHours | null;
  className?: string;
  compact?: boolean;
}

const dayLabels: Record<keyof OpeningHours, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const dayLabelsShort: Record<keyof OpeningHours, string> = {
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb',
  sunday: 'Dom'
};

const dayOrder: (keyof OpeningHours)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

// Mapeia o dia da semana do JavaScript para a chave do objeto
const jsToOpeningHoursDay: Record<number, keyof OpeningHours> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

const isCurrentlyOpen = (hours: OpeningHours): { isOpen: boolean; nextChange: string | null } => {
  const now = new Date();
  const currentDay = jsToOpeningHoursDay[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const todaySchedule = hours[currentDay];
  
  if (!todaySchedule.open || todaySchedule.periods.length === 0) {
    // Encontrar próximo dia aberto
    let nextOpenDay: keyof OpeningHours | null = null;
    for (let i = 1; i <= 7; i++) {
      const checkDayIndex = (now.getDay() + i) % 7;
      const checkDay = jsToOpeningHoursDay[checkDayIndex];
      if (hours[checkDay].open && hours[checkDay].periods.length > 0) {
        nextOpenDay = checkDay;
        break;
      }
    }
    
    if (nextOpenDay) {
      return { 
        isOpen: false, 
        nextChange: `Abre ${dayLabels[nextOpenDay]} às ${formatTime(hours[nextOpenDay].periods[0].start)}` 
      };
    }
    return { isOpen: false, nextChange: null };
  }
  
  // Verificar se está dentro de algum período
  for (const period of todaySchedule.periods) {
    if (currentTime >= period.start && currentTime <= period.end) {
      return { isOpen: true, nextChange: `Fecha às ${formatTime(period.end)}` };
    }
  }
  
  // Verificar próximo período do dia
  for (const period of todaySchedule.periods) {
    if (currentTime < period.start) {
      return { isOpen: false, nextChange: `Abre às ${formatTime(period.start)}` };
    }
  }
  
  // Passou todos os períodos de hoje
  return { isOpen: false, nextChange: 'Fechado hoje' };
};

export const OpeningHoursDisplay: React.FC<OpeningHoursDisplayProps> = ({
  hours,
  className,
  compact = false
}) => {
  if (!hours) {
    return null;
  }

  const currentDay = jsToOpeningHoursDay[new Date().getDay()];
  const { isOpen, nextChange } = isCurrentlyOpen(hours);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            isOpen 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          )}>
            {isOpen ? 'Aberto' : 'Fechado'}
          </span>
          {nextChange && (
            <span className="text-xs text-muted-foreground">{nextChange}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários de Funcionamento
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            isOpen 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          )}>
            {isOpen ? 'Aberto agora' : 'Fechado'}
          </span>
        </CardTitle>
        {nextChange && (
          <p className="text-xs text-muted-foreground">{nextChange}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5">
          {dayOrder.map(day => {
            const schedule = hours[day];
            const isToday = day === currentDay;
            
            return (
              <div 
                key={day}
                className={cn(
                  "flex justify-between items-center py-1.5 px-2 rounded text-sm",
                  isToday && "bg-primary/5 font-medium"
                )}
              >
                <span className={cn(
                  "w-20",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {dayLabelsShort[day]}
                </span>
                <span className={cn(
                  "text-right",
                  !schedule.open && "text-muted-foreground"
                )}>
                  {schedule.open && schedule.periods.length > 0 
                    ? schedule.periods.map((p, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-muted-foreground"> • </span>}
                          {formatTime(p.start)} - {formatTime(p.end)}
                        </span>
                      ))
                    : 'Fechado'
                  }
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default OpeningHoursDisplay;

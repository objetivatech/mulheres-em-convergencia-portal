import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Copy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePeriod {
  start: string;
  end: string;
}

interface DaySchedule {
  open: boolean;
  periods: TimePeriod[];
}

export interface OpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface OpeningHoursEditorProps {
  value: OpeningHours | null;
  onChange: (value: OpeningHours) => void;
}

const defaultSchedule: DaySchedule = {
  open: false,
  periods: []
};

const defaultOpeningHours: OpeningHours = {
  monday: { open: true, periods: [{ start: '09:00', end: '18:00' }] },
  tuesday: { open: true, periods: [{ start: '09:00', end: '18:00' }] },
  wednesday: { open: true, periods: [{ start: '09:00', end: '18:00' }] },
  thursday: { open: true, periods: [{ start: '09:00', end: '18:00' }] },
  friday: { open: true, periods: [{ start: '09:00', end: '18:00' }] },
  saturday: { open: false, periods: [] },
  sunday: { open: false, periods: [] }
};

const dayLabels: Record<keyof OpeningHours, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const dayOrder: (keyof OpeningHours)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const OpeningHoursEditor: React.FC<OpeningHoursEditorProps> = ({
  value,
  onChange
}) => {
  const [hours, setHours] = useState<OpeningHours>(value || defaultOpeningHours);
  const [copyFromDay, setCopyFromDay] = useState<keyof OpeningHours | null>(null);

  useEffect(() => {
    if (value) {
      setHours(value);
    }
  }, [value]);

  const updateHours = (newHours: OpeningHours) => {
    setHours(newHours);
    onChange(newHours);
  };

  const toggleDay = (day: keyof OpeningHours) => {
    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        open: !hours[day].open,
        periods: !hours[day].open ? [{ start: '09:00', end: '18:00' }] : []
      }
    };
    updateHours(newHours);
  };

  const addPeriod = (day: keyof OpeningHours) => {
    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        periods: [...hours[day].periods, { start: '14:00', end: '18:00' }]
      }
    };
    updateHours(newHours);
  };

  const removePeriod = (day: keyof OpeningHours, periodIndex: number) => {
    const newPeriods = hours[day].periods.filter((_, i) => i !== periodIndex);
    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        periods: newPeriods,
        open: newPeriods.length > 0
      }
    };
    updateHours(newHours);
  };

  const updatePeriod = (day: keyof OpeningHours, periodIndex: number, field: 'start' | 'end', value: string) => {
    const newPeriods = hours[day].periods.map((period, i) =>
      i === periodIndex ? { ...period, [field]: value } : period
    );
    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        periods: newPeriods
      }
    };
    updateHours(newHours);
  };

  const copyToOtherDays = (fromDay: keyof OpeningHours) => {
    const newHours = { ...hours };
    dayOrder.forEach(day => {
      if (day !== fromDay) {
        newHours[day] = { ...hours[fromDay] };
      }
    });
    updateHours(newHours);
    setCopyFromDay(null);
  };

  const copyToWeekdays = (fromDay: keyof OpeningHours) => {
    const weekdays: (keyof OpeningHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const newHours = { ...hours };
    weekdays.forEach(day => {
      if (day !== fromDay) {
        newHours[day] = { ...hours[fromDay] };
      }
    });
    updateHours(newHours);
    setCopyFromDay(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horários de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dayOrder.map(day => (
          <div
            key={day}
            className={cn(
              "p-3 sm:p-4 rounded-lg border transition-colors",
              hours[day].open ? "bg-background border-border" : "bg-muted/50 border-muted"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={hours[day].open}
                  onCheckedChange={() => toggleDay(day)}
                  aria-label={`Abrir/Fechar ${dayLabels[day]}`}
                />
                <Label className="font-medium text-sm sm:text-base">
                  {dayLabels[day]}
                </Label>
                {!hours[day].open && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Fechado
                  </span>
                )}
              </div>
              
              {hours[day].open && (
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addPeriod(day)}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Adicionar período</span>
                    <span className="sm:hidden">Período</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCopyFromDay(copyFromDay === day ? null : day)}
                    className="h-8 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                </div>
              )}
            </div>

            {copyFromDay === day && (
              <div className="mb-3 p-2 bg-primary/5 rounded border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">Copiar horários para:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToWeekdays(day)}
                    className="h-7 text-xs"
                  >
                    Dias úteis
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToOtherDays(day)}
                    className="h-7 text-xs"
                  >
                    Todos os dias
                  </Button>
                </div>
              </div>
            )}

            {hours[day].open && (
              <div className="space-y-2">
                {hours[day].periods.map((period, periodIndex) => (
                  <div key={periodIndex} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        type="time"
                        value={period.start}
                        onChange={(e) => updatePeriod(day, periodIndex, 'start', e.target.value)}
                        className="w-[120px] sm:w-[130px] text-sm"
                        aria-label="Horário de abertura"
                      />
                      <span className="text-muted-foreground text-sm">às</span>
                      <Input
                        type="time"
                        value={period.end}
                        onChange={(e) => updatePeriod(day, periodIndex, 'end', e.target.value)}
                        className="w-[120px] sm:w-[130px] text-sm"
                        aria-label="Horário de fechamento"
                      />
                    </div>
                    {hours[day].periods.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePeriod(day, periodIndex)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Remover período"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OpeningHoursEditor;

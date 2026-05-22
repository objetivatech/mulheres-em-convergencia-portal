import React, { useEffect } from 'react';
import { Check, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { scorePassword, MIN_PASSWORD_SCORE } from '@/lib/passwordStrength';

interface PasswordStrengthMeterProps {
  password: string;
  confirmPassword?: string;
  onValidityChange?: (isStrong: boolean) => void;
  className?: string;
  /** Show only when user has typed something. Default true. */
  hideWhenEmpty?: boolean;
}

const barColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-destructive';
};

const labelColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-destructive';
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  confirmPassword,
  onValidityChange,
  className,
  hideWhenEmpty = true,
}) => {
  const result = scorePassword(password);

  useEffect(() => {
    onValidityChange?.(result.isStrong);
  }, [result.isStrong, onValidityChange]);

  if (hideWhenEmpty && !password) return null;

  const items: { ok: boolean; text: string }[] = [
    { ok: result.checks.length8, text: 'Pelo menos 8 caracteres' },
    { ok: result.checks.length12, text: '12+ caracteres (recomendado)' },
    { ok: result.checks.uppercase, text: 'Letra maiúscula (A-Z)' },
    { ok: result.checks.lowercase, text: 'Letra minúscula (a-z)' },
    { ok: result.checks.number, text: 'Número (0-9)' },
    { ok: result.checks.special, text: 'Símbolo (!@#$% ...)' },
  ];

  const confirmMismatch = confirmPassword !== undefined && confirmPassword.length > 0 && confirmPassword !== password;

  return (
    <div className={cn('mt-2 space-y-2 text-sm', className)}>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', barColor(result.score))}
          style={{ width: `${result.score}%` }}
          role="progressbar"
          aria-valuenow={result.score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('flex items-center gap-1 font-medium', labelColor(result.score))}>
          {result.isStrong ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          Força: {result.label} ({result.score}/100)
        </span>
        <span className="text-xs text-muted-foreground">mínimo {MIN_PASSWORD_SCORE}</span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {items.map((item) => (
          <li key={item.text} className="flex items-center gap-1.5">
            {item.ok ? (
              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={cn('text-xs', item.ok ? 'text-foreground' : 'text-muted-foreground')}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
      {confirmPassword !== undefined && confirmPassword.length > 0 && (
        <p className={cn('text-xs flex items-center gap-1', confirmMismatch ? 'text-destructive' : 'text-green-600 dark:text-green-400')}>
          {confirmMismatch ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          {confirmMismatch ? 'As senhas não coincidem.' : 'As senhas coincidem.'}
        </p>
      )}
      {!result.isStrong && (
        <p className="text-xs text-muted-foreground">
          {result.suggestions[0] || 'Fortaleça sua senha para atingir o mínimo de segurança.'}
        </p>
      )}
      {result.isStrong && (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
          Senha segura — pode prosseguir.
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
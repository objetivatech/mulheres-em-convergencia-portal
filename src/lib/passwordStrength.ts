export const MIN_PASSWORD_SCORE = 80;

export interface PasswordChecks {
  length8: boolean;
  length12: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

export type PasswordStrengthLabel = 'Muito fraca' | 'Fraca' | 'Média' | 'Boa' | 'Forte';

export interface PasswordStrengthResult {
  score: number; // 0-100
  label: PasswordStrengthLabel;
  checks: PasswordChecks;
  isStrong: boolean;
  suggestions: string[];
}

const COMMON_PASSWORDS = new Set([
  '123456', '1234567', '12345678', '123456789', '1234567890',
  'password', 'senha', 'qwerty', 'abc123', '111111', '000000',
  'iloveyou', 'admin', 'welcome', 'mudar123', 'senha123', 'password1',
]);

const SPECIAL_RE = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]/;

function hasSequential(pwd: string): boolean {
  const lower = pwd.toLowerCase();
  for (let i = 0; i < lower.length - 3; i++) {
    const a = lower.charCodeAt(i);
    const b = lower.charCodeAt(i + 1);
    const c = lower.charCodeAt(i + 2);
    const d = lower.charCodeAt(i + 3);
    if (b - a === 1 && c - b === 1 && d - c === 1) return true;
    if (a - b === 1 && b - c === 1 && c - d === 1) return true;
  }
  return false;
}

function hasRepeats(pwd: string): boolean {
  return /(.)\1{3,}/.test(pwd);
}

export function scorePassword(pwd: string): PasswordStrengthResult {
  const checks: PasswordChecks = {
    length8: pwd.length >= 8,
    length12: pwd.length >= 12,
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special: SPECIAL_RE.test(pwd),
  };

  if (!pwd) {
    return { score: 0, label: 'Muito fraca', checks, isStrong: false, suggestions: ['Digite uma senha.'] };
  }

  if (COMMON_PASSWORDS.has(pwd.toLowerCase())) {
    return {
      score: 0,
      label: 'Muito fraca',
      checks,
      isStrong: false,
      suggestions: ['Esta senha é muito comum. Escolha outra.'],
    };
  }

  let score = 0;
  if (checks.length8) score += 15;
  if (checks.length12) score += 15;
  if (pwd.length >= 16) score += 10;
  if (checks.lowercase) score += 10;
  if (checks.uppercase) score += 15;
  if (checks.number) score += 15;
  if (checks.special) score += 20;

  if (hasSequential(pwd)) score -= 15;
  if (hasRepeats(pwd)) score -= 15;

  score = Math.max(0, Math.min(100, score));

  let label: PasswordStrengthLabel = 'Muito fraca';
  if (score >= 80) label = 'Forte';
  else if (score >= 70) label = 'Boa';
  else if (score >= 40) label = 'Média';
  else if (score >= 20) label = 'Fraca';

  const suggestions: string[] = [];
  if (!checks.length8) suggestions.push('Use pelo menos 8 caracteres.');
  else if (!checks.length12) suggestions.push('Use 12 ou mais caracteres para mais segurança.');
  if (!checks.lowercase) suggestions.push('Inclua letras minúsculas.');
  if (!checks.uppercase) suggestions.push('Inclua letras maiúsculas.');
  if (!checks.number) suggestions.push('Inclua números.');
  if (!checks.special) suggestions.push('Inclua símbolos (ex: !@#$%).');
  if (hasSequential(pwd)) suggestions.push('Evite sequências como "1234" ou "abcd".');
  if (hasRepeats(pwd)) suggestions.push('Evite caracteres repetidos em sequência.');

  return { score, label, checks, isStrong: score >= MIN_PASSWORD_SCORE, suggestions };
}
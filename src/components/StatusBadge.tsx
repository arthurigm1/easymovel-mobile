import { Palette } from '@/constants/theme';
import { findConstructionStage } from '@/constants/status';
import { Badge } from './Badge';

interface Props {
  status?: string;
  compact?: boolean;
  inverted?: boolean;
}

export function StatusBadge({ status, compact, inverted }: Props) {
  const stage = findConstructionStage(status);
  const label = stage?.label ?? status ?? '';
  const color = stage?.color ?? Palette.textSecondary;
  const bg = stage?.bg ?? Palette.surfaceVariant;

  return (
    <Badge
      label={label}
      color={color}
      bg={bg}
      size={compact ? 'sm' : 'md'}
      inverted={inverted}
    />
  );
}

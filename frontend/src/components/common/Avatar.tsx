import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function resolveAvatarSrc(src?: string): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('http')) return src;
  if (src.startsWith('/uploads/')) {
    const base = (import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '');
    return `${base}${src}`;
  }
  return src;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const resolvedSrc = resolveAvatarSrc(src);

  return (
    <div className={cn('relative inline-flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 font-medium text-primary-700 dark:text-primary-300', sizes[size], className)}>
      {resolvedSrc ? (
        <img src={resolvedSrc} alt={name} className="h-full w-full rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

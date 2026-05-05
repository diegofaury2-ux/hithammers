import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { xs: 'w-5 h-5 text-[9px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function colorFromName(name: string) {
  const colors = ['#2C5A52','#3b82f6','#8b5cf6','#ec4899','#f97316','#06b6d4','#84cc16'];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ name, avatarUrl, size = 'sm', className = '' }: AvatarProps) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${sizes[size]} rounded-full object-cover ${className}`} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      style={{ backgroundColor: colorFromName(name) }}>
      {initials(name)}
    </div>
  );
}

export function AvatarGroup({ users, max = 3 }: { users: { name: string; avatarUrl?: string | null }[]; max?: number }) {
  const shown = users.slice(0, max);
  const rest = users.length - max;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((u, i) => <Avatar key={i} name={u.name} avatarUrl={u.avatarUrl} size="xs" className="border border-card" />)}
      {rest > 0 && <div className="w-5 h-5 rounded-full bg-base-500 border border-card flex items-center justify-center text-[9px] text-muted font-medium">+{rest}</div>}
    </div>
  );
}

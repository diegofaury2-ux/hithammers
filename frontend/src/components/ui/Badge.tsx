import React from 'react';
import { TaskPriority, TaskStatus, ProjectStatus, ProjectPriority } from '../../types';

const priorityLabel: Record<TaskPriority | ProjectPriority, string> = {
  critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa',
};
const statusLabel: Record<TaskStatus | ProjectStatus, string> = {
  todo: 'A Fazer', in_progress: 'Em Andamento', done: 'Concluída', overdue: 'Atrasada',
  active: 'Ativo', paused: 'Pausado', completed: 'Concluído', archived: 'Arquivado',
};

export function PriorityBadge({ priority }: { priority: TaskPriority | ProjectPriority }) {
  const cls = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[priority];
  return <span className={cls}>{priorityLabel[priority]}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus | ProjectStatus }) {
  const cls = `status-${status}`;
  return <span className={cls}>{statusLabel[status]}</span>;
}

export function TeamColorDot({ color }: { color: string | null }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color || '#707070' }} />;
}

import React from 'react';
import { Toast } from '../../hooks/useToast';

const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
const colors = {
  success: 'border-green-600 bg-green-900/30 text-green-300',
  error: 'border-critical bg-critical-bg text-critical',
  info: 'border-blue-600 bg-blue-900/30 text-blue-300',
  warning: 'border-warning bg-warning-bg text-warning',
};

export default function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${colors[t.type]} animate-fade-in`}>
          <span>{icons[t.type]}</span>
          <span>{t.message}</span>
          <button className="ml-2 opacity-60 hover:opacity-100" onClick={() => onRemove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

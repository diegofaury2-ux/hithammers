import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopFilterBar from './TopFilterBar';
import { FilterProvider } from '../../contexts/FilterContext';

export default function AppLayout() {
  return (
    <FilterProvider>
      <div className="flex h-screen bg-base overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-12 border-b border-border bg-base-100 flex items-center justify-end px-5 shrink-0">
            <TopFilterBar />
          </header>
          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterCtx {
  selectedTeamId: string | null;
  selectedProjectId: string | null;
  setTeamId: (id: string | null) => void;
  setProjectId: (id: string | null) => void;
}

const FilterContext = createContext<FilterCtx | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedTeamId, setTeamId] = useState<string | null>(null);
  const [selectedProjectId, setProjectId] = useState<string | null>(null);

  const handleSetTeam = (id: string | null) => {
    setTeamId(id);
    setProjectId(null);
  };

  return (
    <FilterContext.Provider value={{ selectedTeamId, selectedProjectId, setTeamId: handleSetTeam, setProjectId }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilter must be used within FilterProvider');
  return ctx;
}

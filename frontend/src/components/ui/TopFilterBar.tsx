import React, { useEffect, useState } from 'react';
import { useFilter } from '../../contexts/FilterContext';
import { Team, Project } from '../../types';
import api from '../../lib/api';

export default function TopFilterBar() {
  const { selectedTeamId, selectedProjectId, setTeamId, setProjectId } = useFilter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    api.get('/teams').then(r => setTeams(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = selectedTeamId ? `?teamId=${selectedTeamId}` : '';
    api.get(`/projects${params}`).then(r => setProjects(r.data)).catch(() => {});
  }, [selectedTeamId]);

  return (
    <div className="flex items-center gap-2">
      <select
        className="select !w-36 text-xs"
        value={selectedTeamId || ''}
        onChange={e => setTeamId(e.target.value || null)}
      >
        <option value="">Todas as equipes</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      <select
        className="select !w-44 text-xs"
        value={selectedProjectId || ''}
        onChange={e => setProjectId(e.target.value || null)}
        disabled={projects.length === 0}
      >
        <option value="">Todos os projetos</option>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
}

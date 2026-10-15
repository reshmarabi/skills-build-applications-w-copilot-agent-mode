import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => { if (active) setTeams(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Request failed'); });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={teams === null && error === null}
      error={error}
      empty={teams !== null && teams.length === 0}
      emptyMessage="No teams yet."
    >
      <ul className="list-group">
        {teams?.map((team, index) => (
          <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
            {team.name}{team.mascot ? ` - ${team.mascot}` : ''} - {team.members?.length ?? 0} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

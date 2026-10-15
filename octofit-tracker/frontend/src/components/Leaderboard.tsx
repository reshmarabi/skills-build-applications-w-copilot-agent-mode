import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: result }) => { if (active) setLeaderboard(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Request failed'); });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={leaderboard === null && error === null}
      error={error}
      empty={leaderboard !== null && leaderboard.length === 0}
      emptyMessage="No leaderboard entries yet."
    >
      <ol className="list-group list-group-numbered">
        {leaderboard?.map((entry) => (
          <li className="list-group-item" key={entry.rank}>
            {entry.teamName} - {entry.totalPoints} points
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}

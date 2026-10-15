import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; focus?: string; minutes?: number; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then(({ suggestions: result }) => { if (active) setSuggestions(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Request failed'); });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={suggestions === null && error === null}
      error={error}
      empty={suggestions !== null && suggestions.length === 0}
      emptyMessage="No workout suggestions yet."
    >
      <ul className="list-group">
        {suggestions?.map((suggestion, index) => (
          <li className="list-group-item" key={`${suggestion.title}-${index}`}>
            <strong>{suggestion.title}</strong>
            {suggestion.focus ? ` - ${suggestion.focus}` : ''}
            {suggestion.minutes ? ` - ${suggestion.minutes} minutes` : ''}
            {suggestion.reason ? <p className="mb-0">{suggestion.reason}</p> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

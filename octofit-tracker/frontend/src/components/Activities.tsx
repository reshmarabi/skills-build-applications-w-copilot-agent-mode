import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: result }) => { if (active) setActivities(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Request failed'); });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={activities === null && error === null}
      error={error}
      empty={activities !== null && activities.length === 0}
      emptyMessage="No activities yet."
    >
      <ul className="list-group">
        {activities?.map((activity, index) => (
          <li className="list-group-item" key={activity._id ?? `${activity.type}-${activity.minutes}-${index}`}>
            {activity.type} - {activity.minutes} minutes - {activity.points} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

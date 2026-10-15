import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const isObjectId = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw Object.assign(new Error('userId and teamId must be valid IDs'), { status: 400 });
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw Object.assign(new Error('Minutes must be a positive integer'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Referenced user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const { name, mascot } = input as Record<string, unknown>;
  const rawMembers = (input as Record<string, unknown>).members ?? [];
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }
  if (!Array.isArray(rawMembers) || rawMembers.some((member) => typeof member !== 'string' || !/^[0-9a-fA-F]{24}$/.test(member))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const members = [...new Set(rawMembers as string[])];
  const existingMembers = await User.find({ _id: { $in: members } }).select('_id').lean();
  if (existingMembers.length !== members.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 400 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  const ranked = teams
    .map(({ _id, name }) => ({
      teamName: name,
      totalPoints: pointsByTeam.get(_id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName));

  return ranked.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goalFocus = user.fitnessGoal.toLowerCase();
  const activityType = recentActivity?.type.toLowerCase();
  const activityFocus = activityType && ['run', 'running', 'cycle', 'cycling'].includes(activityType)
    ? 'endurance'
    : activityType;

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const matchesGoal = focus === goalFocus;
      const matchesActivity = activityFocus !== undefined && focus === activityFocus;
      const reason = matchesGoal && matchesActivity
        ? `Matches your ${goalFocus} goal and recent ${activityType} activity.`
        : matchesGoal
          ? `Matches your ${goalFocus} fitness goal.`
          : matchesActivity
            ? `Recommended for your recent ${activityType} activity.`
            : `Suggested based on your ${goalFocus} fitness goal.`;
      return { ...workout, reason, score: Number(matchesGoal) * 2 + Number(matchesActivity) };
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .map(({ score: _score, ...workout }) => workout);
}

export { User };

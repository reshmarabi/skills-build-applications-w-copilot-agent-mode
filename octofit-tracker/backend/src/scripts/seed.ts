import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

// Seed stable demo records without clearing data owned by the application.
async function upsertDemoUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const previousUser = await User.findOne({ email }).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } }, { runValidators: true });
  }
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } }, { runValidators: true });
  return user;
}

async function upsertDemoTeam(name: string, mascot: string) {
  return Team.findOneAndUpdate(
    { name },
    { $set: { name, mascot } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await upsertDemoTeam('Octocats', 'Mona');
    const robocats = await upsertDemoTeam('Robocats', 'Hubot');
    const codecats = await upsertDemoTeam('Codecats', 'Ada');
    await upsertDemoTeam('Trailblazers', 'Dash');
    const mona = await upsertDemoUser('Mona', 'mona@example.com', octocats._id, 'endurance');
    const hubot = await upsertDemoUser('Hubot', 'hubot@example.com', robocats._id, 'strength');
    const ada = await upsertDemoUser('Ada', 'ada@example.com', codecats._id, 'mobility');

    const monaRunAt = new Date('2026-01-10T12:00:00.000Z');
    const hubotCycleAt = new Date('2026-01-11T12:00:00.000Z');
    const adaWalkAt = new Date('2026-01-12T12:00:00.000Z');
    await Activity.updateOne(
      { user: mona._id, team: octocats._id, type: 'run', occurredAt: monaRunAt },
      { $set: { user: mona._id, team: octocats._id, type: 'run', minutes: 40, points: 40, occurredAt: monaRunAt } },
      { upsert: true, runValidators: true },
    );
    await Activity.updateOne(
      { user: hubot._id, team: robocats._id, type: 'cycle', occurredAt: hubotCycleAt },
      { $set: { user: hubot._id, team: robocats._id, type: 'cycle', minutes: 25, points: 25, occurredAt: hubotCycleAt } },
      { upsert: true, runValidators: true },
    );
    await Activity.updateOne(
      { user: ada._id, team: codecats._id, type: 'walk', occurredAt: adaWalkAt },
      { $set: { user: ada._id, team: codecats._id, type: 'walk', minutes: 20, points: 20, occurredAt: adaWalkAt } },
      { upsert: true, runValidators: true },
    );
    await Workout.updateOne(
      { title: 'Intervals' },
      { $set: { title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' } },
      { upsert: true, runValidators: true },
    );
    await Workout.updateOne(
      { title: 'Strength Circuit' },
      { $set: { title: 'Strength Circuit', focus: 'strength', minutes: 30, difficulty: 'moderate' } },
      { upsert: true, runValidators: true },
    );
    await Workout.updateOne(
      { title: 'Mobility Flow' },
      { $set: { title: 'Mobility Flow', focus: 'mobility', minutes: 20, difficulty: 'easy' } },
      { upsert: true, runValidators: true },
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}

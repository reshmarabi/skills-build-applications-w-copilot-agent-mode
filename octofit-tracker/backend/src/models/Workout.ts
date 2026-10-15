import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: { type: String, required: true, trim: true },
  focus: { type: String, required: true, trim: true },
  minutes: {
    type: Number,
    required: true,
    min: 1,
    validate: { validator: Number.isInteger, message: 'Minutes must be an integer' },
  },
  difficulty: { type: String, required: true, trim: true },
});

export const Workout = model('Workout', workoutSchema);

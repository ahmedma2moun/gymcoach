import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    userId: { type: Number, required: true }, // Using numeric ID to match User schema
    title: { type: String, required: true },
    date: { type: Date }, // Optional or required based on preference, but good to have
    status: { type: String, default: 'active' },
    exercises: [{
        name: String,
        sets: String,
        reps: String,
        videoUrl: String,
        done: { type: Boolean, default: false },
        weight: { type: String, default: '' }, // Legacy field
        weightKg: { type: String, default: '' },
        weightLbs: { type: String, default: '' },
        coachNote: { type: String, default: '' },
        userNote: { type: String, default: '' }
    }]
});

export default mongoose.model('Plan', planSchema);

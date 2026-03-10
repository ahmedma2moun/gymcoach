import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    userId: { type: Number, required: true, index: true },
    title: { type: String, required: true },
    date: { type: Date },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    exercises: [{
        name: String,
        sets: String,
        reps: String,
        videoUrl: String,
        done: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        weight: { type: String, default: '' },    // legacy field
        weightKg: { type: String, default: '' },
        weightLbs: { type: String, default: '' },
        coachNote: { type: String, default: '' },
        userNote: { type: String, default: '' },
        supersetId: { type: String, default: null }
    }]
}, { timestamps: true });

export default mongoose.model('Plan', planSchema);

import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    userId: { type: Number, required: true }, // Using numeric ID to match User schema
    title: { type: String, required: true },
    status: { type: String, default: 'active' },
    exercises: [{
        name: String,
        sets: String,
        reps: String,
        videoUrl: String,
        done: { type: Boolean, default: false }
    }]
});

export default mongoose.model('Plan', planSchema);

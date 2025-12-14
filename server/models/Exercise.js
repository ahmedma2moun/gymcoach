import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    videoUrl: { type: String, required: false }
});

export default mongoose.model('Exercise', exerciseSchema);

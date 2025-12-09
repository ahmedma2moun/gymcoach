import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // Keeping numeric ID for compatibility with existing frontend logic if needed, or we can switch to _id
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true }
});

export default mongoose.model('User', userSchema);

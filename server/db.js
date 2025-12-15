import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {


        const uri = process.env.MONGO_URI;

        if (!uri) throw new Error('MONGO_URI is not defined');

        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        // Do not exit process in serverless environment
    }
};

export default connectDB;

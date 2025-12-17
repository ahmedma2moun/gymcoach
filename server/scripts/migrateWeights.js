import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plan from '../models/Plan.js';
import connectDB from '../db.js';

dotenv.config();

const migrate = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const plans = await Plan.find({ 'exercises.weight': { $exists: true, $ne: '' } });
        console.log(`Found ${plans.length} plans with weights to potentially migrate.`);

        let updatedCount = 0;

        for (const plan of plans) {
            let planModified = false;
            for (const exercise of plan.exercises) {
                // If weight exists but weightKg is empty, migrate
                if (exercise.weight && !exercise.weightKg) {
                    const weightStr = exercise.weight.toLowerCase().replace('kg', '').trim();
                    const weightVal = parseFloat(weightStr);

                    if (!isNaN(weightVal)) {
                        exercise.weightKg = weightVal.toString();
                        exercise.weightLbs = (weightVal * 2.20462).toFixed(1);
                        planModified = true;
                    }
                }
            }

            if (planModified) {
                await plan.save();
                updatedCount++;
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} plans.`);
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();

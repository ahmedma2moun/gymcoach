import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();


const EXERCISES = [
    // ── BACK ─────────────────────────────────────────────────────────────────
    { name: 'Deadlift', videoUrl: 'https://www.youtube.com/results?search_query=deadlift+proper+form+tutorial' },
    { name: 'Romanian Deadlift', videoUrl: 'https://www.youtube.com/results?search_query=romanian+deadlift+RDL+form+tutorial' },
    { name: 'Barbell Row (Bent-Over Row)', videoUrl: 'https://www.youtube.com/results?search_query=barbell+bent+over+row+form+tutorial' },
    { name: 'Dumbbell Single-Arm Row', videoUrl: 'https://www.youtube.com/results?search_query=single+arm+dumbbell+row+tutorial' },
    { name: 'Cable Row (Seated Cable Row)', videoUrl: 'https://www.youtube.com/results?search_query=seated+cable+row+proper+form' },
    { name: 'T-Bar Row', videoUrl: 'https://www.youtube.com/results?search_query=t+bar+row+form+tutorial' },
    { name: 'Lat Pulldown', videoUrl: 'https://www.youtube.com/results?search_query=lat+pulldown+proper+form+tutorial' },
    { name: 'Wide-Grip Lat Pulldown', videoUrl: 'https://www.youtube.com/results?search_query=wide+grip+lat+pulldown+tutorial' },
    { name: 'Close-Grip Lat Pulldown', videoUrl: 'https://www.youtube.com/results?search_query=close+grip+lat+pulldown+tutorial' },
    { name: 'Pull-Up', videoUrl: 'https://www.youtube.com/results?search_query=pull+up+proper+form+tutorial' },
    { name: 'Chin-Up', videoUrl: 'https://www.youtube.com/results?search_query=chin+up+vs+pull+up+tutorial' },
    { name: 'Neutral-Grip Pull-Up', videoUrl: 'https://www.youtube.com/results?search_query=neutral+grip+pull+up+tutorial' },
    { name: 'Assisted Pull-Up', videoUrl: 'https://www.youtube.com/results?search_query=assisted+pull+up+machine+tutorial' },
    { name: 'Inverted Row', videoUrl: 'https://www.youtube.com/results?search_query=inverted+row+bodyweight+tutorial' },
    { name: 'Cable Pullover', videoUrl: 'https://www.youtube.com/results?search_query=cable+pullover+for+lats+tutorial' },
    { name: 'Dumbbell Pullover', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+pullover+chest+back+tutorial' },
    { name: 'Rack Pull', videoUrl: 'https://www.youtube.com/results?search_query=rack+pull+deadlift+variation+tutorial' },
    { name: 'Good Morning', videoUrl: 'https://www.youtube.com/results?search_query=good+morning+exercise+form+tutorial' },
    { name: 'Back Extension (Hyperextension)', videoUrl: 'https://www.youtube.com/results?search_query=back+extension+hyperextension+tutorial' },
    { name: 'Reverse Hyper', videoUrl: 'https://www.youtube.com/results?search_query=reverse+hyperextension+lower+back+tutorial' },
    { name: 'Superman Hold', videoUrl: 'https://www.youtube.com/results?search_query=superman+exercise+lower+back+tutorial' },
    { name: 'Meadows Row', videoUrl: 'https://www.youtube.com/results?search_query=meadows+row+lats+tutorial' },
    { name: 'Pendlay Row', videoUrl: 'https://www.youtube.com/results?search_query=pendlay+row+form+tutorial' },
    { name: 'Face Pull', videoUrl: 'https://www.youtube.com/results?search_query=face+pull+rear+delt+tutorial' },
    { name: 'Shrug (Barbell Shrug)', videoUrl: 'https://www.youtube.com/results?search_query=barbell+shrug+trap+exercise+tutorial' },
    { name: 'Dumbbell Shrug', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+shrug+trap+tutorial' },
    { name: 'Upright Row', videoUrl: 'https://www.youtube.com/results?search_query=upright+row+trap+shoulder+tutorial' },
    { name: 'Chest-Supported Row', videoUrl: 'https://www.youtube.com/results?search_query=chest+supported+dumbbell+row+tutorial' },
    { name: 'Seal Row', videoUrl: 'https://www.youtube.com/results?search_query=seal+row+back+exercise+tutorial' },
    { name: 'Kroc Row', videoUrl: 'https://www.youtube.com/results?search_query=kroc+row+heavy+dumbbell+tutorial' },

    // ── SHOULDERS ─────────────────────────────────────────────────────────────
    { name: 'Overhead Press (OHP)', videoUrl: 'https://www.youtube.com/results?search_query=overhead+press+OHP+proper+form+tutorial' },
    { name: 'Seated Dumbbell Shoulder Press', videoUrl: 'https://www.youtube.com/results?search_query=seated+dumbbell+shoulder+press+tutorial' },
    { name: 'Standing Dumbbell Shoulder Press', videoUrl: 'https://www.youtube.com/results?search_query=standing+dumbbell+shoulder+press+tutorial' },
    { name: 'Arnold Press', videoUrl: 'https://www.youtube.com/results?search_query=arnold+press+shoulder+tutorial' },
    { name: 'Push Press', videoUrl: 'https://www.youtube.com/results?search_query=push+press+overhead+tutorial' },
    { name: 'Smith Machine Shoulder Press', videoUrl: 'https://www.youtube.com/results?search_query=smith+machine+shoulder+press+tutorial' },
    { name: 'Dumbbell Lateral Raise', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+lateral+raise+proper+form+tutorial' },
    { name: 'Cable Lateral Raise', videoUrl: 'https://www.youtube.com/results?search_query=cable+lateral+raise+shoulder+tutorial' },
    { name: 'Machine Lateral Raise', videoUrl: 'https://www.youtube.com/results?search_query=machine+lateral+raise+tutorial' },
    { name: 'Leaning Lateral Raise', videoUrl: 'https://www.youtube.com/results?search_query=leaning+cable+lateral+raise+medial+delt+tutorial' },
    { name: 'Dumbbell Front Raise', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+front+raise+tutorial' },
    { name: 'Cable Front Raise', videoUrl: 'https://www.youtube.com/results?search_query=cable+front+raise+shoulder+tutorial' },
    { name: 'Plate Front Raise', videoUrl: 'https://www.youtube.com/results?search_query=plate+front+raise+shoulder+tutorial' },
    { name: 'Reverse Fly (Bent-Over Dumbbell Fly)', videoUrl: 'https://www.youtube.com/results?search_query=reverse+dumbbell+fly+rear+delt+tutorial' },
    { name: 'Cable Reverse Fly', videoUrl: 'https://www.youtube.com/results?search_query=cable+reverse+fly+rear+delt+tutorial' },
    { name: 'Machine Reverse Fly (Pec Deck Reverse)', videoUrl: 'https://www.youtube.com/results?search_query=machine+reverse+fly+rear+delt+tutorial' },
    { name: 'Landmine Press', videoUrl: 'https://www.youtube.com/results?search_query=landmine+press+shoulder+tutorial' },
    { name: 'Band Pull-Apart', videoUrl: 'https://www.youtube.com/results?search_query=band+pull+apart+rear+delt+tutorial' },
    { name: 'High Pull', videoUrl: 'https://www.youtube.com/results?search_query=high+pull+explosive+shoulder+tutorial' },
    { name: 'Cuban Press', videoUrl: 'https://www.youtube.com/results?search_query=cuban+press+rotator+cuff+tutorial' },
    { name: 'Dumbbell Y-Raise', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+Y+raise+shoulder+stability+tutorial' },
    { name: 'Dumbbell T-Raise', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+T+raise+shoulder+tutorial' },
    { name: 'Single-Arm Cable Lateral Raise', videoUrl: 'https://www.youtube.com/results?search_query=single+arm+cable+lateral+raise+tutorial' },
    { name: 'Behind-the-Neck Press', videoUrl: 'https://www.youtube.com/results?search_query=behind+the+neck+press+shoulder+tutorial' },
    { name: 'Lu Raise', videoUrl: 'https://www.youtube.com/results?search_query=lu+raise+lateral+raise+variation+tutorial' },
    { name: 'Handstand Push-Up', videoUrl: 'https://www.youtube.com/results?search_query=handstand+push+up+tutorial+for+beginners' },
    { name: 'Pike Push-Up', videoUrl: 'https://www.youtube.com/results?search_query=pike+push+up+shoulder+tutorial' },
    { name: 'Seated Cable Shoulder Press', videoUrl: 'https://www.youtube.com/results?search_query=seated+cable+shoulder+press+tutorial' },

    // ── CHEST ─────────────────────────────────────────────────────────────────
    { name: 'Flat Barbell Bench Press', videoUrl: 'https://www.youtube.com/results?search_query=flat+barbell+bench+press+proper+form+tutorial' },
    { name: 'Incline Barbell Bench Press', videoUrl: 'https://www.youtube.com/results?search_query=incline+barbell+bench+press+tutorial' },
    { name: 'Decline Barbell Bench Press', videoUrl: 'https://www.youtube.com/results?search_query=decline+barbell+bench+press+tutorial' },
    { name: 'Flat Dumbbell Bench Press', videoUrl: 'https://www.youtube.com/results?search_query=flat+dumbbell+bench+press+tutorial' },
    { name: 'Incline Dumbbell Bench Press', videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+bench+press+tutorial' },
    { name: 'Decline Dumbbell Bench Press', videoUrl: 'https://www.youtube.com/results?search_query=decline+dumbbell+bench+press+tutorial' },
    { name: 'Push-Up', videoUrl: 'https://www.youtube.com/results?search_query=push+up+proper+form+tutorial' },
    { name: 'Wide-Grip Push-Up', videoUrl: 'https://www.youtube.com/results?search_query=wide+grip+push+up+chest+tutorial' },
    { name: 'Diamond Push-Up', videoUrl: 'https://www.youtube.com/results?search_query=diamond+push+up+tutorial' },
    { name: 'Decline Push-Up', videoUrl: 'https://www.youtube.com/results?search_query=decline+push+up+upper+chest+tutorial' },
    { name: 'Incline Push-Up', videoUrl: 'https://www.youtube.com/results?search_query=incline+push+up+chest+tutorial' },
    { name: 'Dumbbell Fly', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+fly+proper+form+tutorial' },
    { name: 'Incline Dumbbell Fly', videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+fly+upper+chest+tutorial' },
    { name: 'Cable Fly (Cable Crossover)', videoUrl: 'https://www.youtube.com/results?search_query=cable+fly+crossover+chest+tutorial' },
    { name: 'High-to-Low Cable Fly', videoUrl: 'https://www.youtube.com/results?search_query=high+to+low+cable+fly+lower+chest+tutorial' },
    { name: 'Low-to-High Cable Fly', videoUrl: 'https://www.youtube.com/results?search_query=low+to+high+cable+fly+upper+chest+tutorial' },
    { name: 'Pec Deck Fly (Machine Fly)', videoUrl: 'https://www.youtube.com/results?search_query=pec+deck+machine+fly+tutorial' },
    { name: 'Chest Dip', videoUrl: 'https://www.youtube.com/results?search_query=chest+dip+proper+form+tutorial' },
    { name: 'Close-Grip Bench Press', videoUrl: 'https://www.youtube.com/results?search_query=close+grip+bench+press+triceps+chest+tutorial' },
    { name: 'Smith Machine Bench Press', videoUrl: 'https://www.youtube.com/results?search_query=smith+machine+bench+press+tutorial' },
    { name: 'Smith Machine Incline Press', videoUrl: 'https://www.youtube.com/results?search_query=smith+machine+incline+press+tutorial' },
    { name: 'Svend Press', videoUrl: 'https://www.youtube.com/results?search_query=svend+press+inner+chest+tutorial' },
    { name: 'Floor Press', videoUrl: 'https://www.youtube.com/results?search_query=floor+press+chest+triceps+tutorial' },
    { name: 'Resistance Band Fly', videoUrl: 'https://www.youtube.com/results?search_query=resistance+band+chest+fly+tutorial' },
    { name: 'Resistance Band Push-Up', videoUrl: 'https://www.youtube.com/results?search_query=resistance+band+push+up+tutorial' },
    { name: 'Single-Arm Cable Fly', videoUrl: 'https://www.youtube.com/results?search_query=single+arm+cable+fly+chest+tutorial' },
    { name: 'Hammer Strength Chest Press', videoUrl: 'https://www.youtube.com/results?search_query=hammer+strength+chest+press+tutorial' },
    { name: 'Hex Press', videoUrl: 'https://www.youtube.com/results?search_query=hex+press+inner+chest+dumbbell+tutorial' },

    // ── ARMS — Biceps ─────────────────────────────────────────────────────────
    { name: 'Barbell Curl', videoUrl: 'https://www.youtube.com/results?search_query=barbell+curl+proper+form+tutorial' },
    { name: 'EZ-Bar Curl', videoUrl: 'https://www.youtube.com/results?search_query=ez+bar+curl+bicep+tutorial' },
    { name: 'Dumbbell Curl', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+bicep+curl+proper+form' },
    { name: 'Alternating Dumbbell Curl', videoUrl: 'https://www.youtube.com/results?search_query=alternating+dumbbell+curl+tutorial' },
    { name: 'Hammer Curl', videoUrl: 'https://www.youtube.com/results?search_query=hammer+curl+proper+form+tutorial' },
    { name: 'Incline Dumbbell Curl', videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+curl+long+head+tutorial' },
    { name: 'Concentration Curl', videoUrl: 'https://www.youtube.com/results?search_query=concentration+curl+bicep+peak+tutorial' },
    { name: 'Preacher Curl', videoUrl: 'https://www.youtube.com/results?search_query=preacher+curl+short+head+tutorial' },
    { name: 'Spider Curl', videoUrl: 'https://www.youtube.com/results?search_query=spider+curl+bicep+tutorial' },
    { name: 'Cable Curl', videoUrl: 'https://www.youtube.com/results?search_query=cable+bicep+curl+tutorial' },
    { name: 'High Cable Curl', videoUrl: 'https://www.youtube.com/results?search_query=high+cable+curl+bicep+stretch+tutorial' },
    { name: 'Cross-Body Hammer Curl', videoUrl: 'https://www.youtube.com/results?search_query=cross+body+hammer+curl+tutorial' },
    { name: 'Reverse Curl', videoUrl: 'https://www.youtube.com/results?search_query=reverse+curl+brachioradialis+tutorial' },
    { name: 'Zottman Curl', videoUrl: 'https://www.youtube.com/results?search_query=zottman+curl+tutorial' },
    { name: 'Machine Curl', videoUrl: 'https://www.youtube.com/results?search_query=machine+bicep+curl+tutorial' },

    // ── ARMS — Triceps ────────────────────────────────────────────────────────
    { name: 'Triceps Pushdown (Cable Pushdown)', videoUrl: 'https://www.youtube.com/results?search_query=triceps+pushdown+cable+tutorial' },
    { name: 'Rope Pushdown', videoUrl: 'https://www.youtube.com/results?search_query=rope+tricep+pushdown+tutorial' },
    { name: 'Overhead Triceps Extension (Cable)', videoUrl: 'https://www.youtube.com/results?search_query=overhead+cable+triceps+extension+tutorial' },
    { name: 'Overhead Triceps Extension (Dumbbell)', videoUrl: 'https://www.youtube.com/results?search_query=overhead+dumbbell+triceps+extension+tutorial' },
    { name: 'Skull Crusher (Lying Triceps Extension)', videoUrl: 'https://www.youtube.com/results?search_query=skull+crusher+lying+triceps+extension+tutorial' },
    { name: 'Triceps Dip', videoUrl: 'https://www.youtube.com/results?search_query=triceps+dip+proper+form+tutorial' },
    { name: 'Bench Dip', videoUrl: 'https://www.youtube.com/results?search_query=bench+dip+triceps+tutorial' },
    { name: 'JM Press', videoUrl: 'https://www.youtube.com/results?search_query=jm+press+triceps+tutorial' },
    { name: 'Tate Press', videoUrl: 'https://www.youtube.com/results?search_query=tate+press+dumbbell+triceps+tutorial' },
    { name: 'Kickback', videoUrl: 'https://www.youtube.com/results?search_query=tricep+kickback+dumbbell+tutorial' },
    { name: 'Single-Arm Cable Pushdown', videoUrl: 'https://www.youtube.com/results?search_query=single+arm+cable+tricep+pushdown+tutorial' },
    { name: 'Machine Triceps Extension', videoUrl: 'https://www.youtube.com/results?search_query=machine+tricep+extension+tutorial' },
    { name: 'Floor Triceps Extension', videoUrl: 'https://www.youtube.com/results?search_query=floor+triceps+extension+tutorial' },

    // ── ARMS — Forearms ───────────────────────────────────────────────────────
    { name: 'Wrist Curl', videoUrl: 'https://www.youtube.com/results?search_query=wrist+curl+forearm+flexor+tutorial' },
    { name: 'Reverse Wrist Curl', videoUrl: 'https://www.youtube.com/results?search_query=reverse+wrist+curl+forearm+extensor+tutorial' },
    { name: "Farmer's Walk", videoUrl: 'https://www.youtube.com/results?search_query=farmers+walk+forearm+grip+tutorial' },
    { name: 'Plate Pinch', videoUrl: 'https://www.youtube.com/results?search_query=plate+pinch+grip+strength+tutorial' },
    { name: 'Dead Hang', videoUrl: 'https://www.youtube.com/results?search_query=dead+hang+grip+forearm+tutorial' },

    // ── LEGS — Quadriceps ─────────────────────────────────────────────────────
    { name: 'Back Squat (Barbell Squat)', videoUrl: 'https://www.youtube.com/results?search_query=barbell+back+squat+proper+form+tutorial' },
    { name: 'Front Squat', videoUrl: 'https://www.youtube.com/results?search_query=front+squat+proper+form+tutorial' },
    { name: 'Goblet Squat', videoUrl: 'https://www.youtube.com/results?search_query=goblet+squat+tutorial' },
    { name: 'Hack Squat', videoUrl: 'https://www.youtube.com/results?search_query=hack+squat+machine+tutorial' },
    { name: 'Leg Press', videoUrl: 'https://www.youtube.com/results?search_query=leg+press+proper+form+tutorial' },
    { name: 'Leg Extension', videoUrl: 'https://www.youtube.com/results?search_query=leg+extension+machine+tutorial' },
    { name: 'Bulgarian Split Squat', videoUrl: 'https://www.youtube.com/results?search_query=bulgarian+split+squat+tutorial' },
    { name: 'Lunge (Walking Lunge)', videoUrl: 'https://www.youtube.com/results?search_query=walking+lunge+proper+form+tutorial' },
    { name: 'Reverse Lunge', videoUrl: 'https://www.youtube.com/results?search_query=reverse+lunge+tutorial' },
    { name: 'Step-Up', videoUrl: 'https://www.youtube.com/results?search_query=step+up+exercise+quads+tutorial' },
    { name: 'Sissy Squat', videoUrl: 'https://www.youtube.com/results?search_query=sissy+squat+quad+isolation+tutorial' },
    { name: 'Spanish Squat', videoUrl: 'https://www.youtube.com/results?search_query=spanish+squat+quad+tutorial' },
    { name: 'Cyclist Squat (Heel-Elevated Squat)', videoUrl: 'https://www.youtube.com/results?search_query=cyclist+squat+heel+elevated+quad+tutorial' },

    // ── LEGS — Hamstrings & Glutes ────────────────────────────────────────────
    { name: 'Conventional Deadlift', videoUrl: 'https://www.youtube.com/results?search_query=conventional+deadlift+proper+form+tutorial' },
    { name: 'Sumo Deadlift', videoUrl: 'https://www.youtube.com/results?search_query=sumo+deadlift+proper+form+tutorial' },
    { name: 'Leg Curl (Lying Leg Curl)', videoUrl: 'https://www.youtube.com/results?search_query=lying+leg+curl+machine+tutorial' },
    { name: 'Seated Leg Curl', videoUrl: 'https://www.youtube.com/results?search_query=seated+leg+curl+tutorial' },
    { name: 'Nordic Hamstring Curl', videoUrl: 'https://www.youtube.com/results?search_query=nordic+hamstring+curl+tutorial' },
    { name: 'Glute Bridge', videoUrl: 'https://www.youtube.com/results?search_query=glute+bridge+exercise+tutorial' },
    { name: 'Hip Thrust (Barbell Hip Thrust)', videoUrl: 'https://www.youtube.com/results?search_query=barbell+hip+thrust+glute+tutorial' },
    { name: 'Dumbbell Hip Thrust', videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+hip+thrust+tutorial' },
    { name: 'Single-Leg Hip Thrust', videoUrl: 'https://www.youtube.com/results?search_query=single+leg+hip+thrust+tutorial' },
    { name: 'Donkey Kick', videoUrl: 'https://www.youtube.com/results?search_query=donkey+kick+glute+tutorial' },
    { name: 'Cable Kickback', videoUrl: 'https://www.youtube.com/results?search_query=cable+glute+kickback+tutorial' },
    { name: 'Stiff-Leg Deadlift', videoUrl: 'https://www.youtube.com/results?search_query=stiff+leg+deadlift+tutorial' },
    { name: 'Glute-Ham Raise (GHR)', videoUrl: 'https://www.youtube.com/results?search_query=glute+ham+raise+GHD+tutorial' },
    { name: 'Kettlebell Swing', videoUrl: 'https://www.youtube.com/results?search_query=kettlebell+swing+proper+form+tutorial' },

    // ── LEGS — Calves ─────────────────────────────────────────────────────────
    { name: 'Standing Calf Raise', videoUrl: 'https://www.youtube.com/results?search_query=standing+calf+raise+tutorial' },
    { name: 'Seated Calf Raise', videoUrl: 'https://www.youtube.com/results?search_query=seated+calf+raise+soleus+tutorial' },
    { name: 'Single-Leg Calf Raise', videoUrl: 'https://www.youtube.com/results?search_query=single+leg+calf+raise+tutorial' },
    { name: 'Leg Press Calf Raise', videoUrl: 'https://www.youtube.com/results?search_query=leg+press+calf+raise+tutorial' },
    { name: 'Donkey Calf Raise', videoUrl: 'https://www.youtube.com/results?search_query=donkey+calf+raise+tutorial' },

    // ── LEGS — Inner / Outer Thighs ───────────────────────────────────────────
    { name: 'Hip Abduction Machine', videoUrl: 'https://www.youtube.com/results?search_query=hip+abduction+machine+outer+thigh+tutorial' },
    { name: 'Hip Adduction Machine', videoUrl: 'https://www.youtube.com/results?search_query=hip+adduction+machine+inner+thigh+tutorial' },
    { name: 'Cable Hip Abduction', videoUrl: 'https://www.youtube.com/results?search_query=cable+hip+abduction+glute+medius+tutorial' },
    { name: 'Cable Hip Adduction', videoUrl: 'https://www.youtube.com/results?search_query=cable+hip+adduction+inner+thigh+tutorial' },
    { name: 'Sumo Squat', videoUrl: 'https://www.youtube.com/results?search_query=sumo+squat+inner+thigh+tutorial' },
    { name: 'Lateral Band Walk', videoUrl: 'https://www.youtube.com/results?search_query=lateral+band+walk+glute+medius+tutorial' },
    { name: 'Copenhagen Plank', videoUrl: 'https://www.youtube.com/results?search_query=copenhagen+plank+adductor+tutorial' },
];

async function seedAdmin() {
    const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (existing) {
        console.log('Admin user already exists — skipping.');
        return;
    }
    const hashed = await bcrypt.hash('admin', 10);
    await prisma.user.create({
        data: {
            id: BigInt(Date.now()),
            username: 'admin',
            password: hashed,
            role: 'admin',
            isActive: true,
        },
    });
    console.log('Admin user created (username: admin, password: admin)');
    console.log('IMPORTANT: Change the admin password immediately after first login.');
}

async function seedExercises() {
    const count = await prisma.exercise.count();
    if (count === EXERCISES.length) {
        console.log('Exercises already seeded — skipping.');
        return;
    }

    // Clear and re-seed with sequential IDs starting from 1
    await prisma.exercise.deleteMany();

    const data = EXERCISES.map((exercise, index) => ({
        id: BigInt(index + 1),
        name: exercise.name,
        videoUrl: exercise.videoUrl,
    }));

    await prisma.exercise.createMany({ data });
    console.log(`Seeded ${data.length} exercises (IDs 1–${data.length}).`);
}

async function main() {
    await seedAdmin();
    await seedExercises();
}

main()
    .catch(err => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

export const copyPlanToClipboard = (plan) => {
    const exercisesText = plan.exercises.map(ex => {
        return `Exercise Name: ${ex.name}\nSets: ${ex.sets}\nReps: ${ex.reps}\nYoutube link: ${ex.videoUrl || 'N/A'}\n`;
    }).join('\n');

    const fullText = `${plan.title}\n\n${exercisesText}`;

    navigator.clipboard.writeText(fullText).then(() => {
        alert('Plan copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy plan to clipboard');
    });
};

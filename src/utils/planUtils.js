/**
 * Copies a plan's exercise list to the clipboard.
 * Returns a Promise that resolves to { ok: true } on success
 * or { ok: false, message: string } on failure, so callers
 * can show their own toast notifications.
 */
export const copyPlanToClipboard = (plan) => {
    const exercisesText = plan.exercises.map(ex => {
        return `Exercise Name: ${ex.name}\nSets: ${ex.sets}\nReps: ${ex.reps}\nYoutube link: ${ex.videoUrl || 'N/A'}\n`;
    }).join('\n');

    const fullText = `${plan.title}\n\n${exercisesText}`;

    return navigator.clipboard.writeText(fullText).then(() => {
        return { ok: true, message: 'Plan copied to clipboard!' };
    }).catch(err => {
        console.error('Failed to copy:', err);
        return { ok: false, message: 'Failed to copy plan to clipboard' };
    });
};

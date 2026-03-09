import ExerciseLineChart from './ExerciseLineChart';

const ExerciseHistoryList = ({ exerciseHistory, loading, sortByLatest, emptyMessage }) => {
    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader-spinner"></div>
            </div>
        );
    }

    const exerciseNames = sortByLatest
        ? Object.keys(exerciseHistory).sort((a, b) => {
            const latestA = Math.max(...exerciseHistory[a].map(h => new Date(h.date)));
            const latestB = Math.max(...exerciseHistory[b].map(h => new Date(h.date)));
            return latestB - latestA;
        })
        : Object.keys(exerciseHistory);

    const defaultEmptyMessage = emptyMessage || 'No exercise history available yet.';

    if (exerciseNames.length === 0) {
        return (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                {defaultEmptyMessage}
            </p>
        );
    }

    return (
        <div className="history-container">
            {exerciseNames.map(exerciseName => {
                const history = exerciseHistory[exerciseName];
                if (!history || history.length === 0) return null;

                const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
                const maxWeight = Math.max(...sortedHistory.map(h => parseFloat(h.weightKg) || 0));
                const minWeight = Math.min(...sortedHistory.filter(h => h.weightKg).map(h => parseFloat(h.weightKg)));
                const range = maxWeight - minWeight || 1;

                return (
                    <div key={exerciseName} className="exercise-history-card">
                        <h3 className="exercise-history-title">{exerciseName}</h3>
                        <div className="line-chart-container">
                            <ExerciseLineChart
                                sortedHistory={sortedHistory}
                                maxWeight={maxWeight}
                                minWeight={minWeight}
                                range={range}
                            />
                        </div>
                        <div className="history-stats">
                            <div className="stat-item">
                                <span className="stat-label">Sessions:</span>
                                <span className="stat-value">{sortedHistory.length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Max:</span>
                                <span className="stat-value">
                                    {maxWeight ? `${maxWeight} kg / ${(maxWeight * 2.20462).toFixed(1)} lbs` : 'N/A'}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Latest:</span>
                                <span className="stat-value">
                                    {sortedHistory[sortedHistory.length - 1].weightKg
                                        ? (() => {
                                            const kg = parseFloat(sortedHistory[sortedHistory.length - 1].weightKg);
                                            return `${kg} kg / ${(kg * 2.20462).toFixed(1)} lbs`;
                                          })()
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ExerciseHistoryList;

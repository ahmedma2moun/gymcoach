const AnalyticsView = ({ plans, analyticsMonth, setAnalyticsMonth, loading }) => {
    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader-spinner"></div>
            </div>
        );
    }

    // Build list of months that have plans, sorted newest first
    const monthsSet = new Set();
    plans.forEach(p => {
        const d = new Date(p.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(key);
    });
    const availableMonths = [...monthsSet].sort((a, b) => b.localeCompare(a));

    const selectedMonth = (analyticsMonth && availableMonths.includes(analyticsMonth))
        ? analyticsMonth
        : availableMonths[0] || null;

    if (!selectedMonth) {
        return (
            <div className="analytics-container">
                <div className="analytics-section">
                    <p className="analytics-empty">No workout data yet.</p>
                </div>
            </div>
        );
    }

    const [selYear, selMon] = selectedMonth.split('-').map(Number);

    const monthPlans = plans.filter(p => {
        const d = new Date(p.date);
        return d.getFullYear() === selYear && d.getMonth() === selMon - 1;
    });
    const completedPlans = monthPlans.filter(p => p.exercises.length > 0 && p.exercises.every(e => e.done));

    // Sessions by Training Type
    const sessionsByType = {};
    completedPlans.forEach(p => {
        const title = p.title || 'Untitled';
        sessionsByType[title] = (sessionsByType[title] || 0) + 1;
    });
    const sortedTypes = Object.entries(sessionsByType).sort((a, b) => b[1] - a[1]);
    const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 1;

    // Monthly Overview
    const monthCompleted = completedPlans.length;
    const monthTotal = monthPlans.length;
    const completionRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;
    const totalExercises = monthPlans.reduce((sum, p) => sum + p.exercises.filter(e => e.done).length, 0);

    // Streaks (all-time)
    const allCompleted = plans.filter(p => p.exercises.length > 0 && p.exercises.every(e => e.done));
    const completedDates = [...new Set(allCompleted.map(p => {
        const d = new Date(p.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }))].sort((a, b) => b - a);

    let currentStreak = 0;
    if (completedDates.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oneDay = 86400000;
        let checkDate = today.getTime();
        if (completedDates.includes(checkDate)) {
            currentStreak = 1;
            checkDate -= oneDay;
        } else {
            checkDate -= oneDay;
            if (completedDates.includes(checkDate)) {
                currentStreak = 1;
                checkDate -= oneDay;
            }
        }
        while (completedDates.includes(checkDate)) {
            currentStreak++;
            checkDate -= oneDay;
        }
    }

    let bestStreak = 0;
    if (completedDates.length > 0) {
        const sorted = [...completedDates].sort((a, b) => a - b);
        let streak = 1;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i - 1] === 86400000) {
                streak++;
            } else {
                bestStreak = Math.max(bestStreak, streak);
                streak = 1;
            }
        }
        bestStreak = Math.max(bestStreak, streak);
    }

    // Recent Activity (all-time)
    const recentSessions = [...allCompleted]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const monthLabel = new Date(selYear, selMon - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="analytics-container">
            <div className="analytics-month-selector">
                {availableMonths.map(m => {
                    const [y, mo] = m.split('-').map(Number);
                    const label = new Date(y, mo - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
                    return (
                        <button
                            key={m}
                            className={`analytics-month-btn ${m === selectedMonth ? 'active' : ''}`}
                            onClick={() => setAnalyticsMonth(m)}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <div className="analytics-section">
                <h3 className="analytics-section-title">Sessions by Training Type</h3>
                {sortedTypes.length === 0 ? (
                    <p className="analytics-empty">No completed sessions in {monthLabel}.</p>
                ) : (
                    <div className="analytics-bars">
                        {sortedTypes.map(([title, count]) => (
                            <div key={title} className="analytics-bar-row">
                                <span className="analytics-bar-label">{title}</span>
                                <div className="analytics-bar-track">
                                    <div
                                        className="analytics-bar-fill"
                                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="analytics-bar-count">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="analytics-section">
                <h3 className="analytics-section-title">{monthLabel} Overview</h3>
                <div className="analytics-stats-row">
                    <div className="analytics-stat-card">
                        <span className="analytics-stat-value">{completionRate}%</span>
                        <span className="analytics-stat-label">Completion Rate</span>
                        <div className="analytics-progress-track">
                            <div className="analytics-progress-fill" style={{ width: `${completionRate}%` }}></div>
                        </div>
                    </div>
                    <div className="analytics-stat-card">
                        <span className="analytics-stat-value">{monthCompleted}/{monthTotal}</span>
                        <span className="analytics-stat-label">Sessions Done</span>
                    </div>
                    <div className="analytics-stat-card">
                        <span className="analytics-stat-value">{totalExercises}</span>
                        <span className="analytics-stat-label">Exercises Completed</span>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h3 className="analytics-section-title">Streaks & Consistency</h3>
                <div className="analytics-stats-row">
                    <div className="analytics-stat-card">
                        <span className="analytics-stat-value accent">{currentStreak}</span>
                        <span className="analytics-stat-label">Current Streak (days)</span>
                    </div>
                    <div className="analytics-stat-card">
                        <span className="analytics-stat-value">{bestStreak}</span>
                        <span className="analytics-stat-label">Best Streak (days)</span>
                    </div>
                    <div className="analytics-stat-card">
                        <span className="analytics-stat-value">{allCompleted.length}</span>
                        <span className="analytics-stat-label">Total Sessions</span>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <h3 className="analytics-section-title">Recent Activity</h3>
                {recentSessions.length === 0 ? (
                    <p className="analytics-empty">No completed sessions yet.</p>
                ) : (
                    <div className="analytics-recent-list">
                        {recentSessions.map((plan, idx) => (
                            <div key={idx} className="analytics-recent-item">
                                <div className="analytics-recent-date">
                                    {new Date(plan.date).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="analytics-recent-title">{plan.title}</div>
                                <div className="analytics-recent-count">{plan.exercises.length} exercises</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsView;

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import ExerciseLineChart from './ExerciseLineChart';
import Toast from './Toast';
import LoadingSpinner from './LoadingSpinner';
import './Dashboard.css';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const [plans, setPlans] = useState([]);
    const [openVideoIndex, setOpenVideoIndex] = useState(null);
    const [expandedPlans, setExpandedPlans] = useState({});
    const [exerciseWeights, setExerciseWeights] = useState({}); // Stores in kg
    const [exerciseWeightsLbs, setExerciseWeightsLbs] = useState({}); // Stores in lbs for display
    const [userNotes, setUserNotes] = useState({}); // Temporary state for notes before save
    const [previousWeights, setPreviousWeights] = useState({});

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null); // { message, type }

    // Exercise History Tab
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar', 'history', or 'analytics'
    const [exerciseHistory, setExerciseHistory] = useState({});
    const [historyLoading, setHistoryLoading] = useState(false);
    const [analyticsMonth, setAnalyticsMonth] = useState(null); // 'YYYY-MM' key or null (set on tab open)

    useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const formatWeightDisplay = (kg, lbs) => {
        if (kg && lbs) return `${kg} kg / ${lbs} lbs`;
        if (kg) {
            const calcLbs = (parseFloat(kg) * 2.20462).toFixed(1);
            return `${kg} kg / ${calcLbs} lbs`;
        }
        if (lbs) {
            const calcKg = (parseFloat(lbs) * 0.453592).toFixed(1);
            return `${calcKg} kg / ${lbs} lbs`;
        }
        return '';
    };

    const toggleExercise = async (planId, exerciseIndex, currentStatus, _userNoteValue = null) => {
        const key = `${planId}-${exerciseIndex}`;

        // If toggling status, use state. If saving note only, use passed value or state.
        // Actually, let's keep it simple: We always send current state or what's in DB? 
        // Better: When toggling done, we send everything.

        let weightKg = '';
        let weightLbs = '';
        let legacyWeight = '';

        // Get values from state or if not in state (already saved), we might need them?
        // Current logic relies on state for edits. If strict, we should populate state on load?
        // For now, assume state has current edit.

        // userNote state logic? We need state for user notes too.
        // Let's assume we add `userNotes` state map.
        const note = userNotes[key] || '';

        if (!currentStatus) {
            weightKg = exerciseWeights[key] || '';
            weightLbs = exerciseWeightsLbs[key] || '';

            if (weightKg && !weightLbs) {
                weightLbs = (parseFloat(weightKg) * 2.20462).toFixed(1);
            } else if (weightLbs && !weightKg) {
                weightKg = (parseFloat(weightLbs) * 0.453592).toFixed(1);
            }
            legacyWeight = `${weightKg} kg / ${weightLbs} lbs`;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/plans/${planId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseIndex,
                    done: !currentStatus,
                    weight: legacyWeight,
                    weightKg,
                    weightLbs,
                    userNote: note
                })
            });

            if (res.ok) {
                const updatedPlan = await res.json();
                setPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
                setExerciseWeights(prev => { const n = { ...prev }; delete n[key]; return n; });
                setExerciseWeightsLbs(prev => { const n = { ...prev }; delete n[key]; return n; });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const parsePrevWeight = (entry) => {
        const result = { lastComment: entry.userNote || '' };
        if (entry.weightKg || entry.weightLbs) {
            result.kg = entry.weightKg;
            result.lbs = entry.weightLbs;
            return result;
        }
        if (entry.weight) {
            const val = parseFloat(entry.weight);
            if (!isNaN(val)) {
                result.kg = entry.weight;
                result.lbs = (val * 2.20462).toFixed(1);
                return result;
            }
            result.raw = entry.weight;
            return result;
        }
        if (result.lastComment) return result;
        return null;
    };

    // Derive previous weights from already-fetched plans (server returns date-desc)
    const derivePreviousWeights = (planList) => {
        const weights = {};
        for (const plan of planList) {
            for (const exercise of plan.exercises) {
                if (!exercise.done || weights[exercise.name]) continue;
                const prev = parsePrevWeight(exercise);
                if (prev) weights[exercise.name] = prev;
            }
        }
        return weights;
    };

    // Keep previousWeights in sync whenever plans change
    useEffect(() => {
        setPreviousWeights(derivePreviousWeights(plans));
    }, [plans]);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/plans/${user.id}`);
            const data = await res.json();
            setPlans(data);
        } catch (error) {
            console.error("Failed to fetch plans:", error);
            setToast({ message: 'Failed to load plans. Please try again.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExerciseHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/plans/user/${user.id}/exercise-history`);
            const data = await res.json();
            // Expected format: { exerciseName: [{ date, weightKg, weightLbs, weight, userNote }, ...], ... }
            setExerciseHistory(data);
        } catch (error) {
            console.error("Failed to fetch exercise history:", error);
            setToast({ message: 'Failed to load exercise history.', type: 'error' });
        } finally {
            setHistoryLoading(false);
        }
    };


    const handleWeightChange = (planId, exerciseIndex, value, unit) => {
        const key = `${planId}-${exerciseIndex}`;

        if (unit === 'kg') {
            setExerciseWeights(prev => ({ ...prev, [key]: value }));
            const lbsValue = value ? (parseFloat(value) * 2.20462).toFixed(1) : '';
            setExerciseWeightsLbs(prev => ({ ...prev, [key]: lbsValue }));
        } else if (unit === 'lbs') {
            setExerciseWeightsLbs(prev => ({ ...prev, [key]: value }));
            const kgValue = value ? (parseFloat(value) * 0.453592).toFixed(1) : '';
            setExerciseWeights(prev => ({ ...prev, [key]: kgValue }));
        }
    };

    const getEmbedUrl = (url) => {
        if (!url) return '';
        let videoId = '';
        if (url.includes('youtube.com')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be')) {
            videoId = url.split('/').pop();
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    };

    const toggleVideo = (id) => {
        setOpenVideoIndex(openVideoIndex === id ? null : id);
    };

    const toggleExpand = (planId) => {
        setExpandedPlans(prev => ({
            ...prev,
            [planId]: !prev[planId]
        }));
    };

    const copyPlanToClipboard = (plan) => {
        import('../utils/planUtils').then(({ copyPlanToClipboard: copy }) => {
            copy(plan).then(result => {
                setToast({ message: result.message, type: result.ok ? 'success' : 'error' });
            });
        });
    };

    // Calendar Helper Functions
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
        const plansForDay = plans.filter(p => new Date(p.date).toDateString() === dateStr);
        if (plansForDay.length > 0) {
            setSelectedDate(dateStr);
        }
    };

    const renderExerciseItem = (ex, idx, plan, itemKey, embedUrl) => (
        <div className="exercise-item-group">
            <div className="exercise-item">
                <div className="ex-details">
                    <span className="ex-name">{ex.name}</span>
                    <span className="ex-meta">
                        {ex.sets} Sets x {ex.reps} Reps
                        {ex.done && (ex.weightKg || ex.weightLbs) && ` @ ${formatWeightDisplay(ex.weightKg, ex.weightLbs)}`}
                        {ex.done && !ex.weightKg && !ex.weightLbs && ex.weight && ` @ ${ex.weight}`}
                    </span>
                    {ex.coachNote && <span className="coach-note">Note: {ex.coachNote}</span>}
                    {!ex.done && previousWeights[ex.name] && (
                        <div className="previous-data">
                            <span className="previous-weight">
                                Last: {
                                    previousWeights[ex.name].kg || previousWeights[ex.name].lbs
                                        ? formatWeightDisplay(previousWeights[ex.name].kg, previousWeights[ex.name].lbs)
                                        : previousWeights[ex.name].raw || 'No weight'
                                }
                            </span>
                            {previousWeights[ex.name].lastComment && (
                                <span className="last-comment">"{previousWeights[ex.name].lastComment}"</span>
                            )}
                        </div>
                    )}
                </div>
                {!ex.done && (
                    <div className="weight-inputs-container">
                        <div className="weight-input-group">
                            <input
                                type="number"
                                className="weight-input"
                                placeholder="kg"
                                value={exerciseWeights[itemKey] || ''}
                                onChange={(e) => handleWeightChange(plan.id, idx, e.target.value, 'kg')}
                                onClick={(e) => e.stopPropagation()}
                                step="0.1"
                            />
                            <span className="weight-unit">kg</span>
                        </div>
                        <div className="weight-input-group">
                            <input
                                type="number"
                                className="weight-input"
                                placeholder="lbs"
                                value={exerciseWeightsLbs[itemKey] || ''}
                                onChange={(e) => handleWeightChange(plan.id, idx, e.target.value, 'lbs')}
                                onClick={(e) => e.stopPropagation()}
                                step="0.1"
                            />
                            <span className="weight-unit">lbs</span>
                        </div>
                    </div>
                )}
                <div className="exercise-actions">
                    <button
                        className={ex.done ? "btn-undone" : "btn-complete"}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExercise(plan.id, idx, ex.done);
                        }}
                    >
                        {ex.done ? 'Undone' : 'Complete'}
                    </button>
                    {embedUrl && (
                        <button
                            className="btn-video"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleVideo(itemKey);
                            }}
                        >
                            {openVideoIndex === itemKey ? 'Hide Video' : 'Watch Video'}
                        </button>
                    )}
                </div>
            </div>

            {/* User Note Section */}
            <div className="user-note-section">
                {ex.done ? (
                    ex.userNote && <div className="user-note-display">Your Comment: {ex.userNote}</div>
                ) : (
                    <input
                        className="user-note-input"
                        placeholder="Add a comment..."
                        value={userNotes[itemKey] !== undefined ? userNotes[itemKey] : (ex.userNote || '')}
                        onChange={(e) => setUserNotes(prev => ({ ...prev, [itemKey]: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
            </div>

            {openVideoIndex === itemKey && embedUrl && (
                <div className="video-container">
                    <iframe
                        src={embedUrl}
                        title={ex.name}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            )}
        </div>
    );

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = dateObj.toDateString();
            const dayPlans = plans.filter(p => new Date(p.date).toDateString() === dateStr);
            const hasPlan = dayPlans.length > 0;

            // Determine day status color
            let dayStatusClass = '';
            if (hasPlan) {
                const hasMissed = dayPlans.some(p => {
                    const isDone = p.exercises.every(e => e.done);
                    const pDate = new Date(p.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    pDate.setHours(0, 0, 0, 0);
                    return !isDone && pDate < today;
                });

                const hasPending = dayPlans.some(p => {
                    const isDone = p.exercises.every(e => e.done);
                    const pDate = new Date(p.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    pDate.setHours(0, 0, 0, 0);
                    return !isDone && pDate >= today;
                });

                if (hasMissed) dayStatusClass = 'status-missed-day';
                else if (hasPending) dayStatusClass = ''; // Default/Pending
                else dayStatusClass = 'status-completed-day';
            }

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${hasPlan ? 'has-plan' : ''} ${dayStatusClass}`}
                    onClick={() => hasPlan && handleDayClick(day)}
                >
                    <span className="day-number">{day}</span>
                    {hasPlan && (
                        dayPlans.map((p) => {
                            const isDone = p.exercises.every(e => e.done);
                            const pDate = new Date(p.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            pDate.setHours(0, 0, 0, 0);

                            let statusClass = 'status-pending';
                            if (isDone) statusClass = 'status-completed';
                            else if (pDate < today) statusClass = 'status-missed';

                            return (
                                <div key={p.id || p._id} className={`plan-indicator ${statusClass}`} title={p.title}>
                                    {p.title}
                                </div>
                            );
                        })
                    )}
                </div>
            );
        }

        // Monthly session stats
        const monthPlans = plans.filter(p => {
            const d = new Date(p.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
        const completedSessions = monthPlans.filter(p => p.exercises.length > 0 && p.exercises.every(e => e.done)).length;
        const totalPlanned = monthPlans.length;

        return (
            <div className="calendar-view">
                <div className="calendar-controls">
                    <button onClick={handlePrevMonth} className="btn-small">&lt;</button>
                    <h3>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={handleNextMonth} className="btn-small">&gt;</button>
                </div>
                <div className="month-stats-bar">
                    <div className="month-stat">
                        <span className="month-stat-value completed">{completedSessions}</span>
                        <span className="month-stat-label">Completed</span>
                    </div>
                    <div className="month-stat-divider"></div>
                    <div className="month-stat">
                        <span className="month-stat-value">{totalPlanned}</span>
                        <span className="month-stat-label">Planned</span>
                    </div>
                </div>
                <div className="calendar-grid">
                    <div className="calendar-day-header">Sun</div>
                    <div className="calendar-day-header">Mon</div>
                    <div className="calendar-day-header">Tue</div>
                    <div className="calendar-day-header">Wed</div>
                    <div className="calendar-day-header">Thu</div>
                    <div className="calendar-day-header">Fri</div>
                    <div className="calendar-day-header">Sat</div>
                    {days}
                </div>
            </div>
        );
    };

    const renderExerciseHistoryTab = () => {
        if (historyLoading) {
            return (
                <div className="loader-container">
                    <div className="loader-spinner"></div>
                </div>
            );
        }

        const exerciseNames = Object.keys(exerciseHistory).sort((a, b) => {
            const latestA = Math.max(...exerciseHistory[a].map(h => new Date(h.date)));
            const latestB = Math.max(...exerciseHistory[b].map(h => new Date(h.date)));
            return latestB - latestA;
        });

        if (exerciseNames.length === 0) {
            return <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No exercise history available yet. Complete some workouts to see your progress!</p>;
        }

        return (
            <div className="history-container">
                {exerciseNames.map(exerciseName => {
                    const history = exerciseHistory[exerciseName];
                    if (!history || history.length === 0) return null;

                    // Sort by date
                    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

                    // Prepare data for graph
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

    // --- useMemo: available months derived from plans ---
    const availableMonths = useMemo(() => {
        const monthsSet = new Set();
        plans.forEach(p => {
            const d = new Date(p.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthsSet.add(key);
        });
        return [...monthsSet].sort((a, b) => b.localeCompare(a));
    }, [plans]);

    // --- useMemo: deduplicated completed-session timestamps for streak calculation ---
    const completedDates = useMemo(() => {
        const allCompleted = plans.filter(p => p.exercises.length > 0 && p.exercises.every(e => e.done));
        return [...new Set(allCompleted.map(p => {
            const d = new Date(p.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }))].sort((a, b) => b - a);
    }, [plans]);

    // --- useMemo: streak values ---
    const { currentStreak, bestStreak } = useMemo(() => {
        if (completedDates.length === 0) return { currentStreak: 0, bestStreak: 0 };

        const oneDay = 86400000;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let checkDate = today.getTime();
        if (completedDates.includes(checkDate)) {
            streak = 1;
            checkDate -= oneDay;
        } else {
            checkDate -= oneDay;
            if (completedDates.includes(checkDate)) {
                streak = 1;
                checkDate -= oneDay;
            }
        }
        while (completedDates.includes(checkDate)) {
            streak++;
            checkDate -= oneDay;
        }

        const sorted = [...completedDates].sort((a, b) => a - b);
        let best = 0;
        let run = 1;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i - 1] === oneDay) {
                run++;
            } else {
                best = Math.max(best, run);
                run = 1;
            }
        }
        best = Math.max(best, run);

        return { currentStreak: streak, bestStreak: best };
    }, [completedDates]);

    const renderAnalyticsTab = () => {
        // Default to most recent month if not set or invalid
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

        // Filter plans for selected month
        const monthPlans = plans.filter(p => {
            const d = new Date(p.date);
            return d.getFullYear() === selYear && d.getMonth() === selMon - 1;
        });
        const completedPlans = monthPlans.filter(p => p.exercises.length > 0 && p.exercises.every(e => e.done));

        // A. Sessions by Training Type
        const sessionsByType = {};
        completedPlans.forEach(p => {
            const title = p.title || 'Untitled';
            sessionsByType[title] = (sessionsByType[title] || 0) + 1;
        });
        const sortedTypes = Object.entries(sessionsByType).sort((a, b) => b[1] - a[1]);
        const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 1;

        // B. Monthly Overview
        const monthCompleted = completedPlans.length;
        const monthTotal = monthPlans.length;
        const completionRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;
        const totalExercises = monthPlans.reduce((sum, p) => sum + p.exercises.filter(e => e.done).length, 0);

        // C. All-time completed sessions
        const allCompleted = plans.filter(p => p.exercises.length > 0 && p.exercises.every(e => e.done));

        // D. Recent Activity (all-time)
        const recentSessions = [...allCompleted]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        const monthLabel = new Date(selYear, selMon - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        return (
            <div className="analytics-container">
                {/* Month Selector */}
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

                {/* Sessions by Training Type */}
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

                {/* Monthly Overview */}
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

                {/* Streaks & Consistency (all-time) */}
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

                {/* Recent Activity */}
                <div className="analytics-section">
                    <h3 className="analytics-section-title">Recent Activity</h3>
                    {recentSessions.length === 0 ? (
                        <p className="analytics-empty">No completed sessions yet.</p>
                    ) : (
                        <div className="analytics-recent-list">
                            {recentSessions.map((plan) => (
                                <div key={plan.id || plan._id} className="analytics-recent-item">
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

    return (
        <div className="dashboard">
            {isLoading && <LoadingSpinner overlay />}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <header className="dash-header">
                <div className="dash-header-left">
                    <span className="dash-greeting">Welcome back</span>
                    <h1>{user?.username}</h1>
                </div>
                <button onClick={logout} className="dash-logout-btn">Logout</button>
            </header>

            <div className="dash-body">
                <div className="plans-container">
                {activeTab === 'history' ? (
                    renderExerciseHistoryTab()
                ) : activeTab === 'analytics' ? (
                    renderAnalyticsTab()
                ) : !selectedDate ? (
                    renderCalendar()
                ) : (
                    <div>
                        <button onClick={() => setSelectedDate(null)} className="btn btn-outline mb-4" style={{fontSize:'0.82rem'}}>← Back to Calendar</button>

                        {plans.filter(p => new Date(p.date).toDateString() === selectedDate).length === 0 ? (
                            <p>No plans for this date.</p>
                        ) : (
                            plans.filter(p => new Date(p.date).toDateString() === selectedDate).map((plan) => {
                                const isCompleted = plan.exercises.length > 0 && plan.exercises.every(ex => ex.done);

                                let isCollapsed;
                                if (expandedPlans[plan.id] === undefined) {
                                    isCollapsed = isCompleted;
                                } else {
                                    isCollapsed = !expandedPlans[plan.id];
                                }

                                return (
                                    <div key={plan.id} className={`plan-card ${isCompleted ? 'completed-plan' : ''}`}>
                                        <div className="plan-header" onClick={() => toggleExpand(plan.id)}>
                                            <h3>
                                                {plan.title}
                                                {isCompleted && <span className="check-icon">✓</span>}
                                            </h3>
                                            <button
                                                className="btn-small btn-copy"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyPlanToClipboard(plan);
                                                }}
                                                title="Copy to Clipboard"
                                            >
                                                📋
                                            </button>
                                            <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
                                        </div>

                                        {!isCollapsed && (
                                            <div className="exercise-list">
                                                {(() => {
                                                    // Group exercises for display
                                                    const displayItems = [];
                                                    let currentSuperset = null;

                                                    plan.exercises.forEach((ex, idx) => {
                                                        if (ex.supersetId) {
                                                            if (!currentSuperset || currentSuperset.id !== ex.supersetId) {
                                                                if (currentSuperset) displayItems.push(currentSuperset);
                                                                currentSuperset = { type: 'superset', id: ex.supersetId, items: [] };
                                                            }
                                                            currentSuperset.items.push({ ...ex, originalIndex: idx });
                                                        } else {
                                                            if (currentSuperset) {
                                                                displayItems.push(currentSuperset);
                                                                currentSuperset = null;
                                                            }
                                                            displayItems.push({ type: 'single', data: { ...ex, originalIndex: idx } });
                                                        }
                                                    });
                                                    if (currentSuperset) displayItems.push(currentSuperset);

                                                    return displayItems.map((item, itemIdx) => {
                                                        if (item.type === 'superset') {
                                                            return (
                                                                <div key={`superset-${itemIdx}`} className="superset-container" style={{ border: '2px dashed #00d2ff', borderRadius: '8px', padding: '10px', marginBottom: '15px', position: 'relative' }}>
                                                                    <div className="superset-label" style={{ position: 'absolute', top: '-12px', left: '20px', background: '#1a1a1a', padding: '0 10px', color: '#00d2ff', fontSize: '0.9em', fontWeight: 'bold' }}>Superset</div>
                                                                    {item.items.map((ex, subIdx) => {
                                                                        const globalIdx = ex.originalIndex;
                                                                        const itemKey = `${plan.id}-${globalIdx}`;
                                                                        const embedUrl = getEmbedUrl(ex.videoUrl);
                                                                        return (
                                                                            <div key={globalIdx} className={`exercise-wrapper ${ex.done ? 'done-wrapper' : ''}`} style={subIdx < item.items.length - 1 ? { marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' } : {}}>
                                                                                {renderExerciseItem(ex, globalIdx, plan, itemKey, embedUrl)}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        } else {
                                                            const ex = item.data;
                                                            const globalIdx = ex.originalIndex;
                                                            const itemKey = `${plan.id}-${globalIdx}`;
                                                            const embedUrl = getEmbedUrl(ex.videoUrl);
                                                            return (
                                                                <div key={globalIdx} className={`exercise-wrapper ${ex.done ? 'done-wrapper' : ''}`}>
                                                                    {renderExerciseItem(ex, globalIdx, plan, itemKey, embedUrl)}
                                                                </div>
                                                            );
                                                        }
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
                </div>
            </div>

            {/* Bottom Tab Navigation */}
            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calendar')}
                >
                    Calendar
                </button>
                <button
                    className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Analytics
                </button>
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('history');
                        if (Object.keys(exerciseHistory).length === 0) {
                            fetchExerciseHistory();
                        }
                    }}
                >
                    History{historyLoading && <LoadingSpinner />}
                </button>
            </div>
        </div>
    );
};

export default UserDashboard;

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
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

    const toggleExercise = async (planId, exerciseIndex, currentStatus, userNoteValue = null) => {
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
                await fetchPlans();
                // Clear weights from state if marked done? logic was to clear.
                // Keep note? Maybe clear note state too as it is saved.
                setExerciseWeights(prev => { const n = { ...prev }; delete n[key]; return n; });
                setExerciseWeightsLbs(prev => { const n = { ...prev }; delete n[key]; return n; });
                // setUserNotes(prev => { const n = {...prev}; delete n[key]; return n; }); // Allow keeping it visible?
                // Actually, if we clear state, the input might empty unless we render from plan data.
                // The plan data refreshes, so we should rely on plan.userNote if state is empty.
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPreviousWeight = async (exerciseName) => {
        try {
            const res = await fetch(`/api/plans/user/${user.id}/exercise-history/${encodeURIComponent(exerciseName)}`);
            const data = await res.json();
            // Data structure: { weight, weightKg, weightLbs, lastComment }
            const result = { lastComment: data.lastComment };

            if (data.weightKg || data.weightLbs) {
                result.kg = data.weightKg;
                result.lbs = data.weightLbs;
                return result;
            }
            if (data.weight) {
                const val = parseFloat(data.weight);
                if (!isNaN(val)) {
                    result.kg = data.weight;
                    result.lbs = (val * 2.20462).toFixed(1);
                    return result;
                }
                result.raw = data.weight;
                return result;
            }
            // Return at least the comment if exists, or null if absolutely nothing
            if (result.lastComment) return result;
            return null;
        } catch (e) {
            return null;
        }
    };
    // ... (rest of functions like handleWeightChange kept the same from previous step, logic holds) ... 

    // We need to verify where fetchPreviousWeight usage is and update it.
    // In fetchPlans (Line 36), it expects a return value.
    // In render (Line 317), it expects 'previousWeights[ex.name]' to be consumable.

    /* 
       NOTE: We need to update fetchPlans to handle the object return from fetchPreviousWeight.
       I will inject the updated fetchPlans here as well to be safe.
    */

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/plans/${user.id}`);
            const data = await res.json();
            setPlans(data);

            const weights = {};
            for (const plan of data) {
                for (const exercise of plan.exercises) {
                    if (!exercise.done && !weights[exercise.name]) {
                        const prev = await fetchPreviousWeight(exercise.name);
                        if (prev) {
                            weights[exercise.name] = prev;
                        }
                    }
                }
            }
            setPreviousWeights(weights);
        } catch (error) {
            console.error("Failed to fetch plans:", error);
        } finally {
            setIsLoading(false);
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
                        dayPlans.map((p, i) => {
                            const isDone = p.exercises.every(e => e.done);
                            const pDate = new Date(p.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            pDate.setHours(0, 0, 0, 0);

                            let statusClass = 'status-pending';
                            if (isDone) statusClass = 'status-completed';
                            else if (pDate < today) statusClass = 'status-missed';

                            return (
                                <div key={i} className={`plan-indicator ${statusClass}`} title={p.title}>
                                    {p.title}
                                </div>
                            );
                        })
                    )}
                </div>
            );
        }

        return (
            <div className="calendar-view">
                <div className="calendar-controls">
                    <button onClick={handlePrevMonth} className="btn-small">&lt;</button>
                    <h3>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={handleNextMonth} className="btn-small">&gt;</button>
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

    return (
        <div className="dashboard">
            <header className="dash-header">
                <h1>Welcome, {user?.username}</h1>
                <button onClick={logout} className="btn btn-outline">Logout</button>
            </header>

            <div className="plans-container">
                {!selectedDate ? (
                    renderCalendar()
                ) : (
                    <div>
                        <button onClick={() => setSelectedDate(null)} className="btn btn-outline mb-4">&larr; Back to Calendar ({selectedDate})</button>

                        {plans.filter(p => new Date(p.date).toDateString() === selectedDate).length === 0 ? (
                            <p>No plans for this date.</p>
                        ) : (
                            plans.filter(p => new Date(p.date).toDateString() === selectedDate).map((plan, pIdx) => {
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
                                            <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
                                        </div>

                                        {!isCollapsed && (
                                            <div className="exercise-list">
                                                {plan.exercises.map((ex, idx) => {
                                                    const itemKey = `${plan.id}-${idx}`;
                                                    const embedUrl = getEmbedUrl(ex.videoUrl);

                                                    return (
                                                        <div key={idx} className={`exercise-wrapper ${ex.done ? 'done-wrapper' : ''}`}>
                                                            <div className="exercise-item-group">
                                                                <div className="exercise-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={ex.done}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleExercise(plan.id, idx, ex.done);
                                                                        }}
                                                                    />
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
                                                })}
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
    );
};

export default UserDashboard;

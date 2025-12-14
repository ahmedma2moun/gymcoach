import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Dashboard.css';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const [plans, setPlans] = useState([]);
    const [openVideoIndex, setOpenVideoIndex] = useState(null);
    const [expandedPlans, setExpandedPlans] = useState({});
    const [exerciseWeights, setExerciseWeights] = useState({});
    const [previousWeights, setPreviousWeights] = useState({});

    useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const fetchPlans = async () => {
        const res = await fetch(`/api/plans/${user.id}`);
        const data = await res.json();
        setPlans(data);

        // Fetch previous weights for all exercises in the plans
        const weights = {};
        for (const plan of data) {
            for (const exercise of plan.exercises) {
                if (!exercise.done && !weights[exercise.name]) {
                    const prevWeight = await fetchPreviousWeight(exercise.name);
                    if (prevWeight) {
                        weights[exercise.name] = prevWeight;
                    }
                }
            }
        }
        setPreviousWeights(weights);
    };

    const fetchPreviousWeight = async (exerciseName) => {
        try {
            const res = await fetch(`/api/plans/user/${user.id}/exercise-history/${encodeURIComponent(exerciseName)}`);
            const data = await res.json();
            return data.weight;
        } catch (e) {
            return null;
        }
    };

    const toggleExercise = async (planId, exerciseIndex, currentStatus) => {
        const key = `${planId}-${exerciseIndex}`;
        const weight = exerciseWeights[key] || '';

        const res = await fetch(`/api/plans/${planId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exerciseIndex, done: !currentStatus, weight })
        });

        if (res.ok) {
            fetchPlans();
            // Clear the weight input after marking as done
            setExerciseWeights(prev => {
                const newWeights = { ...prev };
                delete newWeights[key];
                return newWeights;
            });
        }
    };

    const handleWeightChange = (planId, exerciseIndex, value) => {
        const key = `${planId}-${exerciseIndex}`;
        setExerciseWeights(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getEmbedUrl = (url) => {
        if (!url) return '';
        // Handle standard youtube.com/watch?v=ID and youtu.be/ID
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

    return (
        <div className="dashboard">
            <header className="dash-header">
                <h1>Welcome, {user?.username}</h1>
                <button onClick={logout} className="btn btn-outline">Logout</button>
            </header>

            <div className="plans-container">
                {plans.length === 0 ? (
                    <p>No training plans assigned yet.</p>
                ) : (
                    plans.map((plan, pIdx) => {
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
                                        {plan.title} {plan.date && <span className="plan-date">({new Date(plan.date).toLocaleDateString()})</span>}
                                        {isCompleted && <span className="check-icon">✓</span>}
                                    </h3>
                                    <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
                                </div>

                                {!isCollapsed && (
                                    <div className="exercise-list">
                                        {plan.exercises.map((ex, idx) => {
                                            const itemKey = `${pIdx}-${idx}`;
                                            const embedUrl = getEmbedUrl(ex.videoUrl);

                                            return (
                                                <div key={idx} className={`exercise-wrapper ${ex.done ? 'done-wrapper' : ''}`}>
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
                                                                {ex.done && ex.weight && ` @ ${ex.weight}`}
                                                            </span>
                                                            {!ex.done && previousWeights[ex.name] && (
                                                                <span className="previous-weight">Last used: {previousWeights[ex.name]}</span>
                                                            )}
                                                        </div>
                                                        {!ex.done && (
                                                            <input
                                                                type="text"
                                                                className="weight-input"
                                                                placeholder="Weight (e.g., 50kg)"
                                                                value={exerciseWeights[`${plan.id}-${idx}`] || ''}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleWeightChange(plan.id, idx, e.target.value);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
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
        </div>
    );
};

export default UserDashboard;

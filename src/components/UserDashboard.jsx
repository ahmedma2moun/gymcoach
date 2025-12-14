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
    const [previousWeights, setPreviousWeights] = useState({});

    const [activeTab, setActiveTab] = useState('unfinished');

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
        let weight = exerciseWeights[key] || '';
        if (weight) weight = `${weight} kg`;

        const res = await fetch(`/api/plans/${planId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exerciseIndex, done: !currentStatus, weight })
        });

        if (res.ok) {
            fetchPlans();
            // Clear the weight inputs after marking as done
            setExerciseWeights(prev => {
                const newWeights = { ...prev };
                delete newWeights[key];
                return newWeights;
            });
            setExerciseWeightsLbs(prev => {
                const newWeights = { ...prev };
                delete newWeights[key];
                return newWeights;
            });
        }
    };

    const handleWeightChange = (planId, exerciseIndex, value, unit) => {
        const key = `${planId}-${exerciseIndex}`;

        if (unit === 'kg') {
            // Update kg value
            setExerciseWeights(prev => ({
                ...prev,
                [key]: value
            }));

            // Auto-calculate lbs (1 kg = 2.20462 lbs)
            const lbsValue = value ? (parseFloat(value) * 2.20462).toFixed(1) : '';
            setExerciseWeightsLbs(prev => ({
                ...prev,
                [key]: lbsValue
            }));
        } else if (unit === 'lbs') {
            // Update lbs value
            setExerciseWeightsLbs(prev => ({
                ...prev,
                [key]: value
            }));

            // Auto-calculate kg (1 lbs = 0.453592 kg)
            const kgValue = value ? (parseFloat(value) * 0.453592).toFixed(1) : '';
            setExerciseWeights(prev => ({
                ...prev,
                [key]: kgValue
            }));
        }
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

    // Derived state for tabs
    const unfinishedPlans = plans
        .filter(p => !p.exercises.every(ex => ex.done))
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ascending (oldest first)

    const completedPlans = plans
        .filter(p => p.exercises.length > 0 && p.exercises.every(ex => ex.done))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Descending (newest first)

    const displayedPlans = activeTab === 'unfinished' ? unfinishedPlans : completedPlans;

    return (
        <div className="dashboard">
            <header className="dash-header">
                <h1>Welcome, {user?.username}</h1>
                <button onClick={logout} className="btn btn-outline">Logout</button>
            </header>

            <div className="admin-tabs" style={{ marginBottom: '2rem' }}>
                <button
                    className={`tab-btn ${activeTab === 'unfinished' ? 'active' : ''}`}
                    onClick={() => setActiveTab('unfinished')}
                >
                    Unfinished Plans
                </button>
                <button
                    className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed Plans
                </button>
            </div>

            <div className="plans-container">
                {displayedPlans.length === 0 ? (
                    <p>No {activeTab} training plans found.</p>
                ) : (
                    displayedPlans.map((plan, pIdx) => {
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
                                                            <div className="weight-inputs-container">
                                                                <div className="weight-input-group">
                                                                    <input
                                                                        type="number"
                                                                        className="weight-input"
                                                                        placeholder="kg"
                                                                        value={exerciseWeights[`${plan.id}-${idx}`] || ''}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleWeightChange(plan.id, idx, e.target.value, 'kg');
                                                                        }}
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
                                                                        value={exerciseWeightsLbs[`${plan.id}-${idx}`] || ''}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleWeightChange(plan.id, idx, e.target.value, 'lbs');
                                                                        }}
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

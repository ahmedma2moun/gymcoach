import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Dashboard.css';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const [plans, setPlans] = useState([]);
    const [openVideoIndex, setOpenVideoIndex] = useState(null);
    const [expandedPlans, setExpandedPlans] = useState({});

    useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const fetchPlans = async () => {
        const res = await fetch(`/api/plans/${user.id}`);
        const data = await res.json();
        setPlans(data);
    };

    const toggleExercise = async (planId, exerciseIndex, currentStatus) => {
        const res = await fetch(`/api/plans/${planId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exerciseIndex, done: !currentStatus })
        });

        if (res.ok) {
            fetchPlans();
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
                        // If not explicitly toggled:
                        // - Completed: Collapsed
                        // - Not Completed: Expanded
                        // If explicitly toggled (expandedPlans[id] exists), respect that.

                        let isCollapsed;
                        if (expandedPlans[plan.id] === undefined) {
                            // Default state behavior
                            isCollapsed = isCompleted;
                        } else {
                            // Explicit user toggle behavior (inverted logic because true means expanded)
                            isCollapsed = !expandedPlans[plan.id];
                        }

                        // Allow expansion toggle for ALL plans now
                        return (
                            <div key={plan.id} className={`plan-card ${isCompleted ? 'completed-plan' : ''}`}>
                                <div className="plan-header" onClick={() => toggleExpand(plan.id)}>
                                    <h3>{plan.title} {isCompleted && <span className="check-icon">✓</span>}</h3>
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
                                                            toggleVideo(itemKey);
                                                                }}
                                                            >
                                                        {openVideoIndex === itemKey ? 'Hide Video' : 'Watch Video'}
                                                    </button>
                                                        )}
                                                </div>
                                                    {
                                                openVideoIndex === itemKey && embedUrl && (
                                                    <div className="video-container">
                                                        <iframe
                                                            src={embedUrl}
                                                            title={ex.name}
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                )
                                            }
                                                </div>
                                );
                                        })}
                            </div>
                        )
                    }
                            </div>
            );
                    })
                )}
        </div>
        </div >
    );
};

export default UserDashboard;

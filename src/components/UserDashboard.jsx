import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Dashboard.css';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const [plans, setPlans] = useState([]);
    const [openVideoIndex, setOpenVideoIndex] = useState(null);

    useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const fetchPlans = async () => {
        const res = await fetch(`http://localhost:3000/api/plans/${user.id}`);
        const data = await res.json();
        setPlans(data);
    };

    const toggleExercise = async (planId, exerciseIndex, currentStatus) => {
        const res = await fetch(`http://localhost:3000/api/plans/${planId}`, {
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
                    plans.map((plan, pIdx) => (
                        <div key={plan.id} className="plan-card">
                            <h3>{plan.title}</h3>
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
                                                    onChange={() => toggleExercise(plan.id, idx, ex.done)}
                                                />
                                                <div className="ex-details">
                                                    <span className="ex-name">{ex.name}</span>
                                                    <span className="ex-meta">{ex.sets} Sets x {ex.reps} Reps</span>
                                                </div>
                                                {embedUrl && (
                                                    <button
                                                        className="btn-video"
                                                        onClick={() => toggleVideo(itemKey)}
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
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserDashboard;

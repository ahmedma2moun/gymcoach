import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPlan, setNewPlan] = useState({ title: '', date: '', exercises: [] });
    const [exerciseInput, setExerciseInput] = useState({ exerciseId: '', sets: '', reps: '' });

    // Exercise library state
    const [exercises, setExercises] = useState([]);
    const [newExercise, setNewExercise] = useState({ name: '', videoUrl: '' });
    const [editingExercise, setEditingExercise] = useState(null);

    // New state for viewing progress
    const [viewingUser, setViewingUser] = useState(null);
    const [userPlans, setUserPlans] = useState([]);
    const [expandedPlans, setExpandedPlans] = useState({});

    useEffect(() => {
        fetchUsers();
        fetchExercises();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data);
    };

    const fetchExercises = async () => {
        const res = await fetch('/api/exercises');
        const data = await res.json();
        setExercises(data);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        if (res.ok) {
            setNewUser({ username: '', password: '' });
            fetchUsers();
        } else {
            alert('Error creating user');
        }
    };

    const addExerciseToPlan = () => {
        if (!exerciseInput.exerciseId || !exerciseInput.sets || !exerciseInput.reps) return;

        const selectedExercise = exercises.find(ex => ex.id == exerciseInput.exerciseId);
        if (!selectedExercise) return;

        setNewPlan({
            ...newPlan,
            exercises: [...newPlan.exercises, {
                name: selectedExercise.name,
                videoUrl: selectedExercise.videoUrl,
                sets: exerciseInput.sets,
                reps: exerciseInput.reps
            }]
        });
        setExerciseInput({ exerciseId: '', sets: '', reps: '' });
    };

    const removeExerciseFromPlan = (indexToRemove) => {
        setNewPlan({
            ...newPlan,
            exercises: newPlan.exercises.filter((_, index) => index !== indexToRemove)
        });
    };

    const handleAssignPlan = async () => {
        if (!selectedUser || newPlan.exercises.length === 0) return;

        const res = await fetch('/api/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: selectedUser,
                title: newPlan.title,
                date: newPlan.date,
                exercises: newPlan.exercises
            })
        });

        if (res.ok) {
            alert('Plan assigned!');
            setNewPlan({ title: '', date: '', exercises: [] });
            setSelectedUser(null);
        }
    };

    const handleViewProgress = async (user) => {
        setViewingUser(user);
        const res = await fetch(`/api/plans/${user.id}`);
        const data = await res.json();
        setUserPlans(data);
    };

    const handleRepeatPlan = (plan) => {
        // Pre-fill the form with this plan's data
        const cleanExercises = plan.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            videoUrl: ex.videoUrl
        }));

        setNewPlan({
            title: `${plan.title} (Repeat)`,
            date: '', // Force choosing a new date
            exercises: cleanExercises
        });
        setSelectedUser(viewingUser.id);

        // Close modal and scroll to form implicitly (by layout)
        setViewingUser(null);
        setUserPlans([]);
    };

    const closeProgressView = () => {
        setViewingUser(null);
        setUserPlans([]);
        setExpandedPlans({});
    };

    const toggleExpand = (planId, currentCollapsedState) => {
        setExpandedPlans(prev => ({
            ...prev,
            [planId]: currentCollapsedState // If was collapsed (true), set expanded (true). If passed expanded (false), set collapsed (false).
        }));
    };

    const handleToggleStatus = async (user) => {
        const newStatus = !user.isActive;
        const res = await fetch(`/api/users/${user.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: newStatus })
        });
        if (res.ok) {
            // Update local state
            setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
        } else {
            alert('Error updating user status');
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;

        const res = await fetch(`/api/plans/${planId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            setUserPlans(userPlans.filter(p => p.id !== planId));
        } else {
            alert('Error deleting plan');
        }
    };

    // Exercise Library Functions
    const handleCreateExercise = async (e) => {
        e.preventDefault();
        if (!newExercise.name) return;

        const res = await fetch('/api/exercises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newExercise)
        });

        if (res.ok) {
            setNewExercise({ name: '', videoUrl: '' });
            fetchExercises();
        } else {
            alert('Error creating exercise');
        }
    };

    const handleUpdateExercise = async () => {
        if (!editingExercise) return;

        const res = await fetch(`/api/exercises/${editingExercise.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editingExercise.name, videoUrl: editingExercise.videoUrl })
        });

        if (res.ok) {
            setEditingExercise(null);
            fetchExercises();
        } else {
            alert('Error updating exercise');
        }
    };

    const handleDeleteExercise = async (exerciseId) => {
        if (!confirm('Are you sure you want to delete this exercise?')) return;

        const res = await fetch(`/api/exercises/${exerciseId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            fetchExercises();
        } else {
            alert('Error deleting exercise');
        }
    };

    return (
        <div className="dashboard">
            <header className="dash-header">
                <h1>Admin Dashboard</h1>
                <button onClick={logout} className="btn btn-outline">Logout</button>
            </header>

            <div className="dash-grid">
                <div className="dash-card">
                    <h2>Create User</h2>
                    <form onSubmit={handleCreateUser} className="dash-form">
                        <input
                            placeholder="Username"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        />
                        <input
                            placeholder="Password"
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        />
                        <button type="submit" className="btn btn-primary">Add User</button>
                    </form>

                    <h3 className="mt-4">Users List</h3>
                    <ul className="user-list">
                        {users.map(u => (
                            <li key={u.id} className="user-item">
                                <span>{u.username} <small>({u.role})</small></span>
                                {u.role !== 'admin' && (
                                    <div className="user-actions">
                                        <button
                                            className={`btn-small ${u.isActive !== false ? 'btn-deactivate' : 'btn-activate'}`} // Default to active if undefined
                                            onClick={() => handleToggleStatus(u)}
                                            title={u.isActive !== false ? 'Deactivate User' : 'Activate User'}
                                        >
                                            {u.isActive !== false ? '🚫' : '✅'}
                                        </button>
                                        <button
                                            className="btn-small btn-view"
                                            onClick={() => handleViewProgress(u)}
                                            title="View Progress"
                                        >
                                            👁️
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="dash-card">
                    <h2>Assign Training Plan</h2>
                    <select
                        value={selectedUser || ''}
                        onChange={e => setSelectedUser(e.target.value)}
                        className="full-width"
                    >
                        <option value="">Select User</option>
                        {users.filter(u => u.role !== 'admin' && u.isActive !== false).map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                    </select>

                    <input
                        placeholder="Plan Title (e.g., Leg Day)"
                        value={newPlan.title}
                        onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                        className="full-width mt-2"
                    />

                    <div className="input-group mt-2">
                        <label className="input-label">Start Date:</label>
                        <input
                            type="date"
                            value={newPlan.date}
                            min={new Date().toISOString().split('T')[0]} // Prevent past dates
                            onChange={e => setNewPlan({ ...newPlan, date: e.target.value })}
                            onClick={(e) => e.target.showPicker()} /* Open picker on click anywhere in field */
                            className="full-width"
                        />
                    </div>

                    <div className="exercise-builder">
                        <h4>Add Exercises</h4>
                        <div className="ex-inputs">
                            <select
                                value={exerciseInput.exerciseId}
                                onChange={e => setExerciseInput({ ...exerciseInput, exerciseId: e.target.value })}
                                className="exercise-select"
                            >
                                <option value="">Select Exercise</option>
                                {exercises.map(ex => (
                                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                            </select>
                            <input
                                placeholder="Sets"
                                value={exerciseInput.sets}
                                onChange={e => setExerciseInput({ ...exerciseInput, sets: e.target.value })}
                            />
                            <input
                                placeholder="Reps"
                                value={exerciseInput.reps}
                                onChange={e => setExerciseInput({ ...exerciseInput, reps: e.target.value })}
                            />
                            <button type="button" onClick={addExerciseToPlan} className="btn-small">+</button>
                        </div>

                        <ul className="plan-preview">
                            {newPlan.exercises.map((ex, i) => (
                                <li key={i} className="preview-item">
                                    <span>{ex.name} - {ex.sets}x{ex.reps} {ex.videoUrl && '📹'}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeExerciseFromPlan(i)}
                                        className="btn-delete-ex"
                                        title="Remove exercise"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button onClick={handleAssignPlan} className="btn btn-primary full-width mt-2">
                        Assign Plan
                    </button>
                </div>

                {/* Exercise Library Card */}
                <div className="dash-card">
                    <h2>Exercise Library</h2>
                    <form onSubmit={handleCreateExercise} className="dash-form">
                        <input
                            placeholder="Exercise Name"
                            value={newExercise.name}
                            onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                            required
                        />
                        <input
                            placeholder="YouTube URL (optional)"
                            value={newExercise.videoUrl}
                            onChange={e => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                        />
                        <button type="submit" className="btn btn-primary">Add Exercise</button>
                    </form>

                    <h3 className="mt-4">Exercise List</h3>
                    <ul className="user-list">
                        {exercises.map(ex => (
                            <li key={ex.id} className="user-item">
                                {editingExercise?.id === ex.id ? (
                                    <div className="edit-exercise-form">
                                        <input
                                            value={editingExercise.name}
                                            onChange={e => setEditingExercise({ ...editingExercise, name: e.target.value })}
                                            placeholder="Exercise Name"
                                        />
                                        <input
                                            value={editingExercise.videoUrl}
                                            onChange={e => setEditingExercise({ ...editingExercise, videoUrl: e.target.value })}
                                            placeholder="Video URL"
                                        />
                                        <div className="edit-actions">
                                            <button onClick={handleUpdateExercise} className="btn-small btn-save">💾</button>
                                            <button onClick={() => setEditingExercise(null)} className="btn-small btn-cancel">✕</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span>{ex.name} {ex.videoUrl && '📹'}</span>
                                        <div className="user-actions">
                                            <button
                                                className="btn-small btn-edit"
                                                onClick={() => setEditingExercise(ex)}
                                                title="Edit Exercise"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-small btn-delete"
                                                onClick={() => handleDeleteExercise(ex.id)}
                                                title="Delete Exercise"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Progress Modal / Overlay */}
            {viewingUser && (
                <div className="modal-overlay">
                    <div className="modal-content dash-card">
                        <div className="modal-header">
                            <h2>Progress: {viewingUser.username}</h2>
                            <button onClick={closeProgressView} className="btn-close">X</button>
                        </div>
                        <div className="user-plans-list">
                            {userPlans.length === 0 ? (
                                <p>No plans assigned.</p>
                            ) : (
                                userPlans.map((plan, idx) => {
                                    const isCompleted = plan.exercises.every(e => e.done);
                                    let isCollapsed;
                                    if (expandedPlans[plan.id] === undefined) {
                                        isCollapsed = isCompleted;
                                    } else {
                                        isCollapsed = !expandedPlans[plan.id];
                                    }

                                    return (
                                        <div key={idx} className={`plan-card ${isCompleted ? 'completed-plan' : ''}`}>
                                            <div className="plan-header" onClick={() => toggleExpand(plan.id, isCollapsed)}>
                                                <h3>
                                                    {plan.title} {plan.date && <small>({new Date(plan.date).toLocaleDateString()})</small>}
                                                    {isCompleted && <span className="check-icon">✓</span>}
                                                </h3>
                                                <div className="header-actions">
                                                    <button
                                                        className="btn-small btn-repeat"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRepeatPlan(plan);
                                                        }}
                                                        title="Repeat this plan"
                                                    >
                                                        ↻ Repeat
                                                    </button>
                                                    <button
                                                        className="btn-small btn-delete-plan"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeletePlan(plan.id);
                                                        }}
                                                        title="Delete Plan"
                                                    >
                                                        🗑️
                                                    </button>
                                                    <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
                                                </div>
                                            </div>
                                            {!isCollapsed && (
                                                <div className="exercise-list">
                                                    {plan.exercises.map((ex, i) => (
                                                        <div key={i} className={`exercise-wrapper ${ex.done ? 'done-wrapper' : ''}`}>
                                                            <div className="exercise-item">
                                                                <input type="checkbox" checked={ex.done} readOnly />
                                                                <div className="ex-details">
                                                                    <span className="ex-name">{ex.name}</span>
                                                                    <span className="ex-meta">
                                                                        {ex.sets} Sets x {ex.reps} Reps
                                                                        {ex.weight && ` @ ${ex.weight}`}
                                                                        {ex.done && !ex.weight && ' (No weight logged)'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

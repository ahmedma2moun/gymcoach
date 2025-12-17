import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('user-plans'); // Default to User Plans (leftmost)
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [selectedUser, setSelectedUser] = useState(null);
    const [planForm, setPlanForm] = useState({ id: null, title: '', date: '', exercises: [] }); // Renamed from newPlan to planForm for clarity
    const [exerciseInput, setExerciseInput] = useState({ exerciseId: '', sets: '', reps: '', coachNote: '' });
    const [selectedExercises, setSelectedExercises] = useState([]); // Array of indices
    const [cloningPlan, setCloningPlan] = useState(null);

    // Exercise library state
    const [exercises, setExercises] = useState([]);
    const [newExercise, setNewExercise] = useState({ name: '', videoUrl: '' });
    const [editingExercise, setEditingExercise] = useState(null);

    // New state for viewing progress
    const [viewingUser, setViewingUser] = useState(null);
    const [userPlans, setUserPlans] = useState([]);
    const [expandedPlans, setExpandedPlans] = useState({});

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([fetchUsers(), fetchExercises()]);
            setIsLoading(false);
        };
        init();
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
        setIsLoading(true);
        try {
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
        } catch (error) {
            console.error(error);
            alert('Error creating user');
        } finally {
            setIsLoading(false);
        }
    };

    const addExerciseToPlan = () => {
        if (!exerciseInput.exerciseId || !exerciseInput.sets || !exerciseInput.reps) return;

        const selectedExercise = exercises.find(ex => ex.id == exerciseInput.exerciseId);
        if (!selectedExercise) return;

        setPlanForm({
            ...planForm,
            exercises: [...planForm.exercises, {
                name: selectedExercise.name,
                videoUrl: selectedExercise.videoUrl,
                sets: exerciseInput.sets,
                reps: exerciseInput.reps,
                coachNote: exerciseInput.coachNote,
                done: false
            }]
        });
        setExerciseInput({ exerciseId: '', sets: '', reps: '', coachNote: '' });
    };



    const removeExerciseFromPlan = (indexToRemove) => {
        setPlanForm({
            ...planForm,
            exercises: planForm.exercises.filter((_, index) => index !== indexToRemove)
        });
        setSelectedExercises(selectedExercises.filter(i => i !== indexToRemove).map(i => i > indexToRemove ? i - 1 : i));
    };

    const toggleExerciseSelection = (index) => {
        setSelectedExercises(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleCreateSuperset = () => {
        if (selectedExercises.length < 2) return;

        const supersetId = 'ss-' + Date.now();
        const updatedExercises = [...planForm.exercises];

        selectedExercises.forEach(index => {
            if (updatedExercises[index]) {
                updatedExercises[index] = { ...updatedExercises[index], supersetId };
            }
        });

        setPlanForm({ ...planForm, exercises: updatedExercises });
        setSelectedExercises([]);
    };

    const handleUngroupSuperset = (supersetId) => {
        const updatedExercises = planForm.exercises.map(ex =>
            ex.supersetId === supersetId ? { ...ex, supersetId: null } : ex
        );
        setPlanForm({ ...planForm, exercises: updatedExercises });
    };

    const handleSavePlan = async () => {
        if (!viewingUser || planForm.exercises.length === 0) return;

        setIsLoading(true);
        try {
            const isEditing = !!planForm.id;
            const url = isEditing ? `/api/plans/${planForm.id}` : '/api/plans';
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing
                ? { title: planForm.title, exercises: planForm.exercises }
                : {
                    userId: viewingUser.id,
                    title: planForm.title,
                    date: selectedDate, // Use the selected calendar date
                    exercises: planForm.exercises
                };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert(isEditing ? 'Plan updated!' : 'Plan created!');
                setPlanForm({ id: null, title: '', date: '', exercises: [] }); // Reset form
                // Refresh plans
                await fetch(`/api/plans/${viewingUser.id}`)
                    .then(res => res.json())
                    .then(data => setUserPlans(data));

                // Return to calendar view instead of closing modal or staying on form
                setSelectedDate(null);
            }
        } catch (error) {
            console.error(error);
            alert('Error saving plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewProgress = async (user) => {
        setViewingUser(user);
        setIsLoading(true);
        try {
            const res = await fetch(`/api/plans/${user.id}`);
            const data = await res.json();
            setUserPlans(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };



    const closeProgressView = () => {
        setViewingUser(null);
        setUserPlans([]);
        setExpandedPlans({});
        setCurrentDate(new Date());
        setSelectedDate(null);
        setPlanForm({ id: null, title: '', date: '', exercises: [] });
    };

    const toggleExpand = (planId, currentCollapsedState) => {
        setExpandedPlans(prev => ({
            ...prev,
            [planId]: currentCollapsedState
        }));
    };

    const handleToggleStatus = async (user) => {
        const newStatus = !user.isActive;
        setIsLoading(true);
        try {
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
        } catch (error) {
            console.error(error);
            alert('Error updating status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/plans/${planId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setUserPlans(userPlans.filter(p => p.id !== planId));
                // Also close details if open for this plan
                if (activeTab === 'users' && selectedDate) {
                    // Force refresh or just let the filtering handle it
                }
            } else {
                alert('Error deleting plan');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClonePlan = (plan) => {

        setCloningPlan(plan);
        alert('Plan copied! Select a future date to paste it.');
        setSelectedDate(null); // Return to calendar to let user pick a date
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

    const handleDayClick = async (day) => {
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = dateObj.toDateString();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check for existing plans
        const plansForDay = userPlans.filter(p => new Date(p.date).toDateString() === dateStr);

        // Restriction: Disable past empty dates
        if (dateObj < today && plansForDay.length === 0) {
            return;
        }

        setSelectedDate(dateStr);

        // Cloning Logic: Auto-save the cloned plan
        if (cloningPlan && dateObj >= today) {
            // Restriction: Can only clone to empty days
            if (plansForDay.length > 0) {
                alert('A plan already exists on this date. Please select an empty date.');
                return;
            }

            const newPlanBody = {
                userId: viewingUser.id,
                title: `${cloningPlan.title}`,
                date: dateStr,
                exercises: cloningPlan.exercises.map(ex => ({
                    name: ex.name,
                    videoUrl: ex.videoUrl,
                    sets: ex.sets,
                    reps: ex.reps,
                    coachNote: ex.coachNote,
                    supersetId: ex.supersetId,
                    done: false
                }))
            };

            setIsLoading(true);
            try {
                const res = await fetch('/api/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPlanBody)
                });
                if (res.ok) {
                    alert('Plan cloned successfully!');
                    setCloningPlan(null);
                    // Refresh plans
                    await fetch(`/api/plans/${viewingUser.id}`)
                        .then(res => res.json())
                        .then(data => setUserPlans(data));

                    setSelectedDate(null); // Close modal to show updated calendar
                }
            } catch (error) {
                console.error(error);
                alert('Error cloning plan');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // If plan exists and is unfinished, or if date is empty - prepare form
        // Priority: Edit unfinished plan if exists.
        const unfinishedPlan = plansForDay.find(p => !p.exercises.every(e => e.done));

        if (unfinishedPlan) {
            // Edit Mode
            setPlanForm({
                id: unfinishedPlan.id,
                title: unfinishedPlan.title,
                date: unfinishedPlan.date,
                exercises: unfinishedPlan.exercises
            });
        } else if (plansForDay.length === 0) {
            // Create New Mode
            setPlanForm({
                id: null,
                title: '',
                date: dateStr,
                exercises: []
            });
        } else {
            // Only finished plans - maybe just view? Reset form just in case
            setPlanForm({ id: null, title: '', date: dateStr, exercises: [] });
        }
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = dateObj.toDateString();
            const dayPlans = userPlans.filter(p => {
                // Fix timezone issue by comparing valid date strings or using local date parts if stored as YYYY-MM-DD
                // Assumes p.date is ISO string. compare by local date string for simplicity in this context
                return new Date(p.date).toDateString() === dateStr;
            });

            const hasPlan = dayPlans.length > 0;

            // Determine day status color and disability
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = dateObj < today;
            /* 
               Disabled if:
               1. Past date AND no plan (default restriction)
               2. Cloning Mode AND date has a plan (prevent overwrite)
            */
            const isDisabled = (isPast && !hasPlan) || (cloningPlan && hasPlan);

            let dayStatusClass = '';
            // ... existing status logic ...
            if (hasPlan) {
                const hasMissed = dayPlans.some(p => {
                    const isDone = p.exercises.every(e => e.done);
                    const pDate = new Date(p.date);
                    const t = new Date(); t.setHours(0, 0, 0, 0);
                    pDate.setHours(0, 0, 0, 0);
                    return !isDone && pDate < t;
                });

                const hasPending = dayPlans.some(p => {
                    const isDone = p.exercises.every(e => e.done);
                    const pDate = new Date(p.date);
                    const t = new Date(); t.setHours(0, 0, 0, 0);
                    pDate.setHours(0, 0, 0, 0);
                    return !isDone && pDate >= t;
                });

                if (hasMissed) dayStatusClass = 'status-missed-day';
                else if (hasPending) dayStatusClass = '';
                else dayStatusClass = 'status-completed-day';
            }

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${hasPlan ? 'has-plan' : ''} ${dayStatusClass} ${isDisabled ? 'disabled-day' : ''} ${cloningPlan && !isPast && !hasPlan ? 'clone-target' : ''}`}
                    onClick={() => !isDisabled && handleDayClick(day)}
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

    // Exercise Library Functions
    const handleCreateExercise = async (e) => {
        e.preventDefault();
        if (!newExercise.name) return;

        setIsLoading(true);
        try {
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
        } catch (error) {
            console.error(error);
            alert('Error creating exercise');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateExercise = async () => {
        if (!editingExercise) return;

        setIsLoading(true);
        try {
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
        } catch (error) {
            console.error(error);
            alert('Error updating exercise');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExercise = async (exerciseId) => {
        if (!confirm('Are you sure you want to delete this exercise?')) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/exercises/${exerciseId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchExercises();
            } else {
                alert('Error deleting exercise');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting exercise');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <header className="dash-header">
                <h1>Admin Dashboard</h1>
                <button onClick={logout} className="btn btn-outline">Logout</button>
            </header>

            <div className="admin-layout">
                <div className="admin-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'user-plans' ? 'active' : ''}`}
                        onClick={() => setActiveTab('user-plans')}
                    >
                        User Plans
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
                        onClick={() => setActiveTab('exercises')}
                    >
                        Exercise Library
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'create-user' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create-user')}
                    >
                        Create User
                    </button>
                </div>

                {isLoading ? (
                    <div className="loader-container">
                        <div className="loader-spinner"></div>
                    </div>
                ) : (
                    <div className="tab-content">
                        {activeTab === 'user-plans' && (
                            <div className="dash-card">
                                <h3 className="mt-4">Users List</h3>
                                <ul className="user-list">
                                    {users.filter(u => u.role !== 'admin').map(u => (
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
                                                        📅
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {activeTab === 'exercises' && (
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
                                                            ✕
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {activeTab === 'create-user' && (
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
                            </div>
                        )}


                    </div>
                )}
            </div>

            {/* Progress Modal / Overlay */}
            {viewingUser && (
                <div className="modal-overlay">
                    <div className="modal-content dash-card">
                        <div className="modal-header">
                            <h2>Progress: {viewingUser.username} {selectedDate && `- ${selectedDate}`}</h2>
                            <button onClick={closeProgressView} className="btn-close">X</button>
                        </div>

                        {isLoading ? (
                            <div className="loader-container">
                                <div className="loader-spinner"></div>
                            </div>
                        ) : !selectedDate ? (
                            renderCalendar()
                        ) : (
                            <div className="day-detail-view">
                                <button onClick={() => setSelectedDate(null)} className="btn btn-outline mb-4">&larr; Back to Calendar ({selectedDate})</button>

                                {/* New Plan Form if date is empty or editing unfinished plan */}
                                {(userPlans.filter(p => new Date(p.date).toDateString() === selectedDate).length === 0 ||
                                    userPlans.find(p => new Date(p.date).toDateString() === selectedDate && !p.exercises.every(e => e.done))) && (
                                        <div className="plan-form-modal">
                                            <h3>{planForm.id ? `Edit Plan for ${selectedDate}` : `Create Plan for ${selectedDate}`}</h3>

                                            <input
                                                placeholder="Plan Title (e.g., Leg Day)"
                                                value={planForm.title}
                                                onChange={e => setPlanForm({ ...planForm, title: e.target.value })}
                                                className="full-width mt-2"
                                            />

                                            <div className="exercise-builder">
                                                <h4>Exercises</h4>
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
                                                    <input
                                                        placeholder="Coach Note (optional)"
                                                        value={exerciseInput.coachNote}
                                                        onChange={e => setExerciseInput({ ...exerciseInput, coachNote: e.target.value })}
                                                        className="full-width"
                                                        style={{ gridColumn: '1 / -1', marginTop: '5px' }}
                                                    />
                                                    <button type="button" onClick={addExerciseToPlan} className="btn-small">+</button>
                                                </div>

                                                <ul className="plan-preview">
                                                    {(() => {
                                                        const displayItems = [];
                                                        let currentSuperset = null;

                                                        planForm.exercises.forEach((ex, idx) => {
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

                                                        return displayItems.map((item, groupIdx) => {
                                                            if (item.type === 'superset') {
                                                                return (
                                                                    <li key={`group-${groupIdx}`} className="superset-group-container" style={{ border: '2px dashed #00d2ff', borderRadius: '8px', padding: '10px', marginBottom: '10px', position: 'relative', listStyle: 'none' }}>
                                                                        <div className="superset-label" style={{ position: 'absolute', top: '-10px', left: '10px', background: '#242424', padding: '0 5px', color: '#00d2ff', fontSize: '0.8em', fontWeight: 'bold' }}>
                                                                            Superset
                                                                            <button type="button" className="btn-small text-btn" onClick={() => handleUngroupSuperset(item.id)} style={{ marginLeft: '10px', color: '#ff4d4d' }}>(ungroup)</button>
                                                                        </div>
                                                                        <ul style={{ padding: 0, marginTop: '5px' }}>
                                                                            {item.items.map((ex, subIdx) => {
                                                                                const i = ex.originalIndex;
                                                                                const isSelected = selectedExercises.includes(i);
                                                                                return (
                                                                                    <li key={i} className="preview-item" style={{ marginBottom: subIdx < item.items.length - 1 ? '10px' : '0', borderBottom: subIdx < item.items.length - 1 ? '1px solid #333' : 'none', paddingBottom: subIdx < item.items.length - 1 ? '10px' : '0' }}>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isSelected}
                                                                                            onChange={() => toggleExerciseSelection(i)}
                                                                                            style={{ marginRight: '10px' }}
                                                                                        />
                                                                                        <div>
                                                                                            <span>{ex.name} - {ex.sets}x{ex.reps}</span>
                                                                                            {ex.coachNote && <div className="preview-note">Note: {ex.coachNote}</div>}
                                                                                        </div>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => removeExerciseFromPlan(i)}
                                                                                            className="btn-delete-ex"
                                                                                        >
                                                                                            ✕
                                                                                        </button>
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                    </li>
                                                                );
                                                            } else {
                                                                const ex = item.data;
                                                                const i = ex.originalIndex;
                                                                const isSelected = selectedExercises.includes(i);
                                                                return (
                                                                    <li key={i} className="preview-item">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleExerciseSelection(i)}
                                                                            style={{ marginRight: '10px' }}
                                                                        />
                                                                        <div>
                                                                            <span>{ex.name} - {ex.sets}x{ex.reps}</span>
                                                                            {ex.coachNote && <div className="preview-note">Note: {ex.coachNote}</div>}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeExerciseFromPlan(i)}
                                                                            className="btn-delete-ex"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </li>
                                                                );
                                                            }
                                                        });
                                                    })()}
                                                </ul>
                                            </div>

                                            <button onClick={handleSavePlan} className="btn btn-primary full-width mt-2">
                                                {planForm.id ? 'Update Plan' : 'Create Plan'}
                                            </button>

                                            {selectedExercises.length >= 2 && (
                                                <button onClick={handleCreateSuperset} className="btn btn-secondary full-width mt-2">
                                                    Create Superset ({selectedExercises.length})
                                                </button>
                                            )}

                                            <hr className="divider" />
                                        </div>
                                    )}

                                <div className="user-plans-list">
                                    {userPlans.filter(p => new Date(p.date).toDateString() === selectedDate).length === 0 ? (
                                        <p>No plans for this date.</p>
                                    ) : (
                                        userPlans.filter(p => new Date(p.date).toDateString() === selectedDate).map((plan, idx) => {
                                            const isCompleted = plan.exercises.every(e => e.done);
                                            // Always expand in detail view for simplicity, or manage state
                                            const isCollapsed = expandedPlans[plan.id] === undefined ? false : !expandedPlans[plan.id];

                                            return (
                                                <div key={idx} className={`plan-card ${isCompleted ? 'completed-plan' : ''}`}>
                                                    <div className="plan-header" onClick={() => toggleExpand(plan.id, isCollapsed)}>
                                                        <h3>
                                                            {plan.title}
                                                            {isCompleted && <span className="check-icon">✓</span>}
                                                        </h3>

                                                        <button
                                                            className="btn-small btn-clone"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleClonePlan(plan);
                                                            }}
                                                            title="Clone Plan"
                                                        >
                                                            ❐
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

                                                    {
                                                        !isCollapsed && (
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
                                                        )
                                                    }
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default AdminDashboard;

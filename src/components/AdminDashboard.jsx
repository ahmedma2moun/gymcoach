import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPlan, setNewPlan] = useState({ title: '', exercises: [] });
    const [exerciseInput, setExerciseInput] = useState({ name: '', sets: '', reps: '', videoUrl: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('http://localhost:3000/api/users');
        const data = await res.json();
        setUsers(data);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:3000/api/users', {
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
        setNewPlan({
            ...newPlan,
            exercises: [...newPlan.exercises, exerciseInput]
        });
        setExerciseInput({ name: '', sets: '', reps: '', videoUrl: '' });
    };

    const handleAssignPlan = async () => {
        if (!selectedUser || newPlan.exercises.length === 0) return;

        const res = await fetch('http://localhost:3000/api/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: selectedUser,
                title: newPlan.title,
                exercises: newPlan.exercises
            })
        });

        if (res.ok) {
            alert('Plan assigned!');
            setNewPlan({ title: '', exercises: [] });
            setSelectedUser(null);
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
                                {u.username} <small>({u.role})</small>
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
                        {users.filter(u => u.role !== 'admin').map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                    </select>

                    <input
                        placeholder="Plan Title (e.g., Leg Day)"
                        value={newPlan.title}
                        onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                        className="full-width mt-2"
                    />

                    <div className="exercise-builder">
                        <h4>Add Exercises</h4>
                        <div className="ex-inputs">
                            <input
                                placeholder="Exercise Name"
                                value={exerciseInput.name}
                                onChange={e => setExerciseInput({ ...exerciseInput, name: e.target.value })}
                            />
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
                                placeholder="YouTube URL"
                                value={exerciseInput.videoUrl}
                                onChange={e => setExerciseInput({ ...exerciseInput, videoUrl: e.target.value })}
                            />
                            <button type="button" onClick={addExerciseToPlan} className="btn-small">+</button>
                        </div>

                        <ul className="plan-preview">
                            {newPlan.exercises.map((ex, i) => (
                                <li key={i}>{ex.name} - {ex.sets}x{ex.reps} {ex.videoUrl && '📹'}</li>
                            ))}
                        </ul>
                    </div>

                    <button onClick={handleAssignPlan} className="btn btn-primary full-width mt-2">
                        Assign Plan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

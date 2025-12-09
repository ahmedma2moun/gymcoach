import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './AdminDashboard';
import { AuthContext } from './AuthContext';

// Mock AuthContext
const mockLogout = vi.fn();
const mockAuthValue = {
    user: { id: 1, username: 'admin', role: 'admin' },
    logout: mockLogout
};

const renderWithAuth = (component) => {
    return render(
        <AuthContext.Provider value={mockAuthValue}>
            {component}
        </AuthContext.Provider>
    );
};

// Mock Fetch
global.fetch = vi.fn();

describe('AdminDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.confirm = vi.fn(() => true); // Auto-confirm deletions
    });

    it('renders admin dashboard and fetches users', async () => {
        const mockUsers = [
            { id: 1, username: 'admin', role: 'admin' },
            { id: 2, username: 'testuser', role: 'user' }
        ];

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUsers
        });

        renderWithAuth(<AdminDashboard />);

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        // Use loop matching because text might be "testuser (user)"
        await waitFor(() => {
            const elements = screen.getAllByText(/testuser/i);
            expect(elements.length).toBeGreaterThan(0);
        });
    });

    it('opens progress modal, displays date, and toggles plan', async () => {
        const mockUsers = [
            { id: 1, username: 'admin', role: 'admin' },
            { id: 2, username: 'testuser', role: 'user' }
        ];

        const mockPlans = [
            {
                id: 101,
                title: 'Leg Day',
                date: '2025-10-31',
                exercises: [
                    { name: 'Squat', sets: 3, reps: 10, done: true },
                    { name: 'Lunge', sets: 3, reps: 12, done: false }
                ]
            }
        ];

        // Setup robust mock implementation based on URL
        fetch.mockImplementation((url) => {
            if (url.includes('/api/users')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUsers
                });
            }
            if (url.includes('/api/plans/2')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPlans
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => []
            });
        });

        renderWithAuth(<AdminDashboard />);

        // Wait for users to load
        await waitFor(() => screen.getAllByText(/testuser/i));

        // Click View Progress button
        const viewBtns = screen.getAllByTitle('View Progress');
        fireEvent.click(viewBtns[0]);

        // Verify Modal Opens and Date is Displayed
        await waitFor(() => {
            expect(screen.getByText('Progress: testuser')).toBeInTheDocument();
            expect(screen.getAllByText(/Leg Day/)[0]).toBeInTheDocument();
            expect(screen.getByText(/2025/)).toBeInTheDocument();
        });

        // Test Toggle Expand/Collapse
        // Initially expanded
        expect(screen.getByText('Squat')).toBeInTheDocument();

        // Click header to collapse
        // Find header by text
        const titleEl = screen.getAllByText(/Leg Day/)[0];
        const planHeader = titleEl.closest('.plan-header');
        fireEvent.click(planHeader);

        // After click, should be hidden
        await waitFor(() => {
            expect(screen.queryByText('Squat')).not.toBeInTheDocument();
        });

        // Click again to expand
        fireEvent.click(planHeader);
        await waitFor(() => {
            expect(screen.getByText('Squat')).toBeInTheDocument();
        });
    });
});

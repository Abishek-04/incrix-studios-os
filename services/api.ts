import { Project, User, Channel } from '../types';

interface StudioState {
    users: User[];
    projects: Project[];
    channels: Channel[];
    lastUpdated?: string;
}

export const fetchState = async (): Promise<StudioState | null> => {
    try {
        const response = await fetch('/api/state');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching state:', error);
        return null;
    }
};

export const saveState = async (state: Partial<StudioState>): Promise<StudioState | null> => {
    try {
        const response = await fetch('/api/state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(state),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error saving state:', error);
        return null;
    }
};

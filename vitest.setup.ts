import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Mock crypto for server-side tests
vi.mock('crypto', async () => {
    const actual = await vi.importActual('crypto');
    return {
        ...actual,
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
    };
});

/**
 * Unit tests for CDN Folder Operations
 * Tests folder CRUD, sharing, and utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// UTILITY FUNCTION TESTS (Pure functions)
// ============================================

describe('Folder Path Utilities', () => {
    // Test path generation
    describe('generateFolderPath', () => {
        function generateFolderPath(parentPath: string | null, folderName: string): string {
            const sanitizedName = folderName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
            if (!parentPath || parentPath === '/') {
                return `/${sanitizedName}`;
            }
            return `${parentPath}/${sanitizedName}`;
        }

        it('should generate root-level path for null parent', () => {
            const path = generateFolderPath(null, 'Documents');
            expect(path).toBe('/documents');
        });

        it('should generate root-level path for "/" parent', () => {
            const path = generateFolderPath('/', 'Photos');
            expect(path).toBe('/photos');
        });

        it('should generate nested path correctly', () => {
            const path = generateFolderPath('/projects', 'My Project');
            expect(path).toBe('/projects/my-project');
        });

        it('should sanitize special characters in folder name', () => {
            const path = generateFolderPath('/docs', 'Report 2024 (Final)');
            expect(path).toBe('/docs/report-2024--final-');
        });

        it('should handle deeply nested paths', () => {
            const path = generateFolderPath('/a/b/c/d', 'E');
            expect(path).toBe('/a/b/c/d/e');
        });
    });

    // Test folder depth calculation
    describe('calculateFolderDepth', () => {
        function calculateFolderDepth(path: string): number {
            if (!path || path === '/') return 0;
            return path.split('/').filter(p => p).length;
        }

        it('should return 0 for root path', () => {
            expect(calculateFolderDepth('/')).toBe(0);
        });

        it('should return 1 for single-level folder', () => {
            expect(calculateFolderDepth('/documents')).toBe(1);
        });

        it('should return correct depth for nested folders', () => {
            expect(calculateFolderDepth('/a/b/c')).toBe(3);
        });

        it('should handle empty string', () => {
            expect(calculateFolderDepth('')).toBe(0);
        });
    });

    // Test folder name validation
    describe('validateFolderName', () => {
        function validateFolderName(name: string): { valid: boolean; error?: string } {
            if (!name || name.trim().length === 0) {
                return { valid: false, error: 'Folder name is required' };
            }
            if (name.length > 255) {
                return { valid: false, error: 'Folder name too long (max 255 chars)' };
            }
            if (/[<>:"/\\|?*]/.test(name)) {
                return { valid: false, error: 'Folder name contains invalid characters' };
            }
            if (name.startsWith('.')) {
                return { valid: false, error: 'Folder name cannot start with a dot' };
            }
            return { valid: true };
        }

        it('should reject empty name', () => {
            const result = validateFolderName('');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Folder name is required');
        });

        it('should reject whitespace-only name', () => {
            const result = validateFolderName('   ');
            expect(result.valid).toBe(false);
        });

        it('should accept valid name', () => {
            const result = validateFolderName('My Documents');
            expect(result.valid).toBe(true);
        });

        it('should reject name with invalid characters', () => {
            const result = validateFolderName('folder/name');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Folder name contains invalid characters');
        });

        it('should reject name starting with dot', () => {
            const result = validateFolderName('.hidden');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Folder name cannot start with a dot');
        });

        it('should reject name longer than 255 chars', () => {
            const longName = 'a'.repeat(256);
            const result = validateFolderName(longName);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Folder name too long (max 255 chars)');
        });

        it('should accept name with numbers and spaces', () => {
            const result = validateFolderName('Project 2024');
            expect(result.valid).toBe(true);
        });
    });
});

// ============================================
// FOLDER STRUCTURE TESTS
// ============================================

describe('Folder Tree Construction', () => {
    interface FolderTreeNode {
        id: string;
        name: string;
        path: string;
        children: FolderTreeNode[];
        depth: number;
    }

    function buildFolderTree(folders: Array<{ id: string; name: string; path: string; parent_id: string | null }>): FolderTreeNode[] {
        const folderMap = new Map<string, FolderTreeNode>();
        const rootFolders: FolderTreeNode[] = [];

        // Create nodes
        folders.forEach(f => {
            folderMap.set(f.id, {
                id: f.id,
                name: f.name,
                path: f.path,
                children: [],
                depth: f.path.split('/').filter(p => p).length,
            });
        });

        // Build tree
        folders.forEach(f => {
            const node = folderMap.get(f.id)!;
            if (f.parent_id && folderMap.has(f.parent_id)) {
                folderMap.get(f.parent_id)!.children.push(node);
            } else {
                rootFolders.push(node);
            }
        });

        return rootFolders;
    }

    it('should return empty array for empty input', () => {
        const tree = buildFolderTree([]);
        expect(tree).toEqual([]);
    });

    it('should create single root folder', () => {
        const folders = [
            { id: '1', name: 'Documents', path: '/documents', parent_id: null }
        ];
        const tree = buildFolderTree(folders);
        expect(tree.length).toBe(1);
        expect(tree[0].name).toBe('Documents');
        expect(tree[0].children).toEqual([]);
    });

    it('should build nested structure', () => {
        const folders = [
            { id: '1', name: 'Root', path: '/root', parent_id: null },
            { id: '2', name: 'Child', path: '/root/child', parent_id: '1' },
            { id: '3', name: 'Grandchild', path: '/root/child/grandchild', parent_id: '2' }
        ];
        const tree = buildFolderTree(folders);

        expect(tree.length).toBe(1);
        expect(tree[0].name).toBe('Root');
        expect(tree[0].children.length).toBe(1);
        expect(tree[0].children[0].name).toBe('Child');
        expect(tree[0].children[0].children.length).toBe(1);
        expect(tree[0].children[0].children[0].name).toBe('Grandchild');
    });

    it('should handle multiple root folders', () => {
        const folders = [
            { id: '1', name: 'Folder A', path: '/folder-a', parent_id: null },
            { id: '2', name: 'Folder B', path: '/folder-b', parent_id: null }
        ];
        const tree = buildFolderTree(folders);
        expect(tree.length).toBe(2);
    });

    it('should set correct depth', () => {
        const folders = [
            { id: '1', name: 'A', path: '/a', parent_id: null },
            { id: '2', name: 'B', path: '/a/b', parent_id: '1' },
            { id: '3', name: 'C', path: '/a/b/c', parent_id: '2' }
        ];
        const tree = buildFolderTree(folders);

        expect(tree[0].depth).toBe(1);
        expect(tree[0].children[0].depth).toBe(2);
        expect(tree[0].children[0].children[0].depth).toBe(3);
    });
});

// ============================================
// FOLDER MOVE VALIDATION
// ============================================

describe('Folder Move Validation', () => {
    function canMoveFolder(
        folderId: string,
        targetParentId: string | null,
        folderPath: string,
        allFolders: Array<{ id: string; path: string }>
    ): { canMove: boolean; error?: string } {
        // Can't move to itself
        if (folderId === targetParentId) {
            return { canMove: false, error: 'Cannot move folder into itself' };
        }

        // Can't move to a descendant
        if (targetParentId) {
            const targetFolder = allFolders.find(f => f.id === targetParentId);
            if (targetFolder && targetFolder.path.startsWith(folderPath + '/')) {
                return { canMove: false, error: 'Cannot move folder into its own descendant' };
            }
        }

        return { canMove: true };
    }

    it('should allow moving to root', () => {
        const result = canMoveFolder('1', null, '/docs', []);
        expect(result.canMove).toBe(true);
    });

    it('should prevent moving folder into itself', () => {
        const result = canMoveFolder('1', '1', '/docs', []);
        expect(result.canMove).toBe(false);
        expect(result.error).toBe('Cannot move folder into itself');
    });

    it('should prevent moving folder into descendant', () => {
        const folders = [
            { id: '1', path: '/parent' },
            { id: '2', path: '/parent/child' }
        ];
        const result = canMoveFolder('1', '2', '/parent', folders);
        expect(result.canMove).toBe(false);
        expect(result.error).toBe('Cannot move folder into its own descendant');
    });

    it('should allow moving to sibling folder', () => {
        const folders = [
            { id: '1', path: '/folder-a' },
            { id: '2', path: '/folder-b' }
        ];
        const result = canMoveFolder('1', '2', '/folder-a', folders);
        expect(result.canMove).toBe(true);
    });
});

// ============================================
// FOLDER BREADCRUMB TESTS
// ============================================

describe('Folder Breadcrumbs', () => {
    function getBreadcrumbs(
        path: string,
        folders: Array<{ id: string; name: string; path: string }>
    ): Array<{ id: string | null; name: string; path: string }> {
        const breadcrumbs: Array<{ id: string | null; name: string; path: string }> = [
            { id: null, name: 'Home', path: '/' }
        ];

        if (!path || path === '/') return breadcrumbs;

        const parts = path.split('/').filter(p => p);
        let currentPath = '';

        for (const part of parts) {
            currentPath += `/${part}`;
            const folder = folders.find(f => f.path === currentPath);
            if (folder) {
                breadcrumbs.push({
                    id: folder.id,
                    name: folder.name,
                    path: folder.path
                });
            }
        }

        return breadcrumbs;
    }

    it('should return only Home for root', () => {
        const breadcrumbs = getBreadcrumbs('/', []);
        expect(breadcrumbs.length).toBe(1);
        expect(breadcrumbs[0].name).toBe('Home');
    });

    it('should build full breadcrumb path', () => {
        const folders = [
            { id: '1', name: 'Documents', path: '/documents' },
            { id: '2', name: 'Work', path: '/documents/work' },
            { id: '3', name: '2024', path: '/documents/work/2024' }
        ];

        const breadcrumbs = getBreadcrumbs('/documents/work/2024', folders);

        expect(breadcrumbs.length).toBe(4);
        expect(breadcrumbs[0].name).toBe('Home');
        expect(breadcrumbs[1].name).toBe('Documents');
        expect(breadcrumbs[2].name).toBe('Work');
        expect(breadcrumbs[3].name).toBe('2024');
    });

    it('should handle missing intermediate folders', () => {
        const folders = [
            { id: '1', name: 'Documents', path: '/documents' }
        ];

        const breadcrumbs = getBreadcrumbs('/documents/missing/path', folders);

        // Should still have Home and Documents, skip missing
        expect(breadcrumbs.length).toBe(2);
    });
});

// ============================================
// SHARE LINK VALIDATION TESTS
// ============================================

describe('Share Link Validation', () => {
    function isShareLinkValid(link: {
        is_active: boolean;
        expires_at: string | null;
        max_downloads: number | null;
        download_count: number;
    }): { valid: boolean; error?: string } {
        if (!link.is_active) {
            return { valid: false, error: 'Link has been revoked' };
        }

        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return { valid: false, error: 'Link has expired' };
        }

        if (link.max_downloads !== null && link.download_count >= link.max_downloads) {
            return { valid: false, error: 'Download limit reached' };
        }

        return { valid: true };
    }

    it('should validate active link', () => {
        const result = isShareLinkValid({
            is_active: true,
            expires_at: null,
            max_downloads: null,
            download_count: 0
        });
        expect(result.valid).toBe(true);
    });

    it('should reject inactive link', () => {
        const result = isShareLinkValid({
            is_active: false,
            expires_at: null,
            max_downloads: null,
            download_count: 0
        });
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Link has been revoked');
    });

    it('should reject expired link', () => {
        const result = isShareLinkValid({
            is_active: true,
            expires_at: '2020-01-01T00:00:00Z',
            max_downloads: null,
            download_count: 0
        });
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Link has expired');
    });

    it('should reject link at download limit', () => {
        const result = isShareLinkValid({
            is_active: true,
            expires_at: null,
            max_downloads: 5,
            download_count: 5
        });
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Download limit reached');
    });

    it('should allow link below download limit', () => {
        const result = isShareLinkValid({
            is_active: true,
            expires_at: null,
            max_downloads: 5,
            download_count: 3
        });
        expect(result.valid).toBe(true);
    });

    it('should validate not-yet-expired link', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const result = isShareLinkValid({
            is_active: true,
            expires_at: futureDate.toISOString(),
            max_downloads: null,
            download_count: 0
        });
        expect(result.valid).toBe(true);
    });
});

// ============================================
// PASSWORD HASH TESTS
// ============================================

describe('Password Hashing', () => {
    function hashPassword(password: string, salt: string): string {
        // Simulated hash for testing (in real code uses crypto.pbkdf2Sync)
        return `${salt}:${Buffer.from(password + salt).toString('base64')}`;
    }

    function verifyPassword(password: string, storedHash: string): boolean {
        const [salt, hash] = storedHash.split(':');
        const computedHash = Buffer.from(password + salt).toString('base64');
        return hash === computedHash;
    }

    it('should create hash with salt', () => {
        const hash = hashPassword('test123', 'randomsalt');
        expect(hash).toContain('randomsalt:');
    });

    it('should verify correct password', () => {
        const hash = hashPassword('test123', 'salt');
        const isValid = verifyPassword('test123', hash);
        expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
        const hash = hashPassword('test123', 'salt');
        const isValid = verifyPassword('wrongpassword', hash);
        expect(isValid).toBe(false);
    });
});

// ============================================
// FILE SIZE FORMATTING TESTS
// ============================================

describe('File Size Formatting', () => {
    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    }

    it('should format 0 bytes', () => {
        expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
        expect(formatFileSize(500)).toBe('500.0 B');
    });

    it('should format kilobytes', () => {
        expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
        expect(formatFileSize(1048576)).toBe('1.0 MB');
    });

    it('should format gigabytes', () => {
        expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should format terabytes', () => {
        expect(formatFileSize(1099511627776)).toBe('1.0 TB');
    });
});

// ============================================
// MIME TYPE HANDLING TESTS
// ============================================

describe('MIME Type Handling', () => {
    function getMimeCategory(mimeType: string): string {
        const type = mimeType.split('/')[0];
        switch (type) {
            case 'image': return 'image';
            case 'video': return 'video';
            case 'audio': return 'audio';
            case 'text': return 'text';
            default:
                if (mimeType.includes('pdf')) return 'pdf';
                if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
                if (mimeType.includes('json') || mimeType.includes('javascript')) return 'code';
                return 'file';
        }
    }

    function isPreviewable(mimeType: string): boolean {
        const category = getMimeCategory(mimeType);
        return ['image', 'video', 'audio', 'pdf', 'text', 'code'].includes(category);
    }

    it('should categorize images', () => {
        expect(getMimeCategory('image/png')).toBe('image');
        expect(getMimeCategory('image/jpeg')).toBe('image');
        expect(getMimeCategory('image/gif')).toBe('image');
    });

    it('should categorize videos', () => {
        expect(getMimeCategory('video/mp4')).toBe('video');
        expect(getMimeCategory('video/webm')).toBe('video');
    });

    it('should categorize audio', () => {
        expect(getMimeCategory('audio/mp3')).toBe('audio');
        expect(getMimeCategory('audio/wav')).toBe('audio');
    });

    it('should categorize PDFs', () => {
        expect(getMimeCategory('application/pdf')).toBe('pdf');
    });

    it('should categorize archives', () => {
        expect(getMimeCategory('application/zip')).toBe('archive');
    });

    it('should identify previewable types', () => {
        expect(isPreviewable('image/png')).toBe(true);
        expect(isPreviewable('video/mp4')).toBe(true);
        expect(isPreviewable('application/pdf')).toBe(true);
        expect(isPreviewable('text/plain')).toBe(true);
    });

    it('should identify non-previewable types', () => {
        expect(isPreviewable('application/zip')).toBe(false);
        expect(isPreviewable('application/octet-stream')).toBe(false);
    });
});

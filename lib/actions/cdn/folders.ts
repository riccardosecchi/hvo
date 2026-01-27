'use server';

/**
 * CDN Folder Operations - Server Actions
 * Handles folder CRUD with hierarchical path management
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CdnFolder, ApiResponse, CreateFolderFormData, FolderTreeNode } from '@/lib/types/cdn';

// ============================================
// FOLDER QUERIES
// ============================================

/**
 * Get all folders
 */
export async function getFolders(parentId?: string | null): Promise<ApiResponse<CdnFolder[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    let query = supabase
      .from('cdn_folders')
      .select('*')
      .order('name', { ascending: true });

    if (parentId !== undefined) {
      query = query.eq('parent_folder_id', parentId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get folder by ID
 */
export async function getFolderById(folderId: string): Promise<ApiResponse<CdnFolder>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('cdn_folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get folder tree (hierarchical structure)
 */
export async function getFolderTree(): Promise<ApiResponse<FolderTreeNode[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get all folders
    const { data: folders, error } = await supabase
      .from('cdn_folders')
      .select('*')
      .order('path', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    // Build tree structure
    const folderMap = new Map<string, FolderTreeNode>();
    const rootFolders: FolderTreeNode[] = [];

    // First pass: create all nodes
    folders?.forEach((folder) => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
      });
    });

    // Second pass: build hierarchy
    folders?.forEach((folder) => {
      const node = folderMap.get(folder.id)!;
      if (folder.parent_folder_id) {
        const parent = folderMap.get(folder.parent_folder_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    return { success: true, data: rootFolders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get folder contents (files + subfolders)
 */
export async function getFolderContents(folderId: string | null): Promise<
  ApiResponse<{
    folder: CdnFolder | null;
    subfolders: CdnFolder[];
    fileCount: number;
  }>
> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current folder
    let folder: CdnFolder | null = null;
    if (folderId) {
      const { data } = await supabase
        .from('cdn_folders')
        .select('*')
        .eq('id', folderId)
        .single();
      folder = data;
    }

    // Get subfolders
    const { data: subfolders } = await supabase
      .from('cdn_folders')
      .select('*')
      .eq('parent_folder_id', folderId)
      .order('name', { ascending: true });

    // Get file count
    const { count: fileCount } = await supabase
      .from('cdn_files')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId)
      .is('deleted_at', null);

    return {
      success: true,
      data: {
        folder,
        subfolders: subfolders || [],
        fileCount: fileCount || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// FOLDER MUTATIONS
// ============================================

/**
 * Create a new folder
 */
export async function createFolder(
  formData: CreateFolderFormData
): Promise<ApiResponse<CdnFolder>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get parent folder info for path calculation
    let parentPath = '/';
    let parentDepth = 0;

    if (formData.parentFolderId) {
      const { data: parent } = await supabase
        .from('cdn_folders')
        .select('path, depth')
        .eq('id', formData.parentFolderId)
        .single();

      if (parent) {
        parentPath = `${parent.path}${formData.name}/`;
        parentDepth = parent.depth + 1;
      }
    } else {
      parentPath = `/${formData.name}/`;
    }

    // Check for duplicate name in same parent
    const { data: existing } = await supabase
      .from('cdn_folders')
      .select('id')
      .eq('name', formData.name)
      .eq('parent_folder_id', formData.parentFolderId || null)
      .single();

    if (existing) {
      return { success: false, error: 'A folder with this name already exists' };
    }

    // Create folder
    const { data, error } = await supabase
      .from('cdn_folders')
      .insert({
        name: formData.name,
        description: formData.description || null,
        parent_folder_id: formData.parentFolderId || null,
        path: parentPath,
        depth: parentDepth,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log folder creation
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'folder_create',
      p_folder_id: data.id,
      p_metadata: {
        folder_name: data.name,
        parent_folder_id: formData.parentFolderId,
      },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, data, message: 'Folder created successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update folder metadata
 */
export async function updateFolder(
  folderId: string,
  updates: {
    name?: string;
    description?: string;
  }
): Promise<ApiResponse<CdnFolder>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current folder
    const { data: currentFolder } = await supabase
      .from('cdn_folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (!currentFolder) {
      return { success: false, error: 'Folder not found' };
    }

    // If renaming, check for duplicates
    if (updates.name && updates.name !== currentFolder.name) {
      const { data: duplicate } = await supabase
        .from('cdn_folders')
        .select('id')
        .eq('name', updates.name)
        .eq('parent_folder_id', currentFolder.parent_folder_id)
        .neq('id', folderId)
        .single();

      if (duplicate) {
        return { success: false, error: 'A folder with this name already exists' };
      }

      // Update path if name changed
      const oldPath = currentFolder.path;
      const newPath = oldPath.replace(
        new RegExp(`/${currentFolder.name}/$`),
        `/${updates.name}/`
      );
      updates = { ...updates, path: newPath } as any;

      // Update paths of all descendant folders
      await supabase
        .from('cdn_folders')
        .update({
          path: supabase.raw(`REPLACE(path, '${oldPath}', '${newPath}')`),
        })
        .like('path', `${oldPath}%`);
    }

    // Update folder
    const { data, error } = await supabase
      .from('cdn_folders')
      .update(updates)
      .eq('id', folderId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log folder update
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'folder_update',
      p_folder_id: folderId,
      p_metadata: {
        old_name: currentFolder.name,
        new_name: updates.name,
      },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, data, message: 'Folder updated successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete a folder (cascade or move files to parent)
 */
export async function deleteFolder(
  folderId: string,
  options?: {
    moveFilesToParent?: boolean;
  }
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get folder info
    const { data: folder } = await supabase
      .from('cdn_folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (!folder) {
      return { success: false, error: 'Folder not found' };
    }

    // Check if folder has files
    const { count: fileCount } = await supabase
      .from('cdn_files')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId)
      .is('deleted_at', null);

    if (fileCount && fileCount > 0) {
      if (options?.moveFilesToParent) {
        // Move files to parent folder
        await supabase
          .from('cdn_files')
          .update({ folder_id: folder.parent_folder_id })
          .eq('folder_id', folderId);
      } else {
        return {
          success: false,
          error: 'Folder contains files. Please move or delete them first.',
        };
      }
    }

    // Check for subfolders
    const { count: subfolderCount } = await supabase
      .from('cdn_folders')
      .select('*', { count: 'exact', head: true })
      .eq('parent_folder_id', folderId);

    if (subfolderCount && subfolderCount > 0) {
      return {
        success: false,
        error: 'Folder contains subfolders. Please delete them first.',
      };
    }

    // Delete folder (CASCADE will handle related records)
    const { error } = await supabase
      .from('cdn_folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log folder deletion
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'folder_delete',
      p_folder_id: folderId,
      p_metadata: { folder_name: folder.name },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, message: 'Folder deleted successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Move a folder to a new parent
 */
export async function moveFolder(
  folderId: string,
  newParentId: string | null
): Promise<ApiResponse<CdnFolder>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current folder
    const { data: folder } = await supabase
      .from('cdn_folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (!folder) {
      return { success: false, error: 'Folder not found' };
    }

    // Prevent moving folder into itself or its descendants
    if (newParentId) {
      const { data: newParent } = await supabase
        .from('cdn_folders')
        .select('path')
        .eq('id', newParentId)
        .single();

      if (newParent && newParent.path.startsWith(folder.path)) {
        return { success: false, error: 'Cannot move folder into itself or its descendants' };
      }
    }

    // Calculate new path
    let newPath = '/';
    let newDepth = 0;

    if (newParentId) {
      const { data: newParent } = await supabase
        .from('cdn_folders')
        .select('path, depth')
        .eq('id', newParentId)
        .single();

      if (newParent) {
        newPath = `${newParent.path}${folder.name}/`;
        newDepth = newParent.depth + 1;
      }
    } else {
      newPath = `/${folder.name}/`;
    }

    // Check for duplicate name in new parent
    const { data: duplicate } = await supabase
      .from('cdn_folders')
      .select('id')
      .eq('name', folder.name)
      .eq('parent_folder_id', newParentId)
      .neq('id', folderId)
      .single();

    if (duplicate) {
      return { success: false, error: 'A folder with this name already exists in the destination' };
    }

    // Update folder
    const { data, error } = await supabase
      .from('cdn_folders')
      .update({
        parent_folder_id: newParentId,
        path: newPath,
        depth: newDepth,
      })
      .eq('id', folderId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Update paths of all descendant folders
    const oldPath = folder.path;
    await supabase
      .from('cdn_folders')
      .update({
        path: supabase.raw(`REPLACE(path, '${oldPath}', '${newPath}')`),
        depth: supabase.raw(`depth + ${newDepth - folder.depth}`),
      })
      .like('path', `${oldPath}%`)
      .neq('id', folderId);

    // Log folder move
    await supabase.rpc('cdn_log_action', {
      p_action_type: 'folder_move',
      p_folder_id: folderId,
      p_metadata: {
        folder_name: folder.name,
        old_parent_id: folder.parent_folder_id,
        new_parent_id: newParentId,
      },
    });

    revalidatePath('/[locale]/admin/cdn', 'page');

    return { success: true, data, message: 'Folder moved successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get breadcrumb path for a folder
 */
export async function getFolderBreadcrumbs(
  folderId: string | null
): Promise<ApiResponse<Array<{ id: string | null; name: string; path: string }>>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!folderId) {
      return {
        success: true,
        data: [{ id: null, name: 'Home', path: '/' }],
      };
    }

    // Get folder with its path
    const { data: folder } = await supabase
      .from('cdn_folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (!folder) {
      return { success: false, error: 'Folder not found' };
    }

    // Get all ancestor folders by path
    const pathParts = folder.path.split('/').filter((p) => p);
    const breadcrumbs: Array<{ id: string | null; name: string; path: string }> = [
      { id: null, name: 'Home', path: '/' },
    ];

    // Fetch all folders in the path
    const { data: folders } = await supabase
      .from('cdn_folders')
      .select('*')
      .in('name', pathParts)
      .order('depth', { ascending: true });

    if (folders) {
      folders.forEach((f) => {
        breadcrumbs.push({
          id: f.id,
          name: f.name,
          path: f.path,
        });
      });
    }

    return { success: true, data: breadcrumbs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

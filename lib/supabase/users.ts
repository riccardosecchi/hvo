import { createClient } from "@/lib/supabase/client";

/**
 * Suspend an admin user (Master Admin only)
 */
export async function suspendAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    const { error } = await supabase.rpc("suspend_admin", {
        target_user_id: userId,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Reactivate a suspended admin user (Master Admin only)
 */
export async function reactivateAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    const { error } = await supabase.rpc("reactivate_admin", {
        target_user_id: userId,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Remove an admin user completely (Master Admin only)
 * This soft-deletes the profile, not the auth user
 */
export async function removeAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    const { error } = await supabase.rpc("remove_admin", {
        target_user_id: userId,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Cancel/delete a pending invite (Master Admin only)
 */
export async function cancelInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    const { error } = await supabase
        .from("admin_invites")
        .delete()
        .eq("id", inviteId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Reset an admin's password (Master Admin only)
 */
export async function resetAdminPassword(
    userId: string,
    newPassword: string
): Promise<{ success: boolean; error?: string; email?: string }> {
    const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
        return { success: false, error: data.error };
    }

    return { success: true, email: data.email };
}

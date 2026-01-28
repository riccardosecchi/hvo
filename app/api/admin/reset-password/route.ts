import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const { userId, newPassword } = await request.json();

        if (!userId || !newPassword) {
            return NextResponse.json(
                { error: "userId and newPassword are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Verify the caller is master admin
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if caller is master admin
        const { data: callerProfile } = await supabase
            .from("profiles")
            .select("is_master_admin")
            .eq("id", user.id)
            .single();

        if (!callerProfile?.is_master_admin) {
            return NextResponse.json(
                { error: "Only master admin can reset passwords" },
                { status: 403 }
            );
        }

        // Check that target is not master admin
        const { data: targetProfile } = await supabase
            .from("profiles")
            .select("is_master_admin, email")
            .eq("id", userId)
            .single();

        if (targetProfile?.is_master_admin) {
            return NextResponse.json(
                { error: "Cannot reset master admin password" },
                { status: 403 }
            );
        }

        // Use admin client to update the user's password
        const adminClient = createAdminClient();
        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (error) {
            console.error("Error resetting password:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            email: targetProfile?.email
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Rate limiting utilities using Supabase
 */

import { createClient } from '@/lib/supabase/server';

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number; // seconds until reset
}

/**
 * Check if a booking attempt is allowed based on rate limits
 * Uses Supabase function that bypasses RLS
 */
export async function checkBookingRateLimit(
    ipAddress: string,
    eventId: string,
    maxAttempts: number = 3,
    windowMinutes: number = 60
): Promise<RateLimitResult> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('check_booking_rate_limit', {
        p_ip_address: ipAddress,
        p_event_id: eventId,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes,
    });

    if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request (fail open) but log it
        return { allowed: true, remaining: maxAttempts, resetIn: 0 };
    }

    const allowed = Boolean(data);

    return {
        allowed,
        remaining: allowed ? maxAttempts - 1 : 0,
        resetIn: allowed ? 0 : windowMinutes * 60,
    };
}

/**
 * Record a booking attempt for rate limiting
 */
export async function recordBookingAttempt(
    ipAddress: string,
    eventId: string
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc('record_booking_attempt', {
        p_ip_address: ipAddress,
        p_event_id: eventId,
    });

    if (error) {
        console.error('Failed to record booking attempt:', error);
        // Non-critical, continue even if this fails
    }
}

/**
 * Extract client IP from request headers
 * Handles various proxy configurations (Vercel, Cloudflare, nginx)
 */
export function getClientIp(headers: Headers): string {
    // Check various headers in order of preference
    const headerNames = [
        'x-forwarded-for',      // Standard proxy header
        'x-real-ip',            // Nginx proxy
        'cf-connecting-ip',     // Cloudflare
        'x-vercel-forwarded-for', // Vercel
        'x-client-ip',          // Various proxies
    ];

    for (const header of headerNames) {
        const value = headers.get(header);
        if (value) {
            // x-forwarded-for can contain multiple IPs, take the first one
            const ip = value.split(',')[0].trim();
            if (ip && isValidIp(ip)) {
                return ip;
            }
        }
    }

    // Fallback to a hash of the user agent if no IP found
    const userAgent = headers.get('user-agent') || 'unknown';
    return `ua-${hashString(userAgent)}`;
}

/**
 * Basic IP validation
 */
function isValidIp(ip: string): boolean {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Simple string hash for fallback identification
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

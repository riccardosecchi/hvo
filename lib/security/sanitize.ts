/**
 * Input sanitization utilities for security
 */

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a text input
 * - Trims whitespace
 * - Escapes HTML entities
 * - Limits length
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') return '';
    return escapeHtml(input.trim().slice(0, maxLength));
}

/**
 * Validate and sanitize email
 * - Lowercase
 * - Trim
 * - Validate format
 */
export function sanitizeEmail(email: string): { valid: boolean; value: string } {
    if (!email || typeof email !== 'string') {
        return { valid: false, value: '' };
    }

    const sanitized = email.trim().toLowerCase();

    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return {
        valid: emailRegex.test(sanitized) && sanitized.length <= 254,
        value: sanitized,
    };
}

/**
 * Validate and sanitize phone number
 * - Allows: digits, +, spaces, dashes, parentheses
 * - Removes other characters
 */
export function sanitizePhone(phone: string): { valid: boolean; value: string } {
    if (!phone || typeof phone !== 'string') {
        return { valid: true, value: '' }; // Phone is often optional
    }

    // Remove all non-allowed characters
    const sanitized = phone.replace(/[^\d+\s\-()]/g, '').trim();

    // Basic validation: should have at least some digits
    const digitCount = (sanitized.match(/\d/g) || []).length;

    return {
        valid: digitCount >= 6 && digitCount <= 15,
        value: sanitized,
    };
}

/**
 * Sanitize all booking form data
 */
export function sanitizeBookingData(
    data: Record<string, string>,
    fieldTypes: Record<string, string>
): { valid: boolean; data: Record<string, string>; errors: string[] } {
    const sanitized: Record<string, string> = {};
    const errors: string[] = [];

    for (const [key, value] of Object.entries(data)) {
        const fieldType = fieldTypes[key] || 'text';

        switch (fieldType) {
            case 'email': {
                const result = sanitizeEmail(value);
                if (!result.valid && value.trim()) {
                    errors.push(`Email non valida`);
                }
                sanitized[key] = result.value;
                break;
            }
            case 'tel': {
                const result = sanitizePhone(value);
                if (!result.valid && value.trim()) {
                    errors.push(`Numero di telefono non valido`);
                }
                sanitized[key] = result.value;
                break;
            }
            case 'number': {
                const num = value.replace(/[^\d.-]/g, '');
                sanitized[key] = num;
                break;
            }
            default:
                sanitized[key] = sanitizeText(value);
        }
    }

    return {
        valid: errors.length === 0,
        data: sanitized,
        errors,
    };
}

/**
 * Check if honeypot fields are filled (bot detection)
 */
export function checkHoneypot(formData: FormData): boolean {
    const honeypotFields = ['website', 'phone_confirm', 'url_field'];

    for (const field of honeypotFields) {
        const value = formData.get(field);
        if (value && String(value).trim() !== '') {
            return true; // Bot detected
        }
    }

    return false; // Likely human
}

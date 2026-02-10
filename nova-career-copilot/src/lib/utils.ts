import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Extract the first balanced JSON object or array from a text blob.
// This handles nested braces/brackets and ignores braces inside strings.
export function extractJSON(text: string): string | null {
    if (!text) return null;
    const first = text.search(/[\{\[]/);
    if (first === -1) return null;

    const openChar = text[first];
    const closeChar = openChar === '{' ? '}' : ']';

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = first; i < text.length; i++) {
        const ch = text[i];

        if (inString) {
            if (escape) {
                escape = false;
            } else if (ch === '\\') {
                escape = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        } else {
            if (ch === '"') {
                inString = true;
                continue;
            }

            if (ch === openChar) {
                depth++;
            } else if (ch === closeChar) {
                depth--;
                if (depth === 0) {
                    return text.slice(first, i + 1);
                }
            }
        }
    }

    return null;
}

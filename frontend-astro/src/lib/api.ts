/**
 * API utilities for the static LinkedIn Pinpoint site.
 *
 * NO runtime API calls. All data comes from JSON files generated
 * at build time by scripts/fetch-data.js and placed in static/data/.
 *
 * Solutions are lazy-loaded from static JSON files (/data/solutions/{number}.json)
 * when the user clicks "Load More". No worker API is ever called from the browser.
 */

import type { PinpointPuzzle, PinpointSummary, CheckResult, SolutionsResponse } from './types';

/** Convert markdown-like text to HTML */
export function renderExplanation(text: string): string {
        if (!text) return '';
        let html = text
                // Headings
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                // FAQ Q: and A: patterns — style them differently BEFORE generic bold
                .replace(/\*\*Q:\s*(.+?)\*\*/g, '<span class="faq-q">Q: $1</span>')
                .replace(/\*\*A:\s*\*\*/g, '<span class="faq-a">A:</span>')
                .replace(/\*\*A:\s*(.+?)\*\*/g, '<span class="faq-a">A:</span> $1')
                // Bold (generic — after Q/A patterns are handled)
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                // Italic
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                // Unordered lists
                .replace(/^\- (.+)$/gm, '<li>$1</li>')
                .replace(/^\* (.+)$/gm, '<li>$1</li>')
                // Ordered lists
                .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
                // Paragraphs
                .replace(/\n\n/g, '</p><p>')
                // Line breaks
                .replace(/\n/g, '<br>');

        if (!html.startsWith('<h') && !html.startsWith('<li') && !html.startsWith('<p')) {
                html = '<p>' + html + '</p>';
        }

        html = html.replace(/(<li>.*?<\/li>(\s*<br>)?)+/g, (match) => {
                const cleaned = match.replace(/<br>/g, '');
                return '<ul>' + cleaned + '</ul>';
        });

        return html;
}

/** Format date string to readable format */
export function formatDate(dateStr: string): string {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
        });
}

/** Format date string to short format */
export function formatDateShort(dateStr: string): string {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
        });
}

/** Format date to URL-friendly slug format (e.g. "may-16-2026") */
export function formatDateSlug(dateStr: string): string {
        const date = new Date(dateStr + 'T00:00:00');
        const month = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}-${day}-${year}`;
}

/** Format date to month-day-year for URL slugs */
export function formatDateParts(dateStr: string): { month: string; day: string; year: string } {
        const date = new Date(dateStr + 'T00:00:00');
        return {
                month: date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase(),
                day: String(date.getDate()),
                year: String(date.getFullYear())
        };
}

/** Get yesterday's date string */
export function getYesterdayDate(): string {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
}

/**
 * Load ALL solutions for a puzzle from the static JSON file.
 * This is called client-side when the user clicks "Load More".
 * No API call — just fetches a static JSON file from the same origin.
 */
export async function loadSolutionsFromJson(number: number): Promise<SolutionsResponse> {
        const res = await fetch(`/data/solutions/${number}.json`);
        if (!res.ok) {
                throw new Error(`Failed to load solutions for puzzle #${number}`);
        }
        const data = await res.json();
        return {
                solutions: data.solutions,
                offset: 0,
                limit: data.solutions.length,
                total: data.totalSolutions,
                number: data.number
        };
}

/**
 * Check if a word is a valid solution.
 * Fetches the static solutions JSON and checks locally.
 * No API call needed.
 */
export async function checkWordLocally(number: number, word: string): Promise<CheckResult> {
        try {
                const data = await loadSolutionsFromJson(number);
                const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
                const exists = data.solutions.some(
                        s => s.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanWord
                );
                return { exists, word };
        } catch {
                return { exists: false, word };
        }
}

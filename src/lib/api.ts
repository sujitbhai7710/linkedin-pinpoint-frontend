import type { PinpointPuzzle, PinpointSummary, CheckResult, SolutionsResponse } from './types';

const API_BASE = 'https://linkedin-pinpoint-worker.gdgdughdshf.workers.dev';
const ORIGIN_HEADER = 'https://pinpointanswertoday.online';

// API secret for server-side rendering (same as worker SECRET_KEY)
// This is needed because Cloudflare Pages SSR fetch doesn't send Origin headers
const API_SECRET = 'BloggingIo@7';

const defaultHeaders: Record<string, string> = {
        'Origin': ORIGIN_HEADER,
        'Content-Type': 'application/json',
        'X-API-Key': API_SECRET
};

type FetchFn = typeof globalThis.fetch;

interface ApiWrapper<T> {
        success: boolean;
        data: T;
        [key: string]: unknown;
}

interface ListWrapper {
        success: boolean;
        data: PinpointSummary[];
        limit: number;
        page: number;
        count: number;
}

interface SolutionsWrapper {
        success: boolean;
        data: string[];
        total: number;
        hasMore: boolean;
}

async function fetchApi<T>(endpoint: string, customFetch?: FetchFn): Promise<T> {
        const url = `${API_BASE}${endpoint}`;
        const fetchFn = customFetch || globalThis.fetch;
        const res = await fetchFn(url, { headers: defaultHeaders });
        if (!res.ok) {
                throw new Error(`API error: ${res.status} ${res.statusText} for ${endpoint}`);
        }
        const json = await res.json();
        // API wraps responses in { success: true, data: ... }
        if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
                return json.data as T;
        }
        return json as T;
}

export async function getToday(customFetch?: FetchFn): Promise<PinpointPuzzle> {
        return fetchApi<PinpointPuzzle>('/today', customFetch);
}

export async function getYesterday(customFetch?: FetchFn): Promise<PinpointPuzzle> {
        return fetchApi<PinpointPuzzle>('/yesterday', customFetch);
}

export async function getLast(limit: number, page: number, customFetch?: FetchFn): Promise<PinpointSummary[]> {
        const url = `${API_BASE}/last/${limit}/${page}`;
        const fetchFn = customFetch || globalThis.fetch;
        const res = await fetchFn(url, { headers: defaultHeaders });
        if (!res.ok) {
                throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        // /last returns { success, limit, page, count, data: [...] }
        if (json && typeof json === 'object' && 'data' in json) {
                return json.data as PinpointSummary[];
        }
        return json as PinpointSummary[];
}

export async function searchByClue(query: string, customFetch?: FetchFn): Promise<PinpointSummary[]> {
        const url = `${API_BASE}/search/clue?q=${encodeURIComponent(query)}`;
        const fetchFn = customFetch || globalThis.fetch;
        const res = await fetchFn(url, { headers: defaultHeaders });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        return json?.data ?? json;
}

export async function searchByAnswer(query: string, customFetch?: FetchFn): Promise<PinpointSummary[]> {
        const url = `${API_BASE}/search/answer?q=${encodeURIComponent(query)}`;
        const fetchFn = customFetch || globalThis.fetch;
        const res = await fetchFn(url, { headers: defaultHeaders });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        return json?.data ?? json;
}

export async function searchByNumber(number: number, customFetch?: FetchFn): Promise<PinpointPuzzle> {
        return fetchApi<PinpointPuzzle>(`/search/number/${number}`, customFetch);
}

export async function searchByDate(date: string, customFetch?: FetchFn): Promise<PinpointPuzzle> {
        return fetchApi<PinpointPuzzle>(`/search/date/${date}`, customFetch);
}

export async function getSolutions(number: number, offset: number, limit: number, customFetch?: FetchFn): Promise<SolutionsResponse> {
        const url = `${API_BASE}/solutions/${number}/${offset}/${limit}`;
        const fetchFn = customFetch || globalThis.fetch;
        const res = await fetchFn(url, { headers: defaultHeaders });
        if (!res.ok) {
                throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const json: SolutionsWrapper = await res.json();
        return {
                solutions: json.data,
                offset,
                limit,
                total: json.total,
                number
        };
}

export async function checkWord(number: number, word: string, customFetch?: FetchFn): Promise<CheckResult> {
        return fetchApi<CheckResult>(`/check/${number}/${encodeURIComponent(word)}`, customFetch);
}

/** Convert markdown-like text to HTML */
export function renderExplanation(text: string): string {
        if (!text) return '';
        let html = text
                // Headings
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                // Bold
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                // Italic
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                // Unordered lists
                .replace(/^\- (.+)$/gm, '<li>$1</li>')
                .replace(/^\* (.+)$/gm, '<li>$1</li>')
                // Ordered lists
                .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
                // Paragraphs - wrap remaining text blocks
                .replace(/\n\n/g, '</p><p>')
                // Line breaks
                .replace(/\n/g, '<br>');

        // Wrap in paragraph if not starting with a block element
        if (!html.startsWith('<h') && !html.startsWith('<li') && !html.startsWith('<p')) {
                html = '<p>' + html + '</p>';
        }

        // Wrap consecutive li elements in ul
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

/** Get yesterday's date string */
export function getYesterdayDate(): string {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
}

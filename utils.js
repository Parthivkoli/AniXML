/**
 * AniXML - Utilities Module
 * Common utility functions
 */

'use strict';

/**
 * Normalize anime title for better matching
 * @param {string} title - Title to normalize
 * @returns {string} Normalized title
 */
export function normalizeTitle(title) {
    if (!title) return '';

    let normalized = cleanInputTitle(title);

    normalized = normalized
        .replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, ' ')
        .replace(/\s*[:\-–—|]\s*.*$/, '')
        .replace(/\b(?:season|part|movie|ova|tv)\s*\d*\b/gi, '')
        .replace(/\b(?:final\s+season|second\s+season|third\s+season)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Remove common punctuation
    normalized = normalized
        .replace(/[!?:;\-\.,'"]/g, '')
        .trim();

    // Remove season suffixes
    normalized = normalized
        .replace(/\bSeason\s+\d+\b/i, '')
        .replace(/\b\d+(?:st|nd|rd|th)\s+Season\b/i, '')
        .replace(/\b(?:OVA|Movie|TV|Part)\s+\d*\b/i, '')
        .replace(/\bFinal\s+Season\b/i, '')
        .trim();

    return normalized;
}

/**
 * Clean a pasted/imported title line before matching
 * @param {string} title - Raw input line
 * @returns {string} Cleaned title
 */
export function cleanInputTitle(title) {
    if (!title) return '';

    let cleaned = String(title)
        .normalize('NFKC')
        .trim();

    cleaned = cleaned
        .replace(/^[\s>*•·\-]+/, '')
        .replace(/^\(?\s*\d{1,4}\s*[.)\-:]*\s+/, '')
        .replace(/^\[\d+\]\s*/, '');

    cleaned = cleaned
        .replace(/^#+\s*/, '')
        .replace(/\[(?:official|sub|dub|hd|4k|1080p|720p).*?\]/gi, '')
        .replace(/\((?:official|sub|dub|hd|4k|1080p|720p).*?\)/gi, '')
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/[\uFE0F\u200D]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    return cleaned;
}

/**
 * Extract unique titles
 * @param {string[]} titles - Array of titles
 * @returns {string[]} Array of unique titles
 */
export function extractUnique(titles) {
    const seen = new Set();
    const unique = [];

    titles.forEach(title => {
        const normalized = cleanInputTitle(title).toLowerCase();
        if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            unique.push(cleanInputTitle(title));
        }
    });

    return unique;
}

/**
 * Build search candidates from a raw title
 * @param {string} title - Raw title input
 * @returns {string[]} Unique candidate list ordered by confidence
 */
export function buildSearchCandidates(title) {
    const cleaned = cleanInputTitle(title);
    const candidates = [
        cleaned,
        normalizeTitle(cleaned),
        cleaned.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, ' ').replace(/\s+/g, ' ').trim(),
        cleaned.replace(/\s*[:\-–—|]\s*.*$/, '').trim(),
        cleaned.replace(/[!?:;\-\.,'"&]/g, '').replace(/\s+/g, ' ').trim(),
        cleaned.replace(/\bseason\s+\d+\b/gi, '').replace(/\s+/g, ' ').trim(),
        cleaned.replace(/\b(?:episode|ep)\s*\d+\b/gi, '').replace(/\s+/g, ' ').trim(),
        cleaned.replace(/\b(?:s|season)\s*\d+\b/gi, '').replace(/\s+/g, ' ').trim(),
        cleaned.replace(/&/g, ' and ').replace(/\s+/g, ' ').trim(),
    ];

    return [...new Set(candidates.filter(Boolean))].filter(candidate => candidate.length > 0);
}

/**
 * Escape XML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeXml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Download file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format date to ISO string
 * @param {Date} date - Date to format
 * @returns {string} ISO date string
 */
export function formatDate(date = new Date()) {
    return date.toISOString();
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}
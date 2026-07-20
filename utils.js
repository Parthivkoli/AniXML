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

    // Remove common punctuation
    let normalized = title
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
 * Extract unique titles
 * @param {string[]} titles - Array of titles
 * @returns {string[]} Array of unique titles
 */
export function extractUnique(titles) {
    const seen = new Set();
    const unique = [];

    titles.forEach(title => {
        const normalized = title.trim().toLowerCase();
        if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            unique.push(title.trim());
        }
    });

    return unique;
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
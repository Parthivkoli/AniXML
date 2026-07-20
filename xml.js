/**
 * AniXML - XML Generation Module
 * Generates valid MyAnimeList XML and other export formats
 */

'use strict';

import { escapeXml } from './utils.js';

/**
 * Generate valid MyAnimeList XML
 * @param {Array} results - Search results array
 * @param {string} defaultStatus - Default status for unmached entries
 * @returns {string} Valid XML string
 */
export function generateXML(results, defaultStatus = 'Plan to Watch') {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<myanimelist>\n';
    xml += '  <myinfo>\n';
    xml += '    <user_name></user_name>\n';
    xml += '    <user_export_type>1</user_export_type>\n';
    xml += '  </myinfo>\n';

    // Map status values
    const statusMap = {
        'Plan to Watch': 6,
        'Watching': 1,
        'Completed': 2,
        'On Hold': 3,
        'Dropped': 4
    };

    results.forEach((result) => {
        if (!result.matched) {
            // Skip unmatched entries
            return;
        }

        const statusCode = statusMap[defaultStatus] || 6;
        xml += '  <anime>\n';
        xml += `    <series_animedb_id>${result.matched.id}</series_animedb_id>\n`;
        xml += `    <series_title>${escapeXml(result.matched.title)}</series_title>\n`;
        xml += `    <my_status>${defaultStatus}</my_status>\n`;
        xml += '    <my_score>0</my_score>\n';
        xml += '    <my_watched_episodes>0</my_watched_episodes>\n';
        xml += '  </anime>\n';
    });

    xml += '</myanimelist>';
    return xml;
}

/**
 * Generate JSON export
 * @param {Array} results - Search results array
 * @returns {string} JSON string
 */
export function generateJSON(results) {
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalTitles: results.length,
        matchedTitles: results.filter(r => r.matched).length,
        anime: results
            .filter(r => r.matched)
            .map(r => ({
                original: r.original,
                matched: r.matched.title,
                english: r.matched.english,
                romaji: r.matched.romaji,
                year: r.matched.year,
                id: r.matched.id,
                episodes: r.matched.episodes,
                format: r.matched.format,
                status: r.matched.status
            }))
    };

    return JSON.stringify(data, null, 2);
}

/**
 * Generate CSV export
 * @param {Array} results - Search results array
 * @returns {string} CSV string
 */
export function generateCSV(results) {
    let csv = 'Index,Original Title,Matched Title,English,Romaji,Year,AniList ID,Episodes,Format,Status\n';

    results.forEach((result, index) => {
        if (!result.matched) return;

        const row = [
            index + 1,
            `"${result.original.replace(/"/g, '""')}"`,
            `"${result.matched.title.replace(/"/g, '""')}"`,
            `"${result.matched.english.replace(/"/g, '""')}"`,
            `"${result.matched.romaji.replace(/"/g, '""')}"`,
            result.matched.year || '',
            result.matched.id,
            result.matched.episodes || '',
            result.matched.format || '',
            result.matched.status || ''
        ];

        csv += row.join(',') + '\n';
    });

    return csv;
}

/**
 * Validate XML structure
 * @param {string} xml - XML string to validate
 * @returns {boolean} Whether XML is valid
 */
export function validateXML(xml) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        return !doc.getElementsByTagName('parsererror').length;
    } catch (err) {
        return false;
    }
}
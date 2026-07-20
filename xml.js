/**
 * AniXML - XML Generation Module
 * Generates valid MyAnimeList XML and other export formats
 */

'use strict';

import { escapeXml } from './utils.js';

/**
 * Generate valid MyAnimeList XML
 * @param {Array} results - Search results array
 * @param {string} defaultStatus - Default status for unmatched entries
 * @returns {string} Valid XML string
 */
export function generateXML(results, defaultStatus = 'Plan to Watch') {
    if (!results || results.length === 0) {
        return '<?xml version="1.0" encoding="UTF-8"?>\n<myanimelist>\n  <myinfo>\n    <user_name></user_name>\n    <user_export_type>1</user_export_type>\n  </myinfo>\n</myanimelist>';
    }

    // Map status values to MyAnimeList status codes
    const statusMap = {
        'Plan to Watch': 6,
        'Watching': 1,
        'Completed': 2,
        'On Hold': 3,
        'Dropped': 4
    };

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<myanimelist>\n';
    xml += '  <myinfo>\n';
    xml += '    <user_name></user_name>\n';
    xml += '    <user_export_type>1</user_export_type>\n';
    xml += '  </myinfo>\n';

    // Filter and process matched results only
    const matchedResults = results.filter(r => r.matched && r.matched.id);
    
    matchedResults.forEach((result) => {
        try {
            const statusCode = statusMap[defaultStatus] || 6;
            const title = result.matched.title || result.original;
            const animedDbId = result.matched.id || 0;

            xml += '  <anime>\n';
            xml += `    <series_animedb_id>${animedDbId}</series_animedb_id>\n`;
            xml += `    <series_title>${escapeXml(title)}</series_title>\n`;
            xml += `    <my_status>${escapeXml(defaultStatus)}</my_status>\n`;
            xml += '    <my_score>0</my_score>\n';
            xml += '    <my_watched_episodes>0</my_watched_episodes>\n';
            xml += '  </anime>\n';
        } catch (err) {
            console.error('Error processing result:', result, err);
        }
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
    const matchedResults = results.filter(r => r.matched && r.matched.id);
    
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalTitles: results.length,
        matchedTitles: matchedResults.length,
        anime: matchedResults.map(r => ({
            original: r.original,
            matched: r.matched.title,
            english: r.matched.english || '',
            romaji: r.matched.romaji || '',
            year: r.matched.year || null,
            id: r.matched.id,
            episodes: r.matched.episodes || null,
            format: r.matched.format || '',
            status: r.matched.status || ''
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
        if (!result.matched || !result.matched.id) return;

        const row = [
            index + 1,
            `"${(result.original || '').replace(/"/g, '""')}"`,
            `"${(result.matched.title || '').replace(/"/g, '""')}"`,
            `"${(result.matched.english || '').replace(/"/g, '""')}"`,
            `"${(result.matched.romaji || '').replace(/"/g, '""')}"`,
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

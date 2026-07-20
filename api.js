/**
 * AniXML - AniList API Module
 * Handles all interactions with the AniList GraphQL API
 */

'use strict';

import { normalizeTitle, delay } from './utils.js';

const ANILIST_API = 'https://graphql.anilist.co';
const SEARCH_QUERY = `
  query ($search:String){
    Media(search:$search,type:ANIME){
      id
      title{
        romaji
        english
        native
      }
      episodes
      format
      seasonYear
      status
    }
  }
`;

let searchAborted = false;
let activeRequests = 0;
const requestQueue = [];

/**
 * Search for anime titles with concurrency control
 * @param {string[]} titles - Array of anime titles
 * @param {number} concurrency - Maximum concurrent requests
 * @param {boolean} autoRetry - Whether to retry on network error
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Array>} Array of search results
 */
export async function searchTitles(titles, concurrency = 4, autoRetry = true, progressCallback = null) {
    searchAborted = false;
    activeRequests = 0;
    const results = [];
    const startTime = Date.now();
    let completed = 0;
    let failed = 0;

    // Initialize results array
    titles.forEach((title, index) => {
        results[index] = {
            index: index + 1,
            original: title,
            matched: null,
            status: 'pending'
        };
    });

    // Create search tasks with retry logic
    const tasks = titles.map((title, index) => async () => {
        if (searchAborted) return;

        let attempts = 0;
        const maxAttempts = autoRetry ? 2 : 1;

        while (attempts < maxAttempts && !searchAborted) {
            try {
                const result = await searchAnime(title);
                if (result) {
                    results[index].matched = result;
                    results[index].status = 'matched';
                } else {
                    // Try with normalized title
                    const normalized = normalizeTitle(title);
                    if (normalized !== title) {
                        const normalizedResult = await searchAnime(normalized);
                        if (normalizedResult) {
                            results[index].matched = normalizedResult;
                            results[index].status = 'matched';
                        } else {
                            results[index].status = 'notfound';
                        }
                    } else {
                        results[index].status = 'notfound';
                    }
                }
                completed++;
                break;
            } catch (error) {
                attempts++;
                if (attempts < maxAttempts) {
                    await delay(2000);
                } else {
                    results[index].status = 'error';
                    failed++;
                    completed++;
                }
            }
        }

        if (progressCallback) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            progressCallback({
                completed,
                total: titles.length,
                current: title,
                elapsed,
                failed
            });
        }
    });

    // Execute tasks with concurrency limit
    await executeConcurrent(tasks, concurrency);

    return results;
}

/**
 * Search for a single anime
 * @param {string} title - Anime title to search
 * @returns {Promise<Object|null>} Search result or null
 */
async function searchAnime(title) {
    try {
        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: SEARCH_QUERY,
                variables: { search: title }
            })
        });

        if (response.status === 429) {
            // Rate limited - wait and retry
            await delay(2000);
            return searchAnime(title);
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(data.errors[0]?.message || 'API error');
        }

        if (data.data?.Media) {
            return {
                id: data.data.Media.id,
                title: data.data.Media.title.romaji || data.data.Media.title.english || data.data.Media.title.native,
                english: data.data.Media.title.english || '',
                romaji: data.data.Media.title.romaji || '',
                native: data.data.Media.title.native || '',
                episodes: data.data.Media.episodes,
                format: data.data.Media.format,
                year: data.data.Media.seasonYear,
                status: data.data.Media.status
            };
        }

        return null;
    } catch (error) {
        console.error(`Error searching for "${title}":`, error);
        throw error;
    }
}

/**
 * Execute async functions with concurrency limit
 * @param {Function[]} tasks - Array of async functions
 * @param {number} concurrency - Maximum concurrent execution
 */
async function executeConcurrent(tasks, concurrency) {
    const executing = [];
    const queue = [...tasks];

    while (queue.length > 0 || executing.length > 0) {
        if (searchAborted) break;

        while (executing.length < concurrency && queue.length > 0) {
            const task = queue.shift();
            const promise = task().catch(err => {
                console.error('Task error:', err);
            });

            executing.push(promise);

            promise.finally(() => {
                executing.splice(executing.indexOf(promise), 1);
            });
        }

        if (executing.length > 0) {
            await Promise.race(executing);
        }
    }
}

/**
 * Cancel ongoing search
 */
export function cancelSearch() {
    searchAborted = true;
}
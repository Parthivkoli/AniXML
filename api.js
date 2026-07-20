/**
 * AniXML - AniList API Module
 * Handles all interactions with the AniList GraphQL API
 */

'use strict';

import { buildSearchCandidates, normalizeTitle, delay } from './utils.js';

const ANILIST_API = 'https://graphql.anilist.co';
const JIKAN_API = 'https://api.jikan.moe/v4';
const searchCache = new Map();
const inFlightSearches = new Map();
const RATE_LIMIT_BASE_DELAY = 300;
const SEARCH_QUERY = `
    query ($search:String, $type: MediaType){
        Media(search:$search,type:$type){
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

/**
 * Search for anime titles with concurrency control
 * @param {string[]} titles - Array of anime titles
 * @param {number} concurrency - Maximum concurrent requests
 * @param {boolean} autoRetry - Whether to retry on network error
 * @param {Function} progressCallback - Callback for progress updates
 * @param {string} mediaType - AniList media type, ANIME or MANGA
 * @returns {Promise<Array>} Array of search results
 */
export async function searchTitles(titles, concurrency = 4, autoRetry = true, progressCallback = null, mediaType = 'ANIME') {
    searchAborted = false;
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
                const candidates = buildSearchCandidates(title);
                let matchedResult = null;

                for (const candidate of candidates) {
                    matchedResult = await searchAnime(candidate, mediaType);
                    if (matchedResult) {
                        break;
                    }
                }

                if (matchedResult) {
                    results[index].matched = matchedResult;
                    results[index].status = 'matched';
                } else {
                    results[index].status = 'notfound';
                }
                completed++;
                break;
            } catch (error) {
                attempts++;
                if (attempts < maxAttempts) {
                    await delay(600);
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
async function searchAnime(title, mediaType) {
    const cacheKey = `${mediaType}:${String(title).trim().toLowerCase()}`;

    if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey);
    }

    if (inFlightSearches.has(cacheKey)) {
        return inFlightSearches.get(cacheKey);
    }

    const requestPromise = (async () => {
    try {
        const anilistResult = await searchAniList(title, mediaType);
        if (anilistResult) {
            searchCache.set(cacheKey, anilistResult);
            return anilistResult;
        }

        const jikanResult = await searchJikan(title, mediaType);
        if (jikanResult) {
            searchCache.set(cacheKey, jikanResult);
            return jikanResult;
        }

        return null;
    } catch (error) {
        console.error(`Error searching for "${title}":`, error);
        throw error;
    } finally {
        inFlightSearches.delete(cacheKey);
    }
    })();

    inFlightSearches.set(cacheKey, requestPromise);
    return requestPromise;
}

async function searchAniList(title, mediaType) {
    const response = await fetch(ANILIST_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: SEARCH_QUERY,
            variables: { search: title, type: mediaType }
        })
    });

    if (response.status === 429) {
        await delay(RATE_LIMIT_BASE_DELAY);
        const retried = await fetch(ANILIST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: SEARCH_QUERY,
                variables: { search: title, type: mediaType }
            })
        });

        if (retried.status === 429 || !retried.ok) {
            return null;
        }

        const retriedData = await retried.json();
        return mapAniListMedia(retriedData?.data?.Media, mediaType);
    }

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    if (data.errors) {
        console.warn(`API error for "${title}":`, data.errors[0]?.message);
        return null;
    }

    return mapAniListMedia(data.data?.Media, mediaType);
}

async function searchJikan(title, mediaType) {
    const endpoint = mediaType === 'MANGA' ? 'manga' : 'anime';
    const url = `${JIKAN_API}/${endpoint}?q=${encodeURIComponent(title)}&limit=5&sfw=true`;

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (response.status === 429) {
        await delay(500);
        return null;
    }

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    const items = Array.isArray(data?.data) ? data.data : [];
    if (items.length === 0) {
        return null;
    }

    const ranked = items
        .map(item => ({ item, score: scoreJikanMatch(item, title) }))
        .sort((left, right) => right.score - left.score);

    const best = ranked[0];
    if (!best || best.score <= 0) {
        return null;
    }

    const item = best.item;

    return {
        id: item.mal_id,
        title: item.title || item.title_english || item.title_japanese || title,
        english: item.title_english || item.title || '',
        romaji: item.title || '',
        native: item.title_japanese || '',
        episodes: item.episodes || null,
        format: item.type || '',
        year: item.year || null,
        status: item.status || '',
        mediaType,
        source: 'Jikan'
    };
}

function scoreJikanMatch(item, title) {
    const normalizedTitle = String(title).toLowerCase();
    const titleTokens = normalizedTitle
        .replace(/[^a-z0-9]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    const normalizedCandidates = [
        item?.title,
        item?.title_english,
        item?.title_japanese,
        ...(Array.isArray(item?.titles) ? item.titles.map(entry => entry?.title) : [])
    ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase());

    let score = 0;

    normalizedCandidates.forEach(candidate => {
        if (candidate === normalizedTitle) {
            score += 100;
        }
        if (candidate.includes(normalizedTitle) || normalizedTitle.includes(candidate)) {
            score += 40;
        }
        if (candidate.replace(/\s+/g, '') === normalizedTitle.replace(/\s+/g, '')) {
            score += 30;
        }

        const candidateTokens = candidate.replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean);
        const overlap = titleTokens.filter(token => candidateTokens.includes(token)).length;
        if (overlap > 0) {
            score += overlap * 6;
        }
    });

    if (item?.synopsis) {
        score += 1;
    }

    return score;
}

function mapAniListMedia(media, mediaType) {
    if (!media) {
        return null;
    }

    return {
        id: media.id,
        title: media.title.romaji || media.title.english || media.title.native,
        english: media.title.english || '',
        romaji: media.title.romaji || '',
        native: media.title.native || '',
        episodes: media.episodes,
        format: media.format,
        year: media.seasonYear,
        status: media.status,
        mediaType,
        source: 'AniList'
    };
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

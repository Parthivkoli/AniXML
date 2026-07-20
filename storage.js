/**
 * AniXML - Local Storage Module
 * Manages persistent storage of application state
 */

'use strict';

const STORAGE_KEY = 'anixml_state';
const VERSION = '1.0';

/**
 * Initialize storage system
 */
export async function initializeStorage() {
    // Check if storage is available
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('LocalStorage not available');
        return false;
    }
}

/**
 * Save application state
 * @param {Object} state - State object to save
 */
export function saveState(state) {
    try {
        const data = {
            version: VERSION,
            timestamp: new Date().toISOString(),
            ...state
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

/**
 * Load application state
 * @returns {Object|null} Saved state or null
 */
export function loadState() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;

        const state = JSON.parse(data);

        // Version check - implement migrations here if needed
        if (state.version !== VERSION) {
            console.warn('State version mismatch');
        }

        return state;
    } catch (e) {
        console.error('Failed to load state:', e);
        return null;
    }
}

/**
 * Clear all saved state
 */
export function clearState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Failed to clear state:', e);
    }
}

/**
 * Get storage size
 * @returns {number} Size in bytes
 */
export function getStorageSize() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? new Blob([data]).size : 0;
    } catch (e) {
        return 0;
    }
}
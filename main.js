/**
 * AniXML - Main Application Module
 * Orchestrates the entire application lifecycle
 */

'use strict';

import { initializeStorage, saveState, loadState, clearState } from './storage.js';
import { initializeUI, updateStats, showToast, showProgressSection, hideProgressSection, updateProgress, showResultsTable, updateResultsTable, openModal, closeModal } from './ui.js';
import { searchTitles, cancelSearch } from './api.js';
import { generateXML, generateJSON, generateCSV } from './xml.js';
import { normalizeTitle, downloadFile, extractUnique, escapeXml, escapeHtml } from './utils.js';

let appState = {
    inputTitles: [],
    results: [],
    duplicates: 0,
    searchCancelled: false,
    currentSearch: null
};

let settings = {
    concurrency: 4,
    autoRetry: true,
    autoSave: true,
    darkMode: false,
    defaultStatus: 'Plan to Watch'
};

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        // Initialize storage
        await initializeStorage();

        // Load saved state
        const savedState = loadState();
        if (savedState) {
            appState = { ...appState, ...savedState };
            if (savedState.settings) {
                settings = { ...settings, ...savedState.settings };
            }
            updateUIFromState();
        }

        // Initialize UI
        initializeUI();

        // Load dark mode preference
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('themeToggle').textContent = '🌙';
        }

        // Attach event listeners
        attachEventListeners();

        // Load initial content if available
        if (appState.inputTitles.length > 0) {
            document.getElementById('inputTextarea').value = appState.inputTitles.join('\n');
            updateInputStats();
        }

        console.log('AniXML initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to initialize application', 'error');
    }
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    try {
        // Input events
        const inputTextarea = document.getElementById('inputTextarea');
        inputTextarea.addEventListener('input', handleInputChange);
        inputTextarea.addEventListener('dragover', handleDragOver);
        inputTextarea.addEventListener('drop', handleDrop);

        // Button events
        document.getElementById('importTxtBtn').addEventListener('click', handleImportTxt);
        document.getElementById('pasteBtn').addEventListener('click', handlePaste);
        document.getElementById('settingsBtn').addEventListener('click', () => openModal('settingsModal'));
        document.getElementById('clearInputBtn').addEventListener('click', handleClearInput);
        document.getElementById('searchBtn').addEventListener('click', handleSearch);
        document.getElementById('cancelSearchBtn').addEventListener('click', handleCancelSearch);
        document.getElementById('exportBtn').addEventListener('click', () => openModal('exportModal'));

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', handleThemeToggle);

        // Settings modal
        document.getElementById('closeSettingsBtn').addEventListener('click', () => closeModal('settingsModal'));
        document.getElementById('resetSessionBtn').addEventListener('click', handleResetSession);
        document.getElementById('concurrencyInput').addEventListener('change', (e) => {
            settings.concurrency = parseInt(e.target.value);
            saveState({ ...appState, settings });
        });
        document.getElementById('autoRetryToggle').addEventListener('change', (e) => {
            settings.autoRetry = e.target.checked;
            saveState({ ...appState, settings });
        });
        document.getElementById('autoSaveToggle').addEventListener('change', (e) => {
            settings.autoSave = e.target.checked;
            saveState({ ...appState, settings });
        });
        document.getElementById('defaultStatusSelect').addEventListener('change', (e) => {
            settings.defaultStatus = e.target.value;
            saveState({ ...appState, settings });
        });

        // Manual search modal
        document.getElementById('closeManualSearchBtn').addEventListener('click', () => closeModal('manualSearchModal'));
        document.getElementById('manualSearchInput').addEventListener('input', handleManualSearch);

        // Export modal
        document.getElementById('closeExportBtn').addEventListener('click', () => closeModal('exportModal'));
        document.getElementById('downloadXmlBtn').addEventListener('click', handleDownloadXml);
        document.getElementById('downloadXmlGzBtn').addEventListener('click', handleDownloadXmlGz);
        document.getElementById('downloadJsonBtn').addEventListener('click', handleDownloadJson);
        document.getElementById('downloadCsvBtn').addEventListener('click', handleDownloadCsv);
        document.getElementById('downloadUnmatchedBtn').addEventListener('click', handleDownloadUnmatched);
        document.getElementById('copyXmlBtn').addEventListener('click', handleCopyXml);

        // Results filtering
        document.getElementById('searchFilter').addEventListener('input', handleResultsFilter);
        document.getElementById('statusFilter').addEventListener('change', handleResultsFilter);

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Modal overlay click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        console.log('Event listeners attached');
    } catch (error) {
        console.error('Error attaching event listeners:', error);
    }
}

/**
 * Update UI from saved state
 */
function updateUIFromState() {
    if (appState.results.length > 0) {
        updateResultsTable(appState.results);
        showResultsTable();
    }
    updateStats();
}

/**
 * Handle input change
 */
function handleInputChange() {
    updateInputStats();
    if (settings.autoSave) {
        saveCurrentState();
    }
}

/**
 * Handle drag over
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = 'var(--primary-color)';
    e.currentTarget.style.backgroundColor = 'rgba(43, 144, 217, 0.05)';
}

/**
 * Handle drop
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = 'var(--light-border)';
    e.currentTarget.style.backgroundColor = 'transparent';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            handleFileRead(file);
        } else {
            showToast('Please drop a .txt file', 'error');
        }
    }
}

/**
 * Handle file import
 */
function handleImportTxt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileRead(e.target.files[0]);
        }
    });
    input.click();
}

/**
 * Handle file read
 */
function handleFileRead(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const textarea = document.getElementById('inputTextarea');
        textarea.value = content;
        updateInputStats();
        showToast('File imported successfully', 'success');
        if (settings.autoSave) {
            saveCurrentState();
        }
    };
    reader.onerror = () => {
        showToast('Error reading file', 'error');
    };
    reader.readAsText(file);
}

/**
 * Handle paste from clipboard
 */
async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        const textarea = document.getElementById('inputTextarea');
        textarea.value = text;
        updateInputStats();
        showToast('Pasted from clipboard', 'success');
        if (settings.autoSave) {
            saveCurrentState();
        }
    } catch (err) {
        showToast('Failed to read clipboard', 'error');
    }
}

/**
 * Update input statistics
 */
function updateInputStats() {
    const textarea = document.getElementById('inputTextarea');
    const lines = textarea.value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    appState.inputTitles = lines;
    const unique = extractUnique(lines);
    appState.duplicates = lines.length - unique.length;

    document.getElementById('inputCount').textContent = `Lines: ${lines.length}`;
    document.getElementById('uniqueCount').textContent = `Unique: ${unique.length}`;
    document.getElementById('searchBtn').disabled = unique.length === 0;

    updateStats();
}

/**
 * Handle clear input
 */
function handleClearInput() {
    if (confirm('Clear all input?')) {
        document.getElementById('inputTextarea').value = '';
        appState.inputTitles = [];
        appState.duplicates = 0;
        updateInputStats();
        showToast('Input cleared', 'success');
    }
}

/**
 * Handle search
 */
async function handleSearch() {
    const unique = extractUnique(appState.inputTitles);
    if (unique.length === 0) {
        showToast('No titles to search', 'warning');
        return;
    }

    appState.searchCancelled = false;
    showProgressSection();
    document.getElementById('searchBtn').disabled = true;

    try {
        const results = await searchTitles(unique, settings.concurrency, settings.autoRetry, (progress) => {
            if (!appState.searchCancelled) {
                updateProgress(progress);
            }
        });

        if (!appState.searchCancelled) {
            appState.results = results;
            hideProgressSection();
            updateResultsTable(results);
            showResultsTable();
            updateStats();
            showToast('Search completed', 'success');

            if (settings.autoSave) {
                saveCurrentState();
            }
        }
    } catch (error) {
        if (!appState.searchCancelled) {
            hideProgressSection();
            showToast(`Search failed: ${error.message}`, 'error');
            console.error('Search error:', error);
        }
    } finally {
        document.getElementById('searchBtn').disabled = false;
    }
}

/**
 * Handle cancel search
 */
function handleCancelSearch() {
    appState.searchCancelled = true;
    cancelSearch();
    hideProgressSection();
    document.getElementById('searchBtn').disabled = false;
    showToast('Search cancelled', 'info');
}

/**
 * Handle theme toggle
 */
function handleThemeToggle() {
    document.body.classList.toggle('dark-mode');
    settings.darkMode = document.body.classList.contains('dark-mode');
    document.getElementById('themeToggle').textContent = settings.darkMode ? '☀️' : '🌙';
    saveState({ ...appState, settings });
}

/**
 * Handle reset session
 */
function handleResetSession() {
    if (confirm('Reset the entire session? This cannot be undone.')) {
        appState = {
            inputTitles: [],
            results: [],
            duplicates: 0,
            searchCancelled: false,
            currentSearch: null
        };
        document.getElementById('inputTextarea').value = '';
        document.getElementById('resultsSection').style.display = 'none';
        updateInputStats();
        clearState();
        closeModal('settingsModal');
        showToast('Session reset', 'success');
    }
}

/**
 * Handle manual search
 */
async function handleManualSearch(e) {
    const query = e.target.value.trim();
    if (query.length < 2) {
        document.getElementById('manualSearchResults').innerHTML = '';
        return;
    }

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `query ($search:String){Media(search:$search,type:ANIME){id title{romaji english native} episodes format seasonYear status}}`,
                variables: { search: query }
            })
        });
        
        const results = await response.json();

        if (results.data?.Media) {
            const media = results.data.Media;
            const html = `
                <div class="search-result-item" data-id="${media.id}" data-title="${escapeHtml(media.title.romaji || '')}" data-english="${escapeHtml(media.title.english || '')}" data-year="${media.seasonYear || 'N/A'}" data-episodes="${media.episodes || ''}" data-format="${media.format || ''}" data-status="${media.status || ''}">
                    <div class="search-result-title">${escapeHtml(media.title.romaji || media.title.english || '')}</div>
                    <div class="search-result-details">${escapeHtml(media.title.english || '')} | ${media.seasonYear || 'N/A'}</div>
                </div>
            `;
            document.getElementById('manualSearchResults').innerHTML = html;

            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => handleManualSearchSelect(item));
            });
        } else {
            document.getElementById('manualSearchResults').innerHTML = '<p style="padding: 10px; color: var(--text-light);">No results found</p>';
        }
    } catch (err) {
        console.error('Manual search error:', err);
        showToast('Search error', 'error');
    }
}

/**
 * Handle manual search result selection
 */
function handleManualSearchSelect(item) {
    const id = item.dataset.id;
    const title = item.dataset.title;
    const english = item.dataset.english;
    const year = item.dataset.year;
    const episodes = item.dataset.episodes;
    const format = item.dataset.format;
    const status = item.dataset.status;

    const manualSearchInput = document.getElementById('manualSearchInput');
    const rowIndex = manualSearchInput.dataset.rowIndex;
    
    if (rowIndex !== undefined && appState.results[rowIndex]) {
        appState.results[rowIndex].matched = {
            id: parseInt(id),
            title: title,
            english: english,
            romaji: title,
            native: '',
            year: parseInt(year) || null,
            episodes: episodes ? parseInt(episodes) : null,
            format: format,
            status: status
        };
        updateResultsTable(appState.results);
        closeModal('manualSearchModal');
        updateStats();
        showToast('Result updated', 'success');

        if (settings.autoSave) {
            saveCurrentState();
        }
    }
}

/**
 * Handle results filter
 */
function handleResultsFilter() {
    const searchText = document.getElementById('searchFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    const rows = document.querySelectorAll('#resultsTableBody tr');
    rows.forEach(row => {
        if (row.children.length < 8) return;
        
        const originalTitle = row.children[1].textContent.toLowerCase();
        const status = row.children[7].textContent;

        let matchesSearch = originalTitle.includes(searchText);
        let matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'matched' && status.includes('✅')) ||
            (statusFilter === 'ambiguous' && status.includes('⚠️')) ||
            (statusFilter === 'notfound' && status.includes('❌'));

        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

/**
 * Handle download XML
 */
function handleDownloadXml() {
    try {
        if (appState.results.length === 0) {
            showToast('No results to export', 'warning');
            return;
        }
        const xml = generateXML(appState.results, settings.defaultStatus);
        downloadFile(xml, 'animelist.xml', 'application/xml');
        showToast('XML downloaded', 'success');
        closeModal('exportModal');
    } catch (err) {
        showToast(`Export failed: ${err.message}`, 'error');
        console.error('Export error:', err);
    }
}

/**
 * Handle download XML.GZ
 */
function handleDownloadXmlGz() {
    try {
        if (appState.results.length === 0) {
            showToast('No results to export', 'warning');
            return;
        }
        const xml = generateXML(appState.results, settings.defaultStatus);
        const compressed = pako.gzip(xml);
        const blob = new Blob([compressed], { type: 'application/gzip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'animelist.xml.gz';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('XML.GZ downloaded', 'success');
        closeModal('exportModal');
    } catch (err) {
        showToast(`Export failed: ${err.message}`, 'error');
        console.error('Export error:', err);
    }
}

/**
 * Handle download JSON
 */
function handleDownloadJson() {
    try {
        if (appState.results.length === 0) {
            showToast('No results to export', 'warning');
            return;
        }
        const json = generateJSON(appState.results);
        downloadFile(json, 'animelist.json', 'application/json');
        showToast('JSON downloaded', 'success');
        closeModal('exportModal');
    } catch (err) {
        showToast(`Export failed: ${err.message}`, 'error');
        console.error('Export error:', err);
    }
}

/**
 * Handle download CSV
 */
function handleDownloadCsv() {
    try {
        if (appState.results.length === 0) {
            showToast('No results to export', 'warning');
            return;
        }
        const csv = generateCSV(appState.results);
        downloadFile(csv, 'animelist.csv', 'text/csv');
        showToast('CSV downloaded', 'success');
        closeModal('exportModal');
    } catch (err) {
        showToast(`Export failed: ${err.message}`, 'error');
        console.error('Export error:', err);
    }
}

/**
 * Handle download unmatched
 */
function handleDownloadUnmatched() {
    try {
        const unmatched = appState.results
            .filter(r => !r.matched)
            .map(r => r.original)
            .join('\n');

        if (unmatched.length === 0) {
            showToast('No unmatched titles', 'info');
            return;
        }

        downloadFile(unmatched, 'unmatched.txt', 'text/plain');
        showToast('Unmatched list downloaded', 'success');
        closeModal('exportModal');
    } catch (err) {
        showToast(`Export failed: ${err.message}`, 'error');
        console.error('Export error:', err);
    }
}

/**
 * Handle copy XML to clipboard
 */
async function handleCopyXml() {
    try {
        if (appState.results.length === 0) {
            showToast('No results to copy', 'warning');
            return;
        }
        const xml = generateXML(appState.results, settings.defaultStatus);
        await navigator.clipboard.writeText(xml);
        showToast('XML copied to clipboard', 'success');
        closeModal('exportModal');
    } catch (err) {
        showToast(`Copy failed: ${err.message}`, 'error');
        console.error('Copy error:', err);
    }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!document.getElementById('searchBtn').disabled) {
                handleSearch();
            }
        } else if (e.key === 's') {
            e.preventDefault();
            if (!document.getElementById('exportBtn').disabled) {
                document.getElementById('exportBtn').click();
            }
        } else if (e.key === 'o') {
            e.preventDefault();
            handleImportTxt();
        }
    }
}

/**
 * Save current state
 */
function saveCurrentState() {
    const unique = extractUnique(appState.inputTitles);
    saveState({
        inputTitles: unique,
        results: appState.results,
        duplicates: appState.duplicates,
        settings: settings
    });
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

export { appState, settings };

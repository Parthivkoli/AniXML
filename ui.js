/**
 * AniXML - UI Module
 * Handles all user interface updates and interactions
 */

'use strict';

import { normalizeTitle, escapeHtml } from './utils.js';

let progressStartTime = 0;
let progressInterval = null;

/**
 * Initialize UI components
 */
export function initializeUI() {
    // Set initial settings values
    document.getElementById('concurrencyInput').value = '4';
    document.getElementById('autoRetryToggle').checked = true;
    document.getElementById('autoSaveToggle').checked = true;
    document.getElementById('defaultStatusSelect').value = 'Plan to Watch';

    // Responsive adjustments
    handleResponsiveUI();
    window.addEventListener('resize', handleResponsiveUI);
}

/**
 * Update statistics display
 */
export function updateStats() {
    const inputTextarea = document.getElementById('inputTextarea');
    const lines = inputTextarea.value
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    const unique = [...new Set(lines)].length;
    const duplicates = lines.length - unique;

    document.getElementById('totalStat').textContent = unique;

    // Calculate matched/not found from results
    const resultsTable = document.getElementById('resultsTableBody');
    const rows = resultsTable.querySelectorAll('tr');
    let matched = 0;
    let notFound = 0;

    rows.forEach(row => {
        const status = row.children[7].textContent;
        if (status.includes('✅')) matched++;
        if (status.includes('❌')) notFound++;
    });

    document.getElementById('matchedStat').textContent = matched > 0 ? matched : '0';
    document.getElementById('notFoundStat').textContent = notFound > 0 ? notFound : '0';
    document.getElementById('duplicateStat').textContent = duplicates > 0 ? duplicates : '0';
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning, info)
 */
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast active ${type}`;

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

/**
 * Show progress section
 */
export function showProgressSection() {
    document.getElementById('progressSection').style.display = 'block';
    progressStartTime = Date.now();
    updateElapsedTime();
    progressInterval = setInterval(updateElapsedTime, 1000);
}

/**
 * Hide progress section
 */
export function hideProgressSection() {
    document.getElementById('progressSection').style.display = 'none';
    if (progressInterval) {
        clearInterval(progressInterval);
    }
}

/**
 * Update elapsed time
 */
function updateElapsedTime() {
    if (progressStartTime > 0) {
        const elapsed = Math.floor((Date.now() - progressStartTime) / 1000);
        document.getElementById('elapsedTime').textContent = `${elapsed}s`;
    }
}

/**
 * Update progress bar
 * @param {Object} progress - Progress data
 */
export function updateProgress(progress) {
    const percentage = (progress.completed / progress.total) * 100;
    document.getElementById('progressBar').style.width = `${percentage}%`;
    document.getElementById('progressTitle').textContent = `Searching: ${progress.current}`;
    document.getElementById('progressCompleted').textContent = progress.completed;
    document.getElementById('progressTotal').textContent = progress.total;
}

/**
 * Show results table section
 */
export function showResultsTable() {
    document.getElementById('resultsSection').style.display = 'block';
}

/**
 * Update results table
 * @param {Array} results - Search results
 */
export function updateResultsTable(results) {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';

    results.forEach((result, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;

        const statusIcon = result.matched ? '✅' : '❌';
        const statusText = result.matched ? 'Matched' : 'Not Found';

        row.innerHTML = `
            <td>${result.index}</td>
            <td>${escapeHtml(result.original)}</td>
            <td>${result.matched ? escapeHtml(result.matched.title) : '-'}</td>
            <td>${result.matched ? escapeHtml(result.matched.romaji) : '-'}</td>
            <td>${result.matched ? escapeHtml(result.matched.english) : '-'}</td>
            <td>${result.matched ? result.matched.year || '-' : '-'}</td>
            <td>${result.matched ? result.matched.id : '-'}</td>
            <td><span class="status-icon">${statusIcon}</span> ${statusText}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-info" data-action="search" title="Search again">🔍</button>
                    <button class="btn btn-small btn-secondary" data-action="clear" title="Clear match">✕</button>
                </div>
            </td>
        `;

        // Attach action listeners
        row.querySelector('[data-action="search"]').addEventListener('click', () => {
            handleManualSearchClick(index);
        });

        row.querySelector('[data-action="clear"]').addEventListener('click', () => {
            handleClearMatch(index);
        });

        tbody.appendChild(row);
    });
}

/**
 * Handle manual search click
 * @param {number} index - Result index
 */
function handleManualSearchClick(index) {
    const modal = document.getElementById('manualSearchModal');
    const input = document.getElementById('manualSearchInput');
    input.value = '';
    input.dataset.rowIndex = index;
    document.getElementById('manualSearchResults').innerHTML = '';
    openModal('manualSearchModal');
    setTimeout(() => input.focus(), 100);
}

/**
 * Handle clear match
 * @param {number} index - Result index
 */
function handleClearMatch(index) {
    // This will be handled by the main module
    const event = new CustomEvent('clearMatch', { detail: { index } });
    document.dispatchEvent(event);
}

/**
 * Open modal
 * @param {string} modalId - Modal element ID
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // Focus first input
        const input = modal.querySelector('input, textarea, select');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }
}

/**
 * Close modal
 * @param {string} modalId - Modal element ID
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Handle responsive UI adjustments
 */
function handleResponsiveUI() {
    const width = window.innerWidth;
    const toolbar = document.querySelector('.toolbar');

    if (width < 768) {
        toolbar.style.flexDirection = 'column';
    } else {
        toolbar.style.flexDirection = 'row';
    }
}

/**
 * Escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtmlForUI(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// Global state
let currentData = {
    changes: [],
    problems: [],
    components: []
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    refreshChanges();
    refreshProblems();
    refreshComponents();
});

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to selected tab button
    event.target.classList.add('active');
}

// Sub-tab management
function showSubTab(subTabName) {
    // Hide all sub-tab contents
    const subTabContents = document.querySelectorAll('.sub-tab-content');
    subTabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all sub-tab buttons
    const subTabButtons = document.querySelectorAll('.sub-tab-button');
    subTabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected sub-tab content
    document.getElementById(subTabName).classList.add('active');
    
    // Add active class to selected sub-tab button
    event.target.classList.add('active');
}

// API helper functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Database browsing functions
async function refreshChanges() {
    const container = document.getElementById('changes-table');
    container.innerHTML = '<div class="loading">Loading changes...</div>';
    
    try {
        const changes = await apiCall('/api/changes');
        currentData.changes = changes;
        displayChanges(changes);
    } catch (error) {
        container.innerHTML = `<div class="error-message">Failed to load changes: ${error.message}</div>`;
    }
}

async function refreshProblems() {
    const container = document.getElementById('problems-table');
    container.innerHTML = '<div class="loading">Loading problems...</div>';
    
    try {
        const problems = await apiCall('/api/problems');
        currentData.problems = problems;
        displayProblems(problems);
    } catch (error) {
        container.innerHTML = `<div class="error-message">Failed to load problems: ${error.message}</div>`;
    }
}

async function refreshComponents() {
    const container = document.getElementById('components-table');
    container.innerHTML = '<div class="loading">Loading components...</div>';
    
    try {
        const components = await apiCall('/api/components');
        currentData.components = components;
        displayComponents(components);
    } catch (error) {
        container.innerHTML = `<div class="error-message">Failed to load components: ${error.message}</div>`;
    }
}

// Display functions
function displayChanges(changes) {
    const container = document.getElementById('changes-table');
    
    if (changes.length === 0) {
        container.innerHTML = '<div class="info-message">No changes found.</div>';
        return;
    }
    
    const table = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Summary</th>
                    <th>Components</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${changes.map(change => `
                    <tr>
                        <td>${change.id}</td>
                        <td>${escapeHtml(change.summary)}</td>
                        <td>${formatComponents(change.components)}</td>
                        <td class="timestamp">${formatTimestamp(change.timestamp)}</td>
                        <td>
                            <button class="action-btn" onclick="viewChangeDetails(${change.id})">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

function displayProblems(problems) {
    const container = document.getElementById('problems-table');
    
    if (problems.length === 0) {
        container.innerHTML = '<div class="info-message">No problems found.</div>';
        return;
    }
    
    const table = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Summary</th>
                    <th>Components</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${problems.map(problem => `
                    <tr>
                        <td>${problem.id}</td>
                        <td>${escapeHtml(problem.summary)}</td>
                        <td>${formatComponents(problem.components)}</td>
                        <td class="timestamp">${formatTimestamp(problem.timestamp)}</td>
                        <td>
                            <button class="action-btn" onclick="viewProblemDetails(${problem.id})">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

function displayComponents(components) {
    const container = document.getElementById('components-table');
    
    if (components.length === 0) {
        container.innerHTML = '<div class="info-message">No components found.</div>';
        return;
    }
    
    const table = `
        <table>
            <thead>
                <tr>
                    <th>Component Name</th>
                    <th>Changes</th>
                    <th>Problems</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${components.map(component => `
                    <tr>
                        <td>${escapeHtml(component.name)}</td>
                        <td>${component.change_count || 0}</td>
                        <td>${component.problem_count || 0}</td>
                        <td>
                            <button class="action-btn" onclick="viewComponentHistory('${escapeHtml(component.name)}')">History</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Detail view functions
async function viewChangeDetails(id) {
    try {
        const change = await apiCall(`/api/changes/${id}`);
        showModal('Change Details', `
            <h3>Change #${change.id}</h3>
            <p><strong>Summary:</strong> ${escapeHtml(change.summary)}</p>
            <p><strong>Components:</strong> ${formatComponents(change.components)}</p>
            <p><strong>Timestamp:</strong> ${formatTimestamp(change.timestamp)}</p>
            <div>
                <strong>Detailed Description:</strong>
                <pre style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">${escapeHtml(change.detailed_description || 'No detailed description available.')}</pre>
            </div>
        `);
    } catch (error) {
        showModal('Error', `<div class="error-message">Failed to load change details: ${error.message}</div>`);
    }
}

async function viewProblemDetails(id) {
    try {
        const problem = await apiCall(`/api/problems/${id}`);
        showModal('Problem Details', `
            <h3>Problem #${problem.id}</h3>
            <p><strong>Summary:</strong> ${escapeHtml(problem.summary)}</p>
            <p><strong>Components:</strong> ${formatComponents(problem.components)}</p>
            <p><strong>Timestamp:</strong> ${formatTimestamp(problem.timestamp)}</p>
            <div>
                <strong>Correct Action:</strong>
                <pre style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">${escapeHtml(problem.correct_action || 'No correct action available.')}</pre>
            </div>
        `);
    } catch (error) {
        showModal('Error', `<div class="error-message">Failed to load problem details: ${error.message}</div>`);
    }
}

async function viewComponentHistory(componentName) {
    try {
        const history = await apiCall(`/api/components/${encodeURIComponent(componentName)}/history`);
        const changesHtml = history.changes.map(change => 
            `<li>${escapeHtml(change.summary)} <span class="timestamp">(${formatTimestamp(change.timestamp)})</span></li>`
        ).join('');
        
        const problemsHtml = history.problems.map(problem => 
            `<li>${escapeHtml(problem.summary)} <span class="timestamp">(${formatTimestamp(problem.timestamp)})</span></li>`
        ).join('');
        
        showModal('Component History', `
            <h3>History for: ${escapeHtml(componentName)}</h3>
            <h4>Changes (${history.changes.length})</h4>
            <ul>${changesHtml || '<li>No changes found.</li>'}</ul>
            <h4>Problems (${history.problems.length})</h4>
            <ul>${problemsHtml || '<li>No problems found.</li>'}</ul>
        `);
    } catch (error) {
        showModal('Error', `<div class="error-message">Failed to load component history: ${error.message}</div>`);
    }
}

// Tool executor functions
function showToolForm() {
    const toolSelect = document.getElementById('tool-select');
    const toolForm = document.getElementById('tool-form');
    const toolResult = document.getElementById('tool-result');
    
    // Clear previous results
    toolResult.innerHTML = '';
    
    const selectedTool = toolSelect.value;
    if (!selectedTool) {
        toolForm.innerHTML = '';
        return;
    }
    
    const forms = {
        'remember-change': `
            <h3>Remember Change</h3>
            <div class="form-group">
                <label>Summary:</label>
                <input type="text" id="summary" required>
            </div>
            <div class="form-group">
                <label>Detailed Description:</label>
                <textarea id="detailedDescription" required></textarea>
            </div>
            <div class="form-group">
                <label>Components (comma-separated):</label>
                <input type="text" id="components" required>
            </div>
            <button class="execute-btn" onclick="executeRememberChange()">Execute</button>
        `,
        'remember-mistake': `
            <h3>Remember Mistake</h3>
            <div class="form-group">
                <label>Summary:</label>
                <input type="text" id="summary" required>
            </div>
            <div class="form-group">
                <label>Correct Action:</label>
                <textarea id="correctAction" required></textarea>
            </div>
            <div class="form-group">
                <label>Components (comma-separated):</label>
                <input type="text" id="components" required>
            </div>
            <button class="execute-btn" onclick="executeRememberMistake()">Execute</button>
        `,
        'get-potential-context': `
            <h3>Get Potential Context</h3>
            <div class="form-group">
                <label>Task Summary:</label>
                <textarea id="taskSummary" required></textarea>
            </div>
            <div class="form-group">
                <label>Components of Interest (comma-separated):</label>
                <input type="text" id="componentsOfInterest">
            </div>
            <button class="execute-btn" onclick="executeGetPotentialContext()">Execute</button>
        `,
        'change-details': `
            <h3>Change Details</h3>
            <div class="form-group">
                <label>Change ID:</label>
                <input type="number" id="changeId" required>
            </div>
            <button class="execute-btn" onclick="executeChangeDetails()">Execute</button>
        `,
        'problem-details': `
            <h3>Problem Details</h3>
            <div class="form-group">
                <label>Problem ID:</label>
                <input type="number" id="problemId" required>
            </div>
            <button class="execute-btn" onclick="executeProblemDetails()">Execute</button>
        `,
        'component-history': `
            <h3>Component History</h3>
            <div class="form-group">
                <label>Component Name:</label>
                <input type="text" id="componentName" required>
            </div>
            <button class="execute-btn" onclick="executeComponentHistory()">Execute</button>
        `
    };
    
    toolForm.innerHTML = forms[selectedTool] || '';
}

// Tool execution functions
async function executeRememberChange() {
    const summary = document.getElementById('summary').value;
    const detailedDescription = document.getElementById('detailedDescription').value;
    const components = document.getElementById('components').value.split(',').map(c => c.trim());
    
    try {
        const result = await apiCall('/api/tools/remember-change', {
            method: 'POST',
            body: JSON.stringify({ summary, detailedDescription, components })
        });
        
        showToolResult(result, 'success');
        refreshChanges(); // Refresh the changes table
    } catch (error) {
        showToolResult({ error: error.message }, 'error');
    }
}

async function executeRememberMistake() {
    const summary = document.getElementById('summary').value;
    const correctAction = document.getElementById('correctAction').value;
    const components = document.getElementById('components').value.split(',').map(c => c.trim());
    
    try {
        const result = await apiCall('/api/tools/remember-mistake', {
            method: 'POST',
            body: JSON.stringify({ summary, correctAction, components })
        });
        
        showToolResult(result, 'success');
        refreshProblems(); // Refresh the problems table
    } catch (error) {
        showToolResult({ error: error.message }, 'error');
    }
}

async function executeGetPotentialContext() {
    const taskSummary = document.getElementById('taskSummary').value;
    const componentsOfInterest = document.getElementById('componentsOfInterest').value.split(',').map(c => c.trim()).filter(c => c);
    
    try {
        const result = await apiCall('/api/tools/get-potential-context', {
            method: 'POST',
            body: JSON.stringify({ taskSummary, componentsOfInterest })
        });
        
        showToolResult(result, 'success');
    } catch (error) {
        showToolResult({ error: error.message }, 'error');
    }
}

async function executeChangeDetails() {
    const id = parseInt(document.getElementById('changeId').value);
    
    try {
        const result = await apiCall(`/api/tools/change-details/${id}`, {
            method: 'POST'
        });
        
        showToolResult(result, 'success');
    } catch (error) {
        showToolResult({ error: error.message }, 'error');
    }
}

async function executeProblemDetails() {
    const id = parseInt(document.getElementById('problemId').value);
    
    try {
        const result = await apiCall(`/api/tools/problem-details/${id}`, {
            method: 'POST'
        });
        
        showToolResult(result, 'success');
    } catch (error) {
        showToolResult({ error: error.message }, 'error');
    }
}

async function executeComponentHistory() {
    const componentName = document.getElementById('componentName').value;
    
    try {
        const result = await apiCall('/api/tools/component-history', {
            method: 'POST',
            body: JSON.stringify({ componentName })
        });
        
        showToolResult(result, 'success');
    } catch (error) {
        showToolResult({ error: error.message }, 'error');
    }
}

// Utility functions
function showToolResult(result, type) {
    const container = document.getElementById('tool-result');
    const className = type === 'success' ? 'success-message' : 'error-message';
    
    container.innerHTML = `
        <div class="${className}">
            <strong>Result:</strong>
            <pre>${JSON.stringify(result, null, 2)}</pre>
        </div>
    `;
}

function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `<h2>${title}</h2>${content}`;
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
};

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatComponents(components) {
    if (!components) return '';
    
    const componentList = typeof components === 'string' ? components.split(',') : components;
    return componentList.map(comp => `<span class="component-badge">${escapeHtml(comp.trim())}</span>`).join('');
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
}

// Logs functions (placeholder for now)
function refreshLogs() {
    // TODO: Implement when interaction logging is added
    console.log('Refreshing logs...');
} 
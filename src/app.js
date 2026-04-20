// Habita App - Main Application Logic

class HabitaApp {
    constructor() {
        this.appState = new AppState();
        this.winsTracker = storage.getWinsTracker();
        this.currentMonth = new Date();
        this.selectedColor = 'Blue';
        this.currentTutorialStep = 1;
        this.hasSeenTutorial = this.appState.loadFromStorage('hasSeenTutorial', false);
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyDarkMode();
        this.render();
        
        // Show tutorial FAB if user has completed onboarding
        if (!this.appState.showOnboarding) {
            setTimeout(() => this.showTutorialFAB(), 500);
        }
    }

    setupEventListeners() {
        // Color picker buttons
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectColor(e.target, e.target.dataset.color);
            });
        });

        // Modal close on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    // ===== Rendering =====

    render() {
        if (this.appState.showOnboarding) {
            document.getElementById('onboarding-modal').style.display = 'flex';
            document.getElementById('main-app').style.display = 'none';
        } else {
            document.getElementById('onboarding-modal').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
            this.renderMainApp();
        }
    }

    renderMainApp() {
        this.updateWinsDisplay();
        this.renderInbox();
        this.renderHabits();
        this.renderMatrix();
        this.renderCalendar();
        this.renderAnalytics();
    }

    renderInbox() {
        const inboxList = document.getElementById('inbox-list');
        const tasks = storage.getTasks().filter(t => t.isInInbox && !t.isCompleted);

        if (tasks.length === 0) {
            inboxList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No tasks in inbox</p>
                    <small>Create a task to get started</small>
                </div>
            `;
        } else {
            inboxList.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');
        }
    }

    createTaskCard(task) {
        const timeFormatted = task.getFormattedTime();
        return `
            <div class="task-card" style="border-left-color: ${this.getColorHex(task.colorLabel)}">
                <div class="task-card-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">⏱️ ${timeFormatted} · Created ${this.formatDate(task.createdAt)}</div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm" onclick="app.completeTask('${task.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm" onclick="app.deleteTask('${task.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderHabits() {
        const habitsList = document.getElementById('habits-list');
        const habits = storage.getHabits().sort((a, b) => b.createdAt - a.createdAt);

        if (habits.length === 0) {
            habitsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>No Habits Yet</p>
                    <small>Create a habit to start tracking</small>
                </div>
            `;
        } else {
            habitsList.innerHTML = habits.map(habit => this.createHabitCard(habit)).join('');
        }
    }

    createHabitCard(habit) {
        const completion = habit.todayCompletionPercentage();
        const count = habit.todayCount();
        const colorHex = this.getColorHex(habit.colorLabel);

        return `
            <div class="habit-card">
                <div class="habit-header">
                    <div class="habit-icon" style="background-color: ${colorHex}20;">
                        <i class="fas fa-${habit.icon}" style="color: ${colorHex}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div class="habit-name">${this.escapeHtml(habit.name)}</div>
                        <div class="habit-target">Target: ${habit.dailyTarget}/day</div>
                    </div>
                </div>

                <div class="habit-counter">
                    <button class="counter-btn" onclick="app.decrementHabit('${habit.id}')" ${count === 0 ? 'disabled' : ''}>
                        <i class="fas fa-minus-circle" style="color: #ef4444"></i>
                    </button>
                    <div class="counter-display">
                        <div class="counter-value" style="color: ${colorHex}">${count}</div>
                        <div class="counter-target">of ${habit.dailyTarget}</div>
                    </div>
                    <button class="counter-btn" onclick="app.incrementHabit('${habit.id}')">
                        <i class="fas fa-plus-circle" style="color: #10b981"></i>
                    </button>
                </div>

                <div class="habit-progress">
                    <div class="progress-fill" style="width: ${completion}%; background-color: ${colorHex}"></div>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn btn-sm" style="flex: 1; background-color: ${colorHex}; color: white;" onclick="app.viewHabitDetails('${habit.id}')">
                        View
                    </button>
                    <button class="btn btn-sm" style="flex: 1; background-color: #ef4444; color: white;" onclick="app.deleteHabit('${habit.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderMatrix() {
        const tasks = storage.getTasks().filter(t => !t.isCompleted);
        const quadrants = ['highEnergyShortTime', 'highEnergyLongTime', 'lowEnergyShortTime', 'lowEnergyLongTime'];

        quadrants.forEach(quadrant => {
            const container = document.querySelector(`.quadrant[data-quadrant="${quadrant}"] .task-container`);
            if (!container) return;

            const quadrantTasks = tasks.filter(t => t.quadrant === quadrant);
            container.innerHTML = quadrantTasks.map(task => `
                <div class="matrix-task" style="border-left-color: ${this.getColorHex(task.colorLabel)}">
                    ${this.escapeHtml(task.title)}
                    <div style="font-size: 0.75rem; margin-top: 0.25rem; opacity: 0.7;">
                        ${task.getFormattedTime()}
                    </div>
                </div>
            `).join('');
        });
    }

    renderCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

        // Create calendar grid
        const grid = document.getElementById('calendar-grid');
        let html = '';

        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Empty cells before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day other-month"></div>';
        }

        // Days of month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const tasks = storage.getTasks().filter(t => t.scheduledDate && 
                t.scheduledDate.toDateString() === date.toDateString());

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${tasks.length > 0 ? 'completed' : ''}">
                    <span>${day}</span>
                    ${tasks.length > 0 ? `<small>${tasks.length}</small>` : ''}
                </div>
            `;
        }

        grid.innerHTML = html;
    }

    renderAnalytics() {
        this.renderCompletionTable();
        this.renderDistributionChart();
        this.renderTrendGraph();
    }

    renderCompletionTable() {
        const habits = storage.getHabits();
        const table = document.getElementById('completion-table');

        if (habits.length === 0) {
            table.innerHTML = '<p>No habits to display</p>';
            return;
        }

        let html = `
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Habit</th>
                        <th>Today</th>
                        <th>This Week</th>
                        <th>This Month</th>
                    </tr>
                </thead>
                <tbody>
        `;

        habits.forEach(habit => {
            const today = habit.todayCompletionPercentage();
            const thisWeek = this.getWeekCompletionPercentage(habit);
            const thisMonth = this.getMonthCompletionPercentage(habit);

            html += `
                <tr>
                    <td><strong>${this.escapeHtml(habit.name)}</strong></td>
                    <td>${Math.round(today)}%</td>
                    <td>${Math.round(thisWeek)}%</td>
                    <td>${Math.round(thisMonth)}%</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        table.innerHTML = html;
    }

    renderDistributionChart() {
        const tasks = storage.getTasks();
        const completed = tasks.filter(t => t.isCompleted).length;
        const pending = tasks.filter(t => !t.isCompleted && !t.isInInbox).length;
        const inbox = tasks.filter(t => t.isInInbox).length;

        const total = completed + pending + inbox;
        if (total === 0) {
            document.getElementById('distribution-chart').innerHTML = '<p>No data to display</p>';
            return;
        }

        const completedHeight = (completed / total) * 250;
        const pendingHeight = (pending / total) * 250;
        const inboxHeight = (inbox / total) * 250;

        document.getElementById('distribution-chart').innerHTML = `
            <div class="chart-container">
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                    <div class="chart-bar" style="height: ${completedHeight}px; background-color: #10b981;">
                        <div class="chart-label">Completed<br>${completed}</div>
                    </div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                    <div class="chart-bar" style="height: ${pendingHeight}px; background-color: #f59e0b;">
                        <div class="chart-label">Scheduled<br>${pending}</div>
                    </div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                    <div class="chart-bar" style="height: ${inboxHeight}px; background-color: #3b82f6;">
                        <div class="chart-label">Inbox<br>${inbox}</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTrendGraph() {
        const days = 7;
        const today = new Date();
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const tasks = storage.getTasks().filter(t => 
                t.isCompleted && t.scheduledDate && 
                t.scheduledDate.toDateString() === date.toDateString()
            );
            
            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: tasks.length
            });
        }

        const maxCount = Math.max(...data.map(d => d.count), 1);

        const html = `
            <div class="chart-container">
                ${data.map(d => `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div class="chart-bar" style="height: ${(d.count / maxCount) * 250}px;">
                            <div class="chart-label">${d.date}<br>${d.count}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('trend-graph').innerHTML = html;
    }

    // ===== Event Handlers =====

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const tabId = `${tabName}-tab`;
        const tab = document.getElementById(tabId);
        if (tab) tab.style.display = 'block';

        // Add active class to clicked button
        event.target.closest('.tab-button').classList.add('active');
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    addTask() {
        const title = document.getElementById('task-title').value.trim();
        const timeMinutes = parseInt(document.getElementById('task-time').value) || 15;
        const timeSeconds = timeMinutes * 60;
        const color = this.selectedColor;

        if (!title) {
            alert('Please enter a task title');
            return;
        }

        const task = new HabitaTask(title, timeSeconds);
        task.colorLabel = color;
        storage.addTask(task);

        document.getElementById('task-title').value = '';
        document.getElementById('task-time').value = '15';
        this.selectedColor = 'Blue';

        this.closeModal('add-task-modal');
        this.renderInbox();
    }

    deleteTask(taskId) {
        if (confirm('Delete this task?')) {
            storage.deleteTask(taskId);
            this.renderInbox();
        }
    }

    completeTask(taskId) {
        const task = storage.getTasks().find(t => t.id === taskId);
        if (task) {
            task.isCompleted = true;
            task.isInInbox = false;
            storage.updateTask(task);
            this.winsTracker.recordTaskCompletion();
            storage.saveWinsTracker(this.winsTracker);
            this.renderInbox();
            this.updateWinsDisplay();
        }
    }

    addHabit() {
        const name = document.getElementById('habit-name').value.trim();
        const icon = document.getElementById('habit-icon').value.trim() || 'sparkles';
        const color = this.selectedColor;
        const target = parseInt(document.getElementById('habit-target').value) || 1;

        if (!name) {
            alert('Please enter a habit name');
            return;
        }

        const habit = new Habit(name, icon, color, target);
        storage.addHabit(habit);

        document.getElementById('habit-name').value = '';
        document.getElementById('habit-icon').value = 'sparkles';
        document.getElementById('habit-target').value = '1';
        this.selectedColor = 'Blue';

        this.closeModal('add-habit-modal');
        this.renderHabits();
    }

    deleteHabit(habitId) {
        if (confirm('Delete this habit?')) {
            storage.deleteHabit(habitId);
            this.renderHabits();
        }
    }

    incrementHabit(habitId) {
        const habits = storage.getHabits();
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
            habit.incrementToday();
            storage.updateHabit(habit);
            this.renderHabits();
        }
    }

    decrementHabit(habitId) {
        const habits = storage.getHabits();
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
            habit.decrementToday();
            storage.updateHabit(habit);
            this.renderHabits();
        }
    }

    viewHabitDetails(habitId) {
        alert('Habit details view would show detailed history and statistics for this habit.');
    }

    previousMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.renderCalendar();
    }

    selectColor(element, color) {
        // Remove selected class from all color options in all modals
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        element.classList.add('selected');
        this.selectedColor = color;
    }

    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        this.appState.setDarkMode(isDarkMode ? 'dark' : 'light');
    }

    toggleNotifications() {
        const enabled = document.getElementById('notifications-toggle').checked;
        this.appState.setNotificationsEnabled(enabled);
    }

    toggleEnergyHints() {
        const enabled = document.getElementById('energy-hints-toggle').checked;
        this.appState.setShowEnergyHints(enabled);
    }

    applyDarkMode() {
        const setting = this.appState.darkModeSetting;
        const toggle = document.getElementById('dark-mode-toggle');
        const energyToggle = document.getElementById('energy-hints-toggle');
        const notificationsToggle = document.getElementById('notifications-toggle');

        if (setting === 'dark') {
            document.body.classList.add('dark-mode');
            if (toggle) toggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if (toggle) toggle.checked = false;
        }

        if (energyToggle) energyToggle.checked = this.appState.showEnergyRecoveryHints;
        if (notificationsToggle) notificationsToggle.checked = this.appState.notificationsEnabled;
    }

    exportData() {
        storage.exportAsJSON();
        alert('Data exported successfully!');
    }

    resetAllData() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            storage.clearAllData();
            this.appState.resetAllData();
            alert('All data has been reset');
            location.reload();
        }
    }

    updateWinsDisplay() {
        const winsDisplay = document.getElementById('wins-display');
        if (winsDisplay) {
            winsDisplay.textContent = this.winsTracker.totalWins;
        }
    }

    // ===== Onboarding =====

    nextOnboardingPage() {
        const pages = document.querySelectorAll('.onboarding-page');
        if (this.appState.currentOnboardingPage < pages.length - 1) {
            pages[this.appState.currentOnboardingPage].style.display = 'none';
            this.appState.currentOnboardingPage++;
            pages[this.appState.currentOnboardingPage].style.display = 'block';
        }
    }

    completeOnboarding() {
        this.appState.completeOnboarding();
        this.render();
        
        // Auto-open tutorial after onboarding
        setTimeout(() => {
            this.openTutorial();
        }, 300);
    }

    // ===== Utility Methods =====

    getColorHex(label) {
        const colors = {
            'Blue': '#3b82f6',
            'Red': '#ef4444',
            'Green': '#10b981',
            'Orange': '#f97316',
            'Purple': '#a855f7',
            'Pink': '#ec4899'
        };
        return colors[label] || colors['Blue'];
    }

    getWeekCompletionPercentage(habit) {
        let totalPercentage = 0;
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            totalPercentage += habit.completionPercentageForDate(date);
        }
        return totalPercentage / 7;
    }

    getMonthCompletionPercentage(habit) {
        let totalPercentage = 0;
        const date = new Date();
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        
        for (let i = 0; i < daysInMonth; i++) {
            const d = new Date(date.getFullYear(), date.getMonth(), i + 1);
            totalPercentage += habit.completionPercentageForDate(d);
        }
        return totalPercentage / daysInMonth;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'today';
        if (date.toDateString() === yesterday.toDateString()) return 'yesterday';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // ===== Tutorial System =====

    showTutorialFAB() {
        const fab = document.getElementById('tutorial-fab');
        if (fab) {
            fab.style.display = 'flex';
        }
    }

    openTutorial() {
        this.currentTutorialStep = 1;
        this.updateTutorialUI();
        document.getElementById('tutorial-modal').style.display = 'flex';
    }

    closeTutorial() {
        document.getElementById('tutorial-modal').style.display = 'none';
        this.appState.saveToStorage('hasSeenTutorial', true);
    }

    nextTutorialStep() {
        const steps = document.querySelectorAll('.tutorial-step');
        if (this.currentTutorialStep < steps.length) {
            this.currentTutorialStep++;
            this.updateTutorialUI();
        }
    }

    previousTutorialStep() {
        if (this.currentTutorialStep > 1) {
            this.currentTutorialStep--;
            this.updateTutorialUI();
        }
    }

    updateTutorialUI() {
        const steps = document.querySelectorAll('.tutorial-step');
        const totalSteps = steps.length;

        // Hide all steps
        steps.forEach(step => step.classList.remove('active'));

        // Show current step
        const currentStep = document.querySelector(`.tutorial-step[data-step="${this.currentTutorialStep}"]`);
        if (currentStep) {
            currentStep.classList.add('active');
        }

        // Update buttons
        const prevBtn = document.getElementById('tutorial-prev-btn');
        const nextBtn = document.getElementById('tutorial-next-btn');
        const skipBtn = document.getElementById('tutorial-skip-btn');
        const doneBtn = document.getElementById('tutorial-done-btn');

        prevBtn.style.display = this.currentTutorialStep > 1 ? 'inline-block' : 'none';
        skipBtn.style.display = this.currentTutorialStep < totalSteps ? 'inline-block' : 'none';
        nextBtn.style.display = this.currentTutorialStep < totalSteps ? 'inline-block' : 'none';
        doneBtn.style.display = this.currentTutorialStep === totalSteps ? 'inline-block' : 'none';
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HabitaApp();
});

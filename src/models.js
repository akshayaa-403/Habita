// Habita Models - Data Structures for the Web App

class Habit {
    constructor(name, icon, colorLabel, dailyTarget = 1) {
        this.id = this.generateId();
        this.name = name;
        this.icon = icon;
        this.colorLabel = colorLabel;
        this.dailyTarget = dailyTarget;
        this.createdAt = new Date();
        this.logs = [];
    }

    generateId() {
        return 'habit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get the count for today
     */
    todayCount() {
        const today = this.getToday();
        const todayLog = this.logs.find(log => this.isSameDay(log.date, today));
        return todayLog ? todayLog.count : 0;
    }

    /**
     * Get completion percentage for today
     */
    todayCompletionPercentage() {
        const count = this.todayCount();
        const target = this.dailyTarget;
        return Math.min((count / target) * 100, 100);
    }

    /**
     * Get completion percentage for a specific date
     */
    completionPercentageForDate(date) {
        const targetDate = this.getDateStart(date);
        const log = this.logs.find(l => this.isSameDay(l.date, targetDate));
        const count = log ? log.count : 0;
        const target = this.dailyTarget;
        return Math.min((count / target) * 100, 100);
    }

    /**
     * Add or update log entry for a date
     */
    logEntry(count, date = new Date()) {
        const dayStart = this.getDateStart(date);
        let log = this.logs.find(l => this.isSameDay(l.date, dayStart));
        
        if (!log) {
            log = new HabitLog(dayStart, count, this.id);
            this.logs.push(log);
        } else {
            log.count = count;
        }
        log.date = dayStart;
    }

    /**
     * Increment count for today
     */
    incrementToday() {
        const today = this.getToday();
        const count = this.todayCount();
        this.logEntry(count + 1, today);
    }

    /**
     * Decrement count for today
     */
    decrementToday() {
        const today = this.getToday();
        const count = this.todayCount();
        if (count > 0) {
            this.logEntry(count - 1, today);
        }
    }

    getToday() {
        return new Date();
    }

    getDateStart(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}

class HabitLog {
    constructor(date, count = 0, habitId = null) {
        this.id = 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        this.date = new Date(date);
        this.date.setHours(0, 0, 0, 0);
        this.count = count;
        this.habitId = habitId;
    }
}

class HabitaTask {
    constructor(title, timeRequired = 900) {
        this.id = this.generateId();
        this.title = title;
        this.timeRequired = timeRequired; // in seconds
        this.icon = "questionmark";
        this.colorLabel = "Blue";
        this.energyLevel = null; // 1-5
        this.complexity = null; // 1-5
        this.urgency = null; // 1-5
        this.quadrant = null; // "highEnergyShortTime", "highEnergyLongTime", "lowEnergyShortTime", "lowEnergyLongTime"
        this.createdAt = new Date();
        this.isInInbox = true;
        this.scheduledDate = null;
        this.isCompleted = false;
    }

    generateId() {
        return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Determine quadrant based on energy and time
     */
    determineQuadrant() {
        if (this.energyLevel === null || this.urgency === null) {
            return null;
        }

        const shortTime = this.timeRequired <= 30 * 60; // 30 minutes
        const highEnergy = this.energyLevel >= 3;

        if (highEnergy && shortTime) return "highEnergyShortTime";
        if (highEnergy && !shortTime) return "highEnergyLongTime";
        if (!highEnergy && shortTime) return "lowEnergyShortTime";
        if (!highEnergy && !shortTime) return "lowEnergyLongTime";
    }

    /**
     * Format time for display
     */
    getFormattedTime() {
        const minutes = Math.round(this.timeRequired / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }
}

class WinsTracker {
    constructor() {
        this.id = this.generateId();
        this.totalWins = 0;
        this.lastUpdated = new Date();
        this.completedTasks = 0;
        this.habitDaysLogged = 0;
        this.bonusPointsEarned = 0;
        this.createdAt = new Date();
    }

    generateId() {
        return 'wins-' + Date.now();
    }

    recordTaskCompletion() {
        this.totalWins += 1;
        this.completedTasks += 1;
        this.lastUpdated = new Date();
    }

    recordHabitDay() {
        this.totalWins += 1;
        this.habitDaysLogged += 1;
        this.lastUpdated = new Date();
    }

    recordBonus(points = 10) {
        this.totalWins += points;
        this.bonusPointsEarned += points;
        this.lastUpdated = new Date();
    }
}

class AppState {
    constructor() {
        this.hasCompletedOnboarding = this.loadFromStorage('hasCompletedOnboarding', false);
        this.currentOnboardingPage = 0;
        this.notificationsEnabled = this.loadFromStorage('notificationsEnabled', true);
        this.darkModeSetting = this.loadFromStorage('darkModeSetting', 'system');
        this.showEnergyRecoveryHints = this.loadFromStorage('showEnergyRecoveryHints', true);
    }

    loadFromStorage(key, defaultValue) {
        try {
            const stored = localStorage.getItem(key);
            if (stored === null) return defaultValue;
            if (typeof defaultValue === 'boolean') {
                return stored === 'true';
            }
            return JSON.parse(stored);
        } catch (e) {
            return defaultValue;
        }
    }

    saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    completeOnboarding() {
        this.hasCompletedOnboarding = true;
        this.currentOnboardingPage = 0;
        this.saveToStorage('hasCompletedOnboarding', true);
    }

    resetOnboarding() {
        this.hasCompletedOnboarding = false;
        this.currentOnboardingPage = 0;
        this.saveToStorage('hasCompletedOnboarding', false);
    }

    resetAllData() {
        localStorage.removeItem('hasCompletedOnboarding');
        localStorage.removeItem('notificationsEnabled');
        localStorage.removeItem('darkModeSetting');
        localStorage.removeItem('showEnergyRecoveryHints');
        localStorage.removeItem('habits');
        localStorage.removeItem('tasks');
        localStorage.removeItem('winsTracker');
    }

    setDarkMode(setting) {
        this.darkModeSetting = setting;
        this.saveToStorage('darkModeSetting', setting);
    }

    setNotificationsEnabled(enabled) {
        this.notificationsEnabled = enabled;
        this.saveToStorage('notificationsEnabled', enabled);
    }

    setShowEnergyHints(show) {
        this.showEnergyRecoveryHints = show;
        this.saveToStorage('showEnergyRecoveryHints', show);
    }

    get showOnboarding() {
        return !this.hasCompletedOnboarding;
    }
}

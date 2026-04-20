// Habita Storage Service - Manages data persistence with localStorage

class StorageService {
    constructor() {
        this.HABITS_KEY = 'habits';
        this.TASKS_KEY = 'tasks';
        this.WINS_KEY = 'winsTracker';
    }

    // ===== Habits Storage =====

    getHabits() {
        try {
            const stored = localStorage.getItem(this.HABITS_KEY);
            if (!stored) return [];
            
            const habits = JSON.parse(stored);
            return habits.map(h => this.deserializeHabit(h));
        } catch (e) {
            console.error('Failed to load habits:', e);
            return [];
        }
    }

    saveHabits(habits) {
        try {
            const serialized = habits.map(h => this.serializeHabit(h));
            localStorage.setItem(this.HABITS_KEY, JSON.stringify(serialized));
        } catch (e) {
            console.error('Failed to save habits:', e);
        }
    }

    addHabit(habit) {
        const habits = this.getHabits();
        habits.push(habit);
        this.saveHabits(habits);
        return habit;
    }

    updateHabit(habit) {
        const habits = this.getHabits();
        const index = habits.findIndex(h => h.id === habit.id);
        if (index !== -1) {
            habits[index] = habit;
            this.saveHabits(habits);
        }
        return habit;
    }

    deleteHabit(habitId) {
        let habits = this.getHabits();
        habits = habits.filter(h => h.id !== habitId);
        this.saveHabits(habits);
    }

    serializeHabit(habit) {
        return {
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
            colorLabel: habit.colorLabel,
            dailyTarget: habit.dailyTarget,
            createdAt: habit.createdAt.toISOString(),
            logs: habit.logs.map(l => ({
                id: l.id,
                date: l.date.toISOString(),
                count: l.count,
                habitId: l.habitId
            }))
        };
    }

    deserializeHabit(data) {
        const habit = new Habit(data.name, data.icon, data.colorLabel, data.dailyTarget);
        habit.id = data.id;
        habit.createdAt = new Date(data.createdAt);
        habit.logs = data.logs.map(l => {
            const log = new HabitLog(new Date(l.date), l.count, l.habitId);
            log.id = l.id;
            return log;
        });
        return habit;
    }

    // ===== Tasks Storage =====

    getTasks() {
        try {
            const stored = localStorage.getItem(this.TASKS_KEY);
            if (!stored) return [];
            
            const tasks = JSON.parse(stored);
            return tasks.map(t => this.deserializeTask(t));
        } catch (e) {
            console.error('Failed to load tasks:', e);
            return [];
        }
    }

    saveTasks(tasks) {
        try {
            const serialized = tasks.map(t => this.serializeTask(t));
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(serialized));
        } catch (e) {
            console.error('Failed to save tasks:', e);
        }
    }

    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);
        return task;
    }

    updateTask(task) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            tasks[index] = task;
            this.saveTasks(tasks);
        }
        return task;
    }

    deleteTask(taskId) {
        let tasks = this.getTasks();
        tasks = tasks.filter(t => t.id !== taskId);
        this.saveTasks(tasks);
    }

    serializeTask(task) {
        return {
            id: task.id,
            title: task.title,
            timeRequired: task.timeRequired,
            icon: task.icon,
            colorLabel: task.colorLabel,
            energyLevel: task.energyLevel,
            complexity: task.complexity,
            urgency: task.urgency,
            quadrant: task.quadrant,
            createdAt: task.createdAt.toISOString(),
            isInInbox: task.isInInbox,
            scheduledDate: task.scheduledDate ? task.scheduledDate.toISOString() : null,
            isCompleted: task.isCompleted
        };
    }

    deserializeTask(data) {
        const task = new HabitaTask(data.title, data.timeRequired);
        task.id = data.id;
        task.icon = data.icon;
        task.colorLabel = data.colorLabel;
        task.energyLevel = data.energyLevel;
        task.complexity = data.complexity;
        task.urgency = data.urgency;
        task.quadrant = data.quadrant;
        task.createdAt = new Date(data.createdAt);
        task.isInInbox = data.isInInbox;
        task.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
        task.isCompleted = data.isCompleted;
        return task;
    }

    // ===== Wins Tracker Storage =====

    getWinsTracker() {
        try {
            const stored = localStorage.getItem(this.WINS_KEY);
            if (!stored) {
                const tracker = new WinsTracker();
                this.saveWinsTracker(tracker);
                return tracker;
            }
            
            return this.deserializeWinsTracker(JSON.parse(stored));
        } catch (e) {
            console.error('Failed to load wins tracker:', e);
            const tracker = new WinsTracker();
            this.saveWinsTracker(tracker);
            return tracker;
        }
    }

    saveWinsTracker(tracker) {
        try {
            const serialized = this.serializeWinsTracker(tracker);
            localStorage.setItem(this.WINS_KEY, JSON.stringify(serialized));
        } catch (e) {
            console.error('Failed to save wins tracker:', e);
        }
    }

    serializeWinsTracker(tracker) {
        return {
            id: tracker.id,
            totalWins: tracker.totalWins,
            lastUpdated: tracker.lastUpdated.toISOString(),
            completedTasks: tracker.completedTasks,
            habitDaysLogged: tracker.habitDaysLogged,
            bonusPointsEarned: tracker.bonusPointsEarned,
            createdAt: tracker.createdAt.toISOString()
        };
    }

    deserializeWinsTracker(data) {
        const tracker = new WinsTracker();
        tracker.id = data.id;
        tracker.totalWins = data.totalWins;
        tracker.lastUpdated = new Date(data.lastUpdated);
        tracker.completedTasks = data.completedTasks;
        tracker.habitDaysLogged = data.habitDaysLogged;
        tracker.bonusPointsEarned = data.bonusPointsEarned;
        tracker.createdAt = new Date(data.createdAt);
        return tracker;
    }

    // ===== Export/Import =====

    exportAllData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            habits: this.getHabits().map(h => this.serializeHabit(h)),
            tasks: this.getTasks().map(t => this.serializeTask(t)),
            winsTracker: this.serializeWinsTracker(this.getWinsTracker())
        };
        return data;
    }

    exportAsJSON() {
        const data = this.exportAllData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habita-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Import habits
            if (data.habits && Array.isArray(data.habits)) {
                const habits = data.habits.map(h => this.deserializeHabit(h));
                this.saveHabits(habits);
            }
            
            // Import tasks
            if (data.tasks && Array.isArray(data.tasks)) {
                const tasks = data.tasks.map(t => this.deserializeTask(t));
                this.saveTasks(tasks);
            }
            
            // Import wins tracker
            if (data.winsTracker) {
                const tracker = this.deserializeWinsTracker(data.winsTracker);
                this.saveWinsTracker(tracker);
            }
            
            return true;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    }

    // ===== Utility Methods =====

    clearAllData() {
        localStorage.removeItem(this.HABITS_KEY);
        localStorage.removeItem(this.TASKS_KEY);
        localStorage.removeItem(this.WINS_KEY);
    }

    getStorageInfo() {
        return {
            habitCount: this.getHabits().length,
            taskCount: this.getTasks().length,
            totalWins: this.getWinsTracker().totalWins
        };
    }
}

// Create global storage instance
const storage = new StorageService();

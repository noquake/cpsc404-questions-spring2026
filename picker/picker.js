// Pure functions and pool logic for the Discussion Question Picker.
// Used by index.html and tested by tests/picker.test.js.

const REPO_CONFIG = {
    owner: 'kousen',
    name: 'cpsc404-questions-spring2026',
    get apiBase() {
        return `https://api.github.com/repos/${this.owner}/${this.name}/contents`;
    },
};

const WEEK_LABELS = {
    'week02-chapter01': 'Week 2 — Ch 1: Making Inevitable Conflict Productive',
    'week03-chapter02': 'Week 3 — Ch 2: Giving Good-Enough Answers',
    'week04-chapter03': 'Week 4 — Ch 3: Creating Constructive Loyalty',
    'week06-dual-reading': 'Week 6 — Ch 4 + ProducingOSS Ch 8',
    'week07-chapter05-async': "Week 7 — Ch 5: Winning the Prisoner's Dilemma",
    'week08-dual-reading': 'Week 8 — Ch 6 + ProducingOSS Ch 6',
    'week10-dual-reading': 'Week 10 — Ch 7 + ProducingOSS Ch 4',
    'week11-chapter06': 'Week 11 — Ch 6: Communicating More Effectively',
    'week12-chapter08': 'Week 12 — Ch 8: Your Boss Is Not Your Friend',
    'week13-chapter09': 'Week 13 — Ch 9: Dealing with Special Cases',
    'week14-chapter10': 'Week 14 — Ch 10: Managing Your Manager',
};

// Strip metadata lines (Student, Date, headings) and keep just the question content
function cleanBody(text) {
    return text
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            if (/^#{1,2}\s/.test(trimmed)) return false;
            if (/^\*\*(Student|Author)[:：]\*\*/i.test(trimmed)) return false;
            if (/^Student[:：]/i.test(trimmed)) return false;
            if (/^\*\*Date[:：]\*\*/i.test(trimmed)) return false;
            if (/^Date[:：]/i.test(trimmed)) return false;
            return true;
        })
        .join('\n')
        .trim();
}

// Extract author name from various formats students used
function extractAuthor(filename, body) {
    // **Student:** Name or **Author:** Name
    const bold = body.match(/\*\*(Student|Author)[:：]\*\*\s*(.+)/i);
    if (bold) return bold[2].trim();
    // Student: Name (no bold)
    const plain = body.match(/^Student[:：]\s*(.+)/im);
    if (plain) return plain[1].trim();
    // Fall back to filename
    return filename
        .replace('.md', '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Get a friendly label for a week folder
function weekLabel(dirname) {
    if (WEEK_LABELS[dirname]) return WEEK_LABELS[dirname];
    return dirname
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Question pool: pick without replacement
function createPool(questions) {
    const all = [...questions];
    let remaining = [...questions];
    let history = [];
    let historyIndex = -1;

    return {
        pick() {
            if (remaining.length === 0) return null;
            const index = Math.floor(Math.random() * remaining.length);
            const item = remaining.splice(index, 1)[0];
            // Truncate any forward history if we went back then picked new
            history = history.slice(0, historyIndex + 1);
            history.push(item);
            historyIndex = history.length - 1;
            return item;
        },
        pickSpecific(question) {
            const index = remaining.indexOf(question);
            if (index === -1) return null;
            remaining.splice(index, 1);
            history = history.slice(0, historyIndex + 1);
            history.push(question);
            historyIndex = history.length - 1;
            return question;
        },
        back() {
            if (historyIndex <= 0) return null;
            historyIndex--;
            return history[historyIndex];
        },
        forward() {
            if (historyIndex >= history.length - 1) return null;
            historyIndex++;
            return history[historyIndex];
        },
        reset() {
            remaining = [...all];
            history = [];
            historyIndex = -1;
        },
        get all() { return all; },
        get remaining() { return remaining.length; },
        get total() { return all.length; },
        get isEmpty() { return remaining.length === 0; },
        isShown(question) { return !remaining.includes(question); },
        get canGoBack() { return historyIndex > 0; },
        get canGoForward() { return historyIndex < history.length - 1; },
        get historyLength() { return history.length; },
    };
}

// Filter GitHub API directory listing to question markdown files
function isQuestionFile(file) {
    return file.name.endsWith('.md') && file.name !== '.gitkeep';
}

// Filter out empty submissions
function isNonEmpty(question) {
    return question.body.trim().length > 0;
}

// Node.js exports (ignored in browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REPO_CONFIG, WEEK_LABELS,
        cleanBody, extractAuthor, weekLabel,
        createPool, isQuestionFile, isNonEmpty,
    };
}

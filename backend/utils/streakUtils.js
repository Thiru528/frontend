const calculateStreak = (user) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today

    let lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;

    // Handle invalid dates
    if (lastStudy && isNaN(lastStudy.getTime())) lastStudy = null;

    if (lastStudy) {
        // Normalize last study to midnight
        lastStudy = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate());

        const diffTime = Math.abs(today - lastStudy);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // Missed more than 1 day (e.g. studied 2 days ago)
            // Streak is broken. Reset to 0 if just checking, or 1 if performing an action.
            // But for "decay", we strictly want to know if it SHOULD be 0 now.
            return { streak: 0, lastStudyDate: user.lastStudyDate, shouldReset: true };
        }
    }

    return { streak: user.streak, lastStudyDate: user.lastStudyDate, shouldReset: false };
};

/**
 * Checks if the streak has decayed (user missed a day) and updates the user object if necessary.
 * Must be followed by user.save() in the controller.
 * @param {Object} user - Mongoose user object
 * @returns {Boolean} - true if user was modified
 */
const checkStreakDecay = (user) => {
    const result = calculateStreak(user);
    if (result.shouldReset && user.streak !== 0) {
        user.streak = 0;
        return true;
    }
    return false;
};

/**
 * Updates the user's streak based on a new activity (Study/MCQ).
 * @param {Object} user - Mongoose user object
 */
const updateStreak = (user) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
    if (lastStudy && isNaN(lastStudy.getTime())) lastStudy = null;

    if (lastStudy) {
        const lastStudyMidnight = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate());
        const diffTime = Math.abs(today - lastStudyMidnight);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already active today; streak doesn't change, but update timestamp
            user.lastStudyDate = now;
        } else if (diffDays === 1) {
            // Consecutive day
            user.streak = (user.streak || 0) + 1;
            user.lastStudyDate = now;
        } else {
            // Broken streak, restart at 1
            user.streak = 1;
            user.lastStudyDate = now;
        }
    } else {
        // First ever activity
        user.streak = 1;
        user.lastStudyDate = now;
    }
};

module.exports = {
    checkStreakDecay,
    updateStreak
};

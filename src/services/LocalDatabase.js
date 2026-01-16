import AsyncStorage from '@react-native-async-storage/async-storage';
import { OFFLINE_PLANS, OFFLINE_EXAMS } from '../data/offlineData';
import { IT_SKILLS, getAllSkills } from '../data/skills';

class LocalDatabaseService {
    constructor() {
        this.completedDays = new Set(); // In-memory cache
        this.actionQueue = []; // Actions waiting to sync to MongoDB
        this.cachedExams = {}; // New: Cache for AI-generated exams
        this.init(); // Load from storage on startup
    }

    async init() {
        try {
            // Load Progress
            const storedData = await AsyncStorage.getItem('offline_progress');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                if (Array.isArray(parsed)) {
                    this.completedDays = new Set(parsed);
                    console.log('LocalDB: Loaded progress', this.completedDays.size);
                }
            }

            // Load Sync Queue
            const storedQueue = await AsyncStorage.getItem('offline_queue');
            if (storedQueue) {
                this.actionQueue = JSON.parse(storedQueue);
                if (this.actionQueue.length > 0) {
                    console.log(`LocalDB: Loaded ${this.actionQueue.length} pending actions to sync.`);
                }
            }

            // Load Cached AI Exams
            const storedExams = await AsyncStorage.getItem('cached_exams');
            if (storedExams) {
                this.cachedExams = JSON.parse(storedExams);
                console.log(`LocalDB: Loaded cached exams for ${Object.keys(this.cachedExams).length} skills.`);
            }
        } catch (e) {
            console.error('LocalDB: Failed to load data', e);
        }
    }

    /**
     * Saves an AI-generated exam to local storage for future offline use.
     */
    async saveAIExam(skillId, examData) {
        try {
            if (!examData || !examData.questions || examData.questions.length === 0) return;

            // Normalize skill ID
            const key = skillId.toLowerCase();
            this.cachedExams[key] = {
                skill: skillId,
                questions: examData.questions,
                timestamp: Date.now()
            };

            await AsyncStorage.setItem('cached_exams', JSON.stringify(this.cachedExams));
            console.log(`LocalDB: Cached AI Exam for ${skillId}`);
        } catch (e) {
            console.error('LocalDB: Failed to cache exam', e);
        }
    }

    /**
     * Queues an action to be synced to MongoDB when online.
     */
    async queueAction(action) {
        this.actionQueue.push(action);
        await this.persistQueue();
    }

    async persistQueue() {
        try {
            await AsyncStorage.setItem('offline_queue', JSON.stringify(this.actionQueue));
        } catch (e) {
            console.error('LocalDB: Failed to save queue', e);
        }
    }

    getPendingActions() {
        return [...this.actionQueue];
    }

    async clearQueue() {
        this.actionQueue = [];
        await this.persistQueue();
        console.log("LocalDB: Sync Queue Cleared.");
    }

    /**
     * Marks a day as completed in the local store and queues it for sync.
     */
    async markDayComplete(dayNumber) {
        if (this.completedDays.has(dayNumber)) return; // Already done

        this.completedDays.add(dayNumber);

        // 1. Save Local Progress
        try {
            await AsyncStorage.setItem('offline_progress', JSON.stringify([...this.completedDays]));
            console.log(`LocalDB: Persisted Day ${dayNumber} as complete.`);
        } catch (e) {
            console.error('LocalDB: Failed to save progress', e);
        }

        // 2. Queue for Cloud Sync
        await this.queueAction({
            type: 'COMPLETE_DAY',
            payload: { dayNumber },
            timestamp: Date.now()
        });
    }

    /**
     * Unified Access to Skills (Proxy for skills.js)
     */
    getAllSkills() {
        return getAllSkills();
    }

    getSkillCategories() {
        return IT_SKILLS;
    }

    /**
     * Fuzzy search to find the best matching study plan for a given topic/skill.
     * @param {string} topic - The skill or topic name (e.g., "Python", "React Native").
     * @returns {object} The matching study plan or a default one.
     */
    getStudyPlan(topic) {
        let plan = OFFLINE_PLANS['default'];

        if (topic) {
            const normalizedTopic = topic.toLowerCase();
            const exactMatch = Object.keys(OFFLINE_PLANS).find(key => key.toLowerCase() === normalizedTopic);

            if (exactMatch) {
                plan = OFFLINE_PLANS[exactMatch];
            } else {
                const keywords = Object.keys(OFFLINE_PLANS);
                const foundKey = keywords.find(k => normalizedTopic.includes(k.toLowerCase()));
                if (foundKey) {
                    plan = OFFLINE_PLANS[foundKey];
                } else {
                    plan = this.generateGenericFallback(topic);
                }
            }
        }

        // Inject Completion Status
        const updatedCalendar = plan.calendar.map(day => ({
            ...day,
            isCompleted: this.completedDays.has(day.day) || day.isCompleted
        }));

        // Calculate progress
        const completedCount = updatedCalendar.filter(d => d.isCompleted).length;

        return {
            ...plan,
            calendar: updatedCalendar,
            currentDay: completedCount + 1, // Advance current day found on progress
            completedDays: completedCount
        };
    }

    /**
     * Get MCQs for a specific skill.
     * @param {string} skillId - The skill ID or name.
     * @param {number} count - Number of questions to return.
     * @returns {object} Exam data object.
     */
    getQuiz(skillId, count = 10) {
        const normalizedId = skillId.toLowerCase();

        // 1. Check Cache (AI Generated) - Best quality
        if (this.cachedExams[normalizedId]) {
            const cachedData = this.cachedExams[normalizedId];

            // Validate Cache Quality & Correctness
            if (cachedData && cachedData.questions && cachedData.questions.length > 0) {
                const firstQuestion = cachedData.questions[0].question || "";

                // DETECT CACHE POISONING: If cache has "JavaScript Practice" but we want "Java" (or something else)
                const isJsFallback = firstQuestion.includes("JavaScript Practice Question");
                const isActuallyJsAttempt = normalizedId.includes("javascript") || normalizedId.includes("js") || normalizedId.includes("react") || normalizedId.includes("node");

                if (isJsFallback && !isActuallyJsAttempt) {
                    console.log(`LocalDB: ⚠️ Found POISONED CACHE for ${skillId} (Cached JS, Wanted ${skillId}). INVALIDATING.`);
                    delete this.cachedExams[normalizedId];
                    AsyncStorage.setItem('cached_exams', JSON.stringify(this.cachedExams)).catch(e => console.error(e));
                }
                // Check if questions are distinct (sanity check)
                else {
                    const uniqueIds = new Set(cachedData.questions.map(q => q.id || q.question));
                    if (uniqueIds.size >= Math.min(5, cachedData.questions.length)) {
                        console.log(`LocalDB: Found valid cached AI exam for ${skillId}`);

                        // Shuffle
                        const shuffled = [...cachedData.questions].sort(() => 0.5 - Math.random());
                        return {
                            skill: cachedData.skill || skillId,
                            duration: cachedData.duration || 600,
                            questions: shuffled.slice(0, count)
                        };
                    } else {
                        console.log(`LocalDB: Cached exam for ${skillId} has duplicates/low quality. Discarding.`);
                        delete this.cachedExams[normalizedId];
                        AsyncStorage.setItem('cached_exams', JSON.stringify(this.cachedExams)).catch(e => console.error(e));
                    }
                }
            }
        }

        // 2. Fallback to Static Offline Data
        let examData = OFFLINE_EXAMS[skillId] ||
            Object.values(OFFLINE_EXAMS).find(e => e.skill.toLowerCase() === normalizedId);

        // 3. Smart Keyword Mapping (Fix for sub-topics like "Arrays" -> "Data Structures")
        if (!examData) {
            const KEYWORD_MAP = {
                'array': 'Data Structures',
                'list': 'Data Structures',
                'stack': 'Data Structures',
                'queue': 'Data Structures',
                'tree': 'Data Structures',
                'graph': 'Data Structures',
                'algorithm': 'Data Structures',
                'sorting': 'Data Structures',
                'java': 'Java',
                'spring': 'Java',
                'jvm': 'Java',
                'class': 'Java',
                'object': 'Java',
                'react': 'React',
                'native': 'React',
                'hook': 'React',
                'node': 'Node.js',
                'express': 'Node.js',
                'js': 'JavaScript',
                'web': 'JavaScript',
                'python': 'Python',
                'django': 'Python',
                'sql': 'SQL',
                'database': 'SQL',
                'query': 'SQL'
            };

            // Check if any keyword exists in the skillId
            const mappedKey = Object.keys(KEYWORD_MAP).find(keyword => normalizedId.includes(keyword));
            if (mappedKey) {
                const targetSkill = KEYWORD_MAP[mappedKey];
                console.log(`LocalDB: Smart Map '${skillId}' -> '${targetSkill}' (via '${mappedKey}')`);
                examData = OFFLINE_EXAMS[targetSkill];
            }
        }

        // 4. Fuzzy Match (Fallback for "Java Fundamentals" -> "Java")
        if (!examData) {
            const knownSkills = Object.keys(OFFLINE_EXAMS);
            const bestMatch = knownSkills.find(key => normalizedId.includes(key.toLowerCase()));
            if (bestMatch) {
                console.log(`LocalDB: Fuzzy matched '${skillId}' to '${bestMatch}'`);
                examData = OFFLINE_EXAMS[bestMatch];
            }
        }

        if (!examData) {
            // Fallback to default/JavaScript if unknown
            console.warn(`LocalDB: No match for '${skillId}', defaulting to JavaScript`);
            examData = OFFLINE_EXAMS['JavaScript'];
        }

        // Shuffle
        const shuffled = [...(examData.questions || [])].sort(() => 0.5 - Math.random());

        // Ensure we always return a valid object structure
        return {
            skill: examData.skill || skillId,
            duration: examData.duration || 600,
            questions: shuffled.slice(0, count)
        };
    }

    /**
     * Generates a generic plan on the fly if a specific hand-crafted one doesn't exist.
     * This ensures 100% coverage even if we missed a niche skill.
     */
    generateGenericFallback(topic) {
        return {
            title: `Mastering ${topic} (Offline Plan)`,
            totalDays: 30,
            currentDay: 1,
            freeResources: [
                { title: `${topic} Documentation`, type: "link", url: `https://www.google.com/search?q=${topic}+documentation` },
                { title: `${topic} Crash Course`, type: "video", url: `https://www.youtube.com/results?search_query=${topic}+course` }
            ],
            calendar: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                title: `Day ${i + 1}: ${topic} Fundamentals`,
                isCompleted: false,
                tasks: [
                    { id: `t_${topic}_${i}_1`, title: "Core Concepts", type: 'lesson', duration: '30m', description: `Read documentation about ${topic} core concepts.` },
                    { id: `t_${topic}_${i}_2`, title: "Practical Application", type: 'lesson', duration: '45m', description: `Build a small demo using ${topic}.` },
                    { id: `t_${topic}_${i}_3`, title: "Knowledge Check", type: 'test', duration: '15m', skill: topic }
                ]
            }))
        };
    }

    /**
     * Returns a list of all skills we have "Gold Standard" content for.
     */
    getSupportedTopics() {
        return Object.keys(OFFLINE_PLANS).filter(k => k !== 'default');
    }
}

export const LocalDatabase = new LocalDatabaseService();

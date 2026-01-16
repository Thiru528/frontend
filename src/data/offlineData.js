// Comprehensive Offline Data Store

// Helper to generate a generic structure if specific one is missing
const generateGenericPlan = (skillName) => ({
    title: `Mastering ${skillName} (Offline Plan)`,
    totalDays: 30,
    currentDay: 1,
    calendar: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        title: `Day ${i + 1}: ${skillName} Concepts`,
        isCompleted: false,
        tasks: [
            { id: `t_${skillName}_${i}_1`, title: `Learn Basics`, type: 'lesson', duration: '30m' },
            { id: `t_${skillName}_${i}_2`, title: `Practice Code`, type: 'lesson', duration: '45m' }
        ]
    }))
});

// --- CONTENT GENERATORS ---

const createDay = (dayNum, title, description, tasks) => ({
    day: dayNum,
    title,
    isCompleted: false,
    tasks: tasks.map((t, idx) => ({ ...t, id: `d${dayNum}_t${idx}`, completed: false }))
});

// --- HELPER WITH RESOURCES ---
const createPlan = (title, days, resources = []) => ({
    title,
    totalDays: days.length,
    currentDay: 1,
    freeResources: resources, // New: Free Resources Section
    calendar: days
});

// --- JAVA STUDY PLAN ---
const JAVA_PLAN = createPlan(
    "Java Full Stack & Backend Mastery",
    [
        createDay(1, "Why Java? & Setup", "Understanding JVM, JRE, JDK and setting up IntelliJ.", [
            { title: "Theory: Write Once Run Anywhere", type: "lesson", duration: "15m", description: "Learn how Java achieves platform independence." },
            { title: "Lab: Hello World & Variables", type: "lesson", duration: "30m", description: "Write your first Java program." }
        ]),
        createDay(2, "OOPs Basics: Classes & Objects", "The core of Java.", [
            { title: "Classes vs Objects", type: "lesson", duration: "20m", description: "Real world examples of blueprints and instances." },
            { title: "Constructors & 'this'", type: "lesson", duration: "30m", description: "Initializing objects correctly." }
        ]),
        createDay(3, "OOPs Pillars: Inheritance & Polymorphism", "Code reusability and flexibility.", [
            { title: "Extending Classes", type: "lesson", duration: "25m", description: "Using 'extends' and 'super'." },
            { title: "Method Overriding", type: "lesson", duration: "25m", description: "Runtime polymorphism explained." }
        ]),
        createDay(4, "OOPs Pillars: Encapsulation & Abstraction", "Security and design hiding.", [
            { title: "Access Modifiers", type: "lesson", duration: "20m", description: "private, protected, public." },
            { title: "Interfaces vs Abstract Classes", type: "lesson", duration: "30m", description: "When to use which?" }
        ]),
        createDay(5, "Java Collections Framework (DSA Start)", "Lists, Sets, and Maps.", [
            { title: "ArrayList vs LinkedList", type: "lesson", duration: "30m", description: "Memory layout and performance." },
            { title: "HashMap Internals", type: "lesson", duration: "30m", description: "How hashing works." }
        ]),
        createDay(6, "Exception Handling", "Handling errors gracefully.", [
            { title: "Try-Catch-Finally", type: "lesson", duration: "20m" },
            { title: "Custom Exceptions", type: "lesson", duration: "20m" }
        ]),
        createDay(7, "Multithreading & Concurrency", "Running tasks in parallel.", [
            { title: "Thread Lifecycle", type: "lesson", duration: "30m" },
            { title: "Synchronization", type: "lesson", duration: "30m", description: "Avoiding race conditions." }
        ]),
        // ... Middle days would range through Streams API, JDBC, Spring Boot ...
        createDay(28, "System Design: Scaling Java Apps", "Building for millions.", [
            { title: "Load Balancing", type: "lesson", duration: "45m" },
            { title: "Microservices Pattern", type: "lesson", duration: "45m" }
        ]),
        createDay(30, "Final Project: E-Commerce Backend", "Build a REST API.", [
            { title: "Design DB Schema", type: "project", duration: "60m" },
            { title: "Implement API Endpoints", type: "project", duration: "120m" }
        ])
    ],
    [
        { title: "Java Full Course (Telusko)", type: "video", url: "https://www.youtube.com/watch?v=8cm1x4bC610" },
        { title: "Oracle Java Docs", type: "link", url: "https://docs.oracle.com/en/java/" }
    ]
);

// --- REACT STUDY PLAN ---
const REACT_PLAN = createPlan(
    "Modern React with Hooks & Redux",
    [
        createDay(1, "Why React? & JSX", "Component based architecture.", [
            { title: "Virtual DOM vs Real DOM", type: "lesson", duration: "20m" },
            { title: "Writing JSX", type: "lesson", duration: "30m" }
        ]),
        createDay(2, "Components & Props", "Passing data down.", [
            { title: "Functional Components", type: "lesson", duration: "20m" },
            { title: "Prop Types and Defaults", type: "lesson", duration: "20m" }
        ]),
        createDay(3, "State Management: useState", "Handling local data.", [
            { title: "The useState Hook", type: "lesson", duration: "30m" },
            { title: "Updating Complex State", type: "lesson", duration: "30m" }
        ]),
        createDay(4, "Side Effects: useEffect", "Lifecycle methods replacement.", [
            { title: "Dependency Arrays", type: "lesson", duration: "30m" },
            { title: "Cleanup Functions", type: "lesson", duration: "20m" }
        ]),
        createDay(10, "Global State: Redux Toolkit", "Managing App State.", [
            { title: "Slices and Stores", type: "lesson", duration: "45m" },
            { title: "Async Thunks", type: "lesson", duration: "45m" }
        ]),
        createDay(20, "Capstone: Social Media Dashboard", "Full application.", [
            { title: "Setup Project", type: "project", duration: "30m" },
            { title: "Build Features", type: "project", duration: "150m" }
        ])
    ],
    [
        { title: "React Official Docs", type: "link", url: "https://react.dev/" },
        { title: "Redux Toolkit Tutorial", type: "video", url: "https://redux-toolkit.js.org/" }
    ]
);

// --- C++ DSA PLAN ---
const CPP_PLAN = createPlan(
    "C++ & Data Structures Mastery",
    [
        createDay(1, "C++ Basics & Memory", "Pointers and References.", [
            { title: "Pointers vs References", type: "lesson", duration: "40m" },
            { title: "Memory Management (new/delete)", type: "lesson", duration: "40m" }
        ]),
        createDay(2, "STL Containers", "Vectors, Maps, Sets.", [
            { title: "Vector Implementation", type: "lesson", duration: "30m" },
            { title: "Map vs Unordered Map", type: "lesson", duration: "30m" }
        ]),
        createDay(5, "DSA: Arrays & Strings", "Core algorithmic problems.", [
            { title: "Two Pointer Technique", type: "lesson", duration: "45m" },
            { title: "Sliding Window", type: "lesson", duration: "45m" }
        ]),
        createDay(10, "DSA: Linked Lists", "Node based structures.", [
            { title: "Reversing a List", type: "lesson", duration: "40m" },
            { title: "Detecting Cycles", type: "lesson", duration: "40m" }
        ]),
        createDay(15, "DSA: Trees & Graphs", "Hierarchical data.", [
            { title: "BFS & DFS Traversals", type: "lesson", duration: "60m" },
            { title: "Dijkstra's Algorithm", type: "lesson", duration: "60m" }
        ]),
        createDay(30, "System Design: HLD Basics", "High Level Design.", [
            { title: "Client-Server Architecture", type: "lesson", duration: "45m" },
            { title: "Caching Strategies", type: "lesson", duration: "45m" }
        ])
    ],
    [
        { title: "GeeksForGeeks DSA", type: "link", url: "https://www.geeksforgeeks.org/data-structures/" },
        { title: "Striver's DSA Sheet", type: "link", url: "https://takeuforward.org/" }
    ]
);

// --- BUSINESS / PM PLAN ---
const PM_PLAN = createPlan(
    "Product Management & Business Strategy",
    [
        createDay(1, "Role of a PM", "What does a Product Manager do?", [
            { title: "Product vs Project vs Program", type: "lesson", duration: "30m" },
            { title: "The Product Lifecycle", type: "lesson", duration: "30m" }
        ]),
        createDay(5, "Market Research", "Understanding users.", [
            { title: "User Personas", type: "lesson", duration: "45m" },
            { title: "Competitor Analysis", type: "lesson", duration: "45m" }
        ]),
        createDay(10, "Agile & Scrum", "Development methodologies.", [
            { title: "Writing User Stories", type: "lesson", duration: "40m" },
            { title: "Running Sprint Planning", type: "lesson", duration: "40m" }
        ]),
        createDay(20, "Capstone: Product Launch", "Launch a hypothetical feature.", [
            { title: "Create PRD (Product Reqt Doc)", type: "project", duration: "60m" },
            { title: "Go-to-Market Strategy", type: "project", duration: "60m" }
        ])
    ],
    [
        { title: "Dhaval's PM Course", type: "video", url: "https://www.youtube.com/" },
        { title: "Atlassian Agile Guide", type: "link", url: "https://www.atlassian.com/agile" }
    ]
);

// --- DEVOPS PLAN ---
const DEVOPS_PLAN = createPlan(
    "DevOps: Docker, Kubernetes & CI/CD",
    [
        createDay(1, "Introduction to DevOps", "Culture and Tools.", [
            { title: "DevOps vs Traditional IT", type: "lesson", duration: "30m" },
            { title: "The CI/CD Pipeline Concept", type: "lesson", duration: "30m" }
        ]),
        createDay(3, "Docker Basics", "Containerization.", [
            { title: "Writing a Dockerfile", type: "lesson", duration: "45m" },
            { title: "Docker Compose", type: "lesson", duration: "45m" },
            { title: "Lab: Containerize a Node App", type: "project", duration: "45m" }
        ]),
        createDay(7, "Kubernetes (K8s)", "Orchestration.", [
            { title: "Pods and Services", type: "lesson", duration: "45m" },
            { title: "Deployments", type: "lesson", duration: "45m" }
        ]),
        createDay(15, "CI/CD with GitHub Actions", "Automation.", [
            { title: "Creating Workflows", type: "lesson", duration: "45m" },
            { title: "Auto-deploy to AWS", type: "project", duration: "60m" }
        ])
    ],
    [
        { title: "Docker Docs", type: "link", url: "https://docs.docker.com/" },
        { title: "K8s by Nana", type: "video", url: "https://www.youtube.com/" }
    ]
);


// --- PYTHON DATA SCIENCE PLAN ---
const PYTHON_PLAN = createPlan(
    "Python for Data Science & AI",
    [
        createDay(1, "Python Basics", "Variables, Types, Loops.", [
            { title: "Python Syntax", type: "lesson", duration: "30m" },
            { title: "Lists and Dictionaries", type: "lesson", duration: "30m" }
        ]),
        createDay(3, "NumPy & Pandas", "Data Manipulation.", [
            { title: "NumPy Arrays", type: "lesson", duration: "45m" },
            { title: "Pandas DataFrames", type: "lesson", duration: "45m" }
        ]),
        createDay(10, "Machine Learning with Scikit-Learn", "Algos.", [
            { title: "Linear Regression", type: "lesson", duration: "60m" },
            { title: "Classification Models", type: "lesson", duration: "60m" }
        ]),
        createDay(30, "Capstone: Prediction Model", "Real world AI.", [
            { title: "Kaggle Dataset Analysis", type: "project", duration: "60m" },
            { title: "Train & Deploy Model", type: "project", duration: "120m" }
        ])
    ],
    [
        { title: "CS50 Python", type: "video", url: "https://cs50.harvard.edu/python/" },
        { title: "Kaggle Learn", type: "link", url: "https://www.kaggle.com/learn" }
    ]
);

// --- SQL & DATABASE PLAN ---
const SQL_PLAN = createPlan(
    "SQL Database Design & Management",
    [
        createDay(1, "Intro to Databases", "Relational Models.", [
            { title: "RDBMS Concepts", type: "lesson", duration: "30m" },
            { title: "Install PostgreSQL", type: "lesson", duration: "30m" }
        ]),
        createDay(3, "Basic Queries", "CRUD Operations.", [
            { title: "SELECT, INSERT, UPDATE, DELETE", type: "lesson", duration: "45m" },
            { title: "WHERE Clauses and Operators", type: "lesson", duration: "45m" }
        ]),
        createDay(7, "Advanced SQL", "Joins and Aggregation.", [
            { title: "Inner vs Outer Joins", type: "lesson", duration: "45m" },
            { title: "GROUP BY and HAVING", type: "lesson", duration: "45m" }
        ]),
        createDay(20, "Normalization & Performance", "Design best practices.", [
            { title: "1NF, 2NF, 3NF", type: "lesson", duration: "45m" },
            { title: "Indexing Strategies", type: "lesson", duration: "45m" }
        ])
    ],
    [
        { title: "SQLZOO", type: "link", url: "https://sqlzoo.net/" },
        { title: "PostgreSQL Docs", type: "link", url: "https://www.postgresql.org/docs/" }
    ]
);

// --- DESIGN (UI/UX) PLAN ---
const DESIGN_PLAN = createPlan(
    "UI/UX Design with Figma",
    [
        createDay(1, "Design Principles", "Color, Typography, Layout.", [
            { title: "Color Theory", type: "lesson", duration: "30m" },
            { title: "Typography Basics", type: "lesson", duration: "30m" }
        ]),
        createDay(5, "Figma Basics", "Tools and Constraints.", [
            { title: "Frames vs Groups", type: "lesson", duration: "45m" },
            { title: "Auto Layout Mastery", type: "lesson", duration: "45m" }
        ]),
        createDay(15, "Prototyping", "Interactions.", [
            { title: "Smart Animate", type: "lesson", duration: "45m" },
            { title: "Component Sets", type: "lesson", duration: "45m" }
        ]),
        createDay(25, "Design System", "Scalability.", [
            { title: "Creating Tokens", type: "project", duration: "60m" },
            { title: "Publishing a Library", type: "project", duration: "60m" }
        ])
    ],
    [
        { title: "Figma YouTube", type: "video", url: "https://www.youtube.com/figma" },
        { title: "Google UX Course", type: "link", url: "https://grow.google/certificates/ux-design/" }
    ]
);

// --- LINUX & SYSTEM PLAN ---
const LINUX_PLAN = createPlan(
    "Linux System Administration & Scripting",
    [
        createDay(1, "Linux Basics", "File System & Commands.", [
            { title: "File Hierarchy System (FHS)", type: "lesson", duration: "30m" },
            { title: "Basic Commands (ls, cd, cp, mv)", type: "lesson", duration: "30m" }
        ]),
        createDay(5, "Permissions & Users", "Security.", [
            { title: "chmod, chown, chgrp", type: "lesson", duration: "45m" },
            { title: "User Management (useradd, usermod)", type: "lesson", duration: "45m" }
        ]),
        createDay(10, "Bash Scripting", "Automation.", [
            { title: "Variables and Loops in Bash", type: "lesson", duration: "45m" },
            { title: "Cron Jobs", type: "lesson", duration: "30m" }
        ]),
        createDay(20, "Server Management", "Processes and Networking.", [
            { title: "Systemd and Services", type: "lesson", duration: "60m" },
            { title: "SSH & Firewalls (UFW)", type: "lesson", duration: "60m" }
        ])
    ],
    [
        { title: "Linux Journey", type: "link", url: "https://linuxjourney.com/" },
        { title: "OverTheWire Wargames", type: "link", url: "https://overthewire.org/" }
    ]
);

// --- MOBILE DEV (REACT NATIVE) PLAN ---
const MOBILE_PLAN = createPlan(
    "Cross-Platform Mobile Dev with React Native",
    [
        createDay(1, "Mobile Concepts", "Native vs Hybrid.", [
            { title: "How React Native Works (Bridge)", type: "lesson", duration: "30m" },
            { title: "Setting up Expo", type: "lesson", duration: "30m" }
        ]),
        createDay(3, "Core Components", "View, Text, Image.", [
            { title: "Flexbox for Mobile Layouts", type: "lesson", duration: "45m" },
            { title: "Styling with StyleSheet", type: "lesson", duration: "45m" }
        ]),
        createDay(10, "Navigation", "React Navigation.", [
            { title: "Stack vs Tab Navigation", type: "lesson", duration: "45m" },
            { title: "Passing Parameters", type: "lesson", duration: "30m" }
        ]),
        createDay(20, "Native Features", "Accessing Device APIs.", [
            { title: "Camera & Location", type: "project", duration: "60m" },
            { title: "Push Notifications", type: "project", duration: "60m" }
        ])
    ],
    [
        { title: "React Native Docs", type: "link", url: "https://reactnative.dev/" },
        { title: "Expo Documentation", type: "link", url: "https://docs.expo.dev/" }
    ]
);

// --- WEB FUNDAMENTALS PLAN ---
const WEB_PLAN = createPlan(
    "Web Development Fundamentals (HTML/CSS)",
    [
        createDay(1, "HTML5 Semantic Structure", "Building the skeleton.", [
            { title: "Semantic Tags", type: "lesson", duration: "30m" },
            { title: "Forms and Inputs", type: "lesson", duration: "30m" }
        ]),
        createDay(3, "CSS Styling", "Making it pretty.", [
            { title: "Box Model", type: "lesson", duration: "45m" },
            { title: "Flexbox & Grid", type: "lesson", duration: "60m" }
        ]),
        createDay(7, "Responsive Design", "Mobile first.", [
            { title: "Media Queries", type: "lesson", duration: "45m" },
            { title: "Viewport Units", type: "lesson", duration: "30m" }
        ]),
        createDay(15, "Final Project: Landing Page", "Build a portfolio.", [
            { title: "Wireframing", type: "project", duration: "60m" },
            { title: "Implementation", type: "project", duration: "120m" }
        ])
    ],
    [
        { title: "MDN Web Docs", type: "link", url: "https://developer.mozilla.org/" },
        { title: "FreeCodeCamp Web Design", type: "video", url: "https://www.youtube.com/" }
    ]
);

// --- NODE.JS BACKEND PLAN ---
const NODE_PLAN = createPlan(
    "Node.js Backend Development",
    [
        createDay(1, "Node Runtime", "JS on the server.", [
            { title: "Event Loop & Non-Blocking I/O", type: "lesson", duration: "45m" },
            { title: "Modules (CommonJS vs ES6)", type: "lesson", duration: "30m" }
        ]),
        createDay(3, "Express Framework", "Building APIs.", [
            { title: "Routing and Middleware", type: "lesson", duration: "60m" },
            { title: "Handling Requests/Responses", type: "lesson", duration: "45m" }
        ]),
        createDay(7, "Database Integration", "MongoDB/Mongoose.", [
            { title: "Connecting to DB", type: "lesson", duration: "45m" },
            { title: "CRUD Operations", type: "lesson", duration: "60m" }
        ]),
        createDay(20, "Authentication", "Security.", [
            { title: "JWT Implementation", type: "project", duration: "60m" },
            { title: "Password Hashing", type: "project", duration: "45m" }
        ])
    ],
    [
        { title: "Node.js Best Practices", type: "link", url: "https://github.com/goldbergyoni/nodebestpractices" },
        { title: "Express Docs", type: "link", url: "https://expressjs.com/" }
    ]
);

// --- CLOUD (AWS) PLAN ---
const CLOUD_PLAN = createPlan(
    "AWS Cloud Essentials",
    [
        createDay(1, "Cloud Concepts", "IaaS, PaaS, SaaS.", [
            { title: "AWS Global Infrastructure", type: "lesson", duration: "30m" },
            { title: "Free Tier Setup", type: "lesson", duration: "30m" }
        ]),
        createDay(3, "EC2 & IAM", "Compute and Security.", [
            { title: "Launching an Instance", type: "lesson", duration: "45m" },
            { title: "IAM Users and Roles", type: "lesson", duration: "45m" }
        ]),
        createDay(7, "S3 Storage", "Object Storage.", [
            { title: "Buckets and Objects", type: "lesson", duration: "30m" },
            { title: "Hosting a Static Website", type: "lesson", duration: "60m" }
        ]),
        createDay(15, "Serverless (Lambda)", "Function as a Service.", [
            { title: "Creating a Lambda", type: "project", duration: "45m" },
            { title: "API Gateway Trigger", type: "project", duration: "45m" }
        ])
    ],
    [
        { title: "AWS Documentation", type: "link", url: "https://aws.amazon.com/documentation/" },
        { title: "AWS Skill Builder", type: "link", url: "https://explore.skillbuilder.aws/" }
    ]
);

// --- EXPORTED PLANS ---
export const OFFLINE_PLANS = {
    'Java': JAVA_PLAN,
    'React': REACT_PLAN,
    'C++': CPP_PLAN,
    'Business': PM_PLAN,
    'Project Management': PM_PLAN,
    'DevOps': DEVOPS_PLAN,
    'Docker': DEVOPS_PLAN,
    'Python': PYTHON_PLAN,
    'Data Science': PYTHON_PLAN,
    'SQL': SQL_PLAN,
    'Database': SQL_PLAN,
    'Design': DESIGN_PLAN,
    'UI/UX': DESIGN_PLAN,
    'Figma': DESIGN_PLAN,
    'Linux': LINUX_PLAN,
    'System': LINUX_PLAN,
    'Mobile': MOBILE_PLAN,
    'React Native': MOBILE_PLAN,
    'Node': NODE_PLAN,
    'Node.js': NODE_PLAN,
    'Backend': NODE_PLAN,
    'Web': WEB_PLAN,
    'HTML': WEB_PLAN,
    'CSS': WEB_PLAN,
    'Cloud': CLOUD_PLAN,
    'AWS': CLOUD_PLAN,
    'default': JAVA_PLAN
};


// --- MCQs (Expanded) ---
export const OFFLINE_EXAMS = {
    'Java': {
        skill: 'Java',
        duration: 900,
        questions: [
            { id: 101, question: "Which memory area stores objects in Java?", options: ["Stack", "Heap", "Method Area", "Registers"], correctAnswer: 1 },
            { id: 102, question: "What is the size of int variable?", options: ["8 bit", "16 bit", "32 bit", "64 bit"], correctAnswer: 2 },
            { id: 103, question: "Which is not an access modifier?", options: ["protected", "void", "public", "private"], correctAnswer: 1 },
            { id: 104, question: "Which collection allows duplicate elements?", options: ["Set", "List", "Map", "None"], correctAnswer: 1 },
            { id: 105, question: "What does 'synchronized' keyword do?", options: ["Allows multiple threads", "Locks the method/block for one thread", "Speeds up execution", "Stops the thread"], correctAnswer: 1 },
            // Add more...
            { id: 106, question: "What is the default value of a boolean in Java?", options: ["true", "false", "null", "0"], correctAnswer: 1 },
            { id: 107, question: "Which exception is unchecked?", options: ["IOException", "SQLException", "RuntimeException", "ClassNotFoundException"], correctAnswer: 2 },
            { id: 108, question: "String in Java is?", options: ["Mutable", "Immutable", "Static", "Thread-safe"], correctAnswer: 1 },
            { id: 109, question: "What is the parent class of all classes?", options: ["Object", "Class", "System", "String"], correctAnswer: 0 },
            { id: 110, question: "Which keyword is used to inherit a class?", options: ["implement", "extends", "inherits", "this"], correctAnswer: 1 },
            { id: 111, question: "Interface methods are by default?", options: ["private", "protected", "public abstract", "final"], correctAnswer: 2 },
            { id: 112, question: "What is 'this' keyword?", options: ["Current class instance", "Parent class", "Static method", "Void type"], correctAnswer: 0 },
            { id: 113, question: "Can we overload main() method?", options: ["Yes", "No", "Runtime Error", "Compilation Error"], correctAnswer: 0 },
            { id: 114, question: "Which is not a primitive type?", options: ["int", "float", "String", "char"], correctAnswer: 2 },
            { id: 115, question: "ArrayList implements which interface?", options: ["Set", "List", "Queue", "Map"], correctAnswer: 1 },
            { id: 116, question: "What is the purpose of 'final' variable?", options: ["Constant value", "Mutable", "Static", "Global"], correctAnswer: 0 },
            { id: 117, question: "Which Map allows null keys?", options: ["TreeMap", "HashMap", "HashTable", "ConcurrentHashMap"], correctAnswer: 1 },
            { id: 118, question: "Execution starts from?", options: ["init()", "start()", "main()", "run()"], correctAnswer: 2 },
            { id: 119, question: "super() must be?", options: ["Last statement", "First statement in constructor", "Anywhere", "In loop"], correctAnswer: 1 },
            { id: 120, question: "Comparable interface contains?", options: ["compareTo()", "compare()", "equals()", "sort()"], correctAnswer: 0 }
        ]
    },
    'JavaScript': {
        skill: 'JavaScript',
        duration: 600,
        questions: [
            { id: 1, question: "typeof null?", options: ["object", "null", "undefined"], correctAnswer: 0 },
            { id: 2, question: "Which is not a JS data type?", options: ["Boolean", "Undefined", "Integer", "String"], correctAnswer: 2 },
            { id: 3, question: "What represents 'Value is not a number'?", options: ["NaN", "null", "undefined", "Error"], correctAnswer: 0 },
            // Fallback Placeholders
            ...Array.from({ length: 50 }, (_, i) => ({
                id: 100 + i,
                question: `(Offline Mode) JavaScript Practice Question #${i + 1}`,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: 0
            }))
        ]
    },
    'C++': {
        skill: 'C++',
        duration: 900,
        questions: [
            { id: 301, question: "What is a virtual function?", options: ["Static function", "Function overriding mechanism", "Friend function", "Inline function"], correctAnswer: 1 },
            { id: 302, question: "Difference between struct and class in C++?", options: ["None", "Default access modifier", "Memory allocation", "Inheritance type"], correctAnswer: 1 },
            // ...
            { id: 303, question: "What is a pointer?", options: ["Variable storing address", "Reference", "Array", "Class"], correctAnswer: 0 },
            { id: 304, question: "Correct way to alloc memory?", options: ["new", "malloc", "alloc", "create"], correctAnswer: 0 },
            { id: 305, question: "Destructor symbol?", options: ["~", "!", "#", "-"], correctAnswer: 0 },
            { id: 306, question: "Is C++ Object Oriented?", options: ["Yes", "No", "Partially", "Purely"], correctAnswer: 0 },
            { id: 307, question: "Complexity of Binary Search?", options: ["O(log n)", "O(n)", "O(1)", "O(n^2)"], correctAnswer: 0 }
        ]
    },
    'Business': {
        skill: 'Business',
        duration: 600,
        questions: [
            { id: 501, question: "What is SWOT analysis?", options: ["Strengths, Weaknesses, Opportunities, Threats", "Software, Web, Online, Tech", "Sales, Work, Order, Team", "None"], correctAnswer: 0 },
            { id: 502, question: "What is Agile?", options: ["A waterfall method", "Iterative development methodology", "A programming language", "Database type"], correctAnswer: 1 },
            ...Array.from({ length: 48 }, (_, i) => ({ id: 600 + i, question: `Business Case Study #${i + 1}`, options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 0 }))
        ]
    },
    'DevOps': {
        skill: 'DevOps',
        duration: 600,
        questions: [
            { id: 701, question: "What command builds a Docker image?", options: ["docker build", "docker create", "docker run", "docker compose"], correctAnswer: 0 },
            { id: 702, question: "What is a Pod in K8s?", options: ["A container", "Smallest deployable unit", "A server", "A database"], correctAnswer: 1 },
            { id: 703, question: "What is CI/CD?", options: ["Continuous Integration/Deployment", "Code Integration/Delivery", "Cloud Interface/Data", "None"], correctAnswer: 0 },
            { id: 704, question: "Default Docker file name?", options: ["Dockerfile", "dockerfile.txt", "Docker.config", "Containerfile"], correctAnswer: 0 },
            { id: 705, question: "Command to stop container?", options: ["docker stop", "docker kill", "docker end", "docker halt"], correctAnswer: 0 },
            { id: 706, question: "Which tool is for IaC?", options: ["Terraform", "Jenkins", "Git", "Jira"], correctAnswer: 0 },
            { id: 707, question: "What is Git?", options: ["Version Control System", "Cloud Provider", "IDE", "Language"], correctAnswer: 0 }
        ]
    },
    'Python': {
        skill: 'Python',
        duration: 900,
        questions: [
            { id: 901, question: "What is the output of print(2**3)?", options: ["6", "8", "9", "Error"], correctAnswer: 1 },
            { id: 902, question: "Which is a mutable type?", options: ["Tuple", "List", "String", "Int"], correctAnswer: 1 },
            { id: 903, question: "What does 'break' do?", options: ["Stops loop", "Skips iteration", "Exits program", "None"], correctAnswer: 0 },
            { id: 904, question: "How to define a function?", options: ["func x():", "def x():", "function x():", "void x():"], correctAnswer: 1 },
            { id: 905, question: "List vs Tuple?", options: ["List is mutable", "Tuple is mutable", "Same", "List is faster"], correctAnswer: 0 },
            { id: 906, question: "Output of 3 // 2?", options: ["1.5", "1", "2", "Error"], correctAnswer: 1 },
            { id: 907, question: "What is a decorator?", options: ["A design pattern", "Modify function behavior", "A comment", "A variable"], correctAnswer: 1 },
            { id: 908, question: "Is Python compiled?", options: ["Yes", "No (Interpreted)", "Both", "Reference counted"], correctAnswer: 2 },
            { id: 909, question: "Keyword for private in Class?", options: ["private", "__ (double underscore)", "hidden", "protected"], correctAnswer: 1 },
            { id: 910, question: "Which set operation merges two sets?", options: ["union()", "merge()", "add()", "join()"], correctAnswer: 0 }
        ]
    },
    'SQL': {
        skill: 'SQL',
        duration: 600,
        questions: [
            { id: 1101, question: "Which statement is used to fetch data?", options: ["GET", "SELECT", "FETCH", "RETRIEVE"], correctAnswer: 1 },
            { id: 1102, question: "What is the primary key?", options: ["Unique ID", "Foreign Key", "Index", "Null value"], correctAnswer: 0 },
            { id: 1103, question: "Command to delete table?", options: ["DROP", "DELETE", "REMOVE", "TRUNCATE"], correctAnswer: 0 },
            { id: 1104, question: "What adds a new row?", options: ["INSERT INTO", "ADD ROW", "UPDATE", "CREATE"], correctAnswer: 0 },
            { id: 1105, question: "COUNT(*) does what?", options: ["Counts all rows", "Counts nulls", "Counts distinct", "Errors"], correctAnswer: 0 },
            { id: 1106, question: "What is a Join?", options: ["Combine rows from 2+ tables", "Split table", "Delete table", "Index"], correctAnswer: 0 },
            { id: 1107, question: "Which key links tables?", options: ["Foreign Key", "Primary Key", "Super Key", "Candidate Key"], correctAnswer: 0 },
            { id: 1108, question: "SQL stands for?", options: ["Structured Query Language", "Simple Query List", "Standard Question Log", "System Queue Loop"], correctAnswer: 0 }
        ]
    },
    'Design': {
        skill: 'Design',
        duration: 600,
        questions: [
            { id: 1301, question: "What is 'White Space'?", options: ["Empty color", "Negative space", "Background", "Error"], correctAnswer: 1 },
            { id: 1302, question: "What represents hierarchy?", options: ["Size/Weight", "Color only", "Position only", "None"], correctAnswer: 0 },
            ...Array.from({ length: 48 }, (_, i) => ({ id: 1400 + i, question: `UX Principle #${i + 1}`, options: ["Good", "Bad", "Neutral", "N/A"], correctAnswer: 0 }))
        ]
    },
    'Linux': {
        skill: 'Linux',
        duration: 600,
        questions: [
            { id: 1501, question: "Command to list files?", options: ["ls", "list", "show", "dir"], correctAnswer: 0 },
            { id: 1502, question: "What is 'sudo'?", options: ["SuperUser Do", "Super Domain", "System User", "Safe Undo"], correctAnswer: 0 },
            ...Array.from({ length: 48 }, (_, i) => ({ id: 1600 + i, question: `Linux Cmd #${i + 1}`, options: ["Root", "User", "Bin", "Dev"], correctAnswer: 0 }))
        ]
    },
    'Mobile': {
        skill: 'Mobile',
        duration: 600,
        questions: [
            { id: 1701, question: "What connects JS to Native in RN?", options: ["The Bridge", "The Tunnel", "The Wire", "The Link"], correctAnswer: 0 },
            { id: 1702, question: "Is React Native compiled to native code?", options: ["No, it runs JS on a thread", "Yes, fully C++", "Yes, Java only", "No, it's a webview"], correctAnswer: 0 },
            ...Array.from({ length: 48 }, (_, i) => ({ id: 1800 + i, question: `Mobile Logic #${i + 1}`, options: ["iOS", "Android", "Both", "None"], correctAnswer: 2 }))
        ]
    },
    'Web': {
        skill: 'Web',
        duration: 600,
        questions: [
            { id: 1901, question: "Which tag is used for the largest heading?", options: ["<h6>", "<h1>", "<head>", "<header>"], correctAnswer: 1 },
            { id: 1902, question: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"], correctAnswer: 1 },
            ...Array.from({ length: 48 }, (_, i) => ({ id: 2000 + i, question: `Web Dev Question #${i + 1}`, options: ["A", "B", "C", "D"], correctAnswer: 0 }))
        ]
    },
    'Node': {
        skill: 'Node',
        duration: 600,
        questions: [
            { id: 2101, question: "Node.js is based on which engine?", options: ["SpiderMonkey", "V8", "Chakra", "JavaScriptCore"], correctAnswer: 1, explanation: "Node.js is built on Google Chrome's V8 JavaScript engine." },
            { id: 2102, question: "Which module is used for file system?", options: ["http", "fs", "path", "os"], correctAnswer: 1, explanation: "The 'fs' (File System) module provides API to interact with the file system." },
            { id: 2103, question: "What is the purpose of package.json?", options: ["Store metadata & dependencies", "Store database configs", "Store binary files", "Store user logs"], correctAnswer: 0, explanation: "package.json holds metadata relevant to the project and handles the project's dependencies." },
            { id: 2104, question: "Which function reads a file asynchronously?", options: ["fs.read()", "fs.readFile()", "fs.readFileSync()", "fs.open()"], correctAnswer: 1, explanation: "fs.readFile() reads the file concurrently (asynchronously), unlike readFileSync which blocks execution." },
            { id: 2105, question: "What is 'callback hell'?", options: ["Recursive functions", "Deeply nested callbacks", "Infinite loops", "Syntax errors"], correctAnswer: 1, explanation: "Callback hell occurs when multiple asynchronous operations are nested, making code hard to read." },
            { id: 2106, question: "How do you install a dependency?", options: ["npm install <package>", "node install <package>", "npm get <package>", "install <package>"], correctAnswer: 0, explanation: "Standard command is 'npm install' or 'npm i'." },
            { id: 2107, question: "What object handles HTTP requests?", options: ["require('http')", "require('net')", "require('url')", "require('fs')"], correctAnswer: 0, explanation: "The 'http' module allows Node.js to transfer data over the Hyper Text Transfer Protocol." },
            { id: 2108, question: "Default scope of a module in Node?", options: ["Global", "Local to module", "Public", "Private"], correctAnswer: 1, explanation: "In Node.js, variables are local to the module (file) by default, not global." },
            { id: 2109, question: "What is 'process.env' used for?", options: ["Environment variables", "File processing", "CPU monitoring", "Memory leaks"], correctAnswer: 0, explanation: "process.env is a global variable that lets you access environment configuration." },
            { id: 2110, question: "Which framework is popular for Node.js APIs?", options: ["Django", "Express", "Rails", "Spring"], correctAnswer: 1, explanation: "Express.js is the most popular, minimal web framework for Node." },
            { id: 2111, question: "EventEmittter is in which module?", options: ["events", "stream", "http", "buffer"], correctAnswer: 0, explanation: "The 'events' module includes the EventEmitter class." },
            { id: 2112, question: "What is 'npm'?", options: ["Node Package Manager", "Node Process Manager", "Node Program Maker", "New Project Model"], correctAnswer: 0, explanation: "npm is the default package manager for the JavaScript runtime environment Node.js." },
            { id: 2113, question: "How to export a module?", options: ["module.exports", "exports.module", "export default", "return module"], correctAnswer: 0, explanation: "In CommonJS (default Node), you use 'module.exports' to export functionality." },
            { id: 2114, question: "Which method joins paths correctly?", options: ["path.join()", "path.concat()", "path.add()", "path.combine()"], correctAnswer: 0, explanation: "path.join() normalizes the resulting path correctly for different operating systems." },
            { id: 2115, question: "What is a 'Stream'?", options: ["Data collection", "Continuous data flow", "A river", "A database"], correctAnswer: 1, explanation: "Streams are objects that let you read data from a source or write data to a destination in continuous fashion." },
            { id: 2116, question: "Node.js is single-threaded?", options: ["True", "False", "Only on Windows", "Only on Linux"], correctAnswer: 0, explanation: "True. It runs JS on a single thread using the Event Loop, though it uses C++ threads for I/O tasks." },
            { id: 2117, question: "Global object in Node.js?", options: ["window", "global", "document", "root"], correctAnswer: 1, explanation: "'global' is the top-level scope object in Node.js (unlike 'window' in browsers)." }
        ]
    },
    'Cloud': {
        skill: 'Cloud',
        duration: 600,
        questions: [
            { id: 2301, question: "Which AWS service is for compute?", options: ["S3", "EC2", "RDS", "VPC"], correctAnswer: 1 },
            { id: 2302, question: "What does S3 stand for?", options: ["Simple Storage Service", "Static Storage Server", "Safe Secure Storage", "Super Simple Server"], correctAnswer: 0 },
            ...Array.from({ length: 48 }, (_, i) => ({ id: 2400 + i, question: `AWS Question #${i + 1}`, options: ["A", "B", "C", "D"], correctAnswer: 0 }))
        ]
    },
    'React': {
        skill: 'React',
        duration: 900,
        questions: [
            { id: 2501, question: "What is the Virtual DOM?", options: ["A direct copy of HTML", "A lightweight copy of the Real DOM", "A new browser engine", "A separate CPU thread"], correctAnswer: 1, explanation: "React uses a Virtual DOM to optimize updates by only re-rendering what changed." },
            { id: 2502, question: "Which hook manages state?", options: ["useEffect", "useContext", "useState", "useReducer"], correctAnswer: 2, explanation: "useState is the primary hook for adding state variables to functional components." },
            { id: 2503, question: "What is JSX?", options: ["Java Syntax Extension", "JavaScript XML", "JSON XML", "Java Serialized XML"], correctAnswer: 1, explanation: "JSX stands for JavaScript XML, allowing you to write HTML-like structures in JS." },
            { id: 2504, question: "How do you pass data to child components?", options: ["State", "Props", "Context", "Redux"], correctAnswer: 1, explanation: "Props (properties) are the mechanism to pass read-only data from parent to child." },
            { id: 2505, question: "What does useEffect do?", options: ["Handles side effects", "Creates state", "Optimizes images", "Compiles code"], correctAnswer: 0, explanation: "useEffect performs side effects like data fetching or subscriptions in function components." },
            { id: 2506, question: "What prevents re-renders?", options: ["useMemo", "useEffect", "useState", "useRef"], correctAnswer: 0, explanation: "useMemo caches the result of a calculation to prevent expensive re-computations." },
            { id: 2507, question: "What is a 'key' prop used for?", options: ["Encryption", "Identifying list items", "Accessing API", "CSS styling"], correctAnswer: 1, explanation: "Keys help React identify which items have changed, added, or removed in lists." },
            { id: 2508, question: "Redux is used for?", options: ["Routing", "State Management", "Styling", "Testing"], correctAnswer: 1, explanation: "Redux is a predictable state container for JavaScript apps, widely used for global state." },
            { id: 2509, question: "Context API avoids what?", options: ["State", "Prop Drilling", "Hooks", "Components"], correctAnswer: 1, explanation: "Context provides a way to share values like theme without passing props through every level." },
            { id: 2510, question: "React components must return?", options: ["A single root element", "Multiple root elements", "Nothing", "A string only"], correctAnswer: 0, explanation: "Components must return a single root element (or a Fragment) to resolve the tree." }
        ]
    }
};

// Add Aliases for Robust Lookup (MUST be done after definition)
Object.assign(OFFLINE_EXAMS, {
    'Node.js': OFFLINE_EXAMS['Node'],
    'Backend': OFFLINE_EXAMS['Node'],
    'React Native': OFFLINE_EXAMS['Mobile'],
    'AWS': OFFLINE_EXAMS['Cloud'],
    'Introduction to Java': OFFLINE_EXAMS['Java'],
    'Core Java': OFFLINE_EXAMS['Java'],
    'Java Basics': OFFLINE_EXAMS['Java'],
    'Advanced Java': OFFLINE_EXAMS['Java'],
    'Docker': OFFLINE_EXAMS['DevOps'],
    'PostgreSQL': OFFLINE_EXAMS['SQL'],
    'UI/UX': OFFLINE_EXAMS['Design'],
    'Figma': OFFLINE_EXAMS['Design'],
    'HTML': OFFLINE_EXAMS['Web'],
    'CSS': OFFLINE_EXAMS['Web'],
    'Frontend': OFFLINE_EXAMS['React'] // Map generic Frontend to React for now
});

export const IT_SKILLS = {
    frontend: [
        { id: 'html', name: 'HTML5', icon: 'logo-html5', color: '#E34F26' },
        { id: 'css', name: 'CSS3', icon: 'logo-css3', color: '#1572B6' },
        { id: 'js', name: 'JavaScript', icon: 'logo-javascript', color: '#F7DF1E' },
        { id: 'ts', name: 'TypeScript', icon: 'code-slash-outline', color: '#3178C6' },
        { id: 'react', name: 'React', icon: 'logo-react', color: '#61DAFB' },
        { id: 'vue', name: 'Vue.js', icon: 'logo-vue', color: '#4FC08D' },
        { id: 'angular', name: 'Angular', icon: 'logo-angular', color: '#DD0031' },
        { id: 'next', name: 'Next.js', icon: 'server-outline', color: '#000000' },
        { id: 'tailwind', name: 'Tailwind CSS', icon: 'color-palette-outline', color: '#38B2AC' },
    ],
    backend: [
        { id: 'node', name: 'Node.js', icon: 'logo-nodejs', color: '#339933' },
        { id: 'python', name: 'Python', icon: 'logo-python', color: '#3776AB' },
        { id: 'java', name: 'Java', icon: 'cafe-outline', color: '#007396' },
        { id: 'csharp', name: 'C#', icon: 'code-slash-outline', color: '#239120' },
        { id: 'go', name: 'Go', icon: 'code-outline', color: '#00ADD8' },
        { id: 'rust', name: 'Rust', icon: 'settings-outline', color: '#000000' },
        { id: 'php', name: 'PHP', icon: 'server-outline', color: '#777BB4' },
    ],
    mobile: [
        { id: 'rn', name: 'React Native', icon: 'logo-react', color: '#61DAFB' },
        { id: 'flutter', name: 'Flutter', icon: 'phone-portrait-outline', color: '#02569B' },
        { id: 'ios', name: 'Swift/iOS', icon: 'logo-apple', color: '#000000' },
        { id: 'android', name: 'Kotlin/Android', icon: 'logo-android', color: '#3DDC84' },
    ],
    database: [
        { id: 'sql', name: 'SQL', icon: 'server-outline', color: '#4479A1' },
        { id: 'mongo', name: 'MongoDB', icon: 'leaf-outline', color: '#47A248' },
        { id: 'postgres', name: 'PostgreSQL', icon: 'server-outline', color: '#336791' },
        { id: 'redis', name: 'Redis', icon: 'layers-outline', color: '#DC382D' },
    ],
    devops: [
        { id: 'docker', name: 'Docker', icon: 'logo-docker', color: '#2496ED' },
        { id: 'k8s', name: 'Kubernetes', icon: 'boat-outline', color: '#326CE5' },
        { id: 'aws', name: 'AWS', icon: 'cloud-outline', color: '#FF9900' },
        { id: 'azure', name: 'Azure', icon: 'cloud-done-outline', color: '#007FFF' },
        { id: 'git', name: 'Git', icon: 'git-branch-outline', color: '#F05032' },
    ],
    system: [
        { id: 'c', name: 'C', icon: 'code-slash-outline', color: '#555555' },
        { id: 'cpp', name: 'C++', icon: 'code-slash-outline', color: '#00599C' },
        { id: 'linux', name: 'Linux', icon: 'logo-tux', color: '#FCC624' },
        { id: 'bash', name: 'Shell Scripting', icon: 'terminal-outline', color: '#4EAA25' },
    ],
    business: [
        { id: 'pm', name: 'Project Management', icon: 'briefcase-outline', color: '#FF5733' },
        { id: 'ba', name: 'Business Analysis', icon: 'stats-chart-outline', color: '#33FF57' },
        { id: 'marketing', name: 'Digital Marketing', icon: 'megaphone-outline', color: '#3357FF' },
        { id: 'finance', name: 'Financial Analysis', icon: 'cash-outline', color: '#FF33A1' },
        { id: 'sales', name: 'Sales Strategy', icon: 'people-outline', color: '#F4D03F' },
        { id: 'leadership', name: 'Leadership', icon: 'ribbon-outline', color: '#8E44AD' },
        { id: 'mba', name: 'MBA Fundamentals', icon: 'school-outline', color: '#2C3E50' },
    ],
    design: [
        { id: 'figma', name: 'Figma', icon: 'color-palette-outline', color: '#F24E1E' },
        { id: 'uiux', name: 'UI/UX Design', icon: 'shapes-outline', color: '#FF61F6' },
        { id: 'adobe', name: 'Adobe Suite', icon: 'image-outline', color: '#FF0000' },
    ],
    datascience: [
        { id: 'ml', name: 'Machine Learning', icon: 'analytics-outline', color: '#F7931E' },
        { id: 'ds', name: 'Data Science', icon: 'bar-chart-outline', color: '#2980B9' },
        { id: 'ai', name: 'Artificial Intelligence', icon: 'hardware-chip-outline', color: '#8E44AD' },
        { id: 'nlp', name: 'NLP', icon: 'chatbubbles-outline', color: '#16A085' },
    ],
    concepts: [
        { id: 'dsa', name: 'Data Structures & Algo', icon: 'git-merge-outline', color: '#FF4081' },
        { id: 'oop', name: 'OOP Principles', icon: 'construct-outline', color: '#7C4DFF' },
        { id: 'sysdesign', name: 'System Design', icon: 'server-outline', color: '#00BCD4' },
    ],
};

export const POPULAR_SKILLS = [
    ...IT_SKILLS.frontend.slice(0, 4),
    ...IT_SKILLS.backend.slice(0, 3),
    ...IT_SKILLS.mobile.slice(0, 2),
];

export const getAllSkills = () => {
    return Object.values(IT_SKILLS).flat();
};

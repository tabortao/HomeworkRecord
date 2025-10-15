// 模拟数据生成器

// 学科列表
const SUBJECTS = ['语文', '数学', '英语', '科学', '美术', '音乐'];

// 任务模板
const TASK_TEMPLATES = {
    '语文': [
        '朗读课文3遍',
        '背诵古诗《静夜思》',
        '写一篇日记',
        '完成生字练习',
        '阅读课外书30分钟'
    ],
    '数学': [
        '完成数学练习册第25页',
        '做10道加法题',
        '背诵乘法口诀表',
        '测量家里的家具长度',
        '计算购物清单的总金额'
    ],
    '英语': [
        '背诵10个英语单词',
        '朗读英语课文',
        '观看英语动画片',
        '练习英语字母书写',
        '听英语儿歌'
    ],
    '科学': [
        '观察植物生长情况',
        '做一个简单的小实验',
        '阅读科学书籍',
        '观察天气并记录',
        '收集树叶标本'
    ],
    '美术': [
        '画一幅秋天的图画',
        '练习水彩画',
        '制作手工卡片',
        '用彩色纸折一个小动物',
        '学习简单的简笔画'
    ],
    '音乐': [
        '练习唱歌',
        '听一首古典音乐',
        '学习认识音符',
        '打节奏练习',
        '跟着音乐跳舞'
    ]
};

// 生成随机任务描述
function generateTaskDescription(taskName, subject) {
    const descriptions = {
        '语文': [
            '注意发音准确，语调自然',
            '理解文章的主要内容',
            '记录好词好句',
            '思考作者想要表达的情感'
        ],
        '数学': [
            '仔细计算，避免粗心错误',
            '理解题目要求，认真作答',
            '检查计算过程',
            '尝试用不同方法解决问题'
        ],
        '英语': [
            '注意单词的发音和拼写',
            '尝试用英语简单表达',
            '培养英语听力能力',
            '积累英语词汇量'
        ],
        '科学': [
            '认真观察，做好记录',
            '提出自己的问题和猜想',
            '思考实验原理',
            '总结实验结果'
        ],
        '美术': [
            '发挥想象力，大胆创作',
            '注意色彩搭配',
            '认真完成每一个细节',
            '表达自己的想法和感受'
        ],
        '音乐': [
            '感受音乐的节奏和旋律',
            '理解音乐表达的情感',
            '跟着音乐节奏打拍子',
            '享受音乐带来的快乐'
        ]
    };
    
    const randomDesc = descriptions[subject][Math.floor(Math.random() * descriptions[subject].length)];
    return `${taskName}。${randomDesc}`;
}

// 生成模拟任务数据
function generateMockTasks() {
    const tasks = [];
    const today = new Date();
    
    // 生成过去7天的任务数据
    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() - daysAgo);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        // 每天生成3-6个任务
        const taskCount = Math.floor(Math.random() * 4) + 3;
        const subjectsUsed = new Set();
        
        for (let i = 0; i < taskCount; i++) {
            // 确保学科分布均匀
            let subject;
            do {
                subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
            } while (subjectsUsed.size > 3 && subjectsUsed.has(subject));
            
            subjectsUsed.add(subject);
            
            const taskTemplates = TASK_TEMPLATES[subject];
            const taskName = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
            const description = generateTaskDescription(taskName, subject);
            const plannedDuration = Math.floor(Math.random() * 30) + 15; // 15-45分钟
            const status = Math.random() > 0.3 ? 'completed' : 'pending'; // 70%的概率已完成
            const actualDuration = status === 'completed' ? Math.floor(plannedDuration * (0.8 + Math.random() * 0.4)) : 0;
            
            tasks.push({
                id: Date.now() + i + daysAgo * 100,
                name: taskName,
                subject: subject,
                description: description,
                plannedDuration: plannedDuration,
                actualDuration: actualDuration,
                status: status,
                date: dateStr,
                coins: Math.floor(Math.random() * 10) + 1 // 1-10个金币
            });
        }
    }
    
    return tasks;
}

// 导出模拟数据生成函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateMockTasks };
} else {
    // 浏览器环境下直接挂载到window
    window.generateMockTasks = generateMockTasks;
}
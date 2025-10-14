// 时间管理打卡小程序主脚本

// 数据模型
let tasks = [];
let currentDate = new Date();
let currentTaskId = null;
let currentChart = null;
let selectedDate = new Date().toISOString().split('T')[0]; // 当前选中的日期
let selectedSubject = '全部学科'; // 当前选中的学科

// 颜色主题配置
const SUBJECT_COLORS = {
    '语文': '#FF6B6B',
    '数学': '#4ECDC4',
    '英语': '#45B7D1',
    '科学': '#96CEB4',
    '美术': '#FFD166',
    '音乐': '#F9C80E'
};

// 番茄钟相关变量
let pomodoroTimer = null;
let pomodoroRemainingTime = 25 * 60; // 默认25分钟
let currentPomodoroTaskId = null;
let isPomodoroRunning = false;

// DOM元素引用
const taskListEl = document.getElementById('taskList');
const pomodoroModalEl = document.getElementById('pomodoroModal');
const pomodoroModalContentEl = document.getElementById('pomodoroModalContent');
const closePomodoroBtn = document.getElementById('closePomodoroBtn');
const pomodoroTaskNameEl = document.getElementById('pomodoroTaskName');
const pomodoroTimerEl = document.getElementById('pomodoroTimer');
const pomodoroDurationEl = document.getElementById('pomodoroDuration');
const startPomodoroBtn = document.getElementById('startPomodoroBtn');
const resetPomodoroBtn = document.getElementById('resetPomodoroBtn');
const completeTaskBtn = document.getElementById('completeTaskBtn');
const pomodoroMiniEl = document.getElementById('pomodoroMini');
const pomodoroMiniTimerEl = document.getElementById('pomodoroMiniTimer');
const taskModalEl = document.getElementById('taskModal');
const taskFormEl = document.getElementById('taskForm');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const modalTitleEl = document.getElementById('modalTitle');
const calendarDaysEl = document.getElementById('calendarDays');
const currentWeekEl = document.getElementById('currentWeek');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const todayBtn = document.getElementById('todayBtn');
const chartTypeSelector = document.getElementById('chartTypeSelector');
const filterAllBtn = document.getElementById('filterAllBtn');
const filterCompletedBtn = document.getElementById('filterCompletedBtn');
const filterPendingBtn = document.getElementById('filterPendingBtn');

// 页面相关元素
const calendarPageEl = document.getElementById('calendar-page');
const subjectsPageEl = document.getElementById('subjects-page');
const profilePageEl = document.getElementById('profile-page');
const navCalendarBtn = document.querySelector('[data-page="calendar"]');
const navSubjectsBtn = document.querySelector('[data-page="subjects"]');
const navProfileBtn = document.querySelector('[data-page="profile"]');
const subjectsListEl = document.getElementById('subjectList');
const subjectChartContainer = document.getElementById('subjectStatsChart');
const subjectChartEl = document.getElementById('subjectStatsChart');
let subjectChart = null;

// 初始化应用
function initApp() {
    // 加载本地存储数据
    loadData();
    
    // 初始化显示日历页面
    switchPage('calendar');
    
    // 添加事件监听器
    setupEventListeners();
}

// 加载本地存储数据
function loadData() {
    const savedTasks = localStorage.getItem('timeManagementTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        // 使用模拟数据生成器创建示例数据
        if (window.generateMockTasks) {
            tasks = window.generateMockTasks();
        } else {
            // 如果模拟数据生成器不可用，使用默认示例数据
            tasks = [
                {
                    id: Date.now() + 1,
                    name: '朗读课文3遍',
                    subject: '语文',
                    description: '朗读课文《秋天的雨》3遍，注意读音和语调',
                    plannedDuration: 30,
                    actualDuration: 25,
                    status: 'completed',
                    date: new Date().toISOString().split('T')[0]
                },
                {
                    id: Date.now() + 2,
                    name: '完成数学练习',
                    subject: '数学',
                    description: '完成课本第56页的练习题，包括应用题和计算题',
                    plannedDuration: 45,
                    actualDuration: 0,
                    status: 'pending',
                    date: new Date().toISOString().split('T')[0]
                },
                {
                    id: Date.now() + 3,
                    name: '背诵英语单词',
                    subject: '英语',
                    description: '背诵第7单元的15个单词，能够正确拼写',
                    plannedDuration: 20,
                    actualDuration: 22,
                    status: 'completed',
                    date: new Date().toISOString().split('T')[0]
                },
                {
                    id: Date.now() + 4,
                    name: '科学实验记录',
                    subject: '科学',
                    description: '记录今天做的种子发芽实验观察结果',
                    plannedDuration: 15,
                    actualDuration: 0,
                    status: 'pending',
                    date: new Date().toISOString().split('T')[0]
                }
            ];
        }
        saveData();
    }
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem('timeManagementTasks', JSON.stringify(tasks));
}

// 设置事件监听器
function setupEventListeners() {
    // 添加任务按钮
    addTaskBtn.addEventListener('click', openAddTaskModal);
    
    // 关闭模态框按钮
    closeModalBtn.addEventListener('click', closeTaskModal);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    
    // 表单提交
    taskFormEl.addEventListener('submit', handleTaskFormSubmit);
    
    // 日历导航
    prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
    nextWeekBtn.addEventListener('click', () => navigateWeek(1));
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
        renderTaskList();
        updateStatistics();
    });
    
    // 图表类型切换
    chartTypeSelector.addEventListener('change', renderStatsChart);
    
    // 任务筛选
    filterAllBtn.addEventListener('click', () => {
        setActiveFilterButton(filterAllBtn);
        renderTaskList();
    });
    filterCompletedBtn.addEventListener('click', () => {
        setActiveFilterButton(filterCompletedBtn);
        renderTaskList('completed');
    });
    filterPendingBtn.addEventListener('click', () => {
        setActiveFilterButton(filterPendingBtn);
        renderTaskList('pending');
    });
    
    // 页面导航
    navCalendarBtn.addEventListener('click', () => switchPage('calendar'));
    navSubjectsBtn.addEventListener('click', () => switchPage('subjects'));
    navProfileBtn.addEventListener('click', () => switchPage('profile'));
    
    // 任务菜单点击事件
    document.addEventListener('click', (e) => {
        // 关闭所有任务菜单
        document.querySelectorAll('.task-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
        
        // 如果点击的是任务菜单按钮，显示对应的菜单
        const menuBtn = e.target.closest('.task-menu-btn');
        if (menuBtn) {
            e.stopPropagation();
            const menu = menuBtn.nextElementSibling;
            if (menu && menu.classList.contains('task-menu')) {
                menu.classList.toggle('hidden');
            }
        }
    });
    
    // 番茄钟相关事件监听器
    closePomodoroBtn.addEventListener('click', closePomodoroModal);
    startPomodoroBtn.addEventListener('click', startPomodoroTimer);
    resetPomodoroBtn.addEventListener('click', resetPomodoroTimer);
    completeTaskBtn.addEventListener('click', completeTaskFromPomodoro);
    
    // 点击番茄钟小球恢复全屏
    pomodoroMiniEl.addEventListener('click', () => {
        pomodoroModalEl.classList.remove('hidden');
        pomodoroMiniEl.classList.add('hidden');
    });
}

// 打开添加任务模态框
function openAddTaskModal() {
    currentTaskId = null;
    modalTitleEl.textContent = '添加新任务';
    taskFormEl.reset();
    taskModalEl.classList.remove('hidden');
    document.getElementById('taskName').focus();
}

// 打开编辑任务模态框
function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentTaskId = taskId;
    modalTitleEl.textContent = '编辑任务';
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskSubject').value = task.subject;
    document.getElementById('taskDuration').value = task.plannedDuration;
    document.getElementById('taskDescription').value = task.description;
    
    if (task.status === 'completed') {
        document.querySelector('input[name="taskStatus"][value="completed"]').checked = true;
    } else {
        document.querySelector('input[name="taskStatus"][value="pending"]').checked = true;
    }
    
    taskModalEl.classList.remove('hidden');
}

// 关闭任务模态框
function closeTaskModal() {
    taskModalEl.classList.add('hidden');
    currentTaskId = null;
}

// 页面切换函数
function switchPage(pageName) {
    // 隐藏所有页面
    calendarPageEl.classList.add('hidden');
    subjectsPageEl.classList.add('hidden');
    profilePageEl.classList.add('hidden');
    
    // 移除所有导航按钮的活动状态
    navCalendarBtn.classList.remove('active');
    navSubjectsBtn.classList.remove('active');
    navProfileBtn.classList.remove('active');
    
    // 显示选中的页面和激活对应的导航按钮
    if (pageName === 'calendar') {
        calendarPageEl.classList.remove('hidden');
        navCalendarBtn.classList.add('active');
        
        // 重新渲染日历页面的内容
        renderCalendar();
        renderTaskList();
        renderStatsChart();
        updateStatistics();
    } else if (pageName === 'subjects') {
        subjectsPageEl.classList.remove('hidden');
        navSubjectsBtn.classList.add('active');
        
        // 渲染学科页面内容
        renderSubjectList();
        renderSubjectStatsChart();
    } else if (pageName === 'profile') {
        profilePageEl.classList.remove('hidden');
        navProfileBtn.classList.add('active');
        // 这里可以添加个人资料页面的渲染逻辑
    }
}

// 渲染学科列表
function renderSubjectList() {
    subjectsListEl.innerHTML = '';
    
    // 获取所有学科
    const allSubjects = Object.keys(SUBJECT_COLORS);
    
    allSubjects.forEach(subject => {
        // 计算该学科的统计数据
        const subjectTasks = tasks.filter(task => task.subject === subject);
        const completedTasks = subjectTasks.filter(task => task.status === 'completed');
        const totalDuration = subjectTasks.reduce((sum, task) => sum + (task.actualDuration || task.plannedDuration), 0);
        const completionRate = subjectTasks.length > 0 ? Math.round((completedTasks.length / subjectTasks.length) * 100) : 0;
        
        const subjectCard = document.createElement('div');
        subjectCard.className = 'bg-white rounded-xl shadow-card p-5 card-hover';
        subjectCard.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                    <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${SUBJECT_COLORS[subject]}"></div>
                    <h3 class="font-semibold text-lg">${subject}</h3>
                </div>
                <button class="text-primary hover:text-primary-dark transition-colors" onclick="openAddTaskModalWithSubject('${subject}')">
                    <i class="fa fa-plus-circle mr-1"></i> 添加任务
                </button>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-textSecondary">任务总数</p>
                    <p class="text-xl font-bold">${subjectTasks.length}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-textSecondary">完成率</p>
                    <p class="text-xl font-bold ${completionRate === 100 ? 'text-green-500' : ''}">${completionRate}%</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-textSecondary">学习时长</p>
                    <p class="text-xl font-bold">${formatDuration(totalDuration)}</p>
                </div>
            </div>
        `;
        
        subjectsListEl.appendChild(subjectCard);
    });
}

// 渲染学科统计图表
function renderSubjectStatsChart() {
    // 销毁现有图表
    if (subjectChart) {
        subjectChart.destroy();
    }
    
    const ctx = document.getElementById('subjectStatsChart').getContext('2d');
    
    // 计算各学科的总学习时长
    const subjectStats = {};
    tasks.forEach(task => {
        if (!subjectStats[task.subject]) {
            subjectStats[task.subject] = 0;
        }
        subjectStats[task.subject] += task.actualDuration || task.plannedDuration;
    });
    
    const subjects = Object.keys(subjectStats);
    const durations = Object.values(subjectStats);
    const colors = subjects.map(subject => SUBJECT_COLORS[subject] || '#999');
    
    subjectChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: subjects,
            datasets: [{
                label: '学习时长 (分钟)',
                data: durations,
                backgroundColor: colors.map(color => color + '80'), // 添加透明度
                borderColor: colors,
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 打开添加任务模态框并预填学科
function openAddTaskModalWithSubject(subject) {
    currentTaskId = null;
    modalTitleEl.textContent = '添加新任务';
    taskFormEl.reset();
    document.getElementById('taskSubject').value = subject;
    taskModalEl.classList.remove('hidden');
    document.getElementById('taskName').focus();
}

// 处理任务表单提交
function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const taskName = document.getElementById('taskName').value.trim();
    const taskSubject = document.getElementById('taskSubject').value;
    const taskDuration = parseInt(document.getElementById('taskDuration').value) || 0;
    const taskDescription = document.getElementById('taskDescription').value.trim();
    const taskStatus = document.querySelector('input[name="taskStatus"]:checked').value;
    const taskDate = new Date().toISOString().split('T')[0];
    
    if (!taskName || taskDuration <= 0) {
        alert('请填写任务名称和有效时长');
        return;
    }
    
    if (currentTaskId) {
        // 编辑现有任务
        const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                name: taskName,
                subject: taskSubject,
                description: taskDescription,
                plannedDuration: taskDuration,
                status: taskStatus
            };
        }
    } else {
        // 添加新任务
        tasks.push({
            id: Date.now(),
            name: taskName,
            subject: taskSubject,
            description: taskDescription,
            plannedDuration: taskDuration,
            actualDuration: 0,
            status: taskStatus,
            date: taskDate
        });
    }
    
    saveData();
    renderTaskList();
    updateStatistics();
    closeTaskModal();
}

// 删除任务
function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveData();
        renderTaskList();
        updateStatistics();
    }
}

// 切换任务完成状态
function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        if (task.status === 'completed' && task.actualDuration === 0) {
            task.actualDuration = task.plannedDuration;
        }
        saveData();
        renderTaskList();
        updateStatistics();
    }
}

// 渲染任务列表
function renderTaskList(filter = 'all') {
    // 使用选中的日期，而不是默认的今天
    let filteredTasks = tasks.filter(task => task.date === selectedDate);
    
    // 根据筛选条件过滤任务
    if (filter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.status === 'completed');
    } else if (filter === 'pending') {
        filteredTasks = filteredTasks.filter(task => task.status === 'pending');
    }
    
    // 根据选中的学科过滤任务
    if (selectedSubject !== '全部学科') {
        filteredTasks = filteredTasks.filter(task => task.subject === selectedSubject);
    }
    
    // 按学科分组
    const tasksBySubject = filteredTasks.reduce((groups, task) => {
        const subject = task.subject;
        if (!groups[subject]) {
            groups[subject] = [];
        }
        groups[subject].push(task);
        return groups;
    }, {});
    
    taskListEl.innerHTML = '';
    
    if (Object.keys(tasksBySubject).length === 0) {
        taskListEl.innerHTML = `
            <div class="text-center py-8 bg-white rounded-xl shadow-card">
                <i class="fa fa-calendar-o text-4xl text-gray-300 mb-3"></i>
                <p class="text-textSecondary">今天没有任务哦，赶紧添加一些吧！</p>
            </div>
        `;
        return;
    }
    
    // 渲染每个学科的任务
    Object.entries(tasksBySubject).forEach(([subject, subjectTasks]) => {
        const subjectEl = document.createElement('div');
        subjectEl.className = 'mb-4';
        
        subjectEl.innerHTML = `
            <div class="flex items-center mb-2">
                <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${SUBJECT_COLORS[subject] || '#999'}"></div>
                <h3 class="font-semibold">${subject}</h3>
                <span class="ml-2 text-xs text-textSecondary">${subjectTasks.length}个任务</span>
            </div>
            <div class="space-y-2">
                ${subjectTasks.map(task => `
                    <div class="bg-white rounded-xl shadow-card p-4 card-hover">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center flex-1">
                                <input type="checkbox" class="w-5 h-5 rounded-full border-2 mr-3 accent-primary" ${task.status === 'completed' ? 'checked' : ''} onchange="toggleTaskStatus(${task.id})">
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-medium ${task.status === 'completed' ? 'line-through text-textSecondary' : 'text-textPrimary'}" title="${task.name}">
                                        ${task.name}
                                    </h4>
                                    <p class="text-xs text-textSecondary mt-1 line-clamp-1" title="${task.description}">${task.description}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-1 ml-2">
                                <span class="text-xs text-textSecondary whitespace-nowrap">
                                    ${formatDuration(task.plannedDuration)}${task.actualDuration > 0 ? ` / ${formatDuration(task.actualDuration)}` : ''}
                                </span>
                                <div class="relative">
                                    <button class="task-menu-btn p-1.5 rounded-full hover:bg-gray-100 transition-colors" data-task-id="${task.id}">
                                        <i class="fa fa-ellipsis-v text-textSecondary"></i>
                                    </button>
                                    <div class="task-menu absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg py-1 z-10 hidden">
                                        <button class="w-full text-left px-4 py-2 text-sm text-textPrimary hover:bg-gray-100 transition-colors" onclick="openEditTaskModal(${task.id})">
                                            <i class="fa fa-pencil mr-2"></i>编辑
                                        </button>
                                        <button class="w-full text-left px-4 py-2 text-sm text-amber-500 hover:bg-gray-100 transition-colors" onclick="openPomodoroModal(${task.id})">
                                            <i class="fa fa-tomato mr-2"></i>番茄钟
                                        </button>
                                        <button class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 transition-colors" onclick="deleteTask(${task.id})">
                                            <i class="fa fa-trash mr-2"></i>删除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        taskListEl.appendChild(subjectEl);
    });
}

// 渲染日历
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();
    
    // 获取当前周的第一天（周一）
    const currentDay = currentDate.getDay() || 7; // 将周日(0)转换为7
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(date - (currentDay - 1));
    
    // 确保firstDayOfWeek是周一
    if (firstDayOfWeek.getDay() !== 1) {
        // 如果不是周一，重新计算
        const diff = (firstDayOfWeek.getDay() === 0) ? 6 : firstDayOfWeek.getDay() - 1;
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - diff);
    }
    
    // 获取当前周的周数
    const weekNumber = getWeekNumber(firstDayOfWeek);
    currentWeekEl.textContent = `${year}年${month + 1}月第${weekNumber}周`;
    
    // 渲染7天日期
    calendarDaysEl.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDayOfWeek);
        day.setDate(firstDayOfWeek.getDate() + i);
        
        const dayDate = day.getDate();
        const dayMonth = day.getMonth();
        const isToday = day.getDate() === new Date().getDate() && 
                        day.getMonth() === new Date().getMonth() && 
                        day.getFullYear() === new Date().getFullYear();
        const isCurrentMonth = dayMonth === month;
        
        // 计算当天的任务数量
        const dayStr = day.toISOString().split('T')[0];
        const dayTasks = tasks.filter(task => task.date === dayStr);
        const completedTasks = dayTasks.filter(task => task.status === 'completed').length;
        
        const dayEl = document.createElement('div');
        dayEl.className = `
            flex flex-col items-center justify-center h-16 rounded-xl transition-colors relative cursor-pointer
            ${isToday ? 'bg-primary text-white' : 
              (dayStr === selectedDate ? 'bg-primary/10' : 
               isCurrentMonth ? 'hover:bg-gray-100' : 'text-gray-400')}
        `;        
        
        // 添加点击事件，切换到该日期的任务列表
        dayEl.addEventListener('click', () => {
            selectedDate = dayStr;
            renderTaskList();
            updateStatisticsForSelectedDate();
        });
        
        dayEl.innerHTML = `
            <span class="font-medium">${dayDate}</span>
            ${isToday ? '<span class="text-xs mt-1 bg-white/20 px-1.5 py-0.5 rounded-full">今</span>' : ''}
            ${dayTasks.length > 0 ? `
                <div class="absolute bottom-2 left-0 right-0 flex justify-center space-x-0.5">
                    ${Array(dayTasks.length).fill(0).map((_, index) => `
                        <span class="w-1.5 h-1.5 rounded-full ${index < completedTasks ? 'bg-green-500' : 'bg-gray-300'}"></span>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        calendarDaysEl.appendChild(dayEl);
    }
}

// 获取日期所在的周数
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

// 导航到上一周或下一周
function navigateWeek(direction) {
    currentDate.setDate(currentDate.getDate() + direction * 7);
    renderCalendar();
}

// 渲染统计图表
function renderStatsChart() {
    const ctx = document.getElementById('statsChart').getContext('2d');
    const chartType = chartTypeSelector.value;
    
    // 销毁现有图表
    if (currentChart) {
        currentChart.destroy();
    }
    
    // 获取本周的日期数据
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();
    const currentDay = currentDate.getDay() || 7;
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(date - (currentDay - 1));
    
    const weekDays = [];
    const weekLabels = [];
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDayOfWeek);
        day.setDate(firstDayOfWeek.getDate() + i);
        weekDays.push(day.toISOString().split('T')[0]);
        // 确保标签从周一到周日显示
        const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];
        weekLabels.push(weekDayLabels[i]);
    }
    
    if (chartType === 'time') {
        // 学习时长图表
        const studyTimes = weekDays.map(day => {
            const dayTasks = tasks.filter(task => task.date === day && task.status === 'completed');
            return dayTasks.reduce((total, task) => total + task.actualDuration, 0);
        });
        
        currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekLabels,
                datasets: [{
                    label: '学习时长 (分钟)',
                    data: studyTimes,
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } else if (chartType === 'completion') {
        // 完成率图表
        const completionRates = weekDays.map(day => {
            const dayTasks = tasks.filter(task => task.date === day);
            if (dayTasks.length === 0) return 0;
            const completedTasks = dayTasks.filter(task => task.status === 'completed').length;
            return Math.round((completedTasks / dayTasks.length) * 100);
        });
        
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weekLabels,
                datasets: [{
                    label: '完成率 (%)',
                    data: completionRates,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(76, 175, 80, 1)',
                    pointRadius: 4,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } else if (chartType === 'subjects') {
        // 学科分布图表
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(task => task.date === today);
        
        const subjects = {};
        todayTasks.forEach(task => {
            if (!subjects[task.subject]) {
                subjects[task.subject] = 0;
            }
            subjects[task.subject] += task.plannedDuration;
        });
        
        const subjectLabels = Object.keys(subjects);
        const subjectData = Object.values(subjects);
        const subjectColors = subjectLabels.map(subject => SUBJECT_COLORS[subject] || '#999');
        
        currentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: subjectLabels,
                datasets: [{
                    data: subjectData,
                    backgroundColor: subjectColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            boxWidth: 12
                        }
                    }
                }
            }
        });
    }
}

// 更新统计数据（根据当前选中的日期）
function updateStatistics() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => task.date === today);
    const completedTasks = todayTasks.filter(task => task.status === 'completed');
    
    // 计算学习时间和运动时间
    let studyTime = 0;
    let exerciseTime = 0;
    
    completedTasks.forEach(task => {
        const duration = task.actualDuration || task.plannedDuration;
        if (['语文', '数学', '英语', '科学'].includes(task.subject)) {
            studyTime += duration;
        } else {
            exerciseTime += duration;
        }
    });
    
    // 计算完成率
    const completionRate = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;
    
    // 更新UI
    document.getElementById('studyTime').textContent = formatDuration(studyTime);
    document.getElementById('exerciseTime').textContent = formatDuration(exerciseTime);
    document.getElementById('taskCount').textContent = todayTasks.length;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// 更新选中日期的统计数据
function updateStatisticsForSelectedDate() {
    const selectedDateTasks = tasks.filter(task => task.date === selectedDate);
    const completedTasks = selectedDateTasks.filter(task => task.status === 'completed');
    
    // 计算学习时间和运动时间
    let studyTime = 0;
    let exerciseTime = 0;
    
    completedTasks.forEach(task => {
        const duration = task.actualDuration || task.plannedDuration;
        if (['语文', '数学', '英语', '科学'].includes(task.subject)) {
            studyTime += duration;
        } else {
            exerciseTime += duration;
        }
    });
    
    // 计算完成率
    const completionRate = selectedDateTasks.length > 0 ? Math.round((completedTasks.length / selectedDateTasks.length) * 100) : 0;
    
    // 更新UI
    document.getElementById('studyTime').textContent = formatDuration(studyTime);
    document.getElementById('exerciseTime').textContent = formatDuration(exerciseTime);
    document.getElementById('taskCount').textContent = selectedDateTasks.length;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// 设置活动的学科筛选按钮样式
function setActiveSubjectButton(button) {
    const subjectButtons = document.querySelectorAll('.flex.overflow-x-auto button');
    subjectButtons.forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-white', 'text-textPrimary');
    });
    
    button.classList.remove('bg-white', 'text-textPrimary');
    button.classList.add('bg-primary', 'text-white');
}

// 添加学科筛选事件监听器
function setupSubjectFilterListeners() {
    const subjectButtons = document.querySelectorAll('.flex.overflow-x-auto button');
    subjectButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedSubject = button.textContent;
            setActiveSubjectButton(button);
            renderTaskList();
        });
    });
}

// 设置活动的筛选按钮样式
function setActiveFilterButton(button) {
    [filterAllBtn, filterCompletedBtn, filterPendingBtn].forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-white', 'text-textSecondary');
    });
    
    button.classList.remove('bg-white', 'text-textSecondary');
    button.classList.add('bg-primary', 'text-white');
}

// 格式化时长（分钟转小时:分钟）
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 荣誉系统相关代码

// 荣誉类型定义
const HONOR_TYPES = [
    { id: 'continuous-7', name: '连续打卡7天', icon: 'calendar-check-o', color: 'blue' },
    { id: 'continuous-30', name: '连续打卡30天', icon: 'calendar-check-o', color: 'indigo' },
    { id: 'study-master', name: '学习达人', icon: 'book', color: 'green' },
    { id: 'reading-star', name: '阅读之星', icon: 'book', color: 'emerald' },
    { id: 'exercise-master', name: '运动健将', icon: 'heartbeat', color: 'red' },
    { id: 'wisdom-star', name: '智慧之星', icon: 'lightbulb-o', color: 'amber' },
    { id: 'artistic-talent', name: '艺术小能手', icon: 'paint-brush', color: 'pink' },
    { id: 'math-wizard', name: '数学小天才', icon: 'calculator', color: 'purple' },
    { id: 'language-master', name: '语言大师', icon: 'language', color: 'indigo' },
    { id: 'early-bird', name: '早起鸟儿', icon: 'sun-o', color: 'yellow' },
    { id: 'night-owl', name: '夜猫子', icon: 'moon-o', color: 'slate' },
    { id: 'task-completion', name: '任务完成王', icon: 'check-square-o', color: 'green' },
    { id: 'perfect-week', name: '完美一周', icon: 'star', color: 'yellow' },
    { id: 'balanced-learner', name: '均衡学习者', icon: 'pie-chart', color: 'teal' },
    { id: 'perseverance', name: '坚持不懈', icon: 'bolt', color: 'orange' },
    { id: 'quick-finisher', name: '速战速决', icon: 'rocket', color: 'red' },
    { id: 'detail-oriented', name: '细心谨慎', icon: 'search', color: 'blue' },
    { id: 'creative-thinker', name: '创新思维', icon: 'puzzle-piece', color: 'purple' },
    { id: 'team-player', name: '团队合作', icon: 'users', color: 'green' },
    { id: 'goal-achiever', name: '目标达成', icon: 'trophy', color: 'gold' }
];

// 颜色映射
const HONOR_COLORS = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-500' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-500' },
    green: { bg: 'bg-green-100', text: 'text-green-500' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-500' },
    red: { bg: 'bg-red-100', text: 'text-red-500' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-500' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-500' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-500' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-500' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-500' },
    gold: { bg: 'bg-amber-100', text: 'text-amber-500' }
};

// 获取存储的荣誉数据
function getHonorData() {
    const savedHonors = localStorage.getItem('timeManagementHonors');
    if (savedHonors) {
        return JSON.parse(savedHonors);
    } else {
        // 返回默认的荣誉数据结构
        return {
            currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM格式
            earnedHonors: {} // 结构: { 'YYYY-MM': { 'honor-id': count } }
        };
    }
}

// 保存荣誉数据
function saveHonorData(honorData) {
    localStorage.setItem('timeManagementHonors', JSON.stringify(honorData));
}

// 检查并更新荣誉获取情况
function checkAndUpdateHonors() {
    const honorData = getHonorData();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // 确保当月的荣誉记录存在
    if (!honorData.earnedHonors[currentMonth]) {
        honorData.earnedHonors[currentMonth] = {};
    }
    
    // 模拟一些荣誉获取逻辑
    // 在实际应用中，这些应该根据用户的真实行为来判断
    
    // 检查连续打卡天数
    const today = new Date().toISOString().split('T')[0];
    let consecutiveDays = 0;
    
    // 简单模拟连续打卡7天的情况
    if (!honorData.earnedHonors[currentMonth]['continuous-7']) {
        consecutiveDays = 7; // 这里应该实际计算连续打卡天数
        if (consecutiveDays >= 7) {
            honorData.earnedHonors[currentMonth]['continuous-7'] = 1;
        }
    }
    
    // 模拟其他一些已获得的荣誉
    const earnedHonors = ['study-master', 'reading-star', 'wisdom-star'];
    earnedHonors.forEach(honorId => {
        if (!honorData.earnedHonors[currentMonth][honorId]) {
            honorData.earnedHonors[currentMonth][honorId] = 1;
        }
    });
    
    saveHonorData(honorData);
}

// 渲染荣誉墙
function renderHonorWall() {
    checkAndUpdateHonors();
    const honorData = getHonorData();
    const currentMonth = honorData.currentMonth;
    
    // 更新当前显示的月份
    const [year, month] = currentMonth.split('-');
    document.getElementById('currentHonorMonth').textContent = `${year}年${parseInt(month)}月`;
    
    // 准备已获得和未获得的荣誉
    const earnedHonors = honorData.earnedHonors[currentMonth] || {};
    const earnedHonorIds = Object.keys(earnedHonors);
    const unearnedHonors = HONOR_TYPES.filter(honor => !earnedHonorIds.includes(honor.id));
    const displayEarnedHonors = HONOR_TYPES.filter(honor => earnedHonorIds.includes(honor.id));
    
    // 渲染已获得的荣誉
    const earnedHonorsEl = document.getElementById('earnedHonors');
    earnedHonorsEl.innerHTML = '';
    
    displayEarnedHonors.forEach(honor => {
        const honorElement = document.createElement('div');
        const count = earnedHonors[honor.id] || 1;
        const colorClasses = HONOR_COLORS[honor.color] || HONOR_COLORS.blue;
        
        honorElement.className = 'bg-white rounded-xl shadow-card p-3 flex flex-col items-center justify-center';
        honorElement.innerHTML = `
            <div class="w-16 h-16 ${colorClasses.bg} rounded-full flex items-center justify-center mb-2">
                <i class="fa fa-${honor.icon} ${colorClasses.text} text-2xl"></i>
            </div>
            <p class="text-xs font-medium text-textPrimary text-center mb-1">${honor.name}</p>
            <p class="text-xs text-textSecondary text-center">获得 ${count} 次</p>
        `;
        
        earnedHonorsEl.appendChild(honorElement);
    });
    
    // 渲染未获得的荣誉
    const unearnedHonorsEl = document.getElementById('unearnedHonors');
    unearnedHonorsEl.innerHTML = '';
    
    unearnedHonors.forEach(honor => {
        const honorElement = document.createElement('div');
        
        honorElement.className = 'bg-white rounded-xl shadow-card p-3 flex flex-col items-center justify-center opacity-60';
        honorElement.innerHTML = `
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <i class="fa fa-${honor.icon} text-gray-400 text-2xl"></i>
            </div>
            <p class="text-xs font-medium text-textSecondary text-center">${honor.name}</p>
            <p class="text-xs text-textSecondary text-center">待解锁</p>
        `;
        
        unearnedHonorsEl.appendChild(honorElement);
    });
}

// 切换显示的月份
function changeHonorMonth(direction) {
    const honorData = getHonorData();
    const [year, month] = honorData.currentMonth.split('-').map(Number);
    
    let newMonth, newYear;
    if (direction === 'next') {
        newMonth = month + 1;
        newYear = year;
        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }
    } else {
        newMonth = month - 1;
        newYear = year;
        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }
    }
    
    honorData.currentMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    saveHonorData(honorData);
    renderHonorWall();
}

// 添加荣誉系统事件监听器
function setupHonorSystemListeners() {
    document.getElementById('prevHonorMonthBtn').addEventListener('click', () => changeHonorMonth('prev'));
    document.getElementById('nextHonorMonthBtn').addEventListener('click', () => changeHonorMonth('next'));
}

// 修改switchPage函数，添加个人中心页面的渲染逻辑
function enhancedSwitchPage(pageName) {
    // 隐藏所有页面
    calendarPageEl.classList.add('hidden');
    subjectsPageEl.classList.add('hidden');
    profilePageEl.classList.add('hidden');
    
    // 移除所有导航按钮的活动状态
    navCalendarBtn.classList.remove('active');
    navSubjectsBtn.classList.remove('active');
    navProfileBtn.classList.remove('active');
    
    // 显示选中的页面和激活对应的导航按钮
    if (pageName === 'calendar') {
        calendarPageEl.classList.remove('hidden');
        navCalendarBtn.classList.add('active');
        
        // 重新渲染日历页面的内容
        renderCalendar();
        renderTaskList();
        renderStatsChart();
        updateStatistics();
    } else if (pageName === 'subjects') {
        subjectsPageEl.classList.remove('hidden');
        navSubjectsBtn.classList.add('active');
        
        // 渲染学科页面内容
        renderSubjectList();
        renderSubjectStatsChart();
    } else if (pageName === 'profile') {
        profilePageEl.classList.remove('hidden');
        navProfileBtn.classList.add('active');
        
        // 渲染荣誉墙
        renderHonorWall();
    }
}

// 重命名原始函数并替换为增强版
window.switchPage = enhancedSwitchPage;

// 初始化荣誉系统
function initHonorSystem() {
    setupHonorSystemListeners();
}

// 修改initApp函数，添加荣誉系统初始化
function enhancedInitApp() {
    // 加载本地存储数据
    loadData();
    
    // 初始化荣誉系统
    initHonorSystem();
    
    // 初始化显示日历页面
    enhancedSwitchPage('calendar');
    
    // 添加事件监听器
    setupEventListeners();
    setupSubjectFilterListeners();
}

// 番茄钟相关函数

// 打开番茄钟模态框
function openPomodoroModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentPomodoroTaskId = taskId;
    pomodoroRemainingTime = task.plannedDuration * 60; // 转换为秒
    isPomodoroRunning = false;
    
    // 更新番茄钟UI
    pomodoroTaskNameEl.textContent = task.name;
    pomodoroDurationEl.textContent = `计划时长：${task.plannedDuration}分钟`;
    updatePomodoroTimerDisplay();
    
    // 重置开始按钮文本
    startPomodoroBtn.textContent = '开始';
    
    // 显示番茄钟模态框
    pomodoroModalEl.classList.remove('hidden');
    pomodoroMiniEl.classList.add('hidden');
    
    // 清除之前的定时器
    if (pomodoroTimer) {
        clearInterval(pomodoroTimer);
        pomodoroTimer = null;
    }
}

// 关闭番茄钟模态框
function closePomodoroModal() {
    pomodoroModalEl.classList.add('hidden');
    
    // 停止计时器
    if (pomodoroTimer) {
        clearInterval(pomodoroTimer);
        pomodoroTimer = null;
    }
    
    isPomodoroRunning = false;
}

// 开始/暂停番茄钟计时器
function startPomodoroTimer() {
    if (isPomodoroRunning) {
        // 暂停计时器
        clearInterval(pomodoroTimer);
        pomodoroTimer = null;
        startPomodoroBtn.textContent = '继续';
        isPomodoroRunning = false;
    } else {
        // 开始计时器
        if (pomodoroRemainingTime <= 0) {
            // 如果时间已用完，重置
            const task = tasks.find(t => t.id === currentPomodoroTaskId);
            if (task) {
                pomodoroRemainingTime = task.plannedDuration * 60;
                updatePomodoroTimerDisplay();
            }
        }
        
        pomodoroTimer = setInterval(() => {
            pomodoroRemainingTime--;
            updatePomodoroTimerDisplay();
            
            if (pomodoroRemainingTime <= 0) {
                // 时间到，完成任务
                clearInterval(pomodoroTimer);
                pomodoroTimer = null;
                isPomodoroRunning = false;
                startPomodoroBtn.textContent = '开始';
                
                // 自动完成任务
                completeTaskFromPomodoro();
            }
        }, 1000);
        
        startPomodoroBtn.textContent = '暂停';
        isPomodoroRunning = true;
        
        // 缩小番茄钟为小球
        setTimeout(() => {
            if (isPomodoroRunning) {
                pomodoroModalEl.classList.add('hidden');
                pomodoroMiniEl.classList.remove('hidden');
            }
        }, 2000); // 2秒后缩小
    }
}

// 重置番茄钟
function resetPomodoroTimer() {
    const task = tasks.find(t => t.id === currentPomodoroTaskId);
    if (task) {
        pomodoroRemainingTime = task.plannedDuration * 60;
        updatePomodoroTimerDisplay();
        
        // 停止计时器
        if (pomodoroTimer) {
            clearInterval(pomodoroTimer);
            pomodoroTimer = null;
        }
        
        isPomodoroRunning = false;
        startPomodoroBtn.textContent = '开始';
        
        // 恢复全屏番茄钟
        pomodoroModalEl.classList.remove('hidden');
        pomodoroMiniEl.classList.add('hidden');
    }
}

// 从番茄钟完成任务
function completeTaskFromPomodoro() {
    if (currentPomodoroTaskId) {
        const task = tasks.find(t => t.id === currentPomodoroTaskId);
        if (task) {
            // 标记任务为已完成
            task.status = 'completed';
            
            // 计算实际用时（计划时长减去剩余时间）
            const taskDuration = task.plannedDuration * 60;
            const actualDuration = taskDuration - pomodoroRemainingTime;
            task.actualDuration = Math.ceil(actualDuration / 60); // 转换为分钟
            
            // 保存数据
            saveData();
            
            // 更新UI
            renderTaskList();
            updateStatistics();
            
            // 关闭番茄钟
            closePomodoroModal();
        }
    }
}

// 更新番茄钟显示
function updatePomodoroTimerDisplay() {
    const minutes = Math.floor(pomodoroRemainingTime / 60);
    const seconds = pomodoroRemainingTime % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    pomodoroTimerEl.textContent = formattedTime;
    pomodoroMiniTimerEl.textContent = formattedTime;
}

// 导出函数，使其在全局可用
window.toggleTaskStatus = toggleTaskStatus;
window.openEditTaskModal = openEditTaskModal;
window.deleteTask = deleteTask;
window.openAddTaskModalWithSubject = openAddTaskModalWithSubject;
window.openPomodoroModal = openPomodoroModal;

// 初始化应用
document.addEventListener('DOMContentLoaded', enhancedInitApp);
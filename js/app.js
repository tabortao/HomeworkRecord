// 时间管理打卡小程序主脚本

// 数据模型
let tasks = [];
let currentDate = new Date();
let currentTaskId = null;
let currentChart = null;
let selectedDate = new Date().toISOString().split('T')[0]; // 当前选中的日期
let selectedSubject = '全部学科'; // 当前选中的学科

// 用户管理相关变量
let users = [];
let currentUserId = null;
let currentUser = null;

// 默认用户头像列表
const DEFAULT_AVATARS = [
    '👨‍🎓', '👩‍🎓', '🎓', '🧑‍🎓', '👧', '👦',
    '🐱', '🐶', '🐼', '🐨', '🐯', '🦁',
    '🌟', '🌈', '🎨', '🎵', '⚽', '🏀'
];

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
// 学科相关元素
const subjectModalEl = document.getElementById('subjectModal');
const subjectFormEl = document.getElementById('subjectForm');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const cancelSubjectBtn = document.getElementById('cancelSubjectBtn');
const subjectNameInput = document.getElementById('subjectName');
const subjectColorInput = document.getElementById('subjectColor');
const colorOptions = document.querySelectorAll('.color-option');
const taskSubjectSelect = document.getElementById('taskSubject');

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
    
    // 初始化学科选择下拉框
    updateSubjectSelect();
    
    // 初始化显示日历页面
    switchPage('calendar');
    
    // 添加事件监听器
    setupEventListeners();
    
    // 设置打卡频次UI交互
    setupFrequencyUIListeners();
    
    // 初始化用户管理相关UI
    updateCurrentUserInfo();
    renderUsersList();
    renderAvatarOptions();
}

// 加载本地存储数据
function loadData() {
    // 加载用户数据
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    } else {
        // 如果没有保存的用户，创建一个默认用户
        users = [
            {
                id: 'default-user',
                name: '淘淘同学',
                avatar: '👨‍🎓',
                grade: '幼儿园大班'
            }
        ];
        saveUsers();
    }
    
    // 加载当前用户ID
    currentUserId = localStorage.getItem('currentUserId') || users[0].id;
    
    // 设置当前用户
    currentUser = users.find(user => user.id === currentUserId);
    if (!currentUser) {
        currentUser = users[0];
        currentUserId = currentUser.id;
    }
    
    // 加载学科颜色数据（按用户分组）
    const savedSubjectColors = localStorage.getItem(`subjectColors_${currentUserId}`);
    if (savedSubjectColors) {
        // 使用保存的学科颜色数据覆盖默认颜色
        const parsedColors = JSON.parse(savedSubjectColors);
        // 清空SUBJECT_COLORS对象
        Object.keys(SUBJECT_COLORS).forEach(key => delete SUBJECT_COLORS[key]);
        // 将所有保存的学科颜色添加到SUBJECT_COLORS对象
        Object.assign(SUBJECT_COLORS, parsedColors);
    }
    
    // 加载任务数据（按用户分组）
    const savedTasks = localStorage.getItem(`timeManagementTasks_${currentUserId}`);
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
    localStorage.setItem(`timeManagementTasks_${currentUserId}`, JSON.stringify(tasks));
    localStorage.setItem(`subjectColors_${currentUserId}`, JSON.stringify(SUBJECT_COLORS));
}

// 更新当前用户信息显示
function updateCurrentUserInfo() {
    const userInfoElement = document.getElementById('currentUserInfo');
    if (!userInfoElement || !currentUser) return;

    userInfoElement.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mr-4 text-3xl">
                    ${currentUser.avatar}
                </div>
                <div>
                    <h2 class="text-xl font-bold">${currentUser.name}</h2>
                    <p class="text-textSecondary text-sm">${currentUser.grade}</p>
                </div>
            </div>
            <button id="editUserInfoBtn" class="px-4 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-dark transition-colors text-sm shadow-button">
                <i class="fa fa-pencil mr-1"></i> 编辑
            </button>
        </div>
        
        <div class="flex flex-wrap gap-2 mt-4">
            <div class="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm">
                <i class="fa fa-check-circle mr-1"></i> 完成任务 ${getUserTasks(currentUserId).filter(task => task.status === 'completed').length} 个
            </div>
            <div class="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm">
                <i class="fa fa-book mr-1"></i> 学习学科 ${Object.keys(getUserSubjectColors(currentUserId)).length} 个
            </div>
            <div class="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm">
                <i class="fa fa-clock-o mr-1"></i> 专注时间 ${calculateTotalFocusTime()} 分钟
            </div>
        </div>
    `;

    // 添加编辑按钮事件监听
    const editBtn = document.getElementById('editUserInfoBtn');
    if (editBtn) {
        // 移除旧的事件监听器
        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        
        // 添加新的事件监听器
        newEditBtn.addEventListener('click', function() {
            document.getElementById('currentUserInfo').classList.add('hidden');
            document.getElementById('editUserFormSection').classList.remove('hidden');
            
            // 填充表单数据
            document.getElementById('editUserName').value = currentUser.name;
            document.getElementById('editUserAvatar').value = currentUser.avatar;
            document.getElementById('editUserGrade').value = currentUser.grade;
            
            // 高亮选中的头像
            highlightSelectedAvatar();
        });
    }
}

// 渲染用户列表
function renderUsersList() {
    const usersListElement = document.getElementById('usersList');
    if (!usersListElement) return;

    usersListElement.innerHTML = '';
    
    // 检查当前登录用户是否是管理员（第一个用户）
    const currentUserIsAdmin = users.length > 0 && currentUserId === users[0].id;
    
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = `flex items-center justify-between p-3 rounded-lg transition-colors ${user.id === currentUserId ? 'bg-primary/10 border border-primary/30' : 'hover:bg-gray-50'}`;
        
        // 检查当前正在渲染的用户是否是管理员
        const isUserAdmin = users.indexOf(user) === 0;
        
        userItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-2xl mr-3">${user.avatar}</span>
                <div>
                    <div class="font-medium">${user.name}${isUserAdmin ? ' (管理员)' : ''}</div>
                    <div class="text-sm text-textSecondary">${user.grade}</div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                ${user.id === currentUserId ? 
                    '<span class="text-xs bg-primary text-white px-2 py-1 rounded-full">当前用户</span>' : 
                    `
                    <button data-user-id="${user.id}" class="switchUserBtn px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors">
                        切换
                    </button>
                    ${currentUserIsAdmin && !isUserAdmin ? 
                        `<button data-user-id="${user.id}" class="deleteUserBtn px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors">
                            删除
                        </button>` : ''
                    }
                    `
                }
            </div>
        `;
        
        usersListElement.appendChild(userItem);
    });
    
    // 添加切换用户事件监听
    document.querySelectorAll('.switchUserBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            switchUser(userId);
        });
    });
    
    // 添加删除用户事件监听
    document.querySelectorAll('.deleteUserBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            deleteUser(userId);
        });
    });
}

// 渲染头像选项
function renderAvatarOptions() {
    const avatarOptionsElement = document.getElementById('avatarOptions');
    if (!avatarOptionsElement) return;

    avatarOptionsElement.innerHTML = '';
    
    DEFAULT_AVATARS.forEach(avatar => {
        const avatarOption = document.createElement('div');
        avatarOption.className = `w-12 h-12 flex items-center justify-center text-2xl rounded-lg border-2 cursor-pointer ${avatar === currentUser?.avatar ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-300'}`;
        avatarOption.textContent = avatar;
        
        avatarOption.addEventListener('click', function() {
            document.getElementById('editUserAvatar').value = avatar;
            highlightSelectedAvatar();
        });
        
        avatarOptionsElement.appendChild(avatarOption);
    });
}

// 高亮选中的头像
function highlightSelectedAvatar() {
    const selectedAvatar = document.getElementById('editUserAvatar').value;
    const avatarOptions = document.querySelectorAll('#avatarOptions > div');
    
    avatarOptions.forEach(option => {
        if (option.textContent === selectedAvatar) {
            option.className = 'w-12 h-12 flex items-center justify-center text-2xl rounded-lg border-2 border-primary bg-primary/5 cursor-pointer';
        } else {
            option.className = 'w-12 h-12 flex items-center justify-center text-2xl rounded-lg border-2 border-transparent hover:border-gray-300 cursor-pointer';
        }
    });
}

// 切换用户
function switchUser(userId) {
    currentUserId = userId;
    currentUser = users.find(user => user.id === userId);
    
    // 重新加载当前用户的数据
    loadUserData();
    
    // 更新UI
    updateCurrentUserInfo();
    renderUsersList();
    updateSubjectSelect();
    
    // 保存当前用户ID
    saveUsers();
    
    // 切换回个人中心页面并更新
    enhancedSwitchPage('profile');
}

// 渲染添加用户时的头像选项
function renderNewUserAvatarOptions() {
    const avatarOptionsContainer = document.getElementById('newUserAvatarOptions');
    if (!avatarOptionsContainer) return;
    
    avatarOptionsContainer.innerHTML = '';
    
    // 从DEFAULT_AVATARS数组中渲染头像选项
    DEFAULT_AVATARS.forEach((avatar, index) => {
        const avatarOption = document.createElement('div');
        avatarOption.className = `avatar-option cursor-pointer p-2 rounded-lg transition-colors ${index === 0 ? 'bg-primary/10 border-2 border-primary' : 'hover:bg-gray-100'}`;
        avatarOption.innerHTML = `<span class="text-3xl">${avatar}</span>`;
        avatarOption.setAttribute('data-avatar', avatar);
        
        // 添加点击事件
        avatarOption.addEventListener('click', function() {
            // 移除所有选项的选中状态
            document.querySelectorAll('.avatar-option').forEach(option => {
                option.classList.remove('bg-primary/10', 'border-2', 'border-primary');
                option.classList.add('hover:bg-gray-100');
            });
            
            // 设置当前选项为选中状态
            this.classList.remove('hover:bg-gray-100');
            this.classList.add('bg-primary/10', 'border-2', 'border-primary');
            
            // 更新隐藏输入字段
            document.getElementById('newUserAvatar').value = this.getAttribute('data-avatar');
        });
        
        avatarOptionsContainer.appendChild(avatarOption);
    });
    
    // 默认选中第一个头像
    document.getElementById('newUserAvatar').value = DEFAULT_AVATARS[0];
}

// 显示通知的通用函数
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    
    // 根据类型设置样式
    let bgColor = 'bg-blue-500'; // 默认信息通知
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'warning') bgColor = 'bg-yellow-500';
    
    notification.className = `fixed top-20 right-5 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 opacity-0`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.remove('opacity-0');
        notification.classList.add('opacity-100');
    }, 10);
    
    // 3秒后隐藏通知
    setTimeout(() => {
        notification.classList.remove('opacity-100');
        notification.classList.add('opacity-0');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 显示确认对话框
function showConfirmDialog(message, title = '确认操作') {
    return new Promise((resolve) => {
        const confirmDialog = document.getElementById('confirmDialog');
        const confirmDialogTitle = document.getElementById('confirmDialogTitle');
        const confirmDialogMessage = document.getElementById('confirmDialogMessage');
        const confirmDialogConfirm = document.getElementById('confirmDialogConfirm');
        const confirmDialogCancel = document.getElementById('confirmDialogCancel');
        const confirmDialogCloseBtn = document.getElementById('confirmDialogCloseBtn');
        
        // 设置标题和消息
        confirmDialogTitle.textContent = title;
        confirmDialogMessage.textContent = message;
        
        // 显示对话框
        confirmDialog.classList.remove('hidden');
        
        // 创建确认和取消的处理函数
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        // 清理函数
        function cleanup() {
            confirmDialog.classList.add('hidden');
            confirmDialogConfirm.removeEventListener('click', handleConfirm);
            confirmDialogCancel.removeEventListener('click', handleCancel);
            confirmDialogCloseBtn.removeEventListener('click', handleCancel);
        }
        
        // 添加事件监听器
        confirmDialogConfirm.addEventListener('click', handleConfirm);
        confirmDialogCancel.addEventListener('click', handleCancel);
        confirmDialogCloseBtn.addEventListener('click', handleCancel);
    });
}

// 删除用户
function deleteUser(userId) {
    // 显示确认对话框
    showConfirmDialog('确定要删除此用户吗？此操作无法撤销！').then(function(confirmed) {
        if (confirmed) {
            try {
                // 找到用户索引
                const userIndex = users.findIndex(user => user.id === userId);
                
                if (userIndex !== -1 && userIndex !== 0) { // 不允许删除管理员用户
                    // 删除用户相关的数据
                    localStorage.removeItem(`timeManagementTasks_${userId}`);
                    localStorage.removeItem(`subjectColors_${userId}`);
                    
                    // 从用户列表中移除
                    users.splice(userIndex, 1);
                    
                    // 如果当前用户被删除，切换到管理员用户
                    if (userId === currentUserId) {
                        currentUserId = users[0].id;
                        currentUser = users[0];
                        loadUserData();
                        enhancedSwitchPage('profile');
                    }
                    
                    // 保存并更新UI
                    saveUsers();
                    renderUsersList();
                    
                    showNotification('用户删除成功！', 'success');
                } else {
                    showNotification('无法删除管理员用户或用户不存在！', 'error');
                }
            } catch (error) {
                console.error('删除用户失败:', error);
                showNotification('删除用户失败，请重试。', 'error');
            }
        }
    });
}

// 加载当前用户的数据
function loadUserData() {
    // 加载学科颜色
    const savedSubjectColors = localStorage.getItem(`subjectColors_${currentUserId}`);
    if (savedSubjectColors) {
        // 清空当前学科颜色
        Object.keys(SUBJECT_COLORS).forEach(key => delete SUBJECT_COLORS[key]);
        
        // 添加保存的学科颜色
        const parsedColors = JSON.parse(savedSubjectColors);
        Object.assign(SUBJECT_COLORS, parsedColors);
    } else {
        // 如果没有保存的学科颜色，使用默认值
        resetSubjectColorsToDefault();
    }
    
    // 加载任务
    const savedTasks = localStorage.getItem(`timeManagementTasks_${currentUserId}`);
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
}

// 重置学科颜色为默认值
function resetSubjectColorsToDefault() {
    // 清空当前学科颜色
    Object.keys(SUBJECT_COLORS).forEach(key => delete SUBJECT_COLORS[key]);
    
    // 添加默认学科颜色
    const defaultSubjectColors = {
        '语文': '#FF6B6B',
        '数学': '#4ECDC4',
        '英语': '#45B7D1',
        '科学': '#96CEB4',
        '美术': '#FFD166',
        '音乐': '#F9C80E'
    };
    
    Object.assign(SUBJECT_COLORS, defaultSubjectColors);
}

// 获取指定用户的任务
function getUserTasks(userId) {
    const savedTasks = localStorage.getItem(`timeManagementTasks_${userId}`);
    return savedTasks ? JSON.parse(savedTasks) : [];
}

// 获取指定用户的学科颜色
function getUserSubjectColors(userId) {
    const savedSubjectColors = localStorage.getItem(`subjectColors_${userId}`);
    return savedSubjectColors ? JSON.parse(savedSubjectColors) : {};
}

// 计算总专注时间
function calculateTotalFocusTime() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => task.date === today && task.status === 'completed');
    return todayTasks.reduce((total, task) => total + (task.actualDuration || 0), 0);
}

// 保存用户数据到本地存储
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUserId', currentUserId);
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
    
    // 点击番茄钟弹窗外部区域自动缩小为小圆球
    pomodoroModalEl.addEventListener('click', (e) => {
        // 只有在点击模态框背景（而非内容区域）时才缩小
        if (e.target === pomodoroModalEl && isPomodoroRunning) {
            pomodoroModalEl.classList.add('hidden');
            pomodoroMiniEl.classList.remove('hidden');
        }
    });
    
    // 番茄钟小球点击事件
    pomodoroMiniEl.addEventListener('click', () => {
        pomodoroModalEl.classList.remove('hidden');
        pomodoroMiniEl.classList.add('hidden');
    });
    
    // 番茄钟小球拖动功能
    let isDragging = false;
    let offsetX, offsetY;
    
    pomodoroMiniEl.addEventListener('mousedown', (e) => {
        isDragging = true;
        
        // 计算鼠标相对于元素左上角的偏移量
        const rect = pomodoroMiniEl.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // 添加拖动时的样式
        pomodoroMiniEl.style.transition = 'none'; // 禁用过渡效果
        pomodoroMiniEl.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // 阻止默认行为，避免拖动时选择文本
        e.preventDefault();
        
        // 计算新的位置
        const newX = e.clientX - offsetX;
        const newY = e.clientY - offsetY;
        
        // 限制在视窗内
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const elementWidth = pomodoroMiniEl.offsetWidth;
        const elementHeight = pomodoroMiniEl.offsetHeight;
        
        const clampedX = Math.max(0, Math.min(newX, windowWidth - elementWidth));
        const clampedY = Math.max(0, Math.min(newY, windowHeight - elementHeight));
        
        // 设置新位置
        pomodoroMiniEl.style.left = `${clampedX}px`;
        pomodoroMiniEl.style.top = `${clampedY}px`;
        pomodoroMiniEl.style.transform = 'none'; // 移除居中的transform
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            // 恢复样式
            pomodoroMiniEl.style.transition = 'all 0.3s';
            pomodoroMiniEl.style.cursor = 'move';
        }
    });
    
    // 支持触摸设备
    pomodoroMiniEl.addEventListener('touchstart', (e) => {
        // 阻止事件冒泡
        e.preventDefault();
        const touch = e.touches[0];
        isDragging = true;
        
        const rect = pomodoroMiniEl.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
        
        pomodoroMiniEl.style.transition = 'none';
        pomodoroMiniEl.style.cursor = 'grabbing';
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        const newX = touch.clientX - offsetX;
        const newY = touch.clientY - offsetY;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const elementWidth = pomodoroMiniEl.offsetWidth;
        const elementHeight = pomodoroMiniEl.offsetHeight;
        
        const clampedX = Math.max(0, Math.min(newX, windowWidth - elementWidth));
        const clampedY = Math.max(0, Math.min(newY, windowHeight - elementHeight));
        
        pomodoroMiniEl.style.left = `${clampedX}px`;
        pomodoroMiniEl.style.top = `${clampedY}px`;
        pomodoroMiniEl.style.transform = 'none';
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            pomodoroMiniEl.style.transition = 'all 0.3s';
            pomodoroMiniEl.style.cursor = 'move';
        }
    });
    
    // 学科相关事件监听
    addSubjectBtn.addEventListener('click', openAddSubjectModal);
    cancelSubjectBtn.addEventListener('click', closeSubjectModal);
    subjectFormEl.addEventListener('submit', handleSubjectFormSubmit);
    
    // 颜色选择
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 移除所有颜色选项的选中状态
            colorOptions.forEach(opt => opt.classList.remove('ring-4', 'ring-primary/30'));
            // 添加当前选中颜色的选中状态
            option.classList.add('ring-4', 'ring-primary/30');
            // 更新隐藏输入框的值
            subjectColorInput.value = option.dataset.color;
        });
    });
    
    // 用户管理相关事件监听
    // 添加用户按钮
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserModal = document.getElementById('addUserModal');
    const closeAddUserModalBtn = document.getElementById('closeAddUserModalBtn');
    const cancelAddUserBtn = document.getElementById('cancelAddUserBtn');
    const addUserForm = document.getElementById('addUserForm');
    const newUserName = document.getElementById('newUserName');
    
    // 打开添加用户模态框
    if (addUserBtn && addUserModal) {
        addUserBtn.addEventListener('click', function() {
            addUserModal.classList.remove('hidden');
            newUserName.value = '';
            newUserName.focus();
            // 渲染头像选项
            renderNewUserAvatarOptions();
        });
    }
    
    // 关闭添加用户模态框
    function closeAddUserModal() {
        if (addUserModal) {
            addUserModal.classList.add('hidden');
        }
    }
    
    // 添加关闭模态框事件监听
    if (closeAddUserModalBtn) {
        closeAddUserModalBtn.addEventListener('click', closeAddUserModal);
    }
    
    if (cancelAddUserBtn) {
        cancelAddUserBtn.addEventListener('click', closeAddUserModal);
    }
    
    // 处理添加用户表单提交
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userName = newUserName.value.trim();
            const gradeInput = document.getElementById('newUserGrade');
            const grade = gradeInput ? gradeInput.value.trim() : '未设置';
            const avatarInput = document.getElementById('newUserAvatar');
            const avatar = avatarInput ? avatarInput.value : DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
            
            if (userName) {
                const newUser = {
                    id: Date.now().toString(),
                    name: userName,
                    avatar: avatar,
                    grade: grade
                };
                
                users.push(newUser);
                saveUsers();
                renderUsersList();
                closeAddUserModal();
                
                // 提示用户可以切换到新用户
                showNotification(`用户 "${userName}" 添加成功！`, 'success');
            }
        });
    }
    
    // 显示通知的通用函数



    
    // 取消编辑用户信息
    const cancelEditUserBtn = document.getElementById('cancelEditUserBtn');
    if (cancelEditUserBtn) {
        cancelEditUserBtn.addEventListener('click', function() {
            document.getElementById('currentUserInfo').classList.remove('hidden');
            document.getElementById('editUserFormSection').classList.add('hidden');
        });
    }
    
    // 编辑用户信息表单提交
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('editUserName').value.trim();
            const avatar = document.getElementById('editUserAvatar').value;
            const grade = document.getElementById('editUserGrade').value.trim();
            
            if (name) {
                // 更新当前用户信息
                const userIndex = users.findIndex(user => user.id === currentUserId);
                if (userIndex !== -1) {
                    users[userIndex] = {
                        ...users[userIndex],
                        name,
                        avatar,
                        grade
                    };
                    
                    currentUser = users[userIndex];
                    saveUsers();
                    
                    // 更新UI
                    document.getElementById('currentUserInfo').classList.remove('hidden');
                    document.getElementById('editUserFormSection').classList.add('hidden');
                    updateCurrentUserInfo();
                    renderUsersList();
                }
            } else {
                showNotification('用户名不能为空！', 'error');
            }
        });
    }
    
    // 导出数据按钮
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            const allUserData = {
                users: users,
                data: {}
            };
            
            // 收集每个用户的数据
            users.forEach(user => {
                allUserData.data[user.id] = {
                    tasks: getUserTasks(user.id),
                    subjectColors: getUserSubjectColors(user.id)
                };
            });
            
            // 创建JSON文件并下载
            const dataStr = JSON.stringify(allUserData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `时间管理数据_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }
    
    // 导入数据按钮
    const importDataBtn = document.getElementById('importDataBtn');
    const dataFileInput = document.getElementById('dataFileInput');
    if (importDataBtn && dataFileInput) {
        importDataBtn.addEventListener('click', function() {
            dataFileInput.click();
        });
        
        // 文件选择变化事件
        dataFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // 验证数据格式
                    if (!importedData.users || !importedData.data) {
                        throw new Error('数据格式错误');
                    }
                    
                                    // 询问用户是否替换现有数据
                        if (showConfirmDialog('导入数据将替换现有数据，确定继续吗？')) {
                        // 保存用户列表
                        users = importedData.users;
                        
                        // 保存每个用户的数据
                        Object.keys(importedData.data).forEach(userId => {
                            const userData = importedData.data[userId];
                            if (userData.tasks) {
                                localStorage.setItem(`timeManagementTasks_${userId}`, JSON.stringify(userData.tasks));
                            }
                            if (userData.subjectColors) {
                                localStorage.setItem(`subjectColors_${userId}`, JSON.stringify(userData.subjectColors));
                            }
                        });
                        
                        // 如果有用户，设置当前用户为第一个用户
                        if (users.length > 0) {
                            currentUserId = users[0].id;
                            currentUser = users[0];
                            
                            // 重新加载当前用户的数据
                            loadUserData();
                        }
                        
                        // 保存用户数据
                        saveUsers();
                        
                        // 更新UI
                        updateCurrentUserInfo();
                        renderUsersList();
                        updateSubjectSelect();
                        
                        // 切换到日历页面并更新
                        switchPage('calendar');
                        
                        showNotification('数据导入成功！', 'success');
                    }
            } catch (error) {
                showNotification('导入失败：' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
            
            // 重置文件输入，以便可以重复选择同一个文件
            this.value = '';
        });
    }
    
    // 清除用户数据按钮
    const clearUserDataBtn = document.getElementById('clearUserDataBtn');
    if (clearUserDataBtn) {
        clearUserDataBtn.addEventListener('click', function() {
            // 获取当前用户ID
            const currentUserId = localStorage.getItem('currentUserId');
            if (!currentUserId) {
                showNotification('没有找到当前用户信息', 'error');
                return;
            }
            
            // 显示确认对话框并处理Promise
            showConfirmDialog('确定要清除当前用户的所有数据吗？此操作不可恢复！').then(function(confirmed) {
                if (confirmed) {
                    try {
                        // 清除当前用户的任务数据
                        localStorage.removeItem(`timeManagementTasks_${currentUserId}`);
                        
                        // 清除当前用户的学科颜色数据
                        localStorage.removeItem(`subjectColors_${currentUserId}`);
                        
                        showNotification('用户数据已成功清除', 'success');
                        
                        // 重新加载当前用户数据（将加载空数据）
                        loadUserData();
                        
                        // 重新渲染页面
                        enhancedSwitchPage('calendar');
                    } catch (error) {
                        showNotification('清除数据失败：' + error.message, 'error');
                    }
                }
            });
        });
    }
}

// 打开添加任务模态框
function openAddTaskModal() {
    currentTaskId = null;
    modalTitleEl.textContent = '添加新任务';
    taskFormEl.reset();
    taskModalEl.classList.remove('hidden');
    document.getElementById('taskName').focus();
}

// 打开添加学科模态框
function openAddSubjectModal() {
    subjectNameInput.value = '';
    subjectColorInput.value = '#FF6B6B';
    // 重置颜色选项状态
    colorOptions.forEach(opt => opt.classList.remove('ring-4', 'ring-primary/30'));
    // 默认选中第一个颜色
    colorOptions[0]?.classList.add('ring-4', 'ring-primary/30');
    subjectModalEl.classList.remove('hidden');
    subjectNameInput.focus();
}

// 关闭学科模态框
function closeSubjectModal() {
    subjectModalEl.classList.add('hidden');
}

// 处理学科表单提交
function handleSubjectFormSubmit(e) {
    e.preventDefault();
    
    const subjectName = subjectNameInput.value.trim();
    const subjectColor = subjectColorInput.value;
    
    if (!subjectName) {
        showNotification('请输入学科名称', 'warning');
        return;
    }

    if (SUBJECT_COLORS[subjectName]) {
        showNotification('该学科已存在', 'warning');
        return;
    }
    
    // 添加新学科
    SUBJECT_COLORS[subjectName] = subjectColor;
    
    // 保存学科数据到本地存储
    localStorage.setItem('subjectColors', JSON.stringify(SUBJECT_COLORS));
    
    // 更新任务表单中的学科选择下拉框
    updateSubjectSelect();
    
    // 重新渲染学科页面
    if (subjectsPageEl.classList.contains('hidden') === false) {
        renderSubjectList();
        renderSubjectStatsChart();
    }
    
    // 关闭模态框
    closeSubjectModal();
}

// 更新任务表单中的学科选择下拉框
function updateSubjectSelect() {
    taskSubjectSelect.innerHTML = '';
    
    // 添加所有学科选项
    Object.keys(SUBJECT_COLORS).forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        taskSubjectSelect.appendChild(option);
    });
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
    navCalendarBtn.classList.remove('text-primary', 'bg-primary/5');
    navCalendarBtn.classList.add('text-textSecondary');
    navSubjectsBtn.classList.remove('text-primary', 'bg-primary/5');
    navSubjectsBtn.classList.add('text-textSecondary');
    navProfileBtn.classList.remove('text-primary', 'bg-primary/5');
    navProfileBtn.classList.add('text-textSecondary');
    
    // 显示选中的页面和激活对应的导航按钮
    if (pageName === 'calendar') {
        calendarPageEl.classList.remove('hidden');
        navCalendarBtn.classList.remove('text-textSecondary');
        navCalendarBtn.classList.add('text-primary', 'bg-primary/5');
        
        // 重新渲染日历页面的内容
        renderCalendar();
        renderTaskList();
        renderStatsChart();
        updateStatistics();
    } else if (pageName === 'subjects') {
        subjectsPageEl.classList.remove('hidden');
        navSubjectsBtn.classList.remove('text-textSecondary');
        navSubjectsBtn.classList.add('text-primary', 'bg-primary/5');
        
        // 渲染学科页面内容
        renderSubjectList();
        renderSubjectStatsChart();
    } else if (pageName === 'profile') {
        profilePageEl.classList.remove('hidden');
        navProfileBtn.classList.remove('text-textSecondary');
        navProfileBtn.classList.add('text-primary', 'bg-primary/5');
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
                <div class="flex space-x-2">
                    <button class="text-primary hover:text-primary-dark transition-colors" onclick="openAddTaskModalWithSubject('${subject}')">
                        <i class="fa fa-plus-circle mr-1"></i> 添加任务
                    </button>
                    <button class="text-red-500 hover:text-red-600 transition-colors delete-subject-btn" data-subject="${subject}">
                        <i class="fa fa-trash mr-1"></i> 删除
                    </button>
                </div>
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
    
    // 添加删除学科按钮的事件监听
    document.querySelectorAll('.delete-subject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const subject = this.getAttribute('data-subject');
            deleteSubject(subject);
        });
    });
}

// 删除学科
function deleteSubject(subject) {
    // 检查是否有默认学科，不允许删除
    const defaultSubjects = ['语文', '数学', '英语', '科学', '美术', '音乐'];
    if (defaultSubjects.includes(subject)) {
        showNotification('默认学科不能删除！', 'warning');
        return;
    }
    
    // 检查是否有任务关联到该学科
    const subjectTasks = tasks.filter(task => task.subject === subject);
    if (subjectTasks.length > 0) {
        if (!confirm(`该学科有${subjectTasks.length}个任务，确定要删除吗？删除后任务将被移动到"其他"学科。`)) {
            return;
        }
        
        // 将相关任务的学科改为"其他"
        subjectTasks.forEach(task => {
            task.subject = '其他';
        });
    } else if (!confirm('确定要删除这个学科吗？')) {
        return;
    }
    
    // 删除学科颜色配置
    delete SUBJECT_COLORS[subject];
    
    // 保存数据
    saveData();
    
    // 更新UI
    renderSubjectList();
    renderSubjectStatsChart();
    updateSubjectSelect();
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
        showNotification('请填写任务名称和有效时长', 'warning');
        return;
    }
    
    // 获取打卡频次设置
    const taskFrequency = document.querySelector('input[name="taskFrequency"]:checked').value;
    const nDaysInput = parseInt(document.getElementById('n_days_input').value) || 1;
    const selectedWeekdays = Array.from(document.querySelectorAll('.weekday-checkbox:checked')).map(cb => parseInt(cb.value));
    
    // 构建基本任务对象
    const baseTask = {
        name: taskName,
        subject: taskSubject,
        description: taskDescription,
        plannedDuration: taskDuration,
        actualDuration: 0,
        status: taskStatus
    };
    
    if (currentTaskId) {
        // 编辑现有任务
        const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                ...baseTask
            };
        }
    } else {
        // 添加新任务，根据打卡频次生成任务
        const today = new Date();
        
        // 生成未来30天的任务
        for (let i = 0; i < 30; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + i);
            const dateStr = targetDate.toISOString().split('T')[0];
            const dayOfWeek = targetDate.getDay();
            
            // 根据不同的打卡频次决定是否添加任务
            let shouldAddTask = false;
            
            switch (taskFrequency) {
                case 'once':
                    // 只添加当天任务
                    shouldAddTask = i === 0;
                    break;
                case 'daily':
                    // 添加每天任务
                    shouldAddTask = true;
                    break;
                case 'every_n_days':
                    // 每n天添加一次任务
                    shouldAddTask = i % nDaysInput === 0;
                    break;
                case 'weekly':
                    // 添加每周指定日期的任务
                    shouldAddTask = selectedWeekdays.includes(dayOfWeek);
                    break;
            }
            
            if (shouldAddTask) {
                tasks.push({
                    id: Date.now() + i,
                    ...baseTask,
                    date: dateStr
                });
            }
        }
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
                                            <i class="fa fa-clock-o mr-2"></i>番茄钟
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

// 设置打卡频次UI交互
function setupFrequencyUIListeners() {
    const frequencyRadios = document.querySelectorAll('input[name="taskFrequency"]');
    const nDaysInput = document.getElementById('n_days_input');
    const weekdaysCheckboxes = document.getElementById('weekdays_checkboxes');
    
    // 初始化UI状态
    updateFrequencyUI();
    
    // 添加事件监听器
    frequencyRadios.forEach(radio => {
        radio.addEventListener('change', updateFrequencyUI);
    });
    
    // 当任务模态框打开时，重新初始化UI状态
    const originalOpenAddTaskModal = openAddTaskModal;
    window.openAddTaskModal = function() {
        originalOpenAddTaskModal();
        updateFrequencyUI();
    };
    
    // 更新打卡频次UI状态
    function updateFrequencyUI() {
        const selectedFrequency = document.querySelector('input[name="taskFrequency"]:checked').value;
        
        // 禁用所有额外输入，然后根据选择启用特定的
        if (nDaysInput) nDaysInput.disabled = true;
        if (weekdaysCheckboxes) weekdaysCheckboxes.style.opacity = '0.5';
        
        // 根据选择的频次启用对应的输入
        switch (selectedFrequency) {
            case 'every_n_days':
                if (nDaysInput) nDaysInput.disabled = false;
                break;
            case 'weekly':
                if (weekdaysCheckboxes) weekdaysCheckboxes.style.opacity = '1';
                break;
        }
    }
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
        
        // 渲染用户列表和荣誉墙
        renderUsersList();
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
        
        // 记录番茄钟开始时间
        const task = tasks.find(t => t.id === currentPomodoroTaskId);
        if (task && !task.pomodoroStartTime) {
            task.pomodoroStartTime = Date.now();
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
            
            // 计算实际用时（番茄钟实际运行的时间）
            // 记录番茄钟开始时间（如果还没有记录）
            if (!task.pomodoroStartTime) {
                task.pomodoroStartTime = Date.now();
            }
            
            // 计算实际用时（从开始到现在的时间）
            const elapsedSeconds = Math.floor((Date.now() - task.pomodoroStartTime) / 1000);
            task.actualDuration = Math.max(1, Math.ceil(elapsedSeconds / 60)); // 转换为分钟，至少记录1分钟
            
            // 清除开始时间标记
            delete task.pomodoroStartTime;
            
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
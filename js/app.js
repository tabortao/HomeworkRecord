// 时间管理打卡小程序主脚本

// 数据模型
let tasks = [];
let wishes = [];
let currentDate = new Date();
let currentTaskId = null;
let currentWishId = null;
let currentChart = null;
let selectedDate = toISODateLocal(new Date()); // 当前选中的日期
let selectedSubject = '全部学科'; // 当前选中的学科

// 用户管理相关变量
let users = [];
let currentUserId = null;
let currentUser = null;

// 操作记录相关变量
let activityLogs = [];
const MAX_LOG_AGE_DAYS = 30; // 记录保留30天

// 默认用户头像列表
const DEFAULT_AVATARS = [
    '👨‍🎓', '👩‍🎓', '🎓', '🧑', '👧', '👦',
    '🐱', '🐶', '🐼', '🐨', '🐯', '🦁',
    '🌟', '🌈', '🎨', '🎵', '⚽', '🏀',
    '🐸', '🐙', '🦄', '🦋', '🐢', '🐠',
    '🌺', '🌸', '🌼', '🌻', '🍀', '🎈',
    '🚀', '⭐', '🌙', '☀️', '🌈', '🌍',
    '🎭', '🎪', '🎯', '🎨', '🎸', '🎺',
    '🦊', '🐻', '🐨', '🐮', '🐷', '🐸'
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
// const completeTaskBtn = document.getElementById('completeTaskBtn'); // 移除已完成按钮变量定义
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
const seriesInfoEl = document.getElementById('seriesInfo');
const seriesIdDisplay = document.getElementById('seriesIdDisplay');
const enableStartDateCheckbox = document.getElementById('enableStartDate');
const startDateInput = document.getElementById('startDateInput');
const enableEndDateCheckbox = document.getElementById('enableEndDate');
const endDateInput = document.getElementById('endDateInput');
const endDateContainer = document.getElementById('endDateContainer');

// 页面相关元素
const calendarPageEl = document.getElementById('calendar-page');
const subjectsPageEl = document.getElementById('subjects-page');
const profilePageEl = document.getElementById('profile-page');
const wishesPageEl = document.getElementById('wishes-page');
const navCalendarBtn = document.querySelector('[data-page="calendar"]');
const navSubjectsBtn = document.querySelector('[data-page="subjects"]');
const navProfileBtn = document.querySelector('[data-page="profile"]');
const navWishesBtn = document.querySelector('[data-page="wishes"]');

// 小心愿相关元素
const wishesListEl = document.getElementById('wishes-list');
const wishesCoinsDisplayEl = document.getElementById('wishes-coins-display');
const wishModalEl = document.getElementById('wishModal');
const wishFormEl = document.getElementById('wishForm');
const addWishBtn = document.getElementById('addWishBtn');
const closeWishModalBtn = document.getElementById('closeWishModalBtn');
const cancelWishBtn = document.getElementById('cancelWishBtn');
const wishModalTitleEl = document.getElementById('wishModalTitle');
const wishIconPreviewEl = document.getElementById('wishIconPreview');
const wishIconUploadEl = document.getElementById('wishIconUpload');
const wishNameEl = document.getElementById('wishName');
const wishContentEl = document.getElementById('wishContent');
const wishCostEl = document.getElementById('wishCost');
const subjectsListEl = document.getElementById('subjectList');
const subjectChartContainer = document.getElementById('subjectStatsChart');
const subjectChartEl = document.getElementById('subjectStatsChart');
let subjectChart = null;

// 显示小心愿兑换记录
function showWishRedemptionRecords() {
    // 确保只使用当前用户的操作记录
    const currentUserActivityLogs = JSON.parse(localStorage.getItem(`activityLogs_${currentUserId}`) || '[]');
    
    // 过滤出与小心愿兑换相关的记录
    const wishRecords = currentUserActivityLogs.filter(log => 
        log.actionType === 'wish_redeem' || 
        (log.actionType === 'wish_update' && log.description.includes('兑换'))
    );
    
    // 创建模态框内容
    let contentHTML = '';
    
    if (wishRecords.length === 0) {
        contentHTML = `
            <div class="text-center py-8 text-textSecondary">
                <i class="fa fa-history text-3xl mb-3"></i>
                <p class="text-lg">暂无兑换记录</p>
            </div>
        `;
    } else {
        // 按时间倒序排序
        const sortedRecords = [...wishRecords].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        contentHTML = '<div class="space-y-3 max-h-[400px] overflow-y-auto pr-2">';
        sortedRecords.forEach(log => {
            const logDate = new Date(log.timestamp);
            const formattedDate = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
            const formattedTime = `${String(logDate.getHours()).padStart(2, '0')}:${String(logDate.getMinutes()).padStart(2, '0')}`;
            
            contentHTML += `
                <div class="bg-white p-3 rounded-lg border border-gray-100">
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-medium">${log.description}</div>
                        <div class="text-xs text-gray-400">${formattedDate} ${formattedTime}</div>
                    </div>
                </div>
            `;
        });
        contentHTML += '</div>';
    }
    
    // 使用confirmDialog模态框
    return new Promise((resolve) => {
        const confirmDialog = document.getElementById('confirmDialog');
        const confirmDialogTitle = document.getElementById('confirmDialogTitle');
        const confirmDialogMessage = document.getElementById('confirmDialogMessage');
        const confirmDialogConfirm = document.getElementById('confirmDialogConfirm');
        const confirmDialogCancel = document.getElementById('confirmDialogCancel');
        const confirmDialogCloseBtn = document.getElementById('confirmDialogCloseBtn');
        
        // 隐藏取消按钮
        confirmDialogCancel.classList.add('hidden');
        
        // 设置标题和消息
        confirmDialogTitle.textContent = '小心愿领取记录';
        confirmDialogMessage.innerHTML = contentHTML;
        confirmDialogConfirm.textContent = '关闭';
        
        // 显示对话框
        confirmDialog.classList.remove('hidden');
        
        // 创建确认的处理函数
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        // 清理函数
        function cleanup() {
            confirmDialog.classList.add('hidden');
            // 恢复取消按钮的显示
            confirmDialogCancel.classList.remove('hidden');
            // 移除事件监听器
            confirmDialogConfirm.removeEventListener('click', handleConfirm);
            confirmDialogCloseBtn.removeEventListener('click', handleConfirm);
        }
        
        // 添加事件监听器
        confirmDialogConfirm.addEventListener('click', handleConfirm);
        confirmDialogCloseBtn.addEventListener('click', handleConfirm);
    });
}

// 初始化应用
function initApp() {
    // 加载本地存储数据
    loadData();
    
    // 初始化学科选择下拉框
    updateSubjectSelect();

    // 初始化任务表单日期控件默认值
    initTaskDateControls();
    
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
                name: '管理员',
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
        // 新用户不填充示例数据，使用空数组
        tasks = [];
        saveData();
    }
    
    // 加载小心愿数据（按用户分组）
    const savedWishes = localStorage.getItem(`timeManagementWishes_${currentUserId}`);
    if (savedWishes) {
        wishes = JSON.parse(savedWishes);
    } else {
        // 创建默认的小心愿示例数据（6个默认小心愿：看电视、零花钱、玩平板、玩手机、玩游戏、自由活动）
        wishes = [
            {
                id: Date.now() + 1,
                name: '看电视',
                content: '完成学习任务后可以看10分钟动画片',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '📺',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 5,
                name: '零花钱',
                content: '累计完成一周任务可兑换零花钱',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '💰',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 3,
                name: '玩平板',
                content: '学习进步可以兑换10分钟平板使用时间',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '💻',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 6,
                name: '玩手机',
                content: '表现良好可以兑换10分钟手机使用时间',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '📱',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 2,
                name: '玩游戏',
                content: '周末可以玩20分钟游戏',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '🎮',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 4,
                name: '自由活动',
                content: '完成所有作业后可以兑换30分钟自由支配时间',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '🏃',
                cost: 1,
                status: 'available'
            }
        ];
        saveWishes();
    }
    
    // 加载操作记录（按用户分组）
    const savedActivityLogs = localStorage.getItem(`activityLogs_${currentUserId}`);
    if (savedActivityLogs) {
        activityLogs = JSON.parse(savedActivityLogs);
        cleanOldLogs(); // 清理过期记录
    } else {
        activityLogs = [];
    }
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem(`timeManagementTasks_${currentUserId}`, JSON.stringify(tasks));
    localStorage.setItem(`subjectColors_${currentUserId}`, JSON.stringify(SUBJECT_COLORS));
    localStorage.setItem(`activityLogs_${currentUserId}`, JSON.stringify(activityLogs));
}

// 添加操作记录
function addActivityLog(actionType, description) {
    const log = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.name : '未知用户',
        actionType,
        description
    };
    
    activityLogs.unshift(log); // 新记录添加到开头
    cleanOldLogs(); // 清理过期记录
    saveData(); // 保存数据
}

// 清理过期记录
function cleanOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_AGE_DAYS);
    
    activityLogs = activityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= cutoffDate;
    });
}

// 显示操作记录
function displayActivityLogs() {
    const activityLogContentEl = document.getElementById('activityLogContent');
    if (!activityLogContentEl) return;
    
    activityLogContentEl.innerHTML = '';
    
    if (activityLogs.length === 0) {
        activityLogContentEl.innerHTML = '<p class="text-gray-500 text-center py-4">暂无操作记录</p>';
        return;
    }
    
    activityLogs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'bg-gray-50 rounded-lg p-3 border border-gray-100';
        
        // 格式化时间
        const logDate = new Date(log.timestamp);
        const formattedDate = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
        const formattedTime = `${String(logDate.getHours()).padStart(2, '0')}:${String(logDate.getMinutes()).padStart(2, '0')}`;
        
        // 根据操作类型选择图标
        let iconClass = 'fa-info-circle text-blue-500';
        switch (log.actionType) {
            case 'task_add':
            case 'subject_add':
            case 'wish_add':
            case 'user_add':
                iconClass = 'fa-plus-circle text-green-500';
                break;
            case 'task_delete':
            case 'subject_delete':
            case 'wish_delete':
            case 'user_delete':
                iconClass = 'fa-trash text-red-500';
                break;
            case 'task_update':
            case 'subject_update':
            case 'wish_update':
            case 'user_update':
                iconClass = 'fa-pencil text-amber-500';
                break;
            case 'task_complete':
                iconClass = 'fa-check-circle text-green-500';
                break;
            case 'pomodoro_start':
                iconClass = 'fa-clock-o text-purple-500';
                break;
            case 'wish_redeem':
                iconClass = 'fa-gift text-pink-500';
                break;
            case 'data_clear':
                iconClass = 'fa-exclamation-triangle text-red-500';
                break;
        }
        
        logItem.innerHTML = `
            <div class="flex items-start">
                <div class="mr-3 mt-0.5">
                    <i class="fa ${iconClass}"></i>
                </div>
                <div class="flex-1">
                    <div class="text-sm text-gray-500 mb-1">${formattedDate} ${formattedTime} · ${log.user}</div>
                    <div class="text-textPrimary">${log.description}</div>
                </div>
            </div>
        `;
        
        activityLogContentEl.appendChild(logItem);
    });
}

// 清空操作记录
function clearActivityLogs() {
    activityLogs = [];
    localStorage.setItem(`activityLogs_${currentUserId}`, JSON.stringify(activityLogs));
    displayActivityLogs();
    showNotification('操作记录已清空', 'success');
}

// 保存小心愿数据到本地存储
function saveWishes() {
    localStorage.setItem(`timeManagementWishes_${currentUserId}`, JSON.stringify(wishes));
    // 添加操作记录
    addActivityLog('wish_update', '更新了小心愿数据');
}

// 更新当前用户信息显示
function updateCurrentUserInfo() {
    const userInfoElement = document.getElementById('currentUserInfo');
    if (!currentUser) return;
    
    // 更新顶部导航栏的用户信息
    const navUserAvatar = document.getElementById('navUserAvatar');
    const navUserName = document.getElementById('navUserName');
    if (navUserAvatar) navUserAvatar.textContent = currentUser.avatar;
    if (navUserName) navUserName.textContent = currentUser.name;
    
    // 更新个人中心页面的用户信息
    if (userInfoElement)

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
    
    // 添加操作记录
    addActivityLog('user_switch', `切换到用户「${currentUser.name}」`);
    
    // 切换回个人中心页面并更新
    enhancedSwitchPage('profile');
    
    // 更新金币显示
    updateCoinsDisplay();
    updateStatistics(); // 更新统计数据，包括今日金币
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
    withPasswordVerification('删除用户需要验证密码', () => {
        // 显示确认对话框（不需要再次密码验证）
        showConfirmDialog('确定要删除此用户吗？此操作无法撤销！').then(function(confirmed) {
            if (confirmed) {
                try {
                    // 找到用户索引
                    const userIndex = users.findIndex(user => user.id === userId);
                    
                    if (userIndex !== -1 && userIndex !== 0) { // 不允许删除管理员用户
                        // 删除用户相关的数据
                        localStorage.removeItem(`timeManagementTasks_${userId}`);
                        localStorage.removeItem(`subjectColors_${userId}`);
                        localStorage.removeItem(`timeManagementWishes_${userId}`);
                        
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
    
    // 加载小心愿
    const savedWishes = localStorage.getItem(`timeManagementWishes_${currentUserId}`);
    if (savedWishes) {
        wishes = JSON.parse(savedWishes);
    } else {
        // 创建默认的小心愿示例数据（6个默认小心愿：看电视、零花钱、玩平板、玩手机、玩游戏、自由活动）
        wishes = [
            {
                id: Date.now() + 1,
                name: '看电视',
                content: '完成学习任务后可以看10分钟动画片',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '📺',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 5,
                name: '零花钱',
                content: '累计完成一周任务可兑换零花钱',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '💰',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 3,
                name: '玩平板',
                content: '学习进步可以兑换10分钟平板使用时间',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '💻',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 6,
                name: '玩手机',
                content: '表现良好可以兑换10分钟手机使用时间',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '📱',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 2,
                name: '玩游戏',
                content: '周末可以玩20分钟游戏',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '🎮',
                cost: 1,
                status: 'available'
            },
            {
                id: Date.now() + 4,
                name: '自由活动',
                content: '完成所有作业后可以兑换30分钟自由支配时间',
                icon: '',
                iconType: 'emoji',
                iconEmoji: '🏃',
                cost: 1,
                status: 'available'
            }
        ];
        saveWishes();
    }
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
    const today = toISODateLocal(new Date());
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
    // 领取记录按钮事件监听
    const showWishRedemptionRecordsBtn = document.getElementById('showWishRedemptionRecordsBtn');
    if (showWishRedemptionRecordsBtn) {
        showWishRedemptionRecordsBtn.addEventListener('click', showWishRedemptionRecords);
    }
    
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
    
    // 小心愿页面导航
    if (navWishesBtn) {
        navWishesBtn.addEventListener('click', () => switchPage('wishes'));
    }
    
    // 小心愿相关事件监听器
    if (addWishBtn) addWishBtn.addEventListener('click', openAddWishModal);
    if (closeWishModalBtn) closeWishModalBtn.addEventListener('click', closeWishModal);
    if (cancelWishBtn) cancelWishBtn.addEventListener('click', closeWishModal);
    if (wishFormEl) wishFormEl.addEventListener('submit', handleWishFormSubmit);
    if (wishIconUploadEl) wishIconUploadEl.addEventListener('change', handleWishIconUpload);
    
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
    // completeTaskBtn.addEventListener('click', completeTaskFromPomodoro); // 移除已完成按钮事件监听器
    
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
    
    // 为关闭按钮添加事件监听器
    const closeSubjectModalBtn = document.getElementById('closeSubjectModalBtn');
    if (closeSubjectModalBtn) {
        closeSubjectModalBtn.addEventListener('click', closeSubjectModal);
    }
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
                const password = document.getElementById('newUserPassword').value;
                const newUser = {
                    id: Date.now().toString(),
                    name: userName,
                    avatar: avatar,
                    grade: grade
                };
                
                // 如果设置了密码，则保存密码
                if (password) {
                    newUser.password = password;
                }
                
                users.push(newUser);
                saveUsers();
                renderUsersList();
                closeAddUserModal();
                
                // 提示用户可以切换到新用户
                showNotification(`用户 "${userName}" 添加成功！`, 'success');
            }
        });
    }
    
    // 密码验证相关函数
    let passwordDialogResolve = null;
    let passwordDialogReject = null;
    
    // 打开密码验证对话框
    function showPasswordDialog(message = '此操作需要验证用户密码') {
        const passwordDialog = document.getElementById('passwordDialog');
        const passwordDialogMessage = document.getElementById('passwordDialogMessage');
        const passwordInput = document.getElementById('passwordInput');
        
        if (passwordDialog && passwordDialogMessage && passwordInput) {
            passwordDialogMessage.textContent = message;
            passwordInput.value = '';
            passwordDialog.classList.remove('hidden');
            passwordInput.focus();
        }
        
        return new Promise((resolve, reject) => {
            passwordDialogResolve = resolve;
            passwordDialogReject = reject;
        });
    }
    
    // 关闭密码验证对话框
    function closePasswordDialog() {
        const passwordDialog = document.getElementById('passwordDialog');
        if (passwordDialog) {
            passwordDialog.classList.add('hidden');
        }
        passwordDialogResolve = null;
        passwordDialogReject = null;
    }
    
    // 验证用户密码
    function verifyUserPassword(password) {
        return !currentUser.password || currentUser.password === password;
    }
    
    // 初始化密码对话框事件监听
    const passwordDialog = document.getElementById('passwordDialog');
    const passwordDialogCloseBtn = document.getElementById('passwordDialogCloseBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
    const passwordInput = document.getElementById('passwordInput');
    
    if (passwordDialogCloseBtn) {
        passwordDialogCloseBtn.addEventListener('click', () => {
            if (passwordDialogReject) {
                passwordDialogReject(new Error('用户取消'));
            }
            closePasswordDialog();
        });
    }
    
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', () => {
            if (passwordDialogReject) {
                passwordDialogReject(new Error('用户取消'));
            }
            closePasswordDialog();
        });
    }
    
    if (confirmPasswordBtn) {
        confirmPasswordBtn.addEventListener('click', () => {
            const password = passwordInput ? passwordInput.value : '';
            const isValid = verifyUserPassword(password);
            
            if (isValid) {
                if (passwordDialogResolve) {
                    passwordDialogResolve(true);
                }
            } else {
                showNotification('密码错误，请重试！', 'error');
                return;
            }
            
            closePasswordDialog();
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmPasswordBtn.click();
            }
        });
    }
    
    // 包装需要密码验证的函数
    window.withPasswordVerification = async function(message, action) {
        // 用户未设置密码时，直接执行操作
        if (!currentUser || !currentUser.password) {
            return action();
        }
        
        // 用户设置了密码时，进行密码验证
        try {
            const isVerified = await showPasswordDialog(message);
            if (isVerified) {
                return action();
            }
            return null;
        } catch (error) {
            // 用户取消操作
            return null;
        }
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
    
    // 控制旧密码输入框的显示/隐藏
    function toggleOldPasswordField() {
        const oldPasswordContainer = document.getElementById('oldPasswordContainer');
        if (oldPasswordContainer) {
            // 只有当用户已有密码时才显示旧密码输入框
            if (currentUser && currentUser.password) {
                oldPasswordContainer.classList.remove('hidden');
            } else {
                oldPasswordContainer.classList.add('hidden');
            }
        }
    }
    
    // 当编辑用户表单显示时，检查并控制旧密码字段的显示状态
    const editUserFormSection = document.getElementById('editUserFormSection');
    if (editUserFormSection) {
        // 监听显示状态变化
        const observer = new MutationObserver(() => {
            if (!editUserFormSection.classList.contains('hidden')) {
                toggleOldPasswordField();
            }
        });
        observer.observe(editUserFormSection, { attributes: true, attributeFilter: ['class'] });
    }
    
    // 编辑用户信息表单提交
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('editUserName').value.trim();
            const avatar = document.getElementById('editUserAvatar').value;
            const grade = document.getElementById('editUserGrade').value.trim();
            const newPassword = document.getElementById('editUserPassword').value;
            const oldPassword = document.getElementById('editUserOldPassword')?.value;
            
            if (name) {
                // 更新当前用户信息
                const userIndex = users.findIndex(user => user.id === currentUserId);
                if (userIndex !== -1) {
                    const updatedUser = {
                        ...users[userIndex],
                        name,
                        avatar,
                        grade
                    };
                    
                    // 如果用户有密码且要修改密码，需要验证旧密码
                    if (newPassword && currentUser.password) {
                        // 检查是否有旧密码输入框，如果有且没有输入旧密码，则提示
                        if (oldPassword === undefined || oldPassword === '') {
                            showNotification('修改密码需要验证旧密码！', 'error');
                            return;
                        }
                        
                        // 验证旧密码
                        if (!verifyUserPassword(oldPassword)) {
                            showNotification('旧密码不正确！', 'error');
                            return;
                        }
                        
                        updatedUser.password = newPassword;
                    } else if (newPassword) {
                        // 如果用户之前没有密码，则直接设置新密码
                        updatedUser.password = newPassword;
                    }
                    
                    users[userIndex] = updatedUser;
                    currentUser = updatedUser;
                    saveUsers();
                    
                    // 更新UI
                    document.getElementById('currentUserInfo').classList.remove('hidden');
                    document.getElementById('editUserFormSection').classList.add('hidden');
                    updateCurrentUserInfo();
                    renderUsersList();
                    showNotification('用户信息更新成功！', 'success');
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
                    subjectColors: getUserSubjectColors(user.id),
                    coins: getUserCoinsByUserId(user.id),
                    wishes: getUserWishesByUserId(user.id),
                    activityLogs: JSON.parse(localStorage.getItem(`activityLogs_${user.id}`) || '[]')
                };
            });
            
            // 创建JSON文件并下载
            const dataStr = JSON.stringify(allUserData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `时间管理数据_${toISODateLocal(new Date())}.json`;
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
                            if (userData.coins !== undefined) {
                                localStorage.setItem(`timeManagementCoins_${userId}`, userData.coins);
                            }
                            if (userData.wishes) {
                                localStorage.setItem(`timeManagementWishes_${userId}`, JSON.stringify(userData.wishes));
                            }
                            if (userData.activityLogs) {
                                localStorage.setItem(`activityLogs_${userId}`, JSON.stringify(userData.activityLogs));
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
            withPasswordVerification('清除数据需要验证密码', () => {
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
                    // 清除当前用户的所有数据
                    
                    // 清除任务数据
                    localStorage.setItem(`timeManagementTasks_${currentUserId}`, JSON.stringify([]));
                    
                    // 重置学科颜色为6个默认学科
                    resetSubjectColorsToDefault();
                    localStorage.setItem(`subjectColors_${currentUserId}`, JSON.stringify(SUBJECT_COLORS));
                    
                    // 清除荣誉数据
                    localStorage.removeItem('timeManagementHonors');
                    
                    // 保留6个默认小愿望，清除其他自定义小愿望
                    const defaultWishes = [
                        {
                            id: Date.now() + 1,
                            name: '看电视',
                            content: '完成学习任务后可以看10分钟动画片',
                            icon: '',
                            iconType: 'emoji',
                            iconEmoji: '📺',
                            cost: 1,
                            status: 'available'
                        },
                        {
                            id: Date.now() + 5,
                            name: '零花钱',
                            content: '累计完成一周任务可兑换零花钱',
                            icon: '',
                            iconType: 'emoji',
                            iconEmoji: '💰',
                            cost: 1,
                            status: 'available'
                        },
                        {
                            id: Date.now() + 3,
                            name: '玩平板',
                            content: '学习进步可以兑换10分钟平板使用时间',
                            icon: '',
                            iconType: 'emoji',
                            iconEmoji: '💻',
                            cost: 1,
                            status: 'available'
                        },
                        {
                            id: Date.now() + 6,
                            name: '玩手机',
                            content: '表现良好可以兑换10分钟手机使用时间',
                            icon: '',
                            iconType: 'emoji',
                            iconEmoji: '📱',
                            cost: 1,
                            status: 'available'
                        },
                        {
                            id: Date.now() + 2,
                            name: '玩游戏',
                            content: '周末可以玩20分钟游戏',
                            icon: '',
                            iconType: 'emoji',
                            iconEmoji: '🎮',
                            cost: 1,
                            status: 'available'
                        },
                        {
                            id: Date.now() + 4,
                            name: '自由活动',
                            content: '完成所有作业后可以兑换30分钟自由支配时间',
                            icon: '',
                            iconType: 'emoji',
                            iconEmoji: '🏃',
                            cost: 1,
                            status: 'available'
                        }
                    ];
                    localStorage.setItem(`timeManagementWishes_${currentUserId}`, JSON.stringify(defaultWishes));
                    wishes = defaultWishes;
                    
                    // 清除金币数据
                    localStorage.setItem(`timeManagementCoins_${currentUserId}`, 0);
                    
                    // 清除操作记录
                    localStorage.setItem(`activityLogs_${currentUserId}`, JSON.stringify([]));
                    
                    showNotification('所有数据已成功清除，包括密码。您可以重新设置密码。', 'success');
                    
                    // 重置内存中的数据变量
                    tasks = [];
                    activityLogs = [];
                    // wishes 保持为已设置的默认值
                    
                    // 清除当前用户的密码
                    if (currentUser) {
                        currentUser.password = '';
                        saveUsers();
                    }
                    
                    // 重新渲染所有相关页面和组件
                    updateCurrentUserInfo();
                    renderTaskList();
                    renderWishesList();
                    displayActivityLogs();
                    updateStatistics();
                    renderStatsChart();
                    renderSubjectList();
                    renderSubjectStatsChart();
                    updateSubjectSelect();
                    updateCoinsDisplay();
                    updateWishesCoinsDisplay();
                    updateStatistics();
                    renderStatsChart();
                    
                    // 如果当前显示的是荣誉墙，重新渲染荣誉墙
                    if (document.getElementById('profile-page') && !document.getElementById('profile-page').classList.contains('hidden')) {
                        renderHonorWall();
                    }
                } catch (error) {
                            showNotification('清除数据失败：' + error.message, 'error');
                        }
                    }
                });
            });
        });
    }
}

// 打开添加任务模态框
function openAddTaskModal() {
    withPasswordVerification('添加任务需要验证密码', () => {
        currentTaskId = null;
        modalTitleEl.textContent = '添加新任务';
        taskFormEl.reset();
    // reset date controls to defaults (use local date helper)
    if (startDateInput) startDateInput.value = toISODateLocal(new Date());
        if (enableStartDateCheckbox) enableStartDateCheckbox.checked = false;
        if (endDateInput) endDateInput.value = '';
        if (enableEndDateCheckbox) enableEndDateCheckbox.checked = false;
            // 默认计划时长与奖励金币
            const durationInput = document.getElementById('taskDuration');
            const coinsInput = document.getElementById('taskCoins');
            if (durationInput) durationInput.value = 10; // 默认10分钟
            if (coinsInput) coinsInput.value = 1; // 默认1金币
        // 新增：隐藏系列信息（新增任务默认无系列）
        if (seriesInfoEl) seriesInfoEl.classList.add('hidden');
        if (seriesIdDisplay) seriesIdDisplay.textContent = '-';
        taskModalEl.classList.remove('hidden');
        document.getElementById('taskName').focus();
    });
}

// 打开添加学科模态框
function openAddSubjectModal() {
    withPasswordVerification('添加学科需要验证密码', () => {
        subjectNameInput.value = '';
        subjectColorInput.value = '#FF6B6B';
        // 重置颜色选项状态
        colorOptions.forEach(opt => opt.classList.remove('ring-4', 'ring-primary/30'));
        // 默认选中第一个颜色
        colorOptions[0]?.classList.add('ring-4', 'ring-primary/30');
        subjectModalEl.classList.remove('hidden');
        subjectNameInput.focus();
    });
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
    
    // 添加操作记录
    addActivityLog('subject_add', `添加了新学科「${subjectName}」`)
    
    // 保存学科数据到本地存储
    localStorage.setItem('subjectColors', JSON.stringify(SUBJECT_COLORS));
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
    withPasswordVerification('编辑任务需要验证密码', () => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        currentTaskId = taskId;
        modalTitleEl.textContent = '编辑任务';
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskSubject').value = task.subject;
        document.getElementById('taskDuration').value = task.plannedDuration;
        document.getElementById('taskCoins').value = task.coins || 0;
        document.getElementById('taskDescription').value = task.description;
        
        if (task.status === 'completed') {
            document.querySelector('input[name="taskStatus"][value="completed"]').checked = true;
        } else {
            document.querySelector('input[name="taskStatus"][value="pending"]').checked = true;
        }
        
        taskModalEl.classList.remove('hidden');
        // 填充日期字段，如果任务带有 start/end
        if (task.startDate) {
            enableStartDateCheckbox.checked = true;
            startDateInput.disabled = false;
            // 保证日期格式为 YYYY-MM-DD
            startDateInput.value = toISODateLocal(parseISODateLocal(task.startDate) || new Date(task.startDate));
        } else {
            enableStartDateCheckbox.checked = false;
            if (startDateInput) startDateInput.disabled = true;
            startDateInput.value = toISODateLocal(new Date());
        }
        if (task.endDate) {
            enableEndDateCheckbox.checked = true;
            endDateInput.disabled = false;
            endDateInput.value = toISODateLocal(parseISODateLocal(task.endDate) || new Date(task.endDate));
        } else {
            enableEndDateCheckbox.checked = false;
            if (endDateInput) endDateInput.disabled = true;
            endDateInput.value = '';
        }
        // 设置输入法适配
        setupTaskModalInputAdaptation();
        // 隐藏系列信息与摘要（编辑模态中默认不显示系列信息）
        if (seriesInfoEl) {
            seriesInfoEl.classList.add('hidden');
            if (seriesIdDisplay) seriesIdDisplay.textContent = '-';
            const summaryEl = document.getElementById('seriesSummary');
            if (summaryEl) summaryEl.textContent = '-';
        }
    });
}

// 关闭任务模态框
function closeTaskModal() {
    taskModalEl.classList.add('hidden');
    currentTaskId = null;
}

// 任务弹窗输入法适配
function setupTaskModalInputAdaptation() {
    // 延迟初始化，确保DOM已加载完成
    setTimeout(() => {
        const formInputs = document.querySelectorAll('#taskForm input, #taskForm textarea, #taskForm select');
        
        // 监听输入框聚焦，确保输入框可见
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    // 滚动到当前聚焦的输入框位置，确保可见
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 200);
            });
        });
    }, 300);
    
    // 监听窗口大小变化，自适应调整
    window.addEventListener('resize', () => {
        // 移除可能存在的强制底部显示样式，保持居中
        if (taskModalEl && !taskModalEl.classList.contains('hidden')) {
            taskModalEl.style.alignItems = 'center';
        }
    });
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
        subjectCard.className = 'bg-white rounded-xl shadow-card p-3 card-hover';
        subjectCard.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${SUBJECT_COLORS[subject]}"></div>
                    <h3 class="font-semibold">${subject}</h3>
                </div>
                <div class="flex space-x-2">
                    <button class="text-primary hover:text-primary-dark transition-colors p-1" onclick="openAddTaskModalWithSubject('${subject}')" title="添加任务">
                        <i class="fa fa-plus-circle"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-600 transition-colors p-1 delete-subject-btn" data-subject="${subject}" title="删除">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-center">
                <div class="bg-gray-50 p-2 rounded-lg">
                    <p class="text-xs text-textSecondary">总数</p>
                    <p class="text-base font-bold">${subjectTasks.length}</p>
                </div>
                <div class="bg-gray-50 p-2 rounded-lg">
                    <p class="text-xs text-textSecondary">比例</p>
                    <p class="text-base font-bold ${completionRate === 100 ? 'text-green-500' : ''}">${completionRate}%</p>
                </div>
                <div class="bg-gray-50 p-2 rounded-lg">
                    <p class="text-xs text-textSecondary">时长</p>
                    <p class="text-base font-bold">${formatDuration(totalDuration)}</p>
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
    
    // 添加操作记录
    addActivityLog('subject_delete', `删除了学科「${subject}」`);
    
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
    withPasswordVerification('添加任务需要验证密码', () => {
        currentTaskId = null;
        modalTitleEl.textContent = '添加新任务';
        taskFormEl.reset();
        // 预设学科并重置日期/默认值
        document.getElementById('taskSubject').value = subject;
            if (startDateInput) startDateInput.value = toISODateLocal(new Date());
        if (enableStartDateCheckbox) enableStartDateCheckbox.checked = false;
        if (endDateInput) endDateInput.value = '';
        if (enableEndDateCheckbox) enableEndDateCheckbox.checked = false;
        const durationInput2 = document.getElementById('taskDuration');
        const coinsInput2 = document.getElementById('taskCoins');
        if (durationInput2) durationInput2.value = 10;
        if (coinsInput2) coinsInput2.value = 1;
        taskModalEl.classList.remove('hidden');
        document.getElementById('taskName').focus();
        // 设置输入法适配
        setupTaskModalInputAdaptation();
    });
}

// 处理任务表单提交
async function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const taskName = document.getElementById('taskName').value.trim();
    const taskSubject = document.getElementById('taskSubject').value;
    const taskDuration = parseInt(document.getElementById('taskDuration').value) || 0;
    const taskDescription = document.getElementById('taskDescription').value.trim();
    const taskStatus = document.querySelector('input[name="taskStatus"]:checked').value;
    const taskDate = toISODateLocal(new Date());
    
    if (!taskName || taskDuration <= 0) {
        showNotification('请填写任务名称和有效时长', 'warning');
        return;
    }
    
    // 获取打卡频次设置
    const taskFrequency = document.querySelector('input[name="taskFrequency"]:checked').value;
    const nDaysInput = parseInt(document.getElementById('n_days_input').value) || 1;
    const selectedWeekdays = Array.from(document.querySelectorAll('.weekday-checkbox:checked')).map(cb => parseInt(cb.value));
    
    // 构建基本任务对象
    // 日期设置
    const hasStartDate = enableStartDateCheckbox ? enableStartDateCheckbox.checked : false;
    const startDate = hasStartDate && startDateInput && startDateInput.value ? startDateInput.value : null;
    const hasEndDate = enableEndDateCheckbox ? enableEndDateCheckbox.checked : false;
    const endDate = hasEndDate && endDateInput && endDateInput.value ? endDateInput.value : null;

    const baseTask = {
        name: taskName,
        subject: taskSubject,
        description: taskDescription,
        plannedDuration: taskDuration,
        coins: parseInt(document.getElementById('taskCoins').value) || 0,
        actualDuration: 0,
        status: taskStatus
    };

    // 验证日期规则
    if (taskFrequency === 'once') {
        // 一次性任务只能设置开始日期
        if (hasEndDate) {
            showNotification('一次性任务不能设置结束日期', 'warning');
            return;
        }
        // startDate 可为空（则视为今天），但如果启用，应允许历史日期
    } else {
        // 循环任务必须有开始日期
        if (!hasStartDate || !startDate) {
            showNotification('循环任务必须启用并设置开始日期', 'warning');
            return;
        }
    }

    if (hasStartDate && hasEndDate && startDate && endDate) {
        if (new Date(endDate) < new Date(startDate)) {
            showNotification('结束日期不能早于开始日期', 'warning');
            return;
        }
    }

    if (taskFrequency === 'every_n_days' && (isNaN(nDaysInput) || nDaysInput <= 0)) {
        showNotification('自定义天数必须大于0', 'warning');
        return;
    }
    
    if (currentTaskId) {
        // 编辑现有任务
        const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
        if (taskIndex !== -1) {
            // 记录原始任务信息
            const originalTask = tasks[taskIndex];
            const originalCoins = originalTask.coins || 0;
            const originalStatus = originalTask.status;
            const newCoins = baseTask.coins || 0;
            const newStatus = baseTask.status;
            
            // 更新任务
            tasks[taskIndex] = {
                ...originalTask,
                ...baseTask
            };
            
            // 添加操作记录
            addActivityLog('task_edit', `编辑了任务「${taskName}」`);
            
            // 处理金币变化：金币数量调整
            const coinsDifference = newCoins - originalCoins;
            if (coinsDifference !== 0) {
                const currentCoins = getUserCoins();
                const updatedCoins = currentCoins + coinsDifference;
                // 由于用户已经在打开编辑任务模态框时验证了密码，这里直接保存金币
                saveUserCoins(updatedCoins);
                updateCoinsDisplay();
                
                // 显示金币变化通知
                showNotification(coinsDifference > 0 
                    ? `任务金币调整，获得 ${coinsDifference} 金币！` 
                    : `任务金币调整，扣除 ${Math.abs(coinsDifference)} 金币！`,
                    coinsDifference > 0 ? 'success' : 'error'
                );
            }
            
            // 处理状态切换的金币调整
            if (originalStatus !== newStatus) {
                const taskCoins = newCoins; // 使用新的金币值
                
                if (originalStatus === 'completed' && newStatus === 'pending') {
                    // 从已完成变为待完成，扣除金币
                    // 由于用户已经在打开编辑任务模态框时验证了密码，这里不再需要额外验证
                    const currentCoins = getUserCoins();
                    const updatedCoins = Math.max(0, currentCoins - taskCoins);
                    saveUserCoins(updatedCoins);
                    updateCoinsDisplay();
                    
                    showNotification(`扣除 ${taskCoins} 个金币！`, 'error');
                } else if (originalStatus === 'pending' && newStatus === 'completed') {
                    // 从待完成变为已完成，增加金币
                    const currentCoins = getUserCoins();
                    const updatedCoins = currentCoins + taskCoins;
                    saveUserCoins(updatedCoins);
                    updateCoinsDisplay();
                    
                    showNotification(`获得 ${taskCoins} 个金币！`, 'success');
                }
            }
            // 如果这是一个系列任务（或编辑时将任务改为循环），使用seriesId进行更温和的更新
            // 提供两种编辑范围：仅影响未来实例（默认）或影响全部实例（包含历史）
                    const todayStr = toISODateLocal(new Date());
            // 决定是否需要按 series 更新：如果原任务有 seriesId 或 新频次不是 once
            const willBeSeries = taskFrequency !== 'once';
            let seriesIdToUse = originalTask.seriesId || null;
            // 读取用户在编辑模态中选择的范围（默认 future）
            const editScopeEl = document.querySelector('input[name="editScope"]:checked');
            const editScope = editScopeEl ? editScopeEl.value : 'future';
            if (willBeSeries) {
                // 如果原先没有 seriesId，则生成一个新的 seriesId（基于新规则）
                if (!seriesIdToUse) {
                    const seed = `${taskName}::${taskSubject}::${taskFrequency}::${hasStartDate && startDate ? startDate : ''}::${nDaysInput || ''}::${(selectedWeekdays || []).join(',')}`;
                    seriesIdToUse = 's_' + Array.from(seed).reduce((acc, ch) => ((acc << 5) - acc) + ch.charCodeAt(0), 0).toString(36).replace(/-/g, 'm');
                }

                // 如果用户选择仅影响未来实例（默认行为）
                if (editScope === 'future') {
                    // 1) 更新属于 seriesId 的所有实例的元数据（但保留其 status/actualDuration）
                    tasks.forEach(t => {
                        if (t.seriesId && t.seriesId === seriesIdToUse) {
                            // 如果这是历史且已完成的实例，则保持不变（不修改历史已完成记录）
                            if (t.date < todayStr && t.status === 'completed') return;
                            // update metadata fields for other instances
                            t.name = taskName;
                            t.subject = taskSubject;
                            t.plannedDuration = baseTask.plannedDuration;
                            t.coins = baseTask.coins;
                            t.description = baseTask.description;
                            t.frequency = taskFrequency;
                            t.nDays = taskFrequency === 'every_n_days' ? nDaysInput : null;
                            t.weekdays = taskFrequency === 'weekly' ? selectedWeekdays : null;
                            t.startDate = hasStartDate && startDate ? startDate : (t.startDate || null);
                            t.endDate = hasEndDate && endDate ? endDate : (t.endDate || null);
                        }
                    });

                    // 2) 删除未来（>= today）的实例（会重新生成）
                    tasks = tasks.filter(t => !(t.seriesId && t.seriesId === seriesIdToUse && t.date >= todayStr));

                    // 3) 生成新的未来实例（从 max(start, today) 到 endLimit）
                    const genStart = hasStartDate && startDate ? new Date(startDate) : new Date();
                    const regenStart = new Date(Math.max(new Date(genStart).setHours(0,0,0,0), new Date().setHours(0,0,0,0)));
                    let regenEnd = null;
                    if (hasEndDate && endDate) regenEnd = new Date(endDate);
                    else {
                        if (taskFrequency === 'once') regenEnd = regenStart;
                        else { regenEnd = new Date(regenStart); regenEnd.setDate(regenEnd.getDate() + 365); }
                    }
                    // iterate
                    const curDate = new Date(regenStart);
                    const regenDates = [];
                    while (curDate <= regenEnd) {
                        const dateStr = toISODateLocal(curDate);
                        let shouldAdd = false;
                        switch (taskFrequency) {
                            case 'daily': shouldAdd = true; break;
                            case 'every_n_days': {
                                const diffDays = Math.floor((curDate - genStart) / (1000 * 60 * 60 * 24));
                                shouldAdd = diffDays % nDaysInput === 0; break;
                            }
                            case 'weekly': shouldAdd = selectedWeekdays.includes(curDate.getDay()); break;
                            case 'once': shouldAdd = true; break;
                        }
                        if (shouldAdd) regenDates.push(dateStr);
                        if (taskFrequency === 'once') break;
                        curDate.setDate(curDate.getDate() + 1);
                    }

                    regenDates.forEach((d, idx) => {
                        tasks.push({
                            id: Date.now() + Math.floor(Math.random() * 100000) + idx,
                            name: taskName,
                            subject: taskSubject,
                            description: baseTask.description,
                            plannedDuration: baseTask.plannedDuration,
                            coins: baseTask.coins,
                            actualDuration: 0,
                            status: 'pending',
                            date: d,
                            startDate: hasStartDate && startDate ? startDate : null,
                            endDate: hasEndDate && endDate ? endDate : null,
                            frequency: taskFrequency,
                            nDays: taskFrequency === 'every_n_days' ? nDaysInput : null,
                            weekdays: taskFrequency === 'weekly' ? selectedWeekdays : null,
                            seriesId: seriesIdToUse
                        });
                    });
                } else {
                    // editScope === 'all'：影响全部实例（包括历史） — 询问用户确认后删除该 series 的所有实例并基于新设置重建
                    const confirmed = await showDangerConfirm(`您选择了“影响历史与未来实例”。此操作将删除并重建整个系列（seriesId=${seriesIdToUse}），历史记录将丢失。是否继续？`, '确认编辑范围：影响全部实例');
                    if (!confirmed) {
                        // 用户取消，不做破坏性操作，直接保存当前被编辑的单条任务（已在 tasks[taskIndex] 更新）并退出编辑流程
                        saveData();
                        renderTaskList();
                        closeTaskModal();
                        return;
                    }

                    // 先删除所有属于该 seriesId 的任务
                    tasks = tasks.filter(t => !(t.seriesId && t.seriesId === seriesIdToUse));

                    // 生成整段时间的实例（从 start 到 endLimit），注意：循环任务在这里应当有 startDate
                    const genStartFull = hasStartDate && startDate ? new Date(startDate) : new Date();
                    let regenEndFull = null;
                    if (hasEndDate && endDate) regenEndFull = new Date(endDate);
                    else {
                        if (taskFrequency === 'once') regenEndFull = genStartFull;
                        else { regenEndFull = new Date(genStartFull); regenEndFull.setDate(regenEndFull.getDate() + 365); }
                    }

                    const curDateAll = new Date(genStartFull);
                    const regenDatesAll = [];
                    while (curDateAll <= regenEndFull) {
                        const dateStr = toISODateLocal(curDateAll);
                        let shouldAdd = false;
                        switch (taskFrequency) {
                            case 'daily': shouldAdd = true; break;
                            case 'every_n_days': {
                                const diffDays = Math.floor((curDateAll - genStartFull) / (1000 * 60 * 60 * 24));
                                shouldAdd = diffDays % nDaysInput === 0; break;
                            }
                            case 'weekly': shouldAdd = selectedWeekdays.includes(curDateAll.getDay()); break;
                            case 'once': shouldAdd = true; break;
                        }
                        if (shouldAdd) regenDatesAll.push(dateStr);
                        if (taskFrequency === 'once') break;
                        curDateAll.setDate(curDateAll.getDate() + 1);
                    }

                    regenDatesAll.forEach((d, idx) => {
                        tasks.push({
                            id: Date.now() + Math.floor(Math.random() * 100000) + idx,
                            name: taskName,
                            subject: taskSubject,
                            description: baseTask.description,
                            plannedDuration: baseTask.plannedDuration,
                            coins: baseTask.coins,
                            actualDuration: 0,
                            status: 'pending',
                            date: d,
                            startDate: hasStartDate && startDate ? startDate : null,
                            endDate: hasEndDate && endDate ? endDate : null,
                            frequency: taskFrequency,
                            nDays: taskFrequency === 'every_n_days' ? nDaysInput : null,
                            weekdays: taskFrequency === 'weekly' ? selectedWeekdays : null,
                            seriesId: seriesIdToUse
                        });
                    });
                }
            }
        }
    } else {
        // 添加新任务，根据打卡频次生成任务
    // 生成任务实例：对于一次性任务，使用 startDate（可为历史）或今天；
        // 对于循环任务，根据 start/end 生成实例。为避免无限生成，当未设置结束日期时，默认生成到未来一年（365天）。
    // 使用本地日期解析，避免时区导致日期偏移
    const start = hasStartDate && startDate ? parseISODateLocal(startDate) : new Date();
        let endLimit = null;
        if (hasEndDate && endDate) {
            endLimit = parseISODateLocal(endDate);
        } else {
            // 如果是一次性且无开始日期，通过今天生成单个；如果循环且无结束，则限制为一年
            if (taskFrequency === 'once') {
                endLimit = start; // single
            } else {
                endLimit = new Date(start);
                endLimit.setDate(endLimit.getDate() + 365);
            }
        }

    // 生成日期迭代
        const generateDates = [];
        const cur = new Date(start);
        while (cur <= endLimit) {
            const dateStr = toISODateLocal(cur);
            let shouldAdd = false;
            switch (taskFrequency) {
                case 'once':
                    shouldAdd = true; // only start date
                    break;
                case 'daily':
                    shouldAdd = true;
                    break;
                case 'every_n_days':
                    const diffDays = Math.floor((cur - start) / (1000 * 60 * 60 * 24));
                    shouldAdd = diffDays % nDaysInput === 0;
                    break;
                case 'weekly':
                    shouldAdd = selectedWeekdays.includes(cur.getDay());
                    break;
            }
            if (shouldAdd) generateDates.push(dateStr);
            if (taskFrequency === 'once') break; // 只添加一次
            cur.setDate(cur.getDate() + 1);
        }

        // 如果是循环任务，生成一个 seriesId 用于避免重复生成
        let seriesId = null;
        if (taskFrequency !== 'once') {
            // 生成基于任务核心字段的确定性 seriesId
            const seriesSeed = `${taskName}::${taskSubject}::${taskFrequency}::${start ? toISODateLocal(start) : ''}::${nDaysInput || ''}::${(selectedWeekdays || []).join(',')}`;
            // 简单哈希（非加密）
            seriesId = 's_' + Array.from(seriesSeed).reduce((acc, ch) => ((acc << 5) - acc) + ch.charCodeAt(0), 0).toString(36).replace(/-/g, 'm');

            // 删除已有 tasks 中属于同一 seriesId 的旧实例，以避免重复
            tasks = tasks.filter(t => !(t.seriesId && t.seriesId === seriesId));
        }

        generateDates.forEach((dateStr, idx) => {
            tasks.push({
                id: Date.now() + Math.floor(Math.random() * 100000) + idx,
                ...baseTask,
                date: dateStr,
                startDate: start ? toISODateLocal(start) : null,
                endDate: endLimit ? toISODateLocal(endLimit) : null,
                frequency: taskFrequency,
                nDays: taskFrequency === 'every_n_days' ? nDaysInput : null,
                weekdays: taskFrequency === 'weekly' ? selectedWeekdays : null,
                seriesId: seriesId
            });
        });
        addActivityLog('task_add', `添加了新任务「${taskName}」`);
    }
    
    saveData();
    renderTaskList();
    updateStatistics();
    closeTaskModal();
}

// 删除任务
function deleteTask(taskId) {
    withPasswordVerification('删除任务需要验证密码', () => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (confirm('确定要删除这个任务吗？')) {
            tasks = tasks.filter(t => t.id !== taskId);
            saveData();
            renderTaskList();
            updateStatistics();
            
            // 添加操作记录
            if (taskToDelete) {
                addActivityLog('task_delete', `删除了任务「${taskToDelete.name}」`);
            }
        }
    });
}

// 获取用户总金币数
function getUserCoins() {
    const savedCoins = localStorage.getItem(`timeManagementCoins_${currentUserId}`);
    return savedCoins ? parseInt(savedCoins) : 0;
}

// 根据用户ID获取金币数
function getUserCoinsByUserId(userId) {
    const savedCoins = localStorage.getItem(`timeManagementCoins_${userId}`);
    return savedCoins ? parseInt(savedCoins) : 0;
}

// 根据用户ID获取小心愿数据
function getUserWishesByUserId(userId) {
    const savedWishes = localStorage.getItem(`timeManagementWishes_${userId}`);
    return savedWishes ? JSON.parse(savedWishes) : [];
}

// 保存用户金币数
function saveUserCoins(coins) {
    localStorage.setItem(`timeManagementCoins_${currentUserId}`, coins);
}

// 带密码验证的金币管理函数
function manageUserCoins(newCoins) {
    withPasswordVerification('修改金币数量需要验证密码', () => {
        saveUserCoins(newCoins);
        updateCoinsDisplay();
        updateWishesCoinsDisplay();
        showNotification('金币数量更新成功', 'success');
    });
}

// 更新显示金币数
function updateCoinsDisplay() {
    const totalCoins = getUserCoins();
    const coinsDisplay = document.getElementById('totalCoins');
    if (coinsDisplay) {
        coinsDisplay.textContent = totalCoins;
    }
}

// 初始化金币修改功能
function initCoinsModification() {
    // 使用更精确的选择器找到金币图标元素
    // 先找到包含金币的容器，再找到其中的图标
    const coinsContainer = document.querySelector('#calendar-page section.grid div:last-child');
    if (coinsContainer) {
        const coinsIcon = coinsContainer.querySelector('i.fa.fa-money');
        const iconWrapper = coinsIcon ? coinsIcon.parentElement : null;
        
        if (iconWrapper) {
            // 添加样式和事件监听器到图标容器
            iconWrapper.style.cursor = 'pointer';
            iconWrapper.title = '单击修改金币数量';
            iconWrapper.addEventListener('click', showModifyCoinsDialog);
            
            // 同时也为金币数字添加点击事件，提供更好的用户体验
            const coinsNumber = coinsContainer.querySelector('#totalCoins');
            if (coinsNumber) {
                coinsNumber.style.cursor = 'pointer';
                coinsNumber.title = '单击修改金币数量';
                coinsNumber.addEventListener('click', showModifyCoinsDialog);
            }
        }
    }
    
    // 添加页面切换时的重新初始化
    const originalSwitchPage = enhancedSwitchPage;
    window.enhancedSwitchPage = function(pageId) {
        originalSwitchPage(pageId);
        // 当切换到日历页面时重新初始化金币修改功能
        if (pageId === 'calendar') {
            setTimeout(initCoinsModification, 100); // 延迟一点确保DOM已更新
        }
    };
}

// 显示修改金币对话框
function showModifyCoinsDialog() {
    withPasswordVerification('修改金币数量需要验证密码', () => {
        // 获取当前金币数并显示对话框
        const currentCoins = getUserCoins();
        const modifyCoinsDialog = document.getElementById('modifyCoinsDialog');
        const currentCoinsValue = document.getElementById('currentCoinsValue');
        const newCoinsInput = document.getElementById('newCoinsInput');
        const coinsReasonInput = document.getElementById('coinsReasonInput');
        
        if (modifyCoinsDialog && currentCoinsValue && newCoinsInput && coinsReasonInput) {
            // 设置当前金币数显示
            currentCoinsValue.textContent = currentCoins;
            
            // 清空输入框
            newCoinsInput.value = '';
            coinsReasonInput.value = '';
            
            // 显示对话框
            modifyCoinsDialog.classList.remove('hidden');
            newCoinsInput.focus();
            
            // 保存函数 - 处理金币修改
            function handleSaveCoins() {
                const newCoins = newCoinsInput.value;
                const coinsNum = parseInt(newCoins);
                const reason = coinsReasonInput.value;
                
                if (!isNaN(coinsNum)) {
                    if (reason !== null && reason.trim() !== '') {
                        // 保存新的金币数量
                        saveUserCoins(coinsNum);
                        
                        // 更新显示
                        updateCoinsDisplay();
                        updateWishesCoinsDisplay();
                        
                        // 记录操作日志
                        const coinsDifference = coinsNum - currentCoins;
                        const actionDescription = `修改金币数量从 ${currentCoins} 到 ${coinsNum}（${coinsDifference > 0 ? '增加' : '减少'} ${Math.abs(coinsDifference)} 金币），原因：${reason}`;
                        addActivityLog('coins_modify', actionDescription);
                        
                        // 显示成功通知
                        showNotification('金币数量修改成功', 'success');
                        
                        // 关闭对话框
                        closeModifyCoinsDialog();
                    } else {
                        showNotification('请输入修改原因', 'error');
                    }
                } else {
                    showNotification('请输入有效的数字', 'error');
                }
            }
            
            // 关闭对话框函数
            function closeModifyCoinsDialog() {
                modifyCoinsDialog.classList.add('hidden');
                // 移除事件监听器以避免重复绑定
                saveCoinsBtn.removeEventListener('click', handleSaveCoins);
                modifyCoinsCloseBtn.removeEventListener('click', closeModifyCoinsDialog);
                cancelCoinsBtn.removeEventListener('click', closeModifyCoinsDialog);
            }
            
            // 获取对话框按钮元素
            const saveCoinsBtn = document.getElementById('saveCoinsBtn');
            const modifyCoinsCloseBtn = document.getElementById('modifyCoinsCloseBtn');
            const cancelCoinsBtn = document.getElementById('cancelCoinsBtn');
            
            // 添加事件监听器
            if (saveCoinsBtn) {
                saveCoinsBtn.addEventListener('click', handleSaveCoins);
            }
            
            if (modifyCoinsCloseBtn) {
                modifyCoinsCloseBtn.addEventListener('click', closeModifyCoinsDialog);
            }
            
            if (cancelCoinsBtn) {
                cancelCoinsBtn.addEventListener('click', closeModifyCoinsDialog);
            }
            
            // 添加回车键事件监听
            newCoinsInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    coinsReasonInput.focus();
                }
            });
            
            coinsReasonInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveCoins();
                }
            });
        }
    });
}

// 更新小心愿页面的金币显示
function updateWishesCoinsDisplay() {
    if (wishesCoinsDisplayEl) {
        wishesCoinsDisplayEl.textContent = getUserCoins();
    }
}

// 打开添加小心愿模态框
function openAddWishModal() {
    withPasswordVerification('添加心愿需要验证密码', () => {
        currentWishId = null;
        wishModalTitleEl.textContent = '添加小心愿';
        wishFormEl.reset();
        // 重置图标预览
        wishIconPreviewEl.innerHTML = '<i class="fa fa-gift text-blue-500"></i>';
        
        wishModalEl.classList.remove('hidden');
        wishNameEl.focus();
    });
}

// 打开编辑小心愿模态框
function openEditWishModal(wishId) {
    withPasswordVerification('编辑心愿需要验证密码', () => {
        const wish = wishes.find(w => w.id === wishId);
        if (!wish) return;
        
        currentWishId = wishId;
        wishModalTitleEl.textContent = '编辑小心愿';
        
        // 填充表单数据
        wishNameEl.value = wish.name;
        wishContentEl.value = wish.content;
        wishCostEl.value = wish.cost;
        
        // 更新图标预览
        if (wish.iconType === 'image' && wish.icon) {
            wishIconPreviewEl.innerHTML = `<img src="${wish.icon}" alt="${wish.name}" class="w-full h-full object-cover rounded-xl">`;
        } else if (wish.iconType === 'emoji' && wish.iconEmoji) {
            wishIconPreviewEl.textContent = wish.iconEmoji;
        } else {
            wishIconPreviewEl.innerHTML = '<i class="fa fa-gift text-blue-500"></i>';
        }
        
        wishModalEl.classList.remove('hidden');
    });
}

// 关闭小心愿模态框
function closeWishModal() {
    wishModalEl.classList.add('hidden');
    currentWishId = null;
    wishIconUploadEl.value = '';
}

// 处理小心愿图标上传
function handleWishIconUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.match('image.*')) {
        showNotification('请选择有效的图片文件', 'warning');
        return;
    }
    
    // 使用FileReader读取图片
    const reader = new FileReader();
    reader.onload = function(e) {
        // 更新预览
        wishIconPreviewEl.innerHTML = `<img src="${e.target.result}" alt="预览" class="w-full h-full object-cover rounded-xl">`;
    };
    reader.readAsDataURL(file);
}

// 处理小心愿表单提交
function handleWishFormSubmit(e) {
    e.preventDefault();
    
    const name = wishNameEl.value.trim();
    const content = wishContentEl.value.trim();
    const cost = parseInt(wishCostEl.value) || 0;
    
    if (!name) {
        showNotification('请输入愿望名称', 'warning');
        return;
    }
    
    if (cost <= 0) {
        showNotification('请输入有效的所需金币数', 'warning');
        return;
    }
    
    // 创建小心愿对象
    const wishData = {
        name,
        content,
        cost,
        status: 'available'
    };
    
    // 添加密码验证
    return withPasswordVerification(currentWishId ? '编辑心愿需要验证密码' : '添加心愿需要验证密码', () => {
        // 检查是否有上传的图片
        if (wishIconUploadEl.files.length > 0) {
            const file = wishIconUploadEl.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                wishData.icon = e.target.result;
                wishData.iconType = 'image';
                saveWish(wishData);
                // 添加操作记录
                addActivityLog(currentWishId ? 'wish_edit' : 'wish_add', currentWishId ? `编辑了心愿「${wishData.name}」` : `添加了心愿「${wishData.name}」`);
            };
            reader.readAsDataURL(file);
        } else {
            // 如果没有上传图片，检查是否是已有的emoji图标
            const currentWish = wishes.find(w => w.id === currentWishId);
            if (currentWish && currentWish.iconType === 'emoji') {
                wishData.iconType = 'emoji';
                wishData.iconEmoji = currentWish.iconEmoji;
            } else {
                // 默认使用emoji
                wishData.iconType = 'emoji';
                wishData.iconEmoji = '🎁';
            }
            saveWish(wishData);
            // 添加操作记录
            addActivityLog(currentWishId ? 'wish_edit' : 'wish_add', currentWishId ? `编辑了心愿「${wishData.name}」` : `添加了心愿「${wishData.name}」`);
        }
        return true;
    });
}

// 保存小心愿
function saveWish(wishData) {
    if (currentWishId) {
        // 编辑现有小心愿
        const wishIndex = wishes.findIndex(w => w.id === currentWishId);
        if (wishIndex !== -1) {
            wishes[wishIndex] = { ...wishes[wishIndex], ...wishData };
        }
    } else {
        // 添加新小心愿
        wishes.push({
            id: Date.now(),
            ...wishData
        });
    }
    
    // 保存到本地存储
    saveWishes();
    
    // 关闭模态框
    closeWishModal();
    
    // 重新渲染列表
    renderWishesList();
    
    showNotification(currentWishId ? '小心愿更新成功！' : '小心愿添加成功！', 'success');
}

// 删除小心愿
function deleteWish(wishId) {
    return withPasswordVerification('删除心愿需要验证密码', () => {
        return showConfirmDialog('确定要删除这个小心愿吗？').then(confirmed => {
            if (confirmed) {
                wishes = wishes.filter(w => w.id !== wishId);
                saveWishes();
                renderWishesList();
                showNotification('小心愿已删除', 'success');
            }
            return confirmed;
        });
    });
}

// 兑换小心愿
function redeemWish(wishId) {
    return withPasswordVerification('心愿兑换需要验证密码', () => {
        const wish = wishes.find(w => w.id === wishId);
        if (!wish) return;
        
        const currentCoins = getUserCoins();
        if (currentCoins < wish.cost) {
            showNotification('金币不足，无法兑换', 'error');
            return;
        }
        
        showConfirmDialog(`确定要花费 ${wish.cost} 金币兑换「${wish.name}」吗？`).then(confirmed => {
            if (confirmed) {
                // 扣除金币
                saveUserCoins(currentCoins - wish.cost);
                
                // 增加兑换次数，不改变心愿状态
                if (!wish.redemptionCount) {
                    wish.redemptionCount = 0;
                }
                wish.redemptionCount++;
                
                // 保存到本地存储但不通过saveWishes()函数添加操作记录
                localStorage.setItem(`timeManagementWishes_${currentUserId}`, JSON.stringify(wishes));
                
                // 直接添加正确的兑换操作记录
                addActivityLog('wish_redeem', `兑换了心愿「${wish.name}」，花费${wish.cost}金币`);
                
                // 更新显示
                renderWishesList();
                updateWishesCoinsDisplay();
                updateCoinsDisplay();
                
                showNotification(`成功兑换「${wish.name}」！`, 'success');
            }
        });
    });
}

// 渲染小心愿列表
function renderWishesList() {
    if (!wishesListEl) return;
    
    wishesListEl.innerHTML = '';
    
    if (wishes.length === 0) {
        wishesListEl.innerHTML = `
            <div class="col-span-2 text-center py-10 text-textSecondary">
                <i class="fa fa-star-o text-4xl mb-2"></i>
                <p>还没有小心愿，快来添加吧！</p>
            </div>
        `;
        return;
    }
    
    // 按状态排序：可用的在前，已兑换的在后
    const sortedWishes = [...wishes].sort((a, b) => {
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (a.status !== 'available' && b.status === 'available') return 1;
        return 0;
    });
    
    sortedWishes.forEach(wish => {
        const wishCard = document.createElement('div');
        wishCard.className = `bg-white rounded-xl shadow-card p-3 card-hover relative overflow-hidden`;
        
        // 生成图标HTML
        let iconHtml = '';
        if (wish.iconType === 'image' && wish.icon) {
            iconHtml = `<img src="${wish.icon}" alt="${wish.name}" class="w-12 h-12 object-cover rounded-lg mb-2">`;
        } else if (wish.iconType === 'emoji' && wish.iconEmoji) {
            iconHtml = `<div class="text-3xl mb-2">${wish.iconEmoji}</div>`;
        } else {
            iconHtml = `<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl mb-2">
                            <i class="fa fa-gift text-blue-500"></i>
                        </div>`;
        }
        
        // 生成操作按钮
        let actionHtml = '';
        const currentCoins = getUserCoins();
        const canRedeem = currentCoins >= wish.cost;
        
        // 检查是否有兑换次数
        const redemptionCount = wish.redemptionCount || 0;
        
        // 总是显示可兑换按钮，只要金币足够
        actionHtml = `
            <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-amber-500 font-medium">
                    <i class="fa fa-coins mr-1"></i>${wish.cost}
                </span>
                ${redemptionCount > 0 ? `
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-400">已兑换${redemptionCount}次</span>
                        <button onclick="redeemWish(${wish.id})" 
                            class="text-xs px-2 py-1 rounded-full transition-colors ${canRedeem ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400'}">
                            ${canRedeem ? '可兑换' : '金币不足'}
                        </button>
                    </div>
                ` : `
                    <button onclick="redeemWish(${wish.id})" 
                        class="text-xs px-2 py-1 rounded-full transition-colors ${canRedeem ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400'}">
                        ${canRedeem ? '可兑换' : '金币不足'}
                    </button>
                `}
            </div>
        `;
        
        wishCard.innerHTML = `
            ${iconHtml}
            <h3 class="font-medium text-sm mb-1 line-clamp-1">${wish.name}</h3>
            <p class="text-xs text-textSecondary mb-2 line-clamp-2">${wish.content}</p>
            ${actionHtml}
            
            <!-- 编辑和删除按钮 -->
            <div class="absolute top-1 right-1 flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
                <button onclick="openEditWishModal(${wish.id})" class="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-textSecondary hover:text-primary">
                    <i class="fa fa-pencil text-xs"></i>
                </button>
                <button onclick="deleteWish(${wish.id})" class="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-textSecondary hover:text-red-500">
                    <i class="fa fa-trash text-xs"></i>
                </button>
            </div>
        `;
        
        wishesListEl.appendChild(wishCard);
    });
}

// 切换任务完成状态
function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const wasCompleted = task.status === 'completed';
        
        if (!wasCompleted) {
            // 如果是从未完成变为已完成，也需要密码验证
            renderTaskList();
            
            withPasswordVerification('将任务标记为已完成需要验证密码', () => {
                task.status = 'completed';
                
                // 添加操作记录
                addActivityLog('task_status_change', `将任务「${task.name}」标记为已完成`);
                
                if (task.actualDuration === 0) {
                    task.actualDuration = task.plannedDuration;
                }
                
                // 更新金币数
                const currentCoins = getUserCoins();
                const taskCoins = task.coins || 0;
                
                // 完成任务，增加金币
                saveUserCoins(currentCoins + taskCoins);
                updateCoinsDisplay();
                // 显示获得金币的提示
                showNotification(`获得 ${taskCoins} 个金币！`, 'success');
                
                saveData();
                renderTaskList();
                updateStatistics();
                updateCoinsDisplay();
            });
        } else {
            // 如果是从已完成变为未完成，需要密码验证
            // 立即重新渲染任务列表，将复选框恢复为选中状态
            // 这样在密码验证过程中，复选框状态会保持为已完成
            renderTaskList();
            
            withPasswordVerification('将任务标记为未完成需要验证密码', () => {
                task.status = 'pending';
                
                // 添加操作记录
                addActivityLog('task_status_change', `将任务「${task.name}」标记为待完成`);
                
                // 更新金币数
                const currentCoins = getUserCoins();
                const taskCoins = task.coins || 0;
                
                // 取消完成，减少金币
                const newCoins = Math.max(0, currentCoins - taskCoins);
                saveUserCoins(newCoins);
                updateCoinsDisplay();
                
                saveData();
                renderTaskList();
                updateStatistics();
                updateCoinsDisplay();
            });
        }
    }
}

// 渲染任务列表
function renderTaskList(filter = 'all') {
    // 使用选中的日期，而不是默认的今天
    let filteredTasks = tasks.filter(task => task.date === selectedDate).filter(task => isTaskVisible(selectedDate, task));
    
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
                            <div class="flex items-center space-x-3 ml-2">
                                    <button class="text-primary p-1 rounded-full hover:bg-primary/10 transition-colors" onclick="openPomodoroModal(${task.id})" title="开始番茄钟">
                                        <img src="static/images/番茄钟.png" alt="番茄钟" class="w-5 h-5">
                                    </button>
                                    ${(() => {
                                        // 计划时长：若未设置或为0，显示默认 10 分钟 的浅色斜体样式
                                        const hasDuration = task.plannedDuration && task.plannedDuration > 0;
                                        const displayDur = hasDuration ? formatDuration(task.plannedDuration) : formatDuration(10);
                                        const durExtra = task.actualDuration > 0 ? ` / ${formatDuration(task.actualDuration)}` : '';
                                        const durCls = hasDuration ? 'text-xs text-textSecondary whitespace-nowrap' : 'text-xs italic text-gray-400 whitespace-nowrap';
                                        return `<span class="${durCls}">${displayDur}${durExtra}</span>`;
                                    })()}
                                    ${(() => {
                                        // 奖励金币：若未设置或为0，显示默认 1 金币 的浅色斜体样式
                                        const coinsVal = (task.coins || task.coins === 0) ? task.coins : null;
                                        const hasCoins = coinsVal !== null && coinsVal > 0;
                                        const displayCoins = hasCoins ? coinsVal : 1;
                                        const coinCls = hasCoins ? 'text-xs text-amber-500 whitespace-nowrap flex items-center' : 'text-xs italic text-amber-300 whitespace-nowrap flex items-center';
                                        return `<span class="${coinCls}"><i class="fa fa-coins mr-1"></i>${displayCoins}</span>`;
                                    })()}
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
    const dayStr = toISODateLocal(day);
        const dayTasks = tasks.filter(task => task.date === dayStr);
        const completedTasks = dayTasks.filter(task => task.status === 'completed').length;
        
        // 设置日期元素的基础样式
        let dayClass = 'flex flex-col items-center justify-center h-16 rounded-xl transition-colors relative cursor-pointer';
        
        // 选中日期样式
        if (dayStr === selectedDate) {
            dayClass += ' bg-primary text-white';
        } else if (isToday) {
            // 今日日期特殊样式，但未被选中
            dayClass += ' hover:bg-gray-100';
        } else if (isCurrentMonth) {
            dayClass += ' hover:bg-gray-100';
        } else {
            dayClass += ' text-gray-400';
        }
        
        const dayEl = document.createElement('div');
        dayEl.className = dayClass;        
        
        // 添加点击事件，切换到该日期的任务列表
        dayEl.addEventListener('click', () => {
            selectedDate = dayStr;
            renderTaskList();
            updateStatisticsForSelectedDate();
            renderCalendar(); // 重新渲染日历以更新选中状态
        });
        
        dayEl.innerHTML = `
            <span class="font-medium">${dayDate}</span>
            ${isToday ? '<span class="text-xs mt-1 bg-primary/30 px-1.5 py-0.5 rounded-full font-medium">今</span>' : ''}
            ${dayTasks.length > 0 ? `
                <div class="absolute bottom-2 left-0 right-0 flex justify-center space-x-0.5">
                    ${Array(dayTasks.length).fill(0).map((_, index) => `
                        <span class="w-1.5 h-1.5 rounded-full ${index < completedTasks ? 'bg-green-500' : 'bg-gray-300'}"></span>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        // 为今日日期添加特殊边框标记，使其更明显
        if (isToday && dayStr !== selectedDate) {
            const todayMarker = document.createElement('div');
            todayMarker.className = 'absolute inset-0 rounded-xl border-2 border-primary opacity-70';
            dayEl.appendChild(todayMarker);
        }
        
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
    weekDays.push(toISODateLocal(day));
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
    const today = toISODateLocal(new Date());
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
    const today = toISODateLocal(new Date());
    const todayTasks = tasks.filter(task => task.date === today);
    const completedTasks = todayTasks.filter(task => task.status === 'completed');
    
    // 计算学习时间（包含所有学科）
    let studyTime = 0;
    
    // 计算今日金币
    let todayCoins = 0;
    
    completedTasks.forEach(task => {
        const duration = task.actualDuration || task.plannedDuration;
        studyTime += duration; // 所有学科的任务时长都计入学习时间
        todayCoins += task.coins || 0; // 累计今日获得的金币
    });
    
    // 计算完成率
    const completionRate = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;
    
    // 更新UI
    document.getElementById('studyTime').textContent = formatDuration(studyTime);
    document.getElementById('taskCount').textContent = todayTasks.length;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    document.getElementById('todayCoins').textContent = todayCoins; // 更新今日金币显示
}

// 更新选中日期的统计数据
function updateStatisticsForSelectedDate() {
    const selectedDateTasks = tasks.filter(task => task.date === selectedDate);
    const completedTasks = selectedDateTasks.filter(task => task.status === 'completed');
    
    // 计算学习时间（包含所有学科）
    let studyTime = 0;
    
    completedTasks.forEach(task => {
        const duration = task.actualDuration || task.plannedDuration;
        studyTime += duration; // 所有学科的任务时长都计入学习时间
    });
    
    // 计算完成率
    const completionRate = selectedDateTasks.length > 0 ? Math.round((completedTasks.length / selectedDateTasks.length) * 100) : 0;
    
    // 更新UI
    document.getElementById('studyTime').textContent = formatDuration(studyTime);
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
        // 控制开始/结束日期显示与启用
        if (selectedFrequency === 'once') {
            // 一次性任务：结束日期隐藏，开始日期可选（允许历史补卡）
            if (endDateContainer) endDateContainer.style.display = 'none';
            if (enableStartDateCheckbox) {
                // 不强制启用开始日期
                // keep current state
            }
        } else {
            // 循环任务：必须启用开始日期（默认今天），结束日期可选
            if (endDateContainer) endDateContainer.style.display = 'block';
            if (enableStartDateCheckbox) {
                enableStartDateCheckbox.checked = true;
                if (startDateInput) startDateInput.disabled = false;
            }
            // endDate disabled state handled by its checkbox listener
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
    
    // 仅在有用户任务数据时才检查荣誉
    // 避免在数据清空后自动生成模拟荣誉
    const tasks = getUserTasks();
    if (tasks && tasks.length > 0) {
        // 检查连续打卡天数（此处为简化示例，实际应根据真实数据计算）
        // const today = new Date().toISOString().split('T')[0];
        // let consecutiveDays = calculateConsecutiveDays(tasks);
        
        // 这里不再自动模拟添加荣誉，而是等待用户实际完成任务后再授予
    }
    
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

// 修改switchPage函数，添加小心愿页面的渲染逻辑
function enhancedSwitchPage(pageName) {
    // 隐藏所有页面
    calendarPageEl.classList.add('hidden');
    subjectsPageEl.classList.add('hidden');
    profilePageEl.classList.add('hidden');
    if (wishesPageEl) wishesPageEl.classList.add('hidden');
    
    // 移除所有导航按钮的活动状态
    navCalendarBtn.classList.remove('active');
    navSubjectsBtn.classList.remove('active');
    navProfileBtn.classList.remove('active');
    if (navWishesBtn) navWishesBtn.classList.remove('active');
    
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
    } else if (pageName === 'wishes' && wishesPageEl && navWishesBtn) {
        wishesPageEl.classList.remove('hidden');
        navWishesBtn.classList.add('active');
        
        // 渲染小心愿页面内容
        renderWishesList();
        updateWishesCoinsDisplay();
    }
}

// 重命名原始函数并替换为增强版
window.switchPage = enhancedSwitchPage;

// 暴露小心愿相关函数到window对象，以便在HTML中直接调用
window.openEditWishModal = openEditWishModal;
window.deleteWish = deleteWish;
window.redeemWish = redeemWish;

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
    
    // 更新用户信息显示（包括顶部导航栏）
    updateCurrentUserInfo();
    
    // 初始化显示日历页面
    enhancedSwitchPage('calendar');
    
    // 添加事件监听器
    setupEventListeners();
    setupSubjectFilterListeners();
    
    // 更新金币显示
    updateCoinsDisplay();
    updateStatistics(); // 更新统计数据，包括今日金币
    
    // 初始化金币修改功能
    initCoinsModification();
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
    
    // 确保悬浮球隐藏 - 最重要的是在这里也隐藏悬浮球
    const miniPomodoro = document.getElementById('pomodoroMini');
    if (miniPomodoro) {
        miniPomodoro.classList.add('hidden');
    }
    if (pomodoroMiniEl) {
        pomodoroMiniEl.classList.add('hidden');
    }
    
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
                
                // 立即隐藏悬浮球
                const miniPomodoro = document.getElementById('pomodoroMini');
                if (miniPomodoro) {
                    miniPomodoro.classList.add('hidden');
                }
                if (pomodoroMiniEl) {
                    pomodoroMiniEl.classList.add('hidden');
                }
                
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
            // 如果任务之前不是已完成状态，才增加金币
            const wasCompleted = task.status === 'completed';
            
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
            
            // 如果任务之前不是已完成状态，增加金币
            if (!wasCompleted) {
                const taskCoins = task.coins || 0;
                const currentCoins = getUserCoins();
                const updatedCoins = currentCoins + taskCoins;
                saveUserCoins(updatedCoins); // 直接保存金币，不需要密码验证
                updateCoinsDisplay();
                // 显示获得金币的提示
                showNotification(`获得 ${taskCoins} 个金币！`, 'success');
            }
            
            // 添加操作记录
            addActivityLog('task_complete_pomodoro', `通过番茄钟完成了任务「${task.name}」，耗时${task.actualDuration}分钟`);
            
            // 保存数据
            saveData();
            
            // 更新UI
            renderTaskList();
            updateStatistics();
            
            // 确保悬浮球隐藏 - 提前执行隐藏悬浮球操作
            const miniPomodoro = document.getElementById('pomodoroMini');
            if (miniPomodoro) {
                miniPomodoro.classList.add('hidden');
            }
            
            // 同时确保全局变量引用也隐藏
            if (pomodoroMiniEl) {
                pomodoroMiniEl.classList.add('hidden');
            }
            
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

// 添加操作记录相关事件监听
function setupActivityLogListeners() {
    // 操作记录按钮点击事件
    const activityLogBtn = document.getElementById('activityLogBtn');
    const activityLogModal = document.getElementById('activityLogModal');
    const closeActivityLogBtn = document.getElementById('closeActivityLogBtn');
    const clearActivityLogBtn = document.getElementById('clearActivityLogBtn');
    
    if (activityLogBtn && activityLogModal) {
        activityLogBtn.addEventListener('click', function() {
            displayActivityLogs();
            activityLogModal.classList.remove('hidden');
        });
    }
    
    if (closeActivityLogBtn && activityLogModal) {
        closeActivityLogBtn.addEventListener('click', function() {
            activityLogModal.classList.add('hidden');
        });
    }
    
    if (clearActivityLogBtn) {
        clearActivityLogBtn.addEventListener('click', function() {
            showConfirmDialog('确定要清空所有操作记录吗？此操作不可撤销。').then(confirmed => {
                if (confirmed) {
                    clearActivityLogs();
                }
            });
        });
    }
    
    // 点击模态框外部关闭
    if (activityLogModal) {
        activityLogModal.addEventListener('click', function(e) {
            if (e.target === activityLogModal) {
                activityLogModal.classList.add('hidden');
            }
        });
    }
}

// 修改增强版初始化函数，添加操作记录监听器
function enhancedInitAppWithLogs() {
    enhancedInitApp();
    setupActivityLogListeners();
}

// 初始化应用
document.addEventListener('DOMContentLoaded', enhancedInitAppWithLogs);

// 在关键操作点添加操作记录
// 覆盖一些关键函数以添加操作记录
const originalSaveData = saveData;
saveData = function() {
    originalSaveData.apply(this, arguments);
    // 注意：不要在saveData中添加操作记录，因为它会被其他函数频繁调用，可能导致循环调用
};

// 在关键操作点添加操作记录的示例（这些需要根据实际代码结构进行调整）
// 这里只是添加框架，实际的操作记录需要在各个具体函数中添加

// 为任务完成函数添加操作记录
const originalCompleteTaskFromPomodoro = completeTaskFromPomodoro;
completeTaskFromPomodoro = function() {
    const task = tasks.find(t => t.id === currentPomodoroTaskId);
    const result = originalCompleteTaskFromPomodoro.apply(this, arguments);
    if (task) {
        const duration = Math.max(1, Math.ceil((Date.now() - task.pomodoroStartTime) / 60000));
        addActivityLog('task_complete', `完成了任务「${task.name}」，用时${duration}分钟`);
    }
    return result;
};

// 为番茄钟开始函数添加操作记录
const originalStartPomodoroTimer = startPomodoroTimer;
startPomodoroTimer = function() {
    const result = originalStartPomodoroTimer.apply(this, arguments);
    if (!isPomodoroRunning && pomodoroRemainingTime > 0) {
        const task = tasks.find(t => t.id === currentPomodoroTaskId);
        if (task && !task.pomodoroStartTime) {
            task.pomodoroStartTime = Date.now();
            addActivityLog('pomodoro_start', `开始了任务「${task.name}」的番茄钟`);
        }
    }
    return result;
};

// 移除了重复的操作记录添加逻辑，因为saveWishes()函数已经添加了wish_update记录

// 为小心愿删除函数添加操作记录
if (window.deleteWish) {
    const originalDeleteWish = window.deleteWish;
    window.deleteWish = function(wishId) {
        const wishToDelete = wishes.find(w => w.id === wishId);
        return originalDeleteWish(wishId).then(confirmed => {
            if (confirmed && wishToDelete) {
                addActivityLog('wish_delete', `删除了心愿「${wishToDelete.name}」`);
            }
            return confirmed;
        });
    };
}

// 为小心愿编辑和添加函数添加操作记录（需要在实际的函数中添加）

// 为用户删除函数添加操作记录（保留一次密码验证）
const originalDeleteUser = deleteUser;
deleteUser = function(userId) {
    const userToDelete = users.find(u => u.id === userId);
    // 直接调用原始函数，因为原始函数已经包含密码验证
    const result = originalDeleteUser.apply(this, [userId]);
    // 添加操作记录
    if (userToDelete) {
        addActivityLog('user_delete', `删除了用户「${userToDelete.name}」`);
    }
    return result;
};

// 为数据清除函数添加操作记录
if (window.clearUserData) {
    const originalClearUserData = window.clearUserData;
    window.clearUserData = function() {
        return withPasswordVerification('清除数据需要验证密码', () => {
            return showConfirmDialog('确定要清除所有数据吗？此操作不可撤销！').then(confirmed => {
                if (confirmed) {
                    const result = originalClearUserData.apply(this, arguments);
                    addActivityLog('data_clear', '清除了所有用户数据');
                    return result;
                }
                return false;
            });
        });
    };
}

// 初始化任务表单的日期控件
function initTaskDateControls() {
    if (startDateInput) {
        startDateInput.value = toISODateLocal(new Date());
        startDateInput.disabled = true;
    }
    if (enableStartDateCheckbox) {
        enableStartDateCheckbox.checked = false;
        enableStartDateCheckbox.addEventListener('change', () => {
            if (startDateInput) startDateInput.disabled = !enableStartDateCheckbox.checked;
        });
    }
    if (enableEndDateCheckbox) {
        enableEndDateCheckbox.checked = false;
        enableEndDateCheckbox.addEventListener('change', () => {
            if (endDateInput) endDateInput.disabled = !enableEndDateCheckbox.checked;
        });
    }
    if (endDateInput) {
        endDateInput.disabled = true;
    }
    // 初始时一次性任务隐藏结束日期容器
    if (endDateContainer) endDateContainer.style.display = 'block';
}

// 判断任务在某日期是否可见（基于 startDate/endDate）
function isTaskVisible(dateStr, task) {
    // 如果任务有开始日期，且查询日期在开始日期之前，则不可见
    if (task.startDate) {
        if (new Date(dateStr) < new Date(task.startDate)) return false;
    }
    // 如果任务有结束日期，且查询日期在结束日期之后，则不可见
    if (task.endDate) {
        if (new Date(dateStr) > new Date(task.endDate)) return false;
    }
    return true;
}

// 通用确认对话框，返回 Promise<boolean>
function showConfirmDialog(message, title = '确认操作') {
    return new Promise((resolve) => {
        const confirmDialog = document.getElementById('confirmDialog');
        const confirmDialogTitle = document.getElementById('confirmDialogTitle');
        const confirmDialogMessage = document.getElementById('confirmDialogMessage');
        const confirmDialogConfirm = document.getElementById('confirmDialogConfirm');
        const confirmDialogCancel = document.getElementById('confirmDialogCancel');
        const confirmDialogCloseBtn = document.getElementById('confirmDialogCloseBtn');

    // 显示取消按钮并设置文本
    confirmDialogCancel.classList.remove('hidden');
    confirmDialogTitle.textContent = title;
    confirmDialogMessage.innerHTML = message;
    confirmDialogConfirm.textContent = '确定';

    confirmDialog.classList.remove('hidden');

        const handleConfirm = () => { cleanup(); resolve(true); };
        const handleCancel = () => { cleanup(); resolve(false); };

        function cleanup() {
            confirmDialog.classList.add('hidden');
            confirmDialogCancel.classList.remove('hidden');
            confirmDialogConfirm.removeEventListener('click', handleConfirm);
            confirmDialogCancel.removeEventListener('click', handleCancel);
            confirmDialogCloseBtn.removeEventListener('click', handleCancel);
        }

        confirmDialogConfirm.addEventListener('click', handleConfirm);
        confirmDialogCancel.addEventListener('click', handleCancel);
        confirmDialogCloseBtn.addEventListener('click', handleCancel);
    });
}

// 支持危险模式的确认对话框（danger=true 时突出红色并添加警示）
function showDangerConfirm(message, title = '重要：请确认') {
    const warnHtml = `<div style="color:#b91c1c;font-weight:600;margin-bottom:8px;">⚠️ 警告：此操作不可逆，可能会删除历史数据。</div>`;
    // 将确认按钮样式改为红色临时处理
    const confirmBtn = document.getElementById('confirmDialogConfirm');
    const prevClass = confirmBtn ? confirmBtn.className : '';
    if (confirmBtn) confirmBtn.className = 'flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-button';
    return showConfirmDialog(warnHtml + message, title).then(res => {
        // 恢复按钮样式
        if (confirmBtn) confirmBtn.className = prevClass;
        return res;
    });
}

// 日期处理助手：保证以本地日期为准，避免时区导致的前后一天偏移
function toISODateLocal(d) {
    if (!d) return null;
    const date = (d instanceof Date) ? d : new Date(d);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function parseISODateLocal(dateStr) {
    if (!dateStr) return null;
    // dateStr expected as 'YYYY-MM-DD'
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
}
// 全局变量
// 管理员默认口令将从配置文件中获取

// 日志工具函数
async function log(level, message, data = null) {
    try {
        // 获取当前操作人姓名
        let operatorName = '未知用户';
        if (typeof currentMember !== 'undefined' && currentMember && currentMember.name) {
            operatorName = currentMember.name;
        } else {
            // 从sessionStorage获取当前成员信息
            const memberStr = sessionStorage.getItem('currentMember');
            if (memberStr) {
                const member = JSON.parse(memberStr);
                operatorName = member.name || '未知用户';
            }
        }
        
        // 在日志消息开头添加操作人姓名
        const formattedMessage = `[${operatorName}] ${message}`;
        
        // 构建日志数据
        const logData = {
            level: level,
            message: formattedMessage,
            data: data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            operator: operatorName
        };
        
        // 对操作人姓名进行Base64编码，以支持中文字符
        const encodedOperator = btoa(unescape(encodeURIComponent(operatorName)));
        // 使用Headers对象设置请求头，确保中文字符正确传递
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('X-Operator', encodedOperator);
        // 确保日志级别与后端兼容 (将warn转换为warning)
        const compatibleLogData = {
            ...logData,
            level: logData.level === 'warn' ? 'warning' : logData.level
        };
        // 发送日志到服务器
        await fetch('/api/log', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(compatibleLogData)
        });
    } catch (error) {
        // 如果日志发送失败，降级到console输出
        console.error('日志发送失败:', error);
        // 降级输出也要包含操作人姓名
        let operatorName = '未知用户';
        if (typeof currentMember !== 'undefined' && currentMember && currentMember.name) {
            operatorName = currentMember.name;
        } else {
            const memberStr = sessionStorage.getItem('currentMember');
            if (memberStr) {
                const member = JSON.parse(memberStr);
                operatorName = member.name || '未知用户';
            }
        }
        console.log(`${level}: [${operatorName}] ${message}`, data);
    }
}

// 显示工号输入弹窗
async function showEmployeeIdInput() {
    const modal = document.getElementById('employeeIdModal');
    
    // 显示弹窗
    modal.style.display = 'block';
    await log('info', '显示工号输入弹窗');
}

// 关闭工号输入弹窗
async function closeEmployeeIdInput() {
    document.getElementById('employeeIdModal').style.display = 'none';
    await log('info', '关闭工号输入弹窗');
}

// 确认输入的工号
async function confirmEmployeeId() {
    const employeeId = document.getElementById('employeeId').value;
    if (!employeeId) {
        alert('请输入员工工号');
        await log('warn', '用户尝试确认空的员工工号');
        return;
    }
    
    await log('info', '用户尝试确认员工工号', { employeeId });
    
    // 获取所有成员
    const members = await getFromLocalStorage('members', []);
    
    // 查找匹配的成员
    const matchedMember = members.find(member => member.employeeId === employeeId);
    
    await closeEmployeeIdInput();
    
    if (matchedMember) {
        await log('info', '找到匹配的成员信息', { employeeId, memberName: matchedMember.name });
        await showMemberConfirm(matchedMember);
    } else {
        await log('warn', '未找到匹配的成员信息', { employeeId });
        alert('未找到匹配的成员信息，请联系管理员添加您的员工工号');
    }
}

// 显示成员确认弹窗
async function showMemberConfirm(member) {
    const modal = document.getElementById('memberConfirmModal');
    const memberInfo = document.getElementById('memberInfo');
    
    // 设置成员信息
    memberInfo.innerHTML = `
        <p><strong>姓名:</strong> ${member.name}</p>
        <p><strong>员工工号:</strong> ${member.employeeId}</p>
    `;
    
    // 存储当前成员信息到全局变量
    currentMember = member;
    
    // 显示弹窗
    modal.style.display = 'block';
    await log('info', '显示成员确认弹窗', { memberName: member.name, employeeId: member.employeeId });
}

// 关闭成员确认弹窗
async function closeMemberConfirm() {
    const modal = document.getElementById('memberConfirmModal');
    modal.style.display = 'none';
    currentMember = null;
    await log('info', '关闭成员确认弹窗');
}

// 确认成员身份并进入填写页面
async function confirmMember() {
    if (currentMember) {
        // 将成员信息存储在sessionStorage中，供member.html使用
        sessionStorage.setItem('currentMember', JSON.stringify(currentMember));
        
        await log('info', '成员身份确认成功，跳转到填写页面', { memberName: currentMember.name, employeeId: currentMember.employeeId });
        
        // 关闭弹窗并跳转到成员页面
        await closeMemberConfirm();
        window.location.href = 'frontend/pages/member.html';
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
    // 根据当前页面执行不同的初始化
    const pathname = window.location.pathname;
    await log('info', 'Current pathname', { pathname: pathname });
    
    // 页面访问权限控制
    if (pathname.includes('admin.html')) {
        // 检查是否通过管理员登录验证
        // 在实际项目中，可以使用sessionStorage或其他方式存储登录状态
        // 这里简单检查document.referrer是否包含index.html
        if (!document.referrer.includes('index.html')) {
            alert('您没有权限直接访问此页面，请从首页进入');
            window.location.href = '/index.html';
            return;
        }
        initAdminPage();
        await log('info', 'Admin page initialized');
    } else if (pathname.includes('member.html')) {
        // 检查是否通过成员入口验证
        let memberStr = sessionStorage.getItem('currentMember');
        
        // 测试环境：如果没有当前成员信息，自动设置一个测试成员
        if (!memberStr) {
            await log('info', '测试环境：自动设置测试成员');
            const testMember = {"name": "纪锐鑫", "employeeId": "005721"};
            sessionStorage.setItem('currentMember', JSON.stringify(testMember));
            memberStr = JSON.stringify(testMember);
        }
        
        if (!memberStr && !document.referrer.includes('index.html')) {
            alert('您没有权限直接访问此页面，请从首页进入');
            window.location.href = '/index.html';
            return;
        }
        initMemberPage();
        await log('info', 'Member page initialized');
    }
    
    // 为首页的成员入口按钮添加点击事件
    const memberBtn = document.querySelector('.menu .btn-primary');
    if (memberBtn) {
        memberBtn.onclick = function() {
            // 显示工号输入
            showEmployeeIdInput();
        };
    }
});

// 管理员登录相关函数
async function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'block';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').textContent = '';
    
    // 添加回车登录功能
    const passwordInput = document.getElementById('adminPassword');
    passwordInput.addEventListener('keyup', function(e) {
        if (e.keyCode === 13) {
            checkAdminPassword();
        }
    });
    
    await log('info', '显示管理员登录弹窗');
}

async function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
    await log('info', '关闭管理员登录弹窗');
}

async function checkAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    const errorElement = document.getElementById('loginError');
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        await log('info', '管理员登录成功');
        window.location.href = 'frontend/pages/admin.html';
    } else {
        await log('warn', '管理员登录失败，密码错误');
        errorElement.textContent = '口令错误，请重试';
    }
}

// 全局变量存储当前选择的成员信息
let currentMember = null;

// 防止重复提交的状态变量
let isSavingReport = false;

// 关闭模态框当点击外部区域
window.onclick = function(event) {
    // 登录弹窗
    const loginModal = document.getElementById('adminLoginModal');
    if (loginModal && event.target === loginModal) {
        loginModal.style.display = 'none';
    }
    
    // 报告详情弹窗
    const detailModal = document.getElementById('reportDetailModal');
    if (detailModal && event.target === detailModal) {
        detailModal.style.display = 'none';
    }
    
    // 生成报告弹窗
    const generatedReportModal = document.getElementById('generatedReportModal');
    if (generatedReportModal && event.target === generatedReportModal) {
        generatedReportModal.style.display = 'none';
    }
    
    // 未填写成员列表弹窗
    const missingMembersModal = document.getElementById('missingMembersModal');
    if (missingMembersModal && event.target === missingMembersModal) {
        missingMembersModal.style.display = 'none';
    }
    
    // 成员确认弹窗
    const memberConfirmModal = document.getElementById('memberConfirmModal');
    if (memberConfirmModal && event.target === memberConfirmModal) {
        memberConfirmModal.style.display = 'none';
        currentMember = null;
    }
    
    // 工号输入弹窗
    const employeeIdModal = document.getElementById('employeeIdModal');
    if (employeeIdModal && event.target === employeeIdModal) {
        employeeIdModal.style.display = 'none';
    }
    
    // 提示弹窗
    const alertModal = document.getElementById('alertModal');
    if (alertModal && event.target === alertModal) {
        alertModal.style.display = 'none';
    }
    
    // 日志弹窗
    const logsModal = document.getElementById('logsModal');
    if (logsModal && event.target === logsModal) {
        logsModal.style.display = 'none';
    }
    
    // 今日进展日志弹窗
    const todayProgressModal = document.getElementById('todayProgressModal');
    if (todayProgressModal && event.target === todayProgressModal) {
        todayProgressModal.style.display = 'none';
    }
}

// 成员页面初始化
async function initMemberPage() {

    
    // 显示当前用户信息
    const currentMemberDisplay = document.getElementById('currentMemberDisplay');
    const memberNameInput = document.getElementById('memberName');
    const memberStr = sessionStorage.getItem('currentMember');
    

    
    if (memberStr) {
        try {
            const member = JSON.parse(memberStr);

            if (currentMemberDisplay) {
                currentMemberDisplay.textContent = `${member.name} (${member.employeeId})`;
            }
            if (memberNameInput) {
                memberNameInput.value = member.name;
            }
        } catch (error) {
            await log('error', '解析成员信息失败', error);
        }
    }
    
    // 显示当前日期
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    if (currentDateDisplay) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        currentDateDisplay.textContent = `${year}-${month}-${day}`;
    }
    
    // 初始化所有内容项的项目和成员下拉框
    await initContentItems();
    
    // 加载该成员的报告和日志
    await loadMemberReport();
    await loadMemberLogs();
    
    // 表单提交事件
    const reportForm = document.getElementById('reportForm');

    
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {

            e.preventDefault();
            saveReport();
        });

        
        // 直接为保存按钮添加点击事件作为备份
        const saveButton = reportForm.querySelector('.btn-save');
        if (saveButton) {
            saveButton.addEventListener('click', function(e) {

                e.preventDefault();
                reportForm.dispatchEvent(new Event('submit'));
            });

        }
    }
    
    // 初始化日志功能
    initLogs();
    
    // 检查并显示跳转数字神经按钮
    checkAndShowJumpButton();
}

// 检查当天日报是否已填写
async function hasTodayDailyReport() {
    const currentMemberStr = sessionStorage.getItem('currentMember');
    const currentMember = currentMemberStr ? JSON.parse(currentMemberStr) : null;
    if (!currentMember) return false;
    
    const today = new Date().toISOString().split('T')[0];
    const reports = await getFromLocalStorage('reports', []);
    return reports.some(report => {
        const sameMember = (report.employeeId && currentMember.employeeId && report.employeeId === currentMember.employeeId) ||
                           (report.memberName && currentMember.name && report.memberName === currentMember.name);
        return sameMember && report.date === today && report.type === 'daily';
    });
}

// 切换日报/周报类型
async function toggleReportType() {
    const reportTypeSelect = document.getElementById('reportType');
    const reportType = reportTypeSelect.value;
    await log('info', '用户切换报告类型', { reportType: reportType });
    const dailyContent = document.getElementById('dailyContent');
    const weeklyContent = document.getElementById('weeklyContent');
    
    if (reportType === 'weekly') {
        const dailyDone = await hasTodayDailyReport();
        if (!dailyDone) {
            showAlertModal('请先填写当日的日报。');
            // 恢复选择为日报
            reportTypeSelect.value = 'daily';
            if (dailyContent) dailyContent.style.display = 'block';
            if (weeklyContent) weeklyContent.style.display = 'none';
            return;
        }
    }
    
    if (reportType === 'daily') {
        dailyContent.style.display = 'block';
        weeklyContent.style.display = 'none';
        // 切换到日报类型时，检查并显示跳转数字神经按钮
        checkAndShowJumpButton();
    } else {
        dailyContent.style.display = 'none';
        weeklyContent.style.display = 'block';
        // 切换到周报类型时，隐藏跳转数字神经按钮
        const jumpButton = document.querySelector('.btn-jump-neural');
        if (jumpButton) {
            jumpButton.remove();
        }
    }
    
    // 切换报告类型时清空reportId，确保新报告生成新的ID
    document.getElementById('reportId').value = '';
    
    // 切换报告类型后，重新加载对应类型的报告数据
    loadMemberReport();
}

// 统计日报弹窗
function openDailyStatsModal() {
    const modal = document.getElementById('dailyStatsModal');
    if (!modal) return;
    // 预填默认时间段：本周一到今天
    const today = new Date();
    const day = today.getDay() || 7; // 周一为1
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day - 1));
    const fmt = (d) => d.toISOString().split('T')[0];
    const startInput = document.getElementById('dailyStatsStartDate');
    const endInput = document.getElementById('dailyStatsEndDate');
    if (startInput && !startInput.value) startInput.value = fmt(monday);
    if (endInput && !endInput.value) endInput.value = fmt(today);
    modal.style.display = 'block';
}

function closeDailyStatsModal() {
    const modal = document.getElementById('dailyStatsModal');
    if (modal) modal.style.display = 'none';
}

// 将时间段内日报导入周报“本周完成”
async function importDailyReportsToWeekly() {
    await log('info', '开始导入日报到周报', {});
    
    const startInput = document.getElementById('dailyStatsStartDate');
    const endInput = document.getElementById('dailyStatsEndDate');
    if (!startInput || !endInput) return;
    const startDate = startInput.value;
    const endDate = endInput.value;
    await log('info', '获取日报导入日期范围', { startDate, endDate });
    
    if (!startDate || !endDate) {
        await log('warn', '日报导入失败：未选择开始或结束日期', { startDate, endDate });
        showAlertModal('请选择开始和结束日期');
        return;
    }
    if (startDate > endDate) {
        await log('warn', '日报导入失败：开始日期大于结束日期', { startDate, endDate });
        showAlertModal('开始日期不能大于结束日期');
        return;
    }
    
    const currentMemberStr = sessionStorage.getItem('currentMember');
    const currentMember = currentMemberStr ? JSON.parse(currentMemberStr) : null;
    if (!currentMember) {
        await log('error', '日报导入失败：未获取到成员信息', {});
        showAlertModal('未获取到成员信息，请重新登录');
        return;
    }
    
    await log('info', '获取当前成员信息', { memberName: currentMember.name, employeeId: currentMember.employeeId });
    
    const reports = await getFromLocalStorage('reports', []);
    const inRangeDaily = reports.filter(r => {
        const sameMember = (r.employeeId && currentMember.employeeId && r.employeeId === currentMember.employeeId) ||
                          (r.memberName && currentMember.name && r.memberName === currentMember.name);
        return sameMember && r.type === 'daily' && r.date >= startDate && r.date <= endDate;
    });
    
    await log('info', '查找指定时间段内的日报', { startDate, endDate, foundCount: inRangeDaily.length });
    
    if (inRangeDaily.length === 0) {
        await log('info', '日报导入失败：所选时间段内暂无日报', { startDate, endDate });
        showAlertModal('所选时间段内暂无日报');
        return;
    }
    
    // 汇总今日进展到周报本周完成（去重，不包含进度）
    const weeklyDoneItems = [];
    const contentSet = new Set(); // 用于去重
    inRangeDaily.sort((a, b) => a.date.localeCompare(b.date));
    inRangeDaily.forEach(report => {
        (report.todayProgress || []).forEach(item => {
            const content = item.content || '';
            const project = item.project || '';
            const members = item.members || [];
            // 对成员数组排序以确保相同成员组合的key一致
            const sortedMembers = [...members].sort();
            const key = `${project}-${content}-${JSON.stringify(sortedMembers)}`; // 按项目、内容和成员去重
            if (!contentSet.has(key)) {
                contentSet.add(key);
                weeklyDoneItems.push({
                    project: project,
                    members: members,
                    content: content
                    // 不包含progress字段
                });
            }
        });
    });
    
    await log('info', '日报内容汇总完成，准备导入周报', { originalCount: inRangeDaily.length, importedCount: weeklyDoneItems.length });
    
    await fillContentItems('weeklyDone', weeklyDoneItems);
    closeDailyStatsModal();
    showAlertModal('已将所选时间段内的日报导入本周完成');
    
    await log('success', '日报导入周报成功', { startDate, endDate, importedCount: weeklyDoneItems.length, memberName: currentMember.name });
}

// 初始化所有内容项的项目和成员下拉框
async function initContentItems() {
    const contentContainers = ['todayProgress', 'tomorrowPlan', 'weeklyDone', 'weeklyPlan'];
    
    for (const containerId of contentContainers) {
        const container = document.getElementById(containerId);
        if (container) {
            const contentItems = container.querySelectorAll('.content-item');
            for (const item of contentItems) {
                const projectSelect = item.querySelector('.log-project');
                if (projectSelect) {
                    await loadProjectsToDropdown(projectSelect);
                }
                
                const membersSelect = item.querySelector('.log-members');
                if (membersSelect) {
                    await loadMembersToDropdown(membersSelect);
                    // 初始化自定义下拉框事件
                    initCustomMemberDropdown(membersSelect);
                }
            }
        }
    }
}

// 添加内容项
async function addContentItem(containerId) {
    await log('info', '用户添加内容项', { containerId });
    const container = document.getElementById(containerId);
    const newItem = document.createElement('div');
    newItem.className = 'content-item';
    
    // 根据容器ID决定是否包含完成进度输入字段
    const isPlanSection = containerId === 'tomorrowPlan' || containerId === 'weeklyPlan';
    
    let innerHTML = `
        <select class="log-project" required>
            <option value="">请选择项目</option>
        </select>
        <div class="custom-select log-members">
            <div class="select-trigger">
                <div class="selected-tags"></div>
                <span class="caret">▼</span>
            </div>
            <div class="select-dropdown">
                <div class="dropdown-content">
                    <!-- 成员选项将通过JavaScript动态生成 -->
                </div>
            </div>
            <input type="hidden" class="selected-members" name="members" required>
        </div>
        <input type="text" placeholder="请输入内容" required>
    `;
    
    // 只有非计划部分才添加完成进度输入字段
    if (!isPlanSection) {
        innerHTML += `
            <div class="progress-container">
                <input type="number" class="log-progress" placeholder="进度" min="1" max="100" required>
                <span class="progress-percent">%</span>
            </div>
        `;
    }
    
    innerHTML += `
        <button type="button" onclick="removeContentItem(this)" class="btn-remove">×</button>
    `;
    
    newItem.innerHTML = innerHTML;
    container.appendChild(newItem);
    
    // 加载项目下拉框数据
    const projectSelect = newItem.querySelector('.log-project');
    await loadProjectsToDropdown(projectSelect);
    
    // 加载成员下拉框数据
    const membersSelect = newItem.querySelector('.log-members');
    await loadMembersToDropdown(membersSelect);
    
    // 初始化自定义下拉框事件
    initCustomMemberDropdown(membersSelect);
}

// 删除内容项
async function removeContentItem(button) {
    const item = button.parentElement;
    const container = item.parentElement;
    const containerId = container.id;
    
    // 至少保留一个内容项
    if (container.children.length > 1) {
        container.removeChild(item);
        await log('info', '用户删除内容项', { containerId });
    } else {
        await log('warn', '用户尝试删除最后一个内容项，操作被禁止', { containerId });
    }
}

// 管理员页面初始化
async function initAdminPage() {
    await log('info', '管理员页面初始化开始', {});
    
    // 加载模板
    await log('info', '开始加载管理员模板', {});
    await loadTemplates();
    await log('info', '管理员模板加载完成', {});
    
    // 加载系统设置
    await log('info', '开始加载系统设置', {});
    await loadSettings();
    await log('info', '系统设置加载完成', {});
    
    // 加载成员列表
    await log('info', '开始加载成员列表', {});
    await loadMembers();
    await log('info', '成员列表加载完成', {});
    
    // 加载项目编号
    await log('info', '开始加载项目编号', {});
    await loadProjectNumber();
    await log('info', '项目编号加载完成', {});
    
    // 设置默认日期
    const dataDateElement = document.getElementById('dataDate');
    if (dataDateElement) {
        const defaultDate = new Date().toISOString().split('T')[0];
        dataDateElement.setAttribute('value', defaultDate);
        await log('info', '设置管理员页面默认日期', { defaultDate });
    }
    
    // 初始化项目活动功能
    await log('info', '开始初始化项目活动功能', {});
    await initProjectActivity();
    await log('info', '项目活动功能初始化完成', {});
    
    await log('success', '管理员页面初始化完成', {});
}

// 初始化项目活动功能
async function initProjectActivity() {
    await log('info', '开始初始化项目活动功能', {});
    
    // 加载年份选项到筛选下拉框
    const yearFilter = document.getElementById('activityYearFilter');
    if (yearFilter) {
        await log('info', '开始加载年份选项到活动筛选', {});
        loadYearOptions(yearFilter);
        await log('info', '年份选项加载完成', {});
    } else {
        await log('warn', '未找到年份筛选下拉框', { elementId: 'activityYearFilter' });
    }
    
    // 加载项目列表到筛选下拉框
    const projectFilter = document.getElementById('activityProjectFilter');
    if (projectFilter) {
        await log('info', '开始加载项目列表到活动筛选', {});
        await loadProjectsToActivityFilter(projectFilter);
        await log('info', '项目列表加载完成', {});
    } else {
        await log('warn', '未找到项目筛选下拉框', { elementId: 'activityProjectFilter' });
    }
    
    await log('info', '项目活动功能初始化完成', {});
}

// 加载年份选项
function loadYearOptions(yearFilter) {
    // 清空现有选项
    yearFilter.innerHTML = '';
    
    // 获取当前年份
    const currentYear = new Date().getFullYear();
    
    // 生成最近5年的选项
    for (let i = currentYear - 4; i <= currentYear; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        
        // 设置当前年份为默认选中
        if (i === currentYear) {
            option.selected = true;
        }
        
        yearFilter.appendChild(option);
    }
}

// 加载项目到活动筛选下拉框
async function loadProjectsToActivityFilter(filterElement) {
    // 清空现有选项（保留"所有项目"）
    const allOption = filterElement.querySelector('option[value="all"]');
    filterElement.innerHTML = '';
    if (allOption) {
        filterElement.appendChild(allOption);
    }
    
    // 获取项目列表
    const projects = await getFromLocalStorage('projects', []);
    
    // 添加项目选项
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.name;
        option.textContent = project.name;
        filterElement.appendChild(option);
    });
}

// 生成项目活动数据
async function generateActivityData(projectFilter = 'all', yearFilter = null, monthFilter = null) {
    await log('info', '开始生成项目活动数据', { projectFilter, yearFilter, monthFilter });
    
    try {
        // 获取所有报告
        await log('info', '获取所有报告数据', {});
        const reports = await getFromLocalStorage('reports', []);
        await log('info', '报告数据获取完成', { reportCount: reports.length });
        
        const activityData = {};
        let processedCount = 0;
        let validActivityCount = 0;
        
        // 遍历所有报告
        await log('info', '开始处理报告数据', {});
        reports.forEach(report => {
            processedCount++;
            
            // 只处理日报
            if (report.type !== 'daily') return;
            
            const date = report.date;
            const reportDate = new Date(date);
            const reportYear = reportDate.getFullYear();
            const reportMonth = reportDate.getMonth();
            
            // 检查年份筛选条件
            if (yearFilter !== null && reportYear !== yearFilter) return;
            
            // 检查月份筛选条件
            if (monthFilter !== null && monthFilter !== 'all' && reportMonth !== parseInt(monthFilter)) return;
            
            // 检查今日进展
            if (report.todayProgress && Array.isArray(report.todayProgress)) {
                report.todayProgress.forEach(item => {
                    // 检查项目筛选条件
                    if (projectFilter !== 'all' && item.project !== projectFilter) return;
                    
                    // 增加该日期的活动指数
                    if (!activityData[date]) {
                        activityData[date] = [];
                    }
                    
                    // 存储具体活动内容
                    activityData[date].push({
                        project: item.project,
                        content: item.content,
                        progress: item.progress
                    });
                    
                    validActivityCount++;
                });
            }
        });
        
        await log('info', '项目活动数据生成完成', { 
            processedReports: processedCount, 
            validActivities: validActivityCount, 
            dateCount: Object.keys(activityData).length 
        });
        
        return activityData;
    } catch (error) {
        await log('error', '生成活动数据失败', { error: error.message, projectFilter, yearFilter, monthFilter });
        return {};
    }
}

// 生成活动图表
async function generateActivityChart() {
    await log('info', '开始生成活动图表', {});
    
    try {
        // 获取筛选条件
        const projectFilter = document.getElementById('activityProjectFilter').value;
        const yearFilter = parseInt(document.getElementById('activityYearFilter').value);
        const monthFilter = document.getElementById('activityMonthFilter').value;
        
        await log('info', '获取活动图表筛选条件', { projectFilter, yearFilter, monthFilter });
        
        // 生成活动数据
        await log('info', '开始获取活动数据', { projectFilter, yearFilter, monthFilter });
        const activityData = await generateActivityData(projectFilter, yearFilter, monthFilter);
        await log('info', '活动数据获取完成', { dateCount: Object.keys(activityData).length });
        
        // 渲染图表
        await log('info', '开始渲染活动图表', { yearFilter, monthFilter, activityDataCount: Object.keys(activityData).length });
        await renderActivityChart(activityData, yearFilter, monthFilter);
        await log('info', '活动图表生成完成', { projectFilter, yearFilter, monthFilter });
    } catch (error) {
        await log('error', '生成活动图表失败', { error: error.message });
        alert('生成活动图表失败：' + error.message);
    }
}

// 渲染活动图表
async function renderActivityChart(activityData, yearFilter = null, monthFilter = null) {
    await log('info', '开始渲染活动图表', { yearFilter, monthFilter, activityDataCount: Object.keys(activityData).length });
    const chartContainer = document.getElementById('activityChart');
    if (!chartContainer) {
        await log('warn', '活动图表容器不存在');
        return;
    }
    
    // 清空现有图表
    chartContainer.innerHTML = '';
    
    // 根据筛选条件确定日期范围
    let startDate, endDate;
    if (yearFilter !== null && monthFilter !== null) {
        // 如果有年月筛选，设置为该月的第一天到最后一天
        if (monthFilter === 'all') {
            // 全年筛选
            startDate = new Date(yearFilter, 0, 1);
            endDate = new Date(yearFilter, 11, 31);
        } else {
            // 特定月份筛选
            startDate = new Date(yearFilter, parseInt(monthFilter), 1);
            endDate = new Date(yearFilter, parseInt(monthFilter) + 1, 0);
        }
    } else {
        // 默认显示最近52周
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 364);
    }
    
    // 创建日历网格
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // 计算开始日期是周几（0是周日，6是周六）
    const startDay = startDate.getDay();
    
    // 添加空的开始单元格
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'activity-cell empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // 添加日期单元格
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const activities = activityData[dateString] || [];
        const count = activities.length;
        
        const cell = document.createElement('div');
        cell.className = 'activity-cell';
        cell.dataset.date = dateString;
        cell.dataset.count = count;
        
        // 根据活动数量设置颜色
        if (count === 0) {
            cell.classList.add('level-0');
        } else if (count === 1) {
            cell.classList.add('level-1');
        } else if (count === 2) {
            cell.classList.add('level-2');
        } else if (count === 3) {
            cell.classList.add('level-3');
        } else {
            cell.classList.add('level-4');
        }
        
        // 添加 tooltip，显示具体活动内容
        if (count === 0) {
            cell.title = `${dateString}: 无活动`;
        } else {
            let tooltipText = `${dateString}：${count} 项活动\n\n`;
            activities.forEach((activity, index) => {
                tooltipText += `${index + 1}. 项目：${activity.project}\n`;
                tooltipText += `   进展：${activity.content}\n`;
                tooltipText += `   进度：${activity.progress}%\n`;
            });
            cell.title = tooltipText;
        }
        
        calendarGrid.appendChild(cell);
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 添加月份标签
    const monthLabels = document.createElement('div');
    monthLabels.className = 'month-labels';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let currentMonth = startDate.getMonth();
    
    monthLabels.innerHTML += `<span class="month-label">${months[currentMonth]}</span>`;
    
    const labelDate = new Date(startDate);
    while (labelDate <= endDate) {
        if (labelDate.getDay() === 0 && labelDate.getMonth() !== currentMonth) {
            currentMonth = labelDate.getMonth();
            monthLabels.innerHTML += `<span class="month-label">${months[currentMonth]}</span>`;
        }
        labelDate.setDate(labelDate.getDate() + 1);
    }
    
    // 组合图表和标签
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    chartWrapper.appendChild(monthLabels);
    chartWrapper.appendChild(calendarGrid);
    
    // 添加周几标签
    const dayLabels = document.createElement('div');
    dayLabels.className = 'day-labels';
    dayLabels.innerHTML = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ').map(day => `<span class="day-label">${day}</span>`).join('');
    chartWrapper.appendChild(dayLabels);
    
    // 添加到图表容器
    chartContainer.appendChild(chartWrapper);
    await log('info', '活动图表渲染完成', { yearFilter, monthFilter });
}

// 保存项目编号
async function saveProjectNumber() {
    const projectNumber = document.getElementById('projectNumber').value.trim();
    if (!projectNumber) {
        alert('项目编号不能为空！');
        await log('warn', '用户尝试保存空的项目编号');
        return;
    }
    
    try {
        await log('info', '开始保存项目编号', { projectNumber });
        
        // 获取当前管理员设置
        const adminSettings = await getFromLocalStorage('adminSettings', {});
        
        // 更新项目编号
        adminSettings.projectNumber = {
            data: projectNumber,
            version: adminSettings.projectNumber ? adminSettings.projectNumber.version + 1 : 1
        };
        
        // 保存更新后的管理员设置
        await saveToLocalStorage('adminSettings', adminSettings);
        
        await log('info', '项目编号保存成功', { projectNumber });
        alert('项目编号保存成功！');
    } catch (error) {
        await log('error', '保存项目编号失败', { projectNumber, error });
        alert('保存失败，请重试！');
    }
}

// 获取项目编号（优先adminSettings，缺失时回退读取静态配置）
async function getProjectNumberValue() {
    try {
        const adminSettings = await getFromLocalStorage('adminSettings', {});
        if (adminSettings.projectNumber && adminSettings.projectNumber.data) {
            return adminSettings.projectNumber.data;
        }
        
        // 回退读取静态配置文件
        const resp = await fetch('/data/adminsetting.json');
        if (resp.ok) {
            const json = await resp.json();
            const fallbackNumber = json.projectNumber ? json.projectNumber.data || '' : '';
            if (fallbackNumber) {
                // 写回到adminSettings，便于后续使用
                adminSettings.projectNumber = {
                    data: fallbackNumber,
                    version: json.projectNumber && json.projectNumber.version ? json.projectNumber.version : 1
                };
                await saveToLocalStorage('adminSettings', adminSettings);
            }
            return fallbackNumber;
        }
    } catch (error) {
        await log('error', '获取项目编号失败', error);
    }
    return '';
}

// 加载项目编号到输入框
async function loadProjectNumber() {
    try {
        const projectNumber = await getProjectNumberValue();
        const projectNumberInput = document.getElementById('projectNumber');
        if (projectNumberInput) {
            projectNumberInput.value = projectNumber;
        }
    } catch (error) {
        await log('error', '加载项目编号失败', error);
    }
}

// 显示标签页
function showTab(tabName) {
    // 记录用户切换标签页操作
    log('info', `用户切换到${tabName}标签页`, { tabName: tabName });
    
    // 隐藏所有标签内容
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // 移除所有标签按钮的激活状态
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的标签内容和激活对应的按钮
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// 数据存储功能（使用HTTP请求与服务器交互）



// 全局变量，存储当前数据的版本信息
let dataVersions = {};

// 从服务器获取数据（处理版本信息）
async function getDataFromServer(key, defaultValue = []) {
    try {
        // 获取当前操作人姓名
        let operatorName = '未知用户';
        if (typeof currentMember !== 'undefined' && currentMember && currentMember.name) {
            operatorName = currentMember.name;
        } else {
            // 从sessionStorage获取当前成员信息
            const memberStr = sessionStorage.getItem('currentMember');
            if (memberStr) {
                const member = JSON.parse(memberStr);
                operatorName = member.name || '未知用户';
            }
        }
        
        // 对操作人姓名进行Base64编码，以支持中文字符
        const encodedOperator = btoa(unescape(encodeURIComponent(operatorName)));
        // 使用Headers对象设置请求头，确保中文字符正确传递
        const headers = new Headers();
        headers.append('X-Operator', encodedOperator);
        const response = await fetch(`${CONFIG.API_BASE_URL}${key}`, {
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const versionedData = await response.json();
        
        // 如果返回的是版本化数据结构
        if (versionedData && versionedData.data !== undefined && versionedData.version !== undefined) {
            // 存储当前版本号
            dataVersions[key] = versionedData.version;
            return versionedData.data !== null ? versionedData.data : defaultValue;
        } else {
            // 兼容旧数据格式
            return versionedData !== null ? versionedData : defaultValue;
        }
    } catch (error) {
        await log('error', 'Error getting data from server', error);
        return defaultValue;
    }
}

// 保存数据到服务器（处理版本信息和冲突）
async function saveDataToServer(key, data) {
    try {
        // 获取当前操作人姓名
        let operatorName = '未知用户';
        if (typeof currentMember !== 'undefined' && currentMember && currentMember.name) {
            operatorName = currentMember.name;
        } else {
            // 从sessionStorage获取当前成员信息
            const memberStr = sessionStorage.getItem('currentMember');
            if (memberStr) {
                const member = JSON.parse(memberStr);
                operatorName = member.name || '未知用户';
            }
        }
        
        // 构建带版本号的数据
        const versionedData = {
            data: data,
            version: dataVersions[key] || 0
        };
        
        // 对操作人姓名进行Base64编码，以支持中文字符
        const encodedOperator = btoa(unescape(encodeURIComponent(operatorName)));
        // 使用Headers对象设置请求头，确保中文字符正确传递
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('X-Operator', encodedOperator);
        const response = await fetch(`${CONFIG.API_BASE_URL}${key}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(versionedData),
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                // 版本冲突
                const errorData = await response.json();
                throw new Error(`Version conflict for ${key}: current version is ${errorData.currentVersion}`);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 更新本地版本号
        const result = await response.json();
        if (result.version) {
            dataVersions[key] = result.version;
        }
        
        return result;
    } catch (error) {
        await log('error', 'Error saving data to server', error);
        throw error;
    }
}

// 兼容旧代码的函数（异步版本）
async function saveToLocalStorage(key, data) {
    return await saveDataToServer(key, data);
}

// 兼容旧代码的函数（异步版本）
async function getFromLocalStorage(key, defaultValue = []) {
    return await getDataFromServer(key, defaultValue);
}

// 显示错误消息
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.color = 'red';
}

// 清除所有错误消息
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-text');
    errorElements.forEach(element => {
        element.textContent = '';
    });
}

// 查看当天未填写日志成员
async function showMissingMembers() {
    const reportType = document.getElementById('dataReportType').value;
    const date = document.getElementById('dataDate').value;
    
    if (!date) {
        alert('请选择日期');
        await log('warn', '用户尝试查询未填写成员但未选择日期');
        return;
    }
    
    try {
        await log('info', '用户请求查询未填写成员', { date, reportType });
        
        // 获取所有成员
        const members = await getFromLocalStorage('members', []);
        if (members.length === 0) {
            alert('暂无成员信息');
            await log('warn', '尝试查询未填写成员但系统中暂无成员信息');
            return;
        }
        
        // 获取所有报告
        const reports = await getFromLocalStorage('reports', []);
        
        // 过滤出该日期和报告类型下已提交报告的成员
        const submittedMemberIds = new Set();
        
        await log('info', '开始处理未填写成员查询', { date, reportType, reportsCount: reports.length, membersCount: members.length });
        
        // 辅助函数：递归遍历对象并收集所有members数组中的员工ID
        const collectMemberIds = (obj, parentPath = '') => {
            if (Array.isArray(obj)) {
                obj.forEach((item, index) => collectMemberIds(item, `${parentPath}[${index}]`));
            } else if (typeof obj === 'object' && obj !== null) {
                // 如果对象有members字段且是数组，收集员工ID
                if (obj.members && Array.isArray(obj.members)) {
                    obj.members.forEach(employeeId => {
                        if (employeeId) {
                            submittedMemberIds.add(employeeId);
                        }
                    });
                }
                // 递归遍历对象的其他属性
                Object.entries(obj).forEach(([key, value]) => {
                    if (key !== 'members' && typeof value === 'object' && value !== null) {
                        collectMemberIds(value, `${parentPath}.${key}`);
                    }
                });
            }
        };
        
        await log('info', '开始处理报告列表', { totalReports: reports.length });
        reports.forEach((report, index) => {
            
            if (report.date === date && report.type === reportType) {
                // 1. 递归遍历报告中的所有嵌套对象，收集所有members数组中的员工ID
                collectMemberIds(report, 'report');
                
                // 2. 同时处理memberName字段作为补充
                if (report.memberName) {
                    // 处理复合成员名称
                    let memberNames = [];
                    
                    // 首先尝试使用多种分隔符分割
                    const separators = /[，。；、]/;
                    if (separators.test(report.memberName)) {
                        memberNames = report.memberName.split(separators);
                    } else {
                        // 如果没有分隔符，就是单个成员
                        memberNames = [report.memberName];
                    }
                    
                    // 处理每个成员名称
                    memberNames.forEach(memberName => {
                        // 清理姓名：去除首尾空格和多余空格
                        const trimmedName = memberName.trim().replace(/\s+/g, '');
                        
                        if (trimmedName) {
        
                            
                            // 方法1：精确匹配（优先）
                            let matchedMember = members.find(m => 
                                m.name.trim().replace(/\s+/g, '') === trimmedName
                            );
                            
                            // 方法2：如果精确匹配失败，尝试使用包含匹配
                            if (!matchedMember) {
                                matchedMember = members.find(m => 
                                    m.name.includes(trimmedName) || trimmedName.includes(m.name)
                                );
                            }
                            
                            // 方法3：如果还是失败，尝试使用拼音首字母匹配（简单实现）
                            if (!matchedMember) {
                                // 简单的首字母匹配，仅作为最后的后备方案
                                const getFirstLetter = (name) => {
                                    return name.charAt(0).toUpperCase();
                                };
                                const targetFirstLetter = getFirstLetter(trimmedName);
                                matchedMember = members.find(m => 
                                    getFirstLetter(m.name) === targetFirstLetter
                                );
                            }
                            
                            if (matchedMember) {
                                if (matchedMember.employeeId) {
                                    submittedMemberIds.add(matchedMember.employeeId);
                                } else {

                                }
                            } else {

                            }
                        }
                    });
                }
                
                // 3. 保留对report.employeeId的支持，作为额外保障
                if (report.employeeId) {
                    submittedMemberIds.add(report.employeeId);
                }
            }
        });
        
        // 找出未提交报告的成员
        const missingMembers = members.filter(member => !submittedMemberIds.has(member.employeeId));
        await log('info', '未填写成员查询完成', { 
            totalMembers: members.length, 
            submittedCount: submittedMemberIds.size, 
            missingCount: missingMembers.length 
        });
        
        // 显示结果在模态窗口中
        const modal = document.getElementById('missingMembersModal');
        const modalTitle = document.getElementById('missingMembersTitle');
        const modalBody = document.getElementById('missingMembersBody');
        
        // 设置弹窗标题
        modalTitle.textContent = `${date} ${reportType === 'daily' ? '日报' : '周报'}未填写成员`;
        
        // 设置弹窗内容
        let html = '';
        
        if (missingMembers.length === 0) {
            html += '<p class="no-missing-members">所有成员均已填写日志！</p>';
        } else {
            html += '<div class="missing-members-list">';
            html += '<p class="missing-count">总计：' + missingMembers.length + '人未填写</p>';
            html += '<ul>';
            missingMembers.forEach(member => {
                html += `<li>${member.name}</li>`;
            });
            html += '</ul>';
            html += '</div>';
        }
        
        modalBody.innerHTML = html;
        
        // 显示弹窗
        modal.style.display = 'block';
    } catch (error) {
        await log('error', '查询未填写成员失败', error);
        alert('查询未填写成员失败：' + error.message);
    }
}

// 关闭未填写成员列表弹窗
function closeMissingMembersModal() {
    const modal = document.getElementById('missingMembersModal');
    modal.style.display = 'none';
}

// 保存报告
async function saveReport() {
    // 防止重复提交
    if (isSavingReport) {
        await log('warn', '正在保存报告，请勿重复提交');
        return;
    }
    isSavingReport = true;

    
    // 清除之前的错误消息
    clearErrors();
    
    // 验证必填项
    let isValid = true;
    
    const memberName = document.getElementById('memberName').value;
    if (!memberName.trim()) {
        showError('memberNameError', '请确保当前用户信息正确');
        isValid = false;
    }
    
    const reportType = document.getElementById('reportType').value;
    
    // 获取所有内容项
    const todayProgressItems = getContentItems('todayProgress');
    const tomorrowPlanItems = getContentItems('tomorrowPlan');
    const weeklyDoneItems = getContentItems('weeklyDone');
    const weeklyPlanItems = getContentItems('weeklyPlan');
    // 移除不需要的字段：problems和others
    
    // 验证每一条日志的项目和成员选择
    const validateContentItems = (items, errorId, errorMessage) => {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.project) {
                showError(errorId, `第${i + 1}条${errorMessage}：请选择归属项目`);
                isValid = false;
            }
            if (!item.members || item.members.length === 0) {
                showError(errorId, `第${i + 1}条${errorMessage}：请选择成员`);
                isValid = false;
            }
        }
    };
    
    if (reportType === 'daily') {
        // 验证日报必填项
        if (todayProgressItems.length === 0) {
            showError('todayProgressError', '请填写今日进展');
            isValid = false;
        } else {
            validateContentItems(todayProgressItems, 'todayProgressError', '今日进展');
        }
        
        if (tomorrowPlanItems.length === 0) {
            showError('tomorrowPlanError', '请填写明日计划');
            isValid = false;
        } else {
            validateContentItems(tomorrowPlanItems, 'tomorrowPlanError', '明日计划');
        }
    } else {
        // 验证周报必填项
        if (weeklyDoneItems.length === 0) {
            showError('weeklyDoneError', '请填写本周完成工作');
            isValid = false;
        } else {
            validateContentItems(weeklyDoneItems, 'weeklyDoneError', '本周完成工作');
        }
        
        if (weeklyPlanItems.length === 0) {
            showError('weeklyPlanError', '请填写下周工作计划');
            isValid = false;
        } else {
            validateContentItems(weeklyPlanItems, 'weeklyPlanError', '下周工作计划');
        }
        

    }
    
    if (!isValid) {
        isSavingReport = false;
        return;
    }
    
    let retryAttempts = 0;
    const maxRetries = 3;
    
    while (retryAttempts < maxRetries) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const reportId = document.getElementById('reportId').value;
            
            await log('info', '开始保存报告', { reportType, memberName, date, reportId });
            
            // 获取当前成员信息
            const currentMemberStr = sessionStorage.getItem('currentMember');
            const currentMember = currentMemberStr ? JSON.parse(currentMemberStr) : null;
            
            // 获取所有成员数据，确保能找到正确的employeeId
            const allMembers = await getFromLocalStorage('members', []);
            
            // 确定员工ID的优先级：1. currentMember中的employeeId 2. 通过memberName查询的employeeId
            let employeeId = currentMember ? currentMember.employeeId : null;
            if (!employeeId && memberName) {
                // 清理姓名：去除首尾空格和多余空格
                const trimmedName = memberName.trim().replace(/\s+/g, '');
                
                // 方法1：精确匹配（优先）
                let matchedMember = allMembers.find(m => 
                    m.name.trim().replace(/\s+/g, '') === trimmedName
                );
                
                // 方法2：如果精确匹配失败，尝试使用包含匹配
                if (!matchedMember) {
                    matchedMember = allMembers.find(m => 
                        m.name.includes(trimmedName) || trimmedName.includes(m.name)
                    );
                }
                
                // 方法3：如果还是失败，尝试使用首字母匹配
                if (!matchedMember) {
                    const getFirstLetter = (name) => {
                        return name.charAt(0).toUpperCase();
                    };
                    const targetFirstLetter = getFirstLetter(trimmedName);
                    matchedMember = allMembers.find(m => 
                        getFirstLetter(m.name) === targetFirstLetter
                    );
                }
                
                if (matchedMember) {
                    employeeId = matchedMember.employeeId;
                }
            }
            
            // 确保employeeId是字符串类型，与loadMemberReport函数保持一致
            employeeId = employeeId ? String(employeeId) : null;
            
            let reportData = {
                id: reportId ? parseInt(reportId) : Date.now(),
                type: reportType,
                date: date,
                memberName: memberName,
                employeeId: employeeId
            };
            
            // 根据报告类型添加内容
            if (reportType === 'daily') {
                reportData.todayProgress = todayProgressItems;
                reportData.tomorrowPlan = tomorrowPlanItems;
            } else {
                reportData.weeklyDone = weeklyDoneItems;
                reportData.weeklyPlan = weeklyPlanItems;
            }
            
            await log('debug', '完整报告数据', { reportData: reportData });
            
            // 获取现有报告（异步）
            const reports = await getFromLocalStorage('reports', []);
            
            // 合并/插入当前报告
            const applyReport = (list, data) => {
                const idx = list.findIndex(r => {
                    const isSameMember = (r.employeeId && data.employeeId && r.employeeId === data.employeeId) ||
                                         (r.memberName && data.memberName && r.memberName === data.memberName);
                    return isSameMember && r.date === data.date && r.type === data.type;
                });
                if (idx !== -1) {
                    data.id = list[idx].id;
                    list[idx] = data;
                } else {
                    list.push(data);
                }
                return list;
            };
            
            applyReport(reports, reportData);
            
            // 保存到服务器（异步）
            await saveToLocalStorage('reports', reports);
            await log('info', '报告保存成功', { reportId: reportData.id });
            
            // 保存成功后，将reportId设置回页面，以便下次更新
            document.getElementById('reportId').value = reportData.id;
                
                // 显示成功消息
                showAlertModal('报告保存成功！');
                
                // 如果是日报，显示跳转数字神经按钮
                if (reportType === 'daily') {
                    showJumpButton();
                }
                
                isSavingReport = false;
                return; // 保存成功，退出函数
        } catch (error) {
            await log('error', 'Error in saveReport', error);
            
            // 检查是否为版本冲突
            if (error.message && error.message.includes('Version conflict')) {
                retryAttempts++;
                await log('warn', '版本冲突，重试保存', { attempt: retryAttempts, maxRetries: maxRetries });
                await log('debug', '版本冲突详情', { errorMessage: error.message, retryAttempts: retryAttempts, dataVersionsReports: dataVersions['reports'] });
                
                // 清除本地版本缓存，强制重新获取最新数据
                delete dataVersions['reports'];
                await log('debug', '已清除本地版本缓存', { dataVersionsReports: dataVersions['reports'] });
                
                // 短暂延迟后重试
                await new Promise(resolve => setTimeout(resolve, 400));
                
                // 继续外层while循环进行重试
                continue;
            } else {
                // 非版本冲突错误，直接提示
                showAlertModal('保存失败: ' + error.message);
                isSavingReport = false;
                return;
            }
        }
    }
    
    // 超过最大重试次数
    showAlertModal('保存失败: 数据已被其他人修改，请刷新页面后重试');
    isSavingReport = false;
}

// 显示跳转数字神经按钮
async function showJumpButton() {
    const saveButton = document.querySelector('.btn-save');
    if (!saveButton) return;
    
    // 移除已存在的跳转按钮，避免重复添加
    const existingJumpButton = saveButton.nextElementSibling;
    if (existingJumpButton && existingJumpButton.classList.contains('btn-jump-neural')) {
        existingJumpButton.remove();
    }
    
    // 创建新的跳转按钮
    const jumpButton = document.createElement('button');
    jumpButton.className = 'btn btn-secondary btn-jump-neural';
    jumpButton.textContent = '跳转数字神经';
    jumpButton.onclick = async () => {
        await log('info', '用户点击跳转数字神经按钮');
        window.open('https://192.168.56.78/', '_blank');
    };
    
    // 将按钮添加到保存按钮的右侧
    saveButton.parentNode.insertBefore(jumpButton, saveButton.nextSibling);
    await log('info', '显示跳转数字神经按钮');
}

// 检查并显示跳转数字神经按钮（页面加载时调用）
async function checkAndShowJumpButton() {
    const reportType = document.getElementById('reportType').value;
    // 只在日报类型下检查
    if (reportType !== 'daily') {
        // 如果是周报，隐藏可能存在的跳转按钮
        const jumpButton = document.querySelector('.btn-jump-neural');
        if (jumpButton) {
            jumpButton.remove();
        }
        return;
    }
    
    const memberName = document.getElementById('memberName').value;
    const date = new Date().toISOString().split('T')[0];
    
    if (!memberName) return;
    
    try {
        // 获取所有报告
        const reports = await getFromLocalStorage('reports', []);
        
        // 检查是否存在当天的日报
        const hasSavedDailyReport = reports.some(report => {
            const isSameMember = (report.employeeId && report.employeeId === currentMember?.employeeId) ||
                                 (report.memberName && report.memberName === memberName);
            return report.type === 'daily' && report.date === date && isSameMember;
        });
        
        // 如果存在，显示跳转按钮
        if (hasSavedDailyReport) {
            showJumpButton();
        }
    } catch (error) {
        console.error('检查日报是否已保存失败:', error);
    }
}

// 获取内容项的值（旧版本，仅获取文本）
function getContentValues(containerId) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll('input[type="text"]');
    const values = [];
    
    inputs.forEach(input => {
        if (input.value.trim()) {
            values.push(input.value.trim());
        }
    });
    
    return values;
}

// 获取内容项的详细信息（新版本，包含项目、成员和内容）
async function getContentItems(containerId) {
    await log('info', '开始获取内容项', { containerId });
    const container = document.getElementById(containerId);
    const contentItems = container.querySelectorAll('.content-item');
    const items = [];
    
    // 根据容器ID决定是否包含完成进度信息
    const isPlanSection = containerId === 'tomorrowPlan' || containerId === 'weeklyPlan';
    
    contentItems.forEach(item => {
        const projectSelect = item.querySelector('.log-project');
        const membersSelect = item.querySelector('.log-members');
        const contentInput = item.querySelector('input[type="text"]');
        const progressInput = item.querySelector('.log-progress');
        
        if (contentInput && contentInput.value.trim()) {
            const contentItem = {
                content: contentInput.value.trim()
            };
            
            // 添加项目信息
            if (projectSelect && projectSelect.value) {
                contentItem.project = projectSelect.value;
            }
            
            // 添加成员信息
            if (membersSelect) {
                let selectedMembers = [];
                
                // 检查是否是自定义下拉框
                if (membersSelect.classList.contains('custom-select')) {
                    const selectedMembersInput = membersSelect.querySelector('.selected-members');
                    if (selectedMembersInput && selectedMembersInput.value) {
                        selectedMembers = selectedMembersInput.value.split(',');
                    }
                } else {
                    // 兼容旧的select元素
                    selectedMembers = Array.from(membersSelect.selectedOptions)
                        .filter(option => option.value)
                        .map(option => option.value);
                }
                
                if (selectedMembers.length > 0) {
                    contentItem.members = selectedMembers;
                }
            }
            
            // 只有非计划部分才添加完成进度信息
            if (!isPlanSection && progressInput && progressInput.value) {
                contentItem.progress = parseInt(progressInput.value);
            }
            
            items.push(contentItem);
        }
    });
    
    await log('info', '内容项获取完成', { containerId, itemCount: items.length });
    return items;
}

// 加载项目数据到下拉框
async function loadProjectsToDropdown(selectElement) {
    if (!selectElement) return;
    
    // 清空现有选项
    selectElement.innerHTML = '<option value="">请选择项目</option>';
    
    try {
        // 从localStorage获取项目数据，如果没有则使用默认数据
        const defaultProjects = ['数据集成平台', '数据治理平台', '数据分析', 'AI模型管理', '其他'];
        let projects = await getFromLocalStorage('projects', defaultProjects);
        
        // 确保默认项目数据也适配新的数据结构
        if (projects.length > 0 && typeof projects[0] === 'string') {
            projects = projects.map(name => ({ name, milestoneNumber: '', milestoneName: '' }));
        }
        
        // 添加项目选项
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.name;
            option.textContent = project.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        await log('error', '加载项目数据失败', { error: error });
        // 如果加载失败，使用默认项目
        const defaultProjects = ['数据集成平台', '数据治理平台', '数据分析', 'AI模型管理', '其他'];
        const formattedProjects = defaultProjects.map(name => ({ name, milestoneNumber: '', milestoneName: '' }));
        formattedProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.name;
            option.textContent = project.name;
            selectElement.appendChild(option);
        });
    }
}

// 加载成员数据到下拉框
async function loadMembersToDropdown(selectElement) {
    if (!selectElement) return;
    
    try {
        // 从localStorage获取成员数据，如果没有则使用默认数据
        const defaultMembers = [
            {"name": "李希明", "employeeId": "004757"},
            {"name": "张旺", "employeeId": "005724"},
            {"name": "王强", "employeeId": "006891"},
            {"name": "刘芳", "employeeId": "003642"},
            {"name": "赵敏", "employeeId": "007289"},
            {"name": "周杰", "employeeId": "005421"},
            {"name": "孙丽", "employeeId": "002876"},
            {"name": "陈涛", "employeeId": "008975"},
            {"name": "吴宇", "employeeId": "006354"},
            {"name": "郑敏", "employeeId": "004218"},
            {"name": "钱伟", "employeeId": "007159"},
            {"name": "孙杰", "employeeId": "005832"},
            {"name": "李明", "employeeId": "003274"},
            {"name": "张华", "employeeId": "009416"},
            {"name": "王芳", "employeeId": "006752"},
            {"name": "刘敏", "employeeId": "004819"},
            {"name": "赵杰", "employeeId": "007593"},
            {"name": "周丽", "employeeId": "005268"}
        ];
        const members = await getFromLocalStorage('members', defaultMembers);
        
        // 获取当前成员信息
        const currentMemberStr = sessionStorage.getItem('currentMember');
        const currentMember = currentMemberStr ? JSON.parse(currentMemberStr) : null;
        
        // 检查是否是自定义下拉框
        if (selectElement.classList.contains('custom-select')) {
            // 清空现有选项
            const dropdownContent = selectElement.querySelector('.dropdown-content');
            dropdownContent.innerHTML = '';
            
            // 添加成员选项
            members.forEach(member => {
                const memberOption = document.createElement('div');
                memberOption.className = 'dropdown-option';
                memberOption.dataset.employeeId = member.employeeId;
                memberOption.dataset.name = member.name;
                memberOption.textContent = member.name;
                
                dropdownContent.appendChild(memberOption);
            });
            
            // 如果有当前成员，默认选中
            if (currentMember) {


                renderSelectedTags(selectElement, [currentMember.employeeId]);
            } else {

            }
        } else {
            // 传统select元素（兼容旧代码）
            // 清空现有选项
            selectElement.innerHTML = '<option value="">请选择成员</option>';
            
            // 添加成员选项
            members.forEach(member => {
                const option = document.createElement('option');
                option.value = member.employeeId;
                option.textContent = member.name;
                
                // 默认选中当前成员
                if (currentMember && member.employeeId === currentMember.employeeId) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        await log('error', '加载成员数据失败', { error: error });
        // 如果加载失败，使用默认成员
        const defaultMembers = [
            {"name": "李希明", "employeeId": "004757"},
            {"name": "张旺", "employeeId": "005724"},
            {"name": "王强", "employeeId": "006891"},
            {"name": "刘芳", "employeeId": "003642"},
            {"name": "赵敏", "employeeId": "007289"},
            {"name": "周杰", "employeeId": "005421"},
            {"name": "孙丽", "employeeId": "002876"},
            {"name": "陈涛", "employeeId": "008975"},
            {"name": "吴宇", "employeeId": "006354"},
            {"name": "郑敏", "employeeId": "004218"},
            {"name": "钱伟", "employeeId": "007159"},
            {"name": "孙杰", "employeeId": "005832"},
            {"name": "李明", "employeeId": "003274"},
            {"name": "张华", "employeeId": "009416"},
            {"name": "王芳", "employeeId": "006752"},
            {"name": "刘敏", "employeeId": "004819"},
            {"name": "赵杰", "employeeId": "007593"},
            {"name": "周丽", "employeeId": "005268"}
        ];
        
        // 获取当前成员信息
        const currentMemberStr = sessionStorage.getItem('currentMember');
        const currentMember = currentMemberStr ? JSON.parse(currentMemberStr) : null;
        
        // 检查是否是自定义下拉框
        if (selectElement.classList.contains('custom-select')) {
            // 清空现有选项
            const dropdownContent = selectElement.querySelector('.dropdown-content');
            dropdownContent.innerHTML = '';
            
            // 添加成员选项
            defaultMembers.forEach(member => {
                const memberOption = document.createElement('div');
                memberOption.className = 'dropdown-option';
                memberOption.dataset.employeeId = member.employeeId;
                memberOption.dataset.name = member.name;
                memberOption.textContent = member.name;
                
                dropdownContent.appendChild(memberOption);
            });
            
            // 如果有当前成员，默认选中
            if (currentMember) {
                renderSelectedTags(selectElement, [currentMember.employeeId]);
            }
        } else {
            // 传统select元素（兼容旧代码）
            // 清空现有选项
            selectElement.innerHTML = '<option value="">请选择成员</option>';
            
            // 添加成员选项
            defaultMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = member.employeeId;
                option.textContent = member.name;
                
                // 默认选中当前成员
                if (currentMember && member.employeeId === currentMember.employeeId) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });
        }
    }
}

// 重置内容项
function resetContentItems() {
    resetContentContainer('todayProgress');
    resetContentContainer('tomorrowPlan');
    resetContentContainer('weeklyDone');
    resetContentContainer('weeklyPlan');
}

// 重置单个内容容器
function resetContentContainer(containerId) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll('input[type="text"]');
    
    // 清空所有输入框，保留第一个
    inputs.forEach((input, index) => {
        input.value = '';
        if (index > 0) {
            input.parentElement.remove();
        }
    });
}

// 初始化自定义成员下拉框
function initCustomMemberDropdown(selectElement) {
    if (!selectElement || !selectElement.classList.contains('custom-select')) return;
    
    const trigger = selectElement.querySelector('.select-trigger');
    const dropdown = selectElement.querySelector('.select-dropdown');
    const options = selectElement.querySelectorAll('.dropdown-option');
    
    // 点击触发按钮显示/隐藏下拉框
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(selectElement);
    });
    
    // 点击选项选择成员
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMemberSelect(selectElement, option);
        });
    });
    
    // 点击页面其他地方关闭下拉框
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });
    
    // 阻止下拉框内部点击事件冒泡
    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// 切换下拉框显示/隐藏
function toggleDropdown(selectElement) {
    const dropdown = selectElement.querySelector('.select-dropdown');
    
    // 先关闭所有下拉框
    closeAllDropdowns();
    
    // 再切换当前下拉框
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// 关闭所有下拉框
function closeAllDropdowns() {
    const allDropdowns = document.querySelectorAll('.select-dropdown');
    allDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

// 处理成员选择
function handleMemberSelect(selectElement, option) {
    const employeeId = option.dataset.employeeId;
    const name = option.dataset.name;
    
    // 获取当前选中的成员ID
    const selectedMembersInput = selectElement.querySelector('.selected-members');
    let selectedIds = selectedMembersInput.value ? selectedMembersInput.value.split(',') : [];
    
    // 检查是否已经选中
    if (selectedIds.includes(employeeId)) {
        // 如果已经选中，移除
        selectedIds = selectedIds.filter(id => id !== employeeId);
    } else {
        // 如果未选中，添加
        selectedIds.push(employeeId);
    }
    
    // 更新隐藏输入框的值
    selectedMembersInput.value = selectedIds.join(',');
    
    // 重新渲染选中的标签
    renderSelectedTags(selectElement, selectedIds);
    
    // 保持下拉框打开状态
    const dropdown = selectElement.querySelector('.select-dropdown');
    if (dropdown) {
        dropdown.style.display = 'block';
    }
}

// 渲染选中的成员标签
function renderSelectedTags(selectElement, selectedIds) {
    const selectedTagsContainer = selectElement.querySelector('.selected-tags');
    const options = selectElement.querySelectorAll('.dropdown-option');
    const selectedMembersInput = selectElement.querySelector('.selected-members');
    
    // 清空现有标签
    selectedTagsContainer.innerHTML = '';
    
    // 生成新标签
    selectedIds.forEach(employeeId => {
        const option = Array.from(options).find(opt => opt.dataset.employeeId === employeeId);
        if (option) {
            const name = option.dataset.name;
            
            // 创建标签元素
            const tag = document.createElement('div');
            tag.className = 'selected-tag';
            tag.dataset.employeeId = employeeId;
            tag.innerHTML = `
                ${name}
                <span class="tag-remove" onclick="removeTag(event, this)">×</span>
            `;
            
            selectedTagsContainer.appendChild(tag);
        }
    });
    
    // 更新隐藏输入框的值
    if (selectedMembersInput) {
        selectedMembersInput.value = selectedIds.join(',');
    }
    
    // 更新触发器的样式
    const trigger = selectElement.querySelector('.select-trigger');
    if (selectedIds.length === 0) {
        trigger.classList.add('placeholder');
    } else {
        trigger.classList.remove('placeholder');
    }
}

// 移除选中的成员标签
function removeTag(event, removeButton) {
    event.stopPropagation();
    
    const tag = removeButton.parentElement;
    const selectElement = tag.closest('.custom-select');
    const employeeId = tag.dataset.employeeId;
    
    // 获取当前选中的成员ID
    const selectedMembersInput = selectElement.querySelector('.selected-members');
    let selectedIds = selectedMembersInput.value ? selectedMembersInput.value.split(',') : [];
    
    // 移除该成员ID
    selectedIds = selectedIds.filter(id => id !== employeeId);
    
    // 更新隐藏输入框的值
    selectedMembersInput.value = selectedIds.join(',');
    
    // 重新渲染选中的标签
    renderSelectedTags(selectElement, selectedIds);
}

// 显示成功消息
function showSuccessMessage() {
    const message = document.getElementById('successMessage');
    message.style.display = 'block';
    
    // 3秒后隐藏消息
    setTimeout(() => {
        message.style.display = 'none';
    }, 3000);
}

// 显示提示弹窗
function showAlertModal(message) {
    const modal = document.getElementById('alertModal');
    const messageElement = document.getElementById('alertMessage');
    
    messageElement.textContent = message;
    modal.style.display = 'block';
}

// 关闭提示弹窗
function closeAlertModal() {
    const modal = document.getElementById('alertModal');
    modal.style.display = 'none';
}

// 带入昨日报告内容
async function loadYesterdayReport() {
    // 从sessionStorage获取当前成员信息
    const memberStr = sessionStorage.getItem('currentMember');
    const reportType = document.getElementById('reportType').value;
    
    if (!memberStr) {
        showError('memberNameError', '请先完成成员身份验证');
        return;
    }
    
    const currentMember = JSON.parse(memberStr);
    const currentEmployeeId = currentMember.employeeId;
    
    // 计算昨天的日期
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    
    try {
        // 获取所有报告数据
        const reports = await getFromLocalStorage('reports', []);
        
        // 查找昨天的报告
        const yesterdayReport = reports.find(report => 
            report.employeeId === currentEmployeeId && 
            report.type === reportType && 
            report.date === yesterdayDate
        );
        
        if (yesterdayReport) {
            // 填充报告内容
            if (reportType === 'daily') {
                // 填充今日进展
                await fillContentItems('todayProgress', yesterdayReport.todayProgress || []);
                // 填充明日计划
                await fillContentItems('tomorrowPlan', yesterdayReport.tomorrowPlan || []);
                // 注意：项目现在是每个内容项独立选择的，不再是整个报告的属性
                // if (yesterdayReport.project) {
                //     document.getElementById('project').value = yesterdayReport.project;
                // }
            } else {
                // 填充本周完成工作
                await fillContentItems('weeklyDone', yesterdayReport.weeklyDone || []);
                // 填充下周工作计划
                await fillContentItems('weeklyPlan', yesterdayReport.weeklyPlan || []);
            }
            
            // 显示成功消息
            showAlertModal('昨日内容已成功带入！');
        } else {
            // 没有找到昨天的报告
            showAlertModal(`未找到${reportType === 'daily' ? '昨日日报' : '昨日周报'}数据`);
        }
    } catch (error) {
        await log('error', '加载昨日报告失败', { error: error });
        showAlertModal('加载昨日报告失败，请重试');
    }
}

// 根据成员姓名和日期加载当天的报告
async function loadMemberReport() {
    await log('info', 'loadMemberReport函数开始执行');
    
    // 从sessionStorage获取当前成员信息
    const memberStr = sessionStorage.getItem('currentMember');
    let currentMember = memberStr ? JSON.parse(memberStr) : null;
    let currentEmployeeId = currentMember ? currentMember.employeeId : null;
    
    // 获取成员名称（可能从页面或currentMember中获取）
    const memberName = document.getElementById('memberName').value;
    
    // 如果页面中没有成员名称，尝试从currentMember中获取
    if (!memberName && currentMember) {
        document.getElementById('memberName').value = currentMember.name;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // 获取所有报告数据
        const reports = await getFromLocalStorage('reports', []);
        
        // 获取所有成员数据，用于备用查找
        const allMembers = await getFromLocalStorage('members', []);
        
        // 如果没有currentEmployeeId但有memberName，尝试通过memberName获取employeeId
        if (!currentEmployeeId && memberName) {
            
            // 清理姓名：去除首尾空格和多余空格
            const trimmedName = memberName.trim().replace(/\s+/g, '');
            
            // 方法1：精确匹配（优先）
            let matchedMember = allMembers.find(m => 
                m.name.trim().replace(/\s+/g, '') === trimmedName
            );
            
            // 方法2：如果精确匹配失败，尝试使用包含匹配
            if (!matchedMember) {
                matchedMember = allMembers.find(m => 
                    m.name.includes(trimmedName) || trimmedName.includes(m.name)
                );
            }
            
            // 方法3：如果还是失败，尝试使用首字母匹配
            if (!matchedMember) {
                const getFirstLetter = (name) => {
                    return name.charAt(0).toUpperCase();
                };
                const targetFirstLetter = getFirstLetter(trimmedName);
                matchedMember = allMembers.find(m => 
                    getFirstLetter(m.name) === targetFirstLetter
                );
            }
            
            if (matchedMember) {
                currentEmployeeId = matchedMember.employeeId;
                await log('info', '通过成员名称获取到员工ID', { memberName: memberName, employeeId: currentEmployeeId });
            } else {
                await log('warn', '未找到匹配的成员', { memberName: memberName });
            }
        }
        
        // 确保currentEmployeeId是字符串类型
        currentEmployeeId = currentEmployeeId ? String(currentEmployeeId) : null;
        
        // 查找当天的报告
        // 获取当前选择的报告类型
        const currentReportType = document.getElementById('reportType').value;
        
        const todayReport = reports.find((report) => {





            
            // 确保employeeId类型一致（转换为字符串比较）
            const reportEmployeeIdStr = report.employeeId ? String(report.employeeId) : null;
            const currentEmployeeIdStr = currentEmployeeId ? String(currentEmployeeId) : null;
            
            // 优先使用employeeId匹配，如果没有则使用memberName匹配
            const idMatch = reportEmployeeIdStr && currentEmployeeIdStr && reportEmployeeIdStr === currentEmployeeIdStr;
            const nameMatch = !idMatch && report.memberName === memberName;
            
            // 匹配同一天
            const dateMatch = report.date === today;
            // 匹配当前选择的报告类型
            const typeMatch = report.type === currentReportType;
            





            
            return (idMatch || nameMatch) && dateMatch && typeMatch;
        });
        


        
        if (todayReport) {
            await log('info', '找到当天报告，开始填充数据', { reportId: todayReport.id, reportType: todayReport.type });
            
            // 设置报告ID
            document.getElementById('reportId').value = todayReport.id;
            
            // 设置报告类型
            const reportTypeElement = document.getElementById('reportType');
            if (reportTypeElement.value !== todayReport.type) {
                reportTypeElement.value = todayReport.type;
                
                // 手动切换报告类型显示，不触发onchange事件
                const dailyContent = document.getElementById('dailyContent');
                const weeklyContent = document.getElementById('weeklyContent');
                
                if (todayReport.type === 'daily') {
                    dailyContent.style.display = 'block';
                    weeklyContent.style.display = 'none';
                } else {
                    dailyContent.style.display = 'none';
                    weeklyContent.style.display = 'block';
                }
            }
            
            // 填充内容
            if (todayReport.type === 'daily') {
                // 确保todayProgress和tomorrowPlan存在且为数组
                const todayProgress = Array.isArray(todayReport.todayProgress) ? todayReport.todayProgress : [];
                const tomorrowPlan = Array.isArray(todayReport.tomorrowPlan) ? todayReport.tomorrowPlan : [];
                
                // 填充今日进展
                await fillContentItems('todayProgress', todayProgress);
                
                // 填充明日计划
                await fillContentItems('tomorrowPlan', tomorrowPlan);
            } else {
                // 确保weeklyDone和weeklyPlan存在且为数组
                const weeklyDone = Array.isArray(todayReport.weeklyDone) ? todayReport.weeklyDone : [];
                const weeklyPlan = Array.isArray(todayReport.weeklyPlan) ? todayReport.weeklyPlan : [];
                
                // 填充本周完成工作
                await fillContentItems('weeklyDone', weeklyDone);
                
                // 填充下周工作计划
                await fillContentItems('weeklyPlan', weeklyPlan);
            }
            

        } else {
            await log('info', '未找到当天报告数据，清空表单内容', { memberName: memberName, date: today });
            // 没有找到报告，清空表单（除了姓名）
            clearFormExceptName();
            // 注意：这里不清空reportId，让保存时自动生成新ID
        }
    } catch (error) {
        await log('error', '加载报告数据失败', { error: error });
        alert('加载报告数据失败，请重试');
    }
}

// 填充内容项
async function fillContentItems(containerId, items) {
    const container = document.getElementById(containerId);
    
    // 清空现有内容（保留第一个内容项）
    const existingItems = container.querySelectorAll('.content-item');
    existingItems.forEach((item, index) => {
        if (index > 0) {
            item.remove();
        } else {
            // 清空第一个内容项的所有字段
            const projectSelect = item.querySelector('.log-project');
            const membersSelect = item.querySelector('.log-members');
            const contentInput = item.querySelector('input[type="text"]');
            const progressInput = item.querySelector('.log-progress');
            
            if (projectSelect) projectSelect.value = '';
            if (membersSelect) {
                // 保留成员选择器的默认值（当前用户）
                // 不清除成员选择
            }
            if (contentInput) contentInput.value = '';
            if (progressInput) progressInput.value = '';
        }
    });
    
    // 如果没有数据，保持一个空的内容项
    if (!items || items.length === 0) {
        return;
    }
    
    // 填充数据
    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        let contentItemElement;
        
        if (index === 0) {
            // 使用第一个内容项
            contentItemElement = container.querySelector('.content-item');
        } else {
            // 添加新的内容项
            const newItem = document.createElement('div');
            newItem.className = 'content-item';
            
            // 根据容器ID决定是否包含完成进度输入字段
            const isPlanSection = containerId === 'tomorrowPlan' || containerId === 'weeklyPlan';
            
            let innerHTML = `
                <select class="log-project" required>
                    <option value="">请选择项目</option>
                </select>
                <div class="custom-select log-members">
                    <div class="select-trigger">
                        <div class="selected-tags"></div>
                        <span class="caret">▼</span>
                    </div>
                    <div class="select-dropdown">
                        <div class="dropdown-content">
                            <!-- 成员选项将通过JavaScript动态生成 -->
                        </div>
                    </div>
                    <input type="hidden" class="selected-members" name="members" required>
                </div>
                <input type="text" placeholder="请输入内容" required>
            `;
            
            // 只有非计划部分才添加完成进度输入字段
            if (!isPlanSection) {
                innerHTML += `
                    <div class="progress-container">
                        <input type="number" class="log-progress" placeholder="进度" min="1" max="100" required>
                        <span class="progress-percent">%</span>
                    </div>
                `;
            }
            
            innerHTML += `
                <button type="button" onclick="removeContentItem(this)" class="btn-remove">×</button>
            `;
            
            newItem.innerHTML = innerHTML;
            container.appendChild(newItem);
            contentItemElement = newItem;
        }
        
        // 填充数据到内容项
        const projectSelect = contentItemElement.querySelector('.log-project');
        const membersSelect = contentItemElement.querySelector('.log-members');
        const contentInput = contentItemElement.querySelector('input[type="text"]');
        const progressInput = contentItemElement.querySelector('.log-progress');
        
        // 先填充内容文本（确保内容能立即显示）
        if (contentInput) {
            contentInput.value = item.content || '';
        }
        
        // 加载项目和成员数据
        await loadProjectsToDropdown(projectSelect);
        await loadMembersToDropdown(membersSelect);
        
        // 初始化自定义下拉框事件
        initCustomMemberDropdown(membersSelect);
        
        // 填充项目选择
        if (projectSelect && item.project) {
            projectSelect.value = item.project;
        }
        
        // 填充成员选择
        if (membersSelect && item.members) {
            // 确保item.members是数组
            const memberIds = Array.isArray(item.members) ? item.members : [item.members];
            
            // 检查是否是自定义下拉框
            if (membersSelect.classList.contains('custom-select')) {
                // 使用自定义下拉框的渲染方法
                renderSelectedTags(membersSelect, memberIds);
            }
        }
        
        // 填充完成进度
        if (progressInput && item.progress) {
            progressInput.value = item.progress;
        }
    }
}

// 清空表单（除了姓名）
function clearFormExceptName() {
    // 注意：项目现在是每个内容项独立选择的，不再是整个报告的属性
    // document.getElementById('project').value = '';
    
    // 清空reportId
    document.getElementById('reportId').value = '';
    
    // 清空所有内容项（日报和周报的内容区域）
    const contentContainers = ['todayProgress', 'tomorrowPlan', 'weeklyDone', 'weeklyPlan'];
    contentContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            const existingItems = container.querySelectorAll('.content-item');
            existingItems.forEach((item, index) => {
                if (index > 0) {
                    item.remove();
                } else {
                    // 清空第一个内容项的所有字段
                    const projectSelect = item.querySelector('.log-project');
                    const membersSelect = item.querySelector('.log-members');
                    const contentInput = item.querySelector('input[type="text"]');
                    
                    if (projectSelect) projectSelect.value = '';
                    if (membersSelect) {
                        // 保留成员选择器的默认值（当前用户）
                        // 不清除成员选择
                    }
                    if (contentInput) contentInput.value = '';
                }
            });
        }
    });
}

// 日志相关变量
let allLogs = [];
let filteredLogs = [];
let currentPage = 1;
let logsPerPage = 10;

// 加载成员所有日志
async function loadMemberLogs() {
    const memberName = document.getElementById('memberName').value;
    if (!memberName) return;
    
    try {
        // 获取所有报告数据
        const reports = await getFromLocalStorage('reports', []);
        
        // 过滤当前成员的报告
        allLogs = reports.filter(report => report.memberName === memberName)
                       .sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期倒序排列
        
        // 初始时不筛选，显示所有日志
        filteredLogs = [...allLogs];
        
        // 渲染日志列表
        renderLogs();
    } catch (error) {
        await log('error', '加载日志失败', { error: error });
        alert('加载历史日志失败，请重试');
    }
}

// 筛选日志
function filterLogs() {
    const logType = document.getElementById('logTypeFilter').value;
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;
    
    // 应用筛选条件
    filteredLogs = allLogs.filter(log => {
        // 类型筛选
        if (logType !== 'all' && log.type !== logType) {
            return false;
        }
        
        // 开始日期筛选
        if (startDate && log.date < startDate) {
            return false;
        }
        
        // 结束日期筛选
        if (endDate && log.date > endDate) {
            return false;
        }
        
        return true;
    });
    
    // 重置当前页码
    currentPage = 1;
    
    // 重新渲染日志列表
    renderLogs();
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('logTypeFilter').value = 'all';
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
    
    // 显示所有日志
    filteredLogs = [...allLogs];
    currentPage = 1;
    renderLogs();
}

// 渲染日志列表
async function renderLogs() {
    const logsList = document.getElementById('logsList');
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    
    // 计算当前页的日志
    const startIndex = (currentPage - 1) * logsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);
    
    // 清空列表
    logsList.innerHTML = '';
    
    // 如果没有日志
    if (currentLogs.length === 0) {
        logsList.innerHTML = '<p class="no-logs">暂无历史日志</p>';
        updatePagination(totalPages);
        return;
    }
    
    // 获取所有成员数据，用于转换员工ID为姓名
    const allMembers = await getFromLocalStorage('members', []);
    
    // 辅助函数：根据员工ID获取姓名
    const getMemberNameById = (employeeId) => {
        const member = allMembers.find(m => m.employeeId === employeeId);
        return member ? member.name : employeeId; // 如果找不到，返回员工ID
    };
    
    // 渲染日志条目
        currentLogs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            logItem.setAttribute('data-log-id', log.id);
        
        // 辅助函数：根据进度获取显示文本
        const getProgressText = (progress) => {

            if (progress === null || progress === undefined) return '进行中';
            if (progress > 100) return '已完成';
            return `已完成${progress}%`;
        };

        // 构建日志内容
        let logContent = '';
        // 辅助函数：构建单个工作项的HTML
        const buildWorkItemHTML = (item) => {
            let itemHTML = `项目: ${item.project || '未选择项目'} - ${item.content || item}`;
            // 添加进度信息
            if (item.progress !== undefined) {
                itemHTML += `，${getProgressText(item.progress)}`;
            }
            // 添加成员信息
            if (item.members && item.members.length > 0) {
                const memberNames = item.members.map(getMemberNameById);
                itemHTML += ` —— ${memberNames.join('、')}`;
            }
            return itemHTML;
        };
        
        if (log.type === 'daily') {
            logContent = `
                <div class="log-detail">
                    <strong>今日进展：</strong>
                    <ul>${log.todayProgress.map(item => `<li>${buildWorkItemHTML(item)}</li>`).join('')}</ul>
                    <strong>明日计划：</strong>
                    <ul>${log.tomorrowPlan.map(item => `<li>${buildWorkItemHTML(item)}</li>`).join('')}</ul>
                </div>
            `;
        } else {
            logContent = `
                <div class="log-detail">
                    <strong>本周完成工作：</strong>
                    <ul>${log.weeklyDone.map(item => `<li>${buildWorkItemHTML(item)}</li>`).join('')}</ul>
                    <strong>下周工作计划：</strong>
                    <ul>${log.weeklyPlan.map(item => `<li>${buildWorkItemHTML(item)}</li>`).join('')}</ul>
                </div>
            `;
        }
        
        // 设置日志条目HTML
        logItem.innerHTML = `
            <div class="log-header">
                <span class="log-date">${log.date}</span>
                <span class="log-member">${log.memberName}</span>
                <span class="log-type log-type-${log.type}">${log.type === 'daily' ? '日报' : '周报'}</span>
            </div>
            <div class="log-content-view">
                ${logContent}
            </div>
        `;
        
        logsList.appendChild(logItem);
    });
    
    // 更新分页组件
    updatePagination(totalPages);
}

// 更新分页组件
function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    // 更新页码信息
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    
    // 禁用/启用分页按钮
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// 上一页
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderLogs();
    }
}

// 下一页
function goToNextPage() {
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderLogs();
    }
}

// 显示日志弹窗
function showLogsModal() {
    // 加载日志
    loadMemberLogs();
    
    // 显示弹窗
    const modal = document.getElementById('logsModal');
    modal.style.display = 'block';
}

// 关闭日志弹窗
function closeLogsModal() {
    const modal = document.getElementById('logsModal');
    modal.style.display = 'none';
}

// 初始化日志相关事件监听器
function initLogs() {
    // 成员姓名输入变化时加载日志
    const memberNameInput = document.getElementById('memberName');
    if (memberNameInput) {
        memberNameInput.addEventListener('change', loadMemberLogs);
    }
    
    // 分页按钮事件监听
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) prevPageBtn.addEventListener('click', goToPrevPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', goToNextPage);
    
    // 筛选按钮事件监听
    const filterBtn = document.querySelector('.filter-controls .btn-secondary:first-of-type');
    const resetBtn = document.querySelector('.filter-controls .btn-secondary:last-of-type');
    
    if (filterBtn) filterBtn.addEventListener('click', filterLogs);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
}

// 模板相关函数

// 保存模板
async function saveTemplate(type) {
    const template = document.getElementById(type + 'Template').value;
    await saveToLocalStorage(type + 'Template', template);
    alert(type === 'daily' ? '日报模板保存成功！' : '周报模板保存成功！');
}

// 加载模板
async function loadTemplates() {
    const dailyTemplate = await getFromLocalStorage('dailyTemplate', '{date} 日报\n\n【数据小组】——李希明\n一、近期任务：\n （1）12.31，数据分析试点项目开发；\n （2）12.31，数据集成平台市监局项目实施工作；\n （3）持续进行高速数据仓库及数据工程服务建设；\n （4）持续进行数据治理、数据集成、数据分析等产品售前工作及资料编写；\n二、今日进展：\n{todayProgress}\n三、明日计划：\n{tomorrowPlan}\n四、当前问题及风险：\n  无\n|\n');
    const weeklyTemplate = await getFromLocalStorage('weeklyTemplate', '【数据小组】周报\n{date}\n\n一、本周完成工作：\n{weeklyDone}\n\n二、下周工作计划：\n{weeklyPlan}');

    
    if (document.getElementById('dailyTemplate')) {
        document.getElementById('dailyTemplate').value = dailyTemplate;
    }
    if (document.getElementById('weeklyTemplate')) {
        document.getElementById('weeklyTemplate').value = weeklyTemplate;
    }
}

// 生成报告
async function generateReport() {
    const reportType = document.getElementById('dataReportType').value;
    const date = document.getElementById('dataDate').value;
    
    // 检查日期是否选择
    if (!date) {
        alert('请先选择报告日期！');
        return;
    }
    
    // 获取报告数据
    const reports = await getFromLocalStorage('reports', []);
    const filteredReports = reports.filter(report => 
        report.type === reportType && report.date === date
    );
    
    if (filteredReports.length === 0) {
        alert('该日期没有找到对应的报告数据！');
        return;
    }
    
    // 获取模板（如果没有则使用默认模板）
    const template = await getFromLocalStorage(reportType + 'Template') || 
        (reportType === 'daily' ? '{date} 日报\n\n【数据小组】——李希明\n一、近期任务：\n （1）12.31，数据分析试点项目开发；\n （2）12.31，数据集成平台市监局项目实施工作；\n （3）持续进行高速数据仓库及数据工程服务建设；\n （4）持续进行数据治理、数据集成、数据分析等产品售前工作及资料编写；\n二、今日进展：\n{todayProgress}\n三、明日计划：\n{tomorrowPlan}\n四、当前问题及风险：\n  无\n|\n' : '周报模板\n{date} 周报\n\n成员：{memberName}\n\n本周完成工作：\n{weeklyDone}\n\n下周工作计划：\n{weeklyPlan}');
    
    // 生成报告内容
    let reportContent;
    
    if (reportType === 'daily') {
        // 按项目和工作类型组织日报数据
        reportContent = await generateDailyReport(filteredReports, date, template);
    } else {
        // 周报仍使用原有模板系统
        reportContent = await generateWeeklyReport(filteredReports, date, template);
    }
    
    // 显示生成的报告在弹窗中
    const generatedReportModal = document.getElementById('generatedReportModal');
    const generatedReportContent = document.getElementById('generatedReportContent');
    const generatedReportTitle = document.getElementById('generatedReportTitle');
    
    generatedReportTitle.textContent = `${reportType === 'daily' ? '日报' : '周报'} - ${date}`;
    generatedReportContent.value = reportContent;
    generatedReportModal.style.display = 'block';
}

// 关闭生成报告弹窗
function closeGeneratedReportModal() {
    const modal = document.getElementById('generatedReportModal');
    modal.style.display = 'none';
}

// 复制报告内容
async function copyReportContent() {
    const content = document.getElementById('generatedReportContent').value;
    
    // 方法1：使用现代Clipboard API（首选）
    try {
        await navigator.clipboard.writeText(content);
        showAlertModal('报告内容已复制到剪贴板！');
        return;
    } catch (err) {
        await log('error', 'Clipboard API复制失败', { error: err });
    }
    
    // 方法2：使用传统的execCommand方法（备选）
    try {
        // 创建一个临时文本区域
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed'; // 避免滚动
        textArea.style.opacity = '0'; // 隐藏元素
        document.body.appendChild(textArea);
        
        // 选择文本并复制
        textArea.select();
        document.execCommand('copy');
        
        // 清理
        document.body.removeChild(textArea);
        
        showAlertModal('报告内容已复制到剪贴板！');
        return;
    } catch (err) {
        await log('error', 'execCommand复制失败', { error: err });
    }
    
    // 两种方法都失败，提示手动复制
    showAlertModal('复制失败，请手动复制！');
}

// 计算指定日期的前后日期
function calculateDateOffsets(baseDate, daysOffset) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}

// 生成日报报告（按项目分类格式）
async function generateDailyReport(reports, date, template) {
    // 获取用户预设的项目顺序
    const userProjects = await getFromLocalStorage('projects', []);
    const userProjectNames = userProjects.map(project => project.name);
    
    // 提取报告中实际存在的项目
    const existingProjects = new Set();
    reports.forEach(report => {
        if (report.todayProgress) {
            report.todayProgress.forEach(item => {
                if (item.project) existingProjects.add(item.project);
            });
        }
        if (report.tomorrowPlan) {
            report.tomorrowPlan.forEach(item => {
                if (item.project) existingProjects.add(item.project);
            });
        }
    });
    
    // 按用户预设顺序排列项目，未预设的项目放在末尾
    const projectList = [];
    // 先添加用户预设顺序中存在于报告中的项目
    userProjectNames.forEach(projectName => {
        if (existingProjects.has(projectName)) {
            projectList.push(projectName);
            existingProjects.delete(projectName); // 避免重复添加
        }
    });
    // 再添加剩余的项目（报告中存在但未在预设列表中的项目）
    projectList.push(...existingProjects);
    
    // 组织今日进展数据（按项目分类）
    const todayProgress = {};
    projectList.forEach(project => {
        todayProgress[project] = [];
    });
    
    // 组织明日计划数据（按项目分类）
    const tomorrowPlan = {};
    projectList.forEach(project => {
        tomorrowPlan[project] = [];
    });
    
    // 添加未分配项目的数据
    todayProgress['其他'] = [];
    tomorrowPlan['其他'] = [];
    
    // 获取完整的成员数据
    const allMembers = await getFromLocalStorage('members', []);
    
    // 填充数据（按项目和成员合并同一类型的多条内容）
    reports.forEach(report => {
        // 辅助函数：根据进度值获取进度文本
        const getProgressText = (progress) => {
            if (progress === null || progress === undefined) return '进行中';
            if (progress > 100) return '已完成';
            return `已完成${progress}%`;
        };
        
        // 处理今日进展
        if (report.todayProgress && report.todayProgress.length > 0) {
            report.todayProgress.forEach(item => {
                const project = item.project || '其他';
                const content = item.content || '';
                const progress = item.progress;
                const memberIds = item.members || [];
                
                // 查找成员名称
                const memberNames = memberIds.map(id => {
                    const member = allMembers.find(m => m.employeeId === id);
                    return member ? member.name : id;
                }).filter(Boolean);
                
                // 如果没有找到成员名称，使用报告的成员名称
                const finalMemberNames = memberNames.length > 0 ? memberNames : [report.memberName];
                
                // 拼接内容和进度
                const contentWithProgress = `${content}，${getProgressText(progress)}`;
                
                // 查找该成员组合在该项目下是否已有今日进展条目
                const existingProgressIndex = todayProgress[project].findIndex(existingItem => 
                    JSON.stringify(existingItem.members) === JSON.stringify(finalMemberNames)
                );
                
                if (existingProgressIndex >= 0) {
                    // 如果已有条目，将新内容用分号合并
                    todayProgress[project][existingProgressIndex].content += '；' + contentWithProgress;
                } else {
                    // 如果没有条目，创建新条目
                    todayProgress[project].push({
                        content: contentWithProgress,
                        members: finalMemberNames
                    });
                }
            });
        }
        
        // 处理明日计划
        if (report.tomorrowPlan && report.tomorrowPlan.length > 0) {
            report.tomorrowPlan.forEach(item => {
                const project = item.project || '其他';
                const content = item.content || '';
                const progress = item.progress;
                const memberIds = item.members || [];
                
                // 查找成员名称
                const memberNames = memberIds.map(id => {
                    const member = allMembers.find(m => m.employeeId === id);
                    return member ? member.name : id;
                }).filter(Boolean);
                
                // 如果没有找到成员名称，使用报告的成员名称
                const finalMemberNames = memberNames.length > 0 ? memberNames : [report.memberName];
                
                // 明日计划不需要进度
                const contentWithProgress = content;
                
                // 查找该成员组合在该项目下是否已有明日计划条目
                const existingPlanIndex = tomorrowPlan[project].findIndex(existingItem => 
                    JSON.stringify(existingItem.members) === JSON.stringify(finalMemberNames)
                );
                
                if (existingPlanIndex >= 0) {
                    // 如果已有条目，将新内容用分号合并
                    tomorrowPlan[project][existingPlanIndex].content += '；' + contentWithProgress;
                } else {
                    // 如果没有条目，创建新条目
                    tomorrowPlan[project].push({
                        content: contentWithProgress,
                        members: finalMemberNames
                    });
                }
            });
        }
    });
    
    // 生成报告内容
    let reportContent = '';
    
    // 如果有模板且是字符串类型，使用模板
    if (template && typeof template === 'string') {
        reportContent = template;
        
        // 计算并替换日期变量
        const yesterday = calculateDateOffsets(date, -1);
        const tomorrow = calculateDateOffsets(date, 1);
        reportContent = reportContent.replace(/{date}/g, date);
        reportContent = reportContent.replace(/{yesterday}/g, yesterday);
        reportContent = reportContent.replace(/{tomorrow}/g, tomorrow);
        
        // 生成今日进展部分
        let todayProgressText = '';
        let projectIndex = 1;
        for (const [project, items] of Object.entries(todayProgress)) {
            if (items.length === 0) continue;
            
            todayProgressText += `${projectIndex}、${project}\n`;
            let itemIndex = 1;
            items.forEach(item => {
                const membersText = item.members.join('、');
                todayProgressText += `  （${itemIndex}）${item.content}——${membersText}；\n`;
                itemIndex++;
            });
            projectIndex++;
        }
        reportContent = reportContent.replace(/{todayProgress}/g, todayProgressText);
        
        // 生成明日计划部分
        let tomorrowPlanText = '';
        projectIndex = 1;
        for (const [project, items] of Object.entries(tomorrowPlan)) {
            if (items.length === 0) continue;
            
            tomorrowPlanText += `${projectIndex}、${project}\n`;
            let itemIndex = 1;
            items.forEach(item => {
                const membersText = item.members.join('、');
                tomorrowPlanText += `  （${itemIndex}）${item.content}——${membersText}；\n`;
                itemIndex++;
            });
            projectIndex++;
        }
        reportContent = reportContent.replace(/{tomorrowPlan}/g, tomorrowPlanText);
    } else {
        // 默认模板
        reportContent = `${date} 日报\n\n`;
        
        // 今日进展
        reportContent += '二、今日进展：\n';
        let projectIndex = 1;
        for (const [project, items] of Object.entries(todayProgress)) {
            if (items.length === 0) continue;
            
            reportContent += `${projectIndex}、${project}\n`;
            let itemIndex = 1;
            items.forEach(item => {
                const membersText = item.members.join('、');
                reportContent += `  （${itemIndex}）${item.content}——${membersText}；\n`;
                itemIndex++;
            });
            projectIndex++;
        }
        
        reportContent += '\n';
        
        // 明日计划
        reportContent += '三、明日计划：\n';
        projectIndex = 1;
        for (const [project, items] of Object.entries(tomorrowPlan)) {
            if (items.length === 0) continue;
            
            reportContent += `${projectIndex}、${project}\n`;
            let itemIndex = 1;
            items.forEach(item => {
                const membersText = item.members.join('、');
                reportContent += `  （${itemIndex}）${item.content}——${membersText}；\n`;
                itemIndex++;
            });
            projectIndex++;
        }
        
        reportContent += '\n四、当前问题及风险：\n  无\n|\n';
    }
    
    return reportContent;
}

// 生成周报报告（按项目分类格式，参考日报合并逻辑）
async function generateWeeklyReport(reports, date, template) {
    // 获取用户预设的项目顺序
    const userProjects = await getFromLocalStorage('projects', []);
    const userProjectNames = userProjects.map(project => project.name);
    
    // 提取报告中实际存在的项目
    const existingProjects = new Set();
    reports.forEach(report => {
        if (report.weeklyDone) {
            report.weeklyDone.forEach(item => {
                if (item.project) existingProjects.add(item.project);
            });
        }
        if (report.weeklyPlan) {
            report.weeklyPlan.forEach(item => {
                if (item.project) existingProjects.add(item.project);
            });
        }
    });
    
    // 按用户预设顺序排列项目，未预设的项目放在末尾
    const projectList = [];
    // 先添加用户预设顺序中存在于报告中的项目
    userProjectNames.forEach(projectName => {
        if (existingProjects.has(projectName)) {
            projectList.push(projectName);
            existingProjects.delete(projectName); // 避免重复添加
        }
    });
    // 再添加剩余的项目（报告中存在但未在预设列表中的项目）
    projectList.push(...existingProjects);
    
    // 组织本周完成工作数据（按项目分类）
    const weeklyDone = {};
    projectList.forEach(project => {
        weeklyDone[project] = [];
    });
    
    // 组织下周工作计划数据（按项目分类）
    const weeklyPlan = {};
    projectList.forEach(project => {
        weeklyPlan[project] = [];
    });
    
    // 添加未分配项目的数据
    weeklyDone['其他'] = [];
    weeklyPlan['其他'] = [];
    
    // 获取完整的成员数据
    const allMembers = await getFromLocalStorage('members', []);
    
    // 填充数据（按项目和成员合并同一类型的多条内容）
    reports.forEach(report => {
        // 辅助函数：根据进度值获取进度文本
        const getProgressText = (progress) => {
            if (progress === null || progress === undefined) return '进行中';
            if (progress > 100) return '已完成';
            return `已完成${progress}%`;
        };
        
        // 处理本周完成工作
        if (report.weeklyDone && report.weeklyDone.length > 0) {
            report.weeklyDone.forEach(item => {
                const project = item.project || '其他';
                const content = item.content || '';
                const progress = item.progress;
                const memberIds = item.members || [];
                
                // 查找成员名称
                const memberNames = memberIds.map(id => {
                    const member = allMembers.find(m => m.employeeId === id);
                    return member ? member.name : id;
                }).filter(Boolean);
                
                // 如果没有找到成员名称，使用报告的成员名称
                const finalMemberNames = memberNames.length > 0 ? memberNames : [report.memberName];
                
                // 拼接内容和进度
                const contentWithProgress = `${content}，${getProgressText(progress)}`;
                
                // 查找该成员组合在该项目下是否已有本周完成工作条目
                const existingDoneIndex = weeklyDone[project].findIndex(existingItem => 
                    JSON.stringify(existingItem.members) === JSON.stringify(finalMemberNames)
                );
                
                if (existingDoneIndex >= 0) {
                    // 如果已有条目，将新内容用分号合并
                    weeklyDone[project][existingDoneIndex].content += '；' + contentWithProgress;
                } else {
                    // 如果没有条目，创建新条目
                    weeklyDone[project].push({
                        content: contentWithProgress,
                        members: finalMemberNames
                    });
                }
            });
        }
        
        // 处理下周工作计划
        if (report.weeklyPlan && report.weeklyPlan.length > 0) {
            report.weeklyPlan.forEach(item => {
                const project = item.project || '其他';
                const content = item.content || '';
                const progress = item.progress;
                const memberIds = item.members || [];
                
                // 查找成员名称
                const memberNames = memberIds.map(id => {
                    const member = allMembers.find(m => m.employeeId === id);
                    return member ? member.name : id;
                }).filter(Boolean);
                
                // 如果没有找到成员名称，使用报告的成员名称
                const finalMemberNames = memberNames.length > 0 ? memberNames : [report.memberName];
                
                // 下周工作计划不需要进度
                const contentWithProgress = content;
                
                // 查找该成员组合在该项目下是否已有下周工作计划条目
                const existingPlanIndex = weeklyPlan[project].findIndex(existingItem => 
                    JSON.stringify(existingItem.members) === JSON.stringify(finalMemberNames)
                );
                
                if (existingPlanIndex >= 0) {
                    // 如果已有条目，将新内容用分号合并
                    weeklyPlan[project][existingPlanIndex].content += '；' + contentWithProgress;
                } else {
                    // 如果没有条目，创建新条目
                    weeklyPlan[project].push({
                        content: contentWithProgress,
                        members: finalMemberNames
                    });
                }
            });
        }
        

    });
    
    // 生成报告内容
    let reportContent = '';
    
    // 确保template是字符串类型，如果不是则使用默认模板
    const defaultTemplate = '【数据小组】周报\n{date}\n\n一、本周完成工作：\n{weeklyDone}\n\n二、下周工作计划：\n{weeklyPlan}';
    const validTemplate = (template && typeof template === 'string') ? template : defaultTemplate;
    
    reportContent = validTemplate;
    
    // 替换模板变量
    const yesterday = calculateDateOffsets(date, -1);
    const tomorrow = calculateDateOffsets(date, 1);
    reportContent = reportContent.replace(/{date}/g, date);
    reportContent = reportContent.replace(/{yesterday}/g, yesterday);
    reportContent = reportContent.replace(/{tomorrow}/g, tomorrow);
    
    // 生成本周完成工作部分
    let weeklyDoneText = '';
    let projectIndex = 1;
    for (const [project, items] of Object.entries(weeklyDone)) {
        if (items.length === 0) continue;
        
        weeklyDoneText += `${projectIndex}、${project}\n`;
        let itemIndex = 1;
        items.forEach(item => {
            const membersText = item.members.join('、');
            weeklyDoneText += `  （${itemIndex}）${item.content}——${membersText}；\n`;
            itemIndex++;
        });
        projectIndex++;
    }
    reportContent = reportContent.replace(/{weeklyDone}/g, weeklyDoneText || '  无\n');
    
    // 生成下周工作计划部分
    let weeklyPlanText = '';
    projectIndex = 1;
    for (const [project, items] of Object.entries(weeklyPlan)) {
        if (items.length === 0) continue;
        
        weeklyPlanText += `${projectIndex}、${project}\n`;
        let itemIndex = 1;
        items.forEach(item => {
            const membersText = item.members.join('、');
            weeklyPlanText += `  （${itemIndex}）${item.content}——${membersText}；\n`;
            itemIndex++;
        });
        projectIndex++;
    }
    reportContent = reportContent.replace(/{weeklyPlan}/g, weeklyPlanText || '  无\n');
    

    
    return reportContent;
}

// 下载报告文件
function downloadReport(content, filename) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// 数据查看相关函数

// 加载报告数据
async function loadReportData() {
    const reportType = document.getElementById('dataReportType').value;
    const date = document.getElementById('dataDate').value;
    const reportDataElement = document.getElementById('reportData');
    
    // 获取报告数据
    const reports = await getFromLocalStorage('reports', []);
    const filteredReports = reports.filter(report => 
        report.type === reportType && report.date === date
    );
    
    if (filteredReports.length === 0) {
        reportDataElement.innerHTML = '<p>该日期没有找到对应的报告数据！</p>';
        return;
    }
    
    // 渲染报告数据（按行展示，仅显示成员姓名和项目名称）
    let html = '<div class="report-list">';
    filteredReports.forEach(report => {
        // 存储报告数据为JSON字符串，用于点击时展示详情
        const reportData = JSON.stringify(report).replace(/"/g, '&quot;');
        
        html += `<div class="report-row">
            <div style="flex: 1; cursor: pointer;" onclick="showReportDetail(${reportData})">
                <span class="report-name">${report.memberName}</span>
            </div>
            <button onclick="deleteReport(${report.id}, event)" class="btn btn-remove">删除</button>
        </div>`;
    });
    html += '</div>';
    
    reportDataElement.innerHTML = html;
}

// 删除报告
async function deleteReport(reportId, event) {
    // 阻止事件冒泡，避免触发行点击事件
    event.stopPropagation();
    
    if (confirm('确定要删除这条报告吗？')) {
        let retryAttempts = 0;
        const maxRetries = 3;
        
        while (retryAttempts < maxRetries) {
            try {
                // 获取现有报告
                const reports = await getFromLocalStorage('reports', []);
                
                // 过滤掉要删除的报告
                const updatedReports = reports.filter(report => report.id !== reportId);
                
                // 保存更新后的报告列表
                await saveToLocalStorage('reports', updatedReports);
                
                // 重新加载数据列表
                loadReportData();
                
                await log('info', '报告删除成功', { reportId: reportId });
                return; // 删除成功，退出函数
            } catch (error) {
                await log('error', '删除报告失败', { reportId: reportId, error: error });
                
                // 检查是否为版本冲突
                if (error.message && error.message.includes('Version conflict')) {
                    retryAttempts++;
                    await log('warn', '版本冲突，重试保存', { attempt: retryAttempts, maxRetries: maxRetries });
                    
                    // 清除本地版本缓存，强制重新获取最新数据
                    delete dataVersions['reports'];
                    
                    // 短暂延迟后重试
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    // 非版本冲突错误，直接提示
                    alert('删除报告失败: ' + error.message);
                    return;
                }
            }
        }
        
        // 超过最大重试次数
        alert('删除失败: 数据已被其他人修改，请刷新页面后重试');
    }
}

// 根据进度决定工作结果：100 视为已完成，其余视为进行中
function resolveWorkResult(progressItem = {}) {
    const percent = Number(progressItem.progress);
    if (!Number.isNaN(percent) && percent >= 100) {
        return '已完成';
    }
    return '进行中';
}

// 显示今日进展日志弹窗
async function openTodayProgressModal(todayProgress) {
    const modal = document.getElementById('todayProgressModal');
    const contentDiv = document.getElementById('todayProgressContent');
    
    // 从localStorage获取所有项目数据和管理员设置
    const projects = await getFromLocalStorage('projects', []);
    const projectNumber = await getProjectNumberValue();
    
    // 构建今日进展内容的HTML表格（可编辑版本）
    let contentHTML = `
        <div class="progress-table-container">
            <div class="table-actions">
                <button id="saveProgressBtn" class="btn btn-primary">保存</button>
                <button id="addProgressBtn" class="btn btn-secondary">添加</button>
            </div>
            <table class="progress-table">
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>项目编号</th>
                        <th>项目名称</th>
                        <th>里程碑</th>
                        <th>里程碑名称</th>
                        <th>工作内容</th>
                        <th>工作量(小时)</th>
                        <th>工作类型</th>
                        <th>工作结果</th>
                        <th>备注</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="progressTableBody">
    `;
    
    if (todayProgress && todayProgress.length > 0) {
        todayProgress.forEach((progress, index) => {
            // 根据项目名称查找对应的项目对象
            const project = projects.find(p => p.name === progress.project);
            
            // 获取项目编号、里程碑和里程碑名称
            const projectCode = project ? project.milestoneNumber : '-';
            const projectName = progress.project || '-';
            const milestone = progress.milestone || '里程碑';
            const milestoneName = project ? project.milestoneName : '-';
            const workResult = resolveWorkResult(progress);
            
            contentHTML += `
                <tr data-index="${index}">
                    <td class="editable-cell" contenteditable="true">${index + 1}</td>
                    <td class="editable-cell" contenteditable="true">${projectNumber}</td>
                    <td class="editable-cell" contenteditable="true">${projectName}</td>
                    <td class="editable-cell" contenteditable="true">${projectCode}</td>
                    <td class="editable-cell" contenteditable="true">${milestoneName}</td>
                    <td class="editable-cell" contenteditable="true">${progress.content || ''}</td>
                    <td class="editable-cell" contenteditable="true">${progress.workHours || '8.0'}</td>
                    <td>
                        <select class="editable-select">
                            <option value="5508" ${['5508', '项目晨会与周会', '会议'].includes(progress.workType) ? 'selected' : ''}>项目晨会与周会</option>
                            <option value="4501" ${['4501', '编码', '软件开发'].includes(progress.workType) ? 'selected' : ''}>编码</option>
                        </select>
                    </td>
                    <td class="editable-cell" contenteditable="true">${workResult}</td>
                    <td class="editable-cell" contenteditable="true">${progress.remarks || ''}</td>
                    <td>
                        <button class="action-btn btn-delete" onclick="deleteProgressRow(${index})">删除</button>
                    </td>
                </tr>
            `;
        });
    } else {
        contentHTML += `
            <tr>
                <td colspan="11" class="no-data">今日暂无进展记录</td>
            </tr>
        `;
    }
    
    contentHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    contentDiv.innerHTML = contentHTML;
    
    // 添加事件监听
    document.getElementById('saveProgressBtn').addEventListener('click', saveProgressChanges);
    document.getElementById('addProgressBtn').addEventListener('click', addProgressRow);
    
    // 显示弹窗
    modal.style.display = 'block';
}

// 删除进度行
function deleteProgressRow(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (row) {
        row.remove();
        // 重新编号
        updateRowNumbers();
    }
}

// 添加新进度行
async function addProgressRow() {
    const tableBody = document.getElementById('progressTableBody');
    const newIndex = tableBody.rows.length;
    
    const projectNumber = await getProjectNumberValue();
    
    const newRowHTML = `
        <tr data-index="${newIndex}">
            <td class="editable-cell" contenteditable="true">${newIndex + 1}</td>
            <td class="editable-cell" contenteditable="true">${projectNumber}</td>
            <td class="editable-cell" contenteditable="true"></td>
            <td class="editable-cell" contenteditable="true"></td>
            <td class="editable-cell" contenteditable="true"></td>
            <td class="editable-cell" contenteditable="true"></td>
            <td class="editable-cell" contenteditable="true">8.0</td>
            <td>
                <select class="editable-select">
                    <option value="5508">项目晨会与周会</option>
                    <option value="4501">编码</option>
                </select>
            </td>
            <td class="editable-cell" contenteditable="true">进行中</td>
            <td class="editable-cell" contenteditable="true"></td>
            <td>
                <button class="action-btn btn-delete" onclick="deleteProgressRow(${newIndex})">删除</button>
            </td>
        </tr>
    `;
    
    tableBody.insertAdjacentHTML('beforeend', newRowHTML);
}

// 更新行号
function updateRowNumbers() {
    const rows = document.querySelectorAll('#progressTableBody tr:not(.no-data)');
    rows.forEach((row, index) => {
        const numberCell = row.querySelector('td:nth-child(1)');
        if (numberCell) {
            numberCell.textContent = index + 1;
        }
        row.setAttribute('data-index', index);
        const deleteBtn = row.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.setAttribute('onclick', `deleteProgressRow(${index})`);
        }
    });
}

// 保存进度变更
async function saveProgressChanges() {
    const rows = document.querySelectorAll('#progressTableBody tr:not(.no-data)');
    const updatedProgress = [];
    
    // 获取所有项目数据
    const projects = await getFromLocalStorage('projects', []);
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        const projectName = cells[2].textContent;
        
        // 根据项目名称查找对应的项目对象
        const project = projects.find(p => p.name === projectName);
        
        const progressItem = {
            id: index,
            serialNumber: cells[0].textContent,
            projectNumber: cells[1].textContent,
            projectName: projectName,
            milestone: project ? project.milestoneNumber : cells[3].textContent,
            milestoneName: project ? project.milestoneName : cells[4].textContent,
            workContent: cells[5].textContent,
            workHours: parseFloat(cells[6].textContent) || 0,
            workType: cells[7].querySelector('select').value,
            workResult: cells[8].textContent,
            remarks: cells[9].textContent
        };
        updatedProgress.push(progressItem);
    });
    
    // 这里可以添加保存到后端或本地的逻辑

    alert('保存成功！');
}

// 关闭今日进展日志弹窗
function closeTodayProgressModal() {
    document.getElementById('todayProgressModal').style.display = 'none';
}

// 显示报告详情弹窗
async function showReportDetail(report) {
    const modal = document.getElementById('reportDetailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    // 获取成员列表用于ID转换
    const members = await getFromLocalStorage('members', []);
    
    // 辅助函数：将成员ID数组转换为姓名数组
    const getMemberNames = (ids) => {
        return ids?.map(id => members.find(m => m.employeeId === id)?.name || id) || [];
    };
    
    // 辅助函数：获取进度文本
    const getProgressText = (progress) => {
        if (progress === null || progress === undefined) return '进行中';
        if (progress > 100) return '已完成';
        return `已完成${progress}%`;
    };
    
    // 设置弹窗标题
    modalTitle.textContent = `${report.memberName} - ${report.type === 'daily' ? '日报' : '周报'}详情`;
    
    // 设置弹窗内容
    let html = `<div class="report-detail">
        <p><strong>日期：</strong>${report.date}</p>`;
        
    if (report.type === 'daily') {
        // 日报详情展示
        html += `<p><strong>今日进展：</strong></p><ul>`;
        if (report.todayProgress && report.todayProgress.length > 0) {
            report.todayProgress.forEach((item, index) => {
                const project = item.project || '其他';
                const content = item.content || '';
                const members = item.members ? getMemberNames(item.members).join('、') : '';
                const progressText = item.progress !== undefined ? `，${getProgressText(item.progress)}` : '';
                html += `<li>${index + 1}. ${project} - ${content}${progressText} ——${members}；</li>`;
            });
        } else {
            html += `<li>暂无今日进展</li>`;
        }
        html += `</ul>`;
        
        html += `<p><strong>明日计划：</strong></p><ul>`;
        if (report.tomorrowPlan && report.tomorrowPlan.length > 0) {
            report.tomorrowPlan.forEach((item, index) => {
                const project = item.project || '其他';
                const content = item.content || '';
                const members = item.members ? getMemberNames(item.members).join('、') : '';
                const progressText = item.progress !== undefined ? `，${getProgressText(item.progress)}` : '';
                html += `<li>${index + 1}. ${project} - ${content}${progressText} ——${members}；</li>`;
            });
        } else {
            html += `<li>暂无明日计划</li>`;
        }
        html += `</ul>`;
    } else {
        // 周报详情展示
        html += `<p><strong>本周完成工作：</strong></p><ul>`;
        if (report.weeklyDone && report.weeklyDone.length > 0) {
            report.weeklyDone.forEach((item, index) => {
                const project = item.project || '其他';
                const content = item.content || '';
                const members = item.members ? getMemberNames(item.members).join('、') : '';
                const progressText = item.progress !== undefined ? `，${getProgressText(item.progress)}` : '';
                html += `<li>${index + 1}. ${project} - ${content}${progressText} ——${members}；</li>`;
            });
        } else {
            html += `<li>暂无本周完成工作</li>`;
        }
        html += `</ul>`;
        
        html += `<p><strong>下周工作计划：</strong></p><ul>`;
        if (report.weeklyPlan && report.weeklyPlan.length > 0) {
            report.weeklyPlan.forEach((item, index) => {
                const project = item.project || '其他';
                const content = item.content || '';
                const members = item.members ? getMemberNames(item.members).join('、') : '';
                const progressText = item.progress !== undefined ? `，${getProgressText(item.progress)}` : '';
                html += `<li>${index + 1}. ${project} - ${content}${progressText} ——${members}；</li>`;
            });
        } else {
            html += `<li>暂无下周工作计划</li>`;
        }
        html += `</ul>`;
        

    }
    
    html += `</div>`;
    modalBody.innerHTML = html;
    
    // 显示弹窗
    modal.style.display = 'block';
}

// 关闭报告详情弹窗
function closeModal() {
    const modal = document.getElementById('reportDetailModal');
    modal.style.display = 'none';
}

// 系统设置相关函数

// 加载系统设置
async function loadSettings() {
    await loadProjects();
}

// 加载项目列表
async function loadProjects() {
    const projects = await getFromLocalStorage('projects', []);
    
    // 成员页面的项目选择器
    const projectSelect = document.getElementById('project');
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">请选择项目</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.name;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }
    
    // 管理员页面的项目列表
    const projectsList = document.getElementById('projectsList');
    if (projectsList) {
        projectsList.innerHTML = '';
        projects.forEach(project => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';
            projectItem.setAttribute('data-project-name', project.name);
            projectItem.innerHTML = `
                <div class="project-info">
                    <span class="project-name">${project.name}</span>
                    <span class="project-milestone">里程碑编号: ${project.milestoneNumber}</span>
                    <span class="project-milestone">里程碑名称: ${project.milestoneName}</span>
                </div>
                <div class="project-actions">
                    <button onclick="editProject('${project.name}')" class="btn btn-edit">编辑</button>
                    <button onclick="removeProject('${project.name}')" class="btn btn-remove">×</button>
                </div>
                <div class="project-edit-form" style="display: none;">
                    <input type="text" class="edit-project-name" value="${project.name}" placeholder="项目名称">
                    <input type="text" class="edit-milestone-number" value="${project.milestoneNumber}" placeholder="里程碑编号">
                    <input type="text" class="edit-milestone-name" value="${project.milestoneName}" placeholder="里程碑名称">
                    <button onclick="saveProjectEdit('${project.name}')" class="btn btn-save">保存</button>
                    <button onclick="cancelProjectEdit('${project.name}')" class="btn btn-cancel">取消</button>
                </div>
            `;
            projectsList.appendChild(projectItem);
        });
    }
}

// 加载成员列表
async function loadMembers() {
    const members = await getFromLocalStorage('members', []);
    
    // 管理员页面的成员列表
    const membersList = document.getElementById('membersList');
    if (membersList) {
        membersList.innerHTML = '';
        members.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            memberItem.setAttribute('data-employee-id', member.employeeId);
            memberItem.innerHTML = `
                <div class="member-info">
                    <span class="member-name">${member.name}</span>
                    <span class="member-employee-id">${member.employeeId}</span>
                </div>
                <div class="member-actions">
                    <button onclick="editMember('${member.employeeId}')" class="btn btn-edit">编辑</button>
                    <button onclick="removeMember('${member.employeeId}')" class="btn btn-remove">×</button>
                </div>
                <div class="member-edit-form" style="display: none;">
                    <input type="text" class="edit-name" value="${member.name}" placeholder="姓名">
                    <input type="text" class="edit-employee-id" value="${member.employeeId}" placeholder="员工工号" readonly>
                    <button onclick="saveMemberEdit('${member.employeeId}')" class="btn btn-save">保存</button>
                    <button onclick="cancelMemberEdit('${member.employeeId}')" class="btn btn-cancel">取消</button>
                </div>
            `;
            membersList.appendChild(memberItem);
        });
    }
}

// 编辑成员
function editMember(employeeId) {
    const memberItem = document.querySelector(`[data-employee-id="${employeeId}"]`);
    if (!memberItem) return;
    
    const memberInfo = memberItem.querySelector('.member-info');
    const memberActions = memberItem.querySelector('.member-actions');
    const memberEditForm = memberItem.querySelector('.member-edit-form');
    
    memberInfo.style.display = 'none';
    memberActions.style.display = 'none';
    memberEditForm.style.display = 'block';
}

// 保存成员编辑
async function saveMemberEdit(employeeId) {
    const memberItem = document.querySelector(`[data-employee-id="${employeeId}"]`);
    if (!memberItem) return;
    
    const editName = memberItem.querySelector('.edit-name').value.trim();
    
    if (!editName) {
        alert('姓名不能为空！');
        return;
    }
    
    let retryAttempts = 0;
    const maxRetries = 3;
    
    while (retryAttempts < maxRetries) {
        try {
            const members = await getFromLocalStorage('members', []);
            const memberIndex = members.findIndex(m => m.employeeId === employeeId);
            
            if (memberIndex === -1) {
                alert('未找到该成员！');
                return;
            }
            
            members[memberIndex].name = editName;
            await saveToLocalStorage('members', members);
            
            // 重新加载成员列表
            await loadMembers();
            return;
        } catch (error) {
            await log('error', '保存成员信息失败', { error: error });
            
            if (error.message && error.message.includes('Version conflict')) {
                retryAttempts++;
                await log('warn', '版本冲突，重试操作', { attempt: retryAttempts, maxRetries: maxRetries });
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                alert('保存失败: ' + error.message);
                return;
            }
        }
    }
    
    alert('保存失败: 数据已被其他人修改，请刷新页面后重试');
}

// 取消成员编辑
function cancelMemberEdit(employeeId) {
    const memberItem = document.querySelector(`[data-employee-id="${employeeId}"]`);
    if (!memberItem) return;
    
    const memberInfo = memberItem.querySelector('.member-info');
    const memberActions = memberItem.querySelector('.member-actions');
    const memberEditForm = memberItem.querySelector('.member-edit-form');
    
    memberInfo.style.display = 'block';
    memberActions.style.display = 'flex';
    memberEditForm.style.display = 'none';
}

// 添加项目
async function addProject() {
    const newProjectInput = document.getElementById('newProject');
    const newMilestoneNumberInput = document.getElementById('newMilestoneNumber');
    const newMilestoneNameInput = document.getElementById('newMilestoneName');
    
    const projectName = newProjectInput.value.trim();
    const milestoneNumber = newMilestoneNumberInput.value.trim();
    const milestoneName = newMilestoneNameInput.value.trim();
    
    if (!projectName) {
        alert('请输入项目名称！');
        return;
    }
    
    if (!milestoneNumber) {
        alert('请输入里程碑编号！');
        return;
    }
    
    if (!milestoneName) {
        alert('请输入里程碑名称！');
        return;
    }
    
    let retryAttempts = 0;
    const maxRetries = 3;
    
    while (retryAttempts < maxRetries) {
        try {
            const projects = await getFromLocalStorage('projects', []);
            
            // 检查项目名称是否已存在
            if (projects.some(project => project.name === projectName)) {
                alert('该项目已存在！');
                return;
            }
            
            // 创建新的项目对象
            const newProject = {
                name: projectName,
                milestoneNumber: milestoneNumber,
                milestoneName: milestoneName
            };
            
            projects.push(newProject);
            await saveToLocalStorage('projects', projects);
            
            // 重新加载项目列表
            await loadProjects();
            
            // 清空输入框
            newProjectInput.value = '';
            newMilestoneNumberInput.value = '';
            newMilestoneNameInput.value = '';
            return; // 添加成功，退出函数
        } catch (error) {
            await log('error', '添加项目失败', { error: error });
            
            // 检查是否为版本冲突
            if (error.message && error.message.includes('Version conflict')) {
                retryAttempts++;
                await log('warn', '版本冲突，重试操作', { attempt: retryAttempts, maxRetries: maxRetries });
                
                // 清除本地版本缓存，强制重新获取最新数据
                delete dataVersions['projects'];
                
                // 短暂延迟后重试
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                // 非版本冲突错误，直接提示
                alert('添加项目失败: ' + error.message);
                return;
            }
        }
    }
    
    // 超过最大重试次数
    alert('添加失败: 数据已被其他人修改，请刷新页面后重试');
}

// 编辑项目
function editProject(projectName) {
    const projectItem = document.querySelector(`[data-project-name="${projectName}"]`);
    if (!projectItem) return;
    
    const projectInfo = projectItem.querySelector('.project-info');
    const projectActions = projectItem.querySelector('.project-actions');
    const projectEditForm = projectItem.querySelector('.project-edit-form');
    
    projectInfo.style.display = 'none';
    projectActions.style.display = 'none';
    projectEditForm.style.display = 'block';
    
    // 聚焦到输入框
    const editInput = projectItem.querySelector('.edit-project-name');
    if (editInput) {
        editInput.focus();
        editInput.select();
    }
}

// 保存项目编辑
async function saveProjectEdit(originalProjectName) {
    const projectItem = document.querySelector(`[data-project-name="${originalProjectName}"]`);
    if (!projectItem) return;
    
    const newProjectName = projectItem.querySelector('.edit-project-name').value.trim();
    const newMilestoneNumber = projectItem.querySelector('.edit-milestone-number').value.trim();
    const newMilestoneName = projectItem.querySelector('.edit-milestone-name').value.trim();
    
    if (!newProjectName) {
        alert('项目名称不能为空！');
        return;
    }
    
    if (!newMilestoneNumber) {
        alert('里程碑编号不能为空！');
        return;
    }
    
    if (!newMilestoneName) {
        alert('里程碑名称不能为空！');
        return;
    }
    
    if (newProjectName === originalProjectName && newMilestoneNumber === projectItem.querySelector('.project-milestone').textContent.replace('里程碑编号: ', '') && newMilestoneName === projectItem.querySelector('.project-milestone + .project-milestone').textContent.replace('里程碑名称: ', '')) {
        cancelProjectEdit(originalProjectName);
        return;
    }
    
    let retryAttempts = 0;
    const maxRetries = 3;
    
    while (retryAttempts < maxRetries) {
        try {
            const projects = await getFromLocalStorage('projects', []);
            
            // 检查项目名称是否已存在（排除当前编辑的项目）
            if (projects.some(project => project.name === newProjectName && project.name !== originalProjectName)) {
                alert('该项目名称已存在！');
                return;
            }
            
            const projectIndex = projects.findIndex(project => project.name === originalProjectName);
            if (projectIndex === -1) {
                alert('未找到该项目！');
                return;
            }
            
            // 更新项目信息
            projects[projectIndex] = {
                name: newProjectName,
                milestoneNumber: newMilestoneNumber,
                milestoneName: newMilestoneName
            };
            await saveToLocalStorage('projects', projects);
            
            // 重新加载项目列表
            await loadProjects();
            return;
        } catch (error) {
            await log('error', '保存项目信息失败', { error: error });
            
            if (error.message && error.message.includes('Version conflict')) {
                retryAttempts++;
                await log('warn', '版本冲突，重试操作', { attempt: retryAttempts, maxRetries: maxRetries });
                
                // 清除本地版本缓存，强制重新获取最新数据
                delete dataVersions['projects'];
                
                // 短暂延迟后重试
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                alert('保存失败: ' + error.message);
                return;
            }
        }
    }
    
    alert('保存失败: 数据已被其他人修改，请刷新页面后重试');
}

// 取消项目编辑
function cancelProjectEdit(projectName) {
    const projectItem = document.querySelector(`[data-project-name="${projectName}"]`);
    if (!projectItem) return;
    
    const projectInfo = projectItem.querySelector('.project-info');
    const projectActions = projectItem.querySelector('.project-actions');
    const projectEditForm = projectItem.querySelector('.project-edit-form');
    
    projectInfo.style.display = 'block';
    projectActions.style.display = 'flex';
    projectEditForm.style.display = 'none';
}

// 删除项目
async function removeProject(projectName) {
    if (confirm(`确定要删除项目 "${projectName}" 吗？`)) {
        let retryAttempts = 0;
        const maxRetries = 3;
        
        while (retryAttempts < maxRetries) {
            try {
                let projects = await getFromLocalStorage('projects', []);
                projects = projects.filter(project => project.name !== projectName);
                await saveToLocalStorage('projects', projects);
                
                // 重新加载项目列表
                await loadProjects();
                return; // 删除成功，退出函数
            } catch (error) {
                await log('error', '删除项目失败', { error: error });
                
                // 检查是否为版本冲突
                if (error.message && error.message.includes('Version conflict')) {
                    retryAttempts++;
                    await log('warn', '版本冲突，重试操作', { attempt: retryAttempts, maxRetries: maxRetries });
                    
                    // 清除本地版本缓存，强制重新获取最新数据
                    delete dataVersions['projects'];
                    
                    // 短暂延迟后重试
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    // 非版本冲突错误，直接提示
                    alert('删除项目失败: ' + error.message);
                    return;
                }
            }
        }
        
        // 超过最大重试次数
        alert('删除失败: 数据已被其他人修改，请刷新页面后重试');
    }
}

// 添加成员
async function addMember() {
    const newMemberName = document.getElementById('newMemberName').value.trim();
    const newEmployeeId = document.getElementById('newEmployeeId').value.trim();
    
    if (!newMemberName || !newEmployeeId) {
        alert('请输入成员姓名和工号！');
        return;
    }
    
    let retryAttempts = 0;
    const maxRetries = 3;
    
    while (retryAttempts < maxRetries) {
        try {
            const members = await getFromLocalStorage('members', []);
            
            // 检查工号是否已存在
            const existingMember = members.find(member => member.employeeId === newEmployeeId);
            if (existingMember) {
                alert('该工号已存在！');
                return;
            }
            
            members.push({ name: newMemberName, employeeId: newEmployeeId });
            await saveToLocalStorage('members', members);
            
            // 重新加载成员列表
            await loadMembers();
            
            // 清空输入框
            document.getElementById('newMemberName').value = '';
            document.getElementById('newEmployeeId').value = '';
            return;
        } catch (error) {
            await log('error', '添加成员失败', { error: error });
            
            // 检查是否为版本冲突
            if (error.message && error.message.includes('Version conflict')) {
                retryAttempts++;
                await log('warn', '版本冲突，重试操作', { attempt: retryAttempts, maxRetries: maxRetries });
                
                // 清除本地版本缓存，强制重新获取最新数据
                delete dataVersions['members'];
                
                // 短暂延迟后重试
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                // 非版本冲突错误，直接提示
                alert('添加成员失败: ' + error.message);
                return;
            }
        }
    }
    
    // 超过最大重试次数
    alert('添加失败: 数据已被其他人修改，请刷新页面后重试');
}

// 删除成员
async function removeMember(employeeId) {
    if (confirm(`确定要删除该成员吗？`)) {
        let retryAttempts = 0;
        const maxRetries = 3;
        
        while (retryAttempts < maxRetries) {
            try {
                let members = await getFromLocalStorage('members', []);
                members = members.filter(member => member.employeeId !== employeeId);
                await saveToLocalStorage('members', members);
                
                // 重新加载成员列表
                await loadMembers();
                return; // 删除成功，退出函数
            } catch (error) {
                await log('error', '删除成员失败', { error: error });
                
                // 检查是否为版本冲突
                if (error.message && error.message.includes('Version conflict')) {
                    retryAttempts++;
                    await log('warn', '版本冲突，重试操作', { attempt: retryAttempts, maxRetries: maxRetries });
                    
                    // 清除本地版本缓存，强制重新获取最新数据
                    delete dataVersions['members'];
                    
                    // 短暂延迟后重试
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    // 非版本冲突错误，直接提示
                    alert('删除成员失败: ' + error.message);
                    return;
                }
            }
        }
        
        // 超过最大重试次数
        alert('删除失败: 数据已被其他人修改，请刷新页面后重试');
    }
}
// 全局变量
const ADMIN_PASSWORD = '1'; // 管理员默认口令



// 显示工号输入弹窗
function showEmployeeIdInput() {
    const modal = document.getElementById('employeeIdModal');
    
    // 显示弹窗
    modal.style.display = 'block';
}

// 关闭工号输入弹窗
function closeEmployeeIdInput() {
    document.getElementById('employeeIdModal').style.display = 'none';
}

// 确认输入的工号
async function confirmEmployeeId() {
    const employeeId = document.getElementById('employeeId').value;
    if (!employeeId) {
        alert('请输入员工工号');
        return;
    }
    
    // 获取所有成员
    const members = await getFromLocalStorage('members', []);
    
    // 查找匹配的成员
    const matchedMember = members.find(member => member.employeeId === employeeId);
    
    closeEmployeeIdInput();
    
    if (matchedMember) {
        showMemberConfirm(matchedMember);
    } else {
        alert('未找到匹配的成员信息，请联系管理员添加您的员工工号');
    }
}

// 显示成员确认弹窗
function showMemberConfirm(member) {
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
}

// 关闭成员确认弹窗
function closeMemberConfirm() {
    const modal = document.getElementById('memberConfirmModal');
    modal.style.display = 'none';
    currentMember = null;
}

// 确认成员身份并进入填写页面
function confirmMember() {
    if (currentMember) {
        // 将成员信息存储在sessionStorage中，供member.html使用
        sessionStorage.setItem('currentMember', JSON.stringify(currentMember));
        
        // 关闭弹窗并跳转到成员页面
        closeMemberConfirm();
        window.location.href = 'member.html';
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 根据当前页面执行不同的初始化
    const pathname = window.location.pathname;
    console.log('Current pathname:', pathname);
    
    // 页面访问权限控制
    if (pathname.includes('admin.html')) {
        // 检查是否通过管理员登录验证
        // 在实际项目中，可以使用sessionStorage或其他方式存储登录状态
        // 这里简单检查document.referrer是否包含index.html
        if (!document.referrer.includes('index.html')) {
            alert('您没有权限直接访问此页面，请从首页进入');
            window.location.href = 'index.html';
            return;
        }
        initAdminPage();
        console.log('Admin page initialized');
    } else if (pathname.includes('member.html')) {
        // 检查是否通过成员入口验证
        let memberStr = sessionStorage.getItem('currentMember');
        
        // 测试环境：如果没有当前成员信息，自动设置一个测试成员
        if (!memberStr) {
            console.log('测试环境：自动设置测试成员');
            const testMember = {"name": "纪锐鑫", "employeeId": "005721"};
            sessionStorage.setItem('currentMember', JSON.stringify(testMember));
            memberStr = JSON.stringify(testMember);
        }
        
        if (!memberStr && !document.referrer.includes('index.html')) {
            alert('您没有权限直接访问此页面，请从首页进入');
            window.location.href = 'index.html';
            return;
        }
        initMemberPage();
        console.log('Member page initialized');
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
function showAdminLogin() {
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
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
}

function checkAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    const errorElement = document.getElementById('loginError');
    
    if (password === ADMIN_PASSWORD) {
        window.location.href = 'admin.html';
    } else {
        errorElement.textContent = '口令错误，请重试';
    }
}

// 全局变量存储当前选择的成员信息
let currentMember = null;

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
}

// 成员页面初始化
async function initMemberPage() {
    console.log('initMemberPage function called');
    
    // 显示当前用户信息
    const currentMemberDisplay = document.getElementById('currentMemberDisplay');
    const memberNameInput = document.getElementById('memberName');
    const memberStr = sessionStorage.getItem('currentMember');
    
    console.log('从sessionStorage获取当前成员信息:', memberStr);
    
    if (memberStr) {
        try {
            const member = JSON.parse(memberStr);
            console.log('解析后的当前成员信息:', member);
            if (currentMemberDisplay) {
                currentMemberDisplay.textContent = `${member.name} (${member.employeeId})`;
            }
            if (memberNameInput) {
                memberNameInput.value = member.name;
            }
        } catch (error) {
            console.error('解析成员信息失败:', error);
        }
    } else {
        console.log('sessionStorage中没有当前成员信息');
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
    console.log('Report form element found:', reportForm);
    
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            console.log('Form submit event triggered');
            e.preventDefault();
            saveReport();
        });
        console.log('Submit event listener added');
        
        // 直接为保存按钮添加点击事件作为备份
        const saveButton = reportForm.querySelector('.btn-save');
        if (saveButton) {
            saveButton.addEventListener('click', function(e) {
                console.log('Save button clicked directly');
                e.preventDefault();
                reportForm.dispatchEvent(new Event('submit'));
            });
            console.log('Save button click event listener added');
        }
    }
    
    // 初始化日志功能
    initLogs();
}

// 切换日报/周报类型
function toggleReportType() {
    const reportType = document.getElementById('reportType').value;
    const dailyContent = document.getElementById('dailyContent');
    const weeklyContent = document.getElementById('weeklyContent');
    
    if (reportType === 'daily') {
        dailyContent.style.display = 'block';
        weeklyContent.style.display = 'none';
    } else {
        dailyContent.style.display = 'none';
        weeklyContent.style.display = 'block';
    }
    
    // 切换报告类型时清空reportId，确保新报告生成新的ID
    document.getElementById('reportId').value = '';
    
    // 切换报告类型后，重新加载对应类型的报告数据
    loadMemberReport();
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
            <input type="number" class="log-progress" placeholder="完成进度" min="1" max="100" required>
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
function removeContentItem(button) {
    const item = button.parentElement;
    const container = item.parentElement;
    
    // 至少保留一个内容项
    if (container.children.length > 1) {
        container.removeChild(item);
    }
}

// 管理员页面初始化
async function initAdminPage() {
    // 加载模板
    await loadTemplates();
    
    // 加载系统设置
    await loadSettings();
    
    // 加载成员列表
    await loadMembers();
    
    // 设置默认日期
    const dataDateElement = document.getElementById('dataDate');
    if (dataDateElement) {
        dataDateElement.setAttribute('value', new Date().toISOString().split('T')[0]);
        console.log('Default date set:', new Date().toISOString().split('T')[0]);
    }
}

// 显示标签页
function showTab(tabName) {
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
        const response = await fetch(`http://192.168.53.2:10086/api/data/${key}`);
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
        console.error('Error getting data from server:', error);
        return defaultValue;
    }
}

// 保存数据到服务器（处理版本信息和冲突）
async function saveDataToServer(key, data) {
    try {
        // 构建带版本号的数据
        const versionedData = {
            data: data,
            version: dataVersions[key] || 0
        };
        
        const response = await fetch(`http://192.168.53.2:10086/api/data/${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
        console.error('Error saving data to server:', error);
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
        return;
    }
    
    try {
        // 获取所有成员
        const members = await getFromLocalStorage('members', []);
        if (members.length === 0) {
            alert('暂无成员信息');
            return;
        }
        
        // 获取所有报告
        const reports = await getFromLocalStorage('reports', []);
        
        // 过滤出该日期和报告类型下已提交报告的成员
        const submittedMemberIds = new Set();
        
        console.log(`开始处理未填写成员查询: 日期=${date}, 报告类型=${reportType}`);
        console.log(`当前所有报告数量: ${reports.length}`);
        
        // 辅助函数：递归遍历对象并收集所有members数组中的员工ID
        const collectMemberIds = (obj, parentPath = '') => {
            if (Array.isArray(obj)) {
                console.log(`进入数组: ${parentPath}`);
                obj.forEach((item, index) => collectMemberIds(item, `${parentPath}[${index}]`));
            } else if (typeof obj === 'object' && obj !== null) {
                console.log(`进入对象: ${parentPath}`);
                // 如果对象有members字段且是数组，收集员工ID
                if (obj.members && Array.isArray(obj.members)) {
                    console.log(`在${parentPath}找到members数组: ${JSON.stringify(obj.members)}`);
                    obj.members.forEach(employeeId => {
                        if (employeeId) {
                            console.log(`从${parentPath}.members添加员工ID: ${employeeId}`);
                            submittedMemberIds.add(employeeId);
                            console.log(`submittedMemberIds当前内容: ${Array.from(submittedMemberIds)}`);
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
        
        reports.forEach((report, index) => {
            console.log(`\n处理报告${index+1}/${reports.length}: ID=${report.id}`);
            console.log(`报告类型: ${report.type}, 日期: ${report.date}`);
            
            if (report.date === date && report.type === reportType) {
                console.log(`匹配条件的报告: ${report.id}, memberName: "${report.memberName}", employeeId: ${report.employeeId}`);
                
                // 1. 递归遍历报告中的所有嵌套对象，收集所有members数组中的员工ID
                console.log('\n开始递归收集成员ID...');
                collectMemberIds(report, 'report');
                
                // 2. 同时处理memberName字段作为补充
                if (report.memberName) {
                    console.log('\n处理memberName字段...');
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
                    
                    console.log(`分割后的成员姓名: ${JSON.stringify(memberNames)}`);
                    
                    // 处理每个成员名称
                    memberNames.forEach(memberName => {
                        // 清理姓名：去除首尾空格和多余空格
                        const trimmedName = memberName.trim().replace(/\s+/g, '');
                        
                        if (trimmedName) {
                            console.log(`查找成员: "${trimmedName}"`);
                            
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
                                    console.log(`找到成员: ${matchedMember.name}, 工号: ${matchedMember.employeeId}`);
                                    submittedMemberIds.add(matchedMember.employeeId);
                                    console.log(`submittedMemberIds当前内容: ${Array.from(submittedMemberIds)}`);
                                } else {
                                    console.log(`成员${trimmedName}没有工号信息`);
                                }
                            } else {
                                console.log(`未找到成员${trimmedName}`);
                            }
                        }
                    });
                }
                
                // 3. 保留对report.employeeId的支持，作为额外保障
                if (report.employeeId) {
                    console.log(`\n从report.employeeId添加员工ID: ${report.employeeId}`);
                    submittedMemberIds.add(report.employeeId);
                    console.log(`submittedMemberIds当前内容: ${Array.from(submittedMemberIds)}`);
                }
            } else {
                console.log(`报告不匹配条件: 类型=${report.type}, 日期=${report.date}`);
            }
        });
        
        console.log(`\n处理完成，所有已提交工号: ${Array.from(submittedMemberIds)}`);
        console.log(`所有成员数量: ${members.length}`);
        
        // 找出未提交报告的成员
        const missingMembers = members.filter(member => !submittedMemberIds.has(member.employeeId));
        console.log(`未填写成员数量: ${missingMembers.length}`);
        console.log(`未填写成员详情: ${JSON.stringify(missingMembers.map(m => ({name: m.name, id: m.employeeId})))}`);
        
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
        console.error('查询未填写成员失败:', error);
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
    console.log('saveReport function called');
    
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
        return;
    }
    
    let retryAttempts = 0;
    const maxRetries = 3;
    
    while (retryAttempts < maxRetries) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const reportId = document.getElementById('reportId').value;
            
            console.log('Report data:', { reportType, memberName, date, reportId });
            
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
            
            console.log('Complete report data:', reportData);
            
            // 获取现有报告（异步）
            const reports = await getFromLocalStorage('reports', []);
            
            // 检查是否存在同一成员、同一天、同一类型的报告
            const existingReportIndex = reports.findIndex(r => {
                // 成员匹配：优先使用employeeId，其次使用memberName
                const isSameMember = (r.employeeId && reportData.employeeId && r.employeeId === reportData.employeeId) ||
                                    (r.memberName && reportData.memberName && r.memberName === reportData.memberName);
                // 日期匹配
                const isSameDate = r.date === reportData.date;
                // 类型匹配
                const isSameType = r.type === reportData.type;
                
                return isSameMember && isSameDate && isSameType;
            });
            
            if (existingReportIndex !== -1) {
                // 更新现有报告，保留原有ID
                reportData.id = reports[existingReportIndex].id;
                reports[existingReportIndex] = reportData;
                console.log('Report updated:', reportData);
            } else {
                // 添加新报告，使用新生成的ID
                reports.push(reportData);
                console.log('New report added:', reportData);
            }
            
            // 保存到服务器（异步）
            await saveToLocalStorage('reports', reports);
            console.log('Report saved to server');
            
            // 保存成功后，将reportId设置回页面，以便下次更新
            document.getElementById('reportId').value = reportData.id;
            
            // 显示成功消息
            showAlertModal('报告保存成功！');
            return; // 保存成功，退出函数
        } catch (error) {
            console.error('Error in saveReport:', error);
            
            // 检查是否为版本冲突
            if (error.message && error.message.includes('Version conflict')) {
                retryAttempts++;
                console.log(`Version conflict, retrying... (attempt ${retryAttempts}/${maxRetries})`);
                
                // 清除本地版本缓存，强制重新获取最新数据
                delete dataVersions['reports'];
                
                // 短暂延迟后重试
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 刷新报告数据
                const memberName = document.getElementById('memberName').value;
                if (memberName) {
                    await loadMemberReport();
                }
            } else {
                // 非版本冲突错误，直接提示
                alert('保存失败: ' + error.message);
                return;
            }
        }
    }
    
    // 超过最大重试次数
    alert('保存失败: 数据已被其他人修改，请刷新页面后重试');
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
function getContentItems(containerId) {
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
        const projects = await getFromLocalStorage('projects', defaultProjects);
        
        // 添加项目选项
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('加载项目数据失败:', error);
        // 如果加载失败，使用默认项目
        const defaultProjects = ['数据集成平台', '数据治理平台', '数据分析', 'AI模型管理', '其他'];
        defaultProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
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
                console.log('当前成员信息:', currentMember);
                console.log('默认选择当前成员:', currentMember.employeeId, currentMember.name);
                renderSelectedTags(selectElement, [currentMember.employeeId]);
            } else {
                console.log('未找到当前成员信息');
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
        console.error('加载成员数据失败:', error);
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
        console.error('加载昨日报告失败:', error);
        showAlertModal('加载昨日报告失败，请重试');
    }
}

// 根据成员姓名和日期加载当天的报告
async function loadMemberReport() {
    console.log('=== loadMemberReport函数开始执行 ===');
    
    // 从sessionStorage获取当前成员信息
    const memberStr = sessionStorage.getItem('currentMember');
    let currentMember = memberStr ? JSON.parse(memberStr) : null;
    let currentEmployeeId = currentMember ? currentMember.employeeId : null;
    
    console.log('从sessionStorage获取的currentMember:', currentMember);
    console.log('从sessionStorage获取的currentEmployeeId:', currentEmployeeId, '类型:', typeof currentEmployeeId);
    
    // 获取成员名称（可能从页面或currentMember中获取）
    const memberName = document.getElementById('memberName').value;
    console.log('从页面获取的memberName:', memberName);
    
    // 如果页面中没有成员名称，尝试从currentMember中获取
    if (!memberName && currentMember) {
        console.log('页面中没有memberName，从currentMember中获取:', currentMember.name);
        document.getElementById('memberName').value = currentMember.name;
    }
    
    const today = new Date().toISOString().split('T')[0];
    console.log('当前日期:', today);
    
    try {
        // 获取所有报告数据
        const reports = await getFromLocalStorage('reports', []);
        console.log('从服务器获取的所有报告数量:', reports.length);
        console.log('所有报告详细数据:', JSON.stringify(reports));
        
        // 获取所有成员数据，用于备用查找
        const allMembers = await getFromLocalStorage('members', []);
        console.log('从服务器获取的所有成员数量:', allMembers.length);
        
        // 如果没有currentEmployeeId但有memberName，尝试通过memberName获取employeeId
        if (!currentEmployeeId && memberName) {
            console.log('尝试通过memberName获取employeeId，memberName:', memberName);
            
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
                console.log('通过memberName找到成员:', matchedMember);
                console.log('获取到的employeeId:', currentEmployeeId);
            } else {
                console.log('未找到匹配的成员:', memberName);
            }
        }
        
        // 确保currentEmployeeId是字符串类型
        currentEmployeeId = currentEmployeeId ? String(currentEmployeeId) : null;
        console.log('最终使用的currentEmployeeId:', currentEmployeeId, '类型:', typeof currentEmployeeId);
        
        // 查找当天的报告
        console.log('=== 开始查找当天报告 ===');
        console.log('查找条件:');
        console.log('- currentEmployeeId:', currentEmployeeId);
        console.log('- memberName:', memberName);
        console.log('- date:', today);
        
        // 获取当前选择的报告类型
        const currentReportType = document.getElementById('reportType').value;
        console.log('- currentReportType:', currentReportType);
        
        const todayReport = reports.find((report, index) => {
            console.log(`\n检查第${index + 1}个报告:`);
            console.log('报告详情:', JSON.stringify(report));
            console.log('报告employeeId:', report.employeeId, '类型:', typeof report.employeeId);
            console.log('报告date:', report.date);
            console.log('报告memberName:', report.memberName);
            console.log('报告类型:', report.type);
            
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
            
            console.log('匹配结果:');
            console.log('- idMatch:', idMatch);
            console.log('- nameMatch:', nameMatch);
            console.log('- dateMatch:', dateMatch);
            console.log('- typeMatch:', typeMatch);
            
            return (idMatch || nameMatch) && dateMatch && typeMatch;
        });
        
        console.log('\n=== 查找结束 ===');
        console.log('找到的当天报告:', todayReport ? JSON.stringify(todayReport) : 'null');
        
        if (todayReport) {
            console.log('\n=== 找到当天报告，开始填充数据 ===');
            console.log('报告ID:', todayReport.id);
            console.log('报告类型:', todayReport.type);
            
            // 设置报告ID
            document.getElementById('reportId').value = todayReport.id;
            console.log('已设置报告ID:', todayReport.id);
            
            // 设置报告类型
            const reportTypeElement = document.getElementById('reportType');
            if (reportTypeElement.value !== todayReport.type) {
                reportTypeElement.value = todayReport.type;
                console.log('已设置报告类型:', todayReport.type);
                
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
                console.log('已切换报告类型显示');
            }
            
            // 填充内容
            if (todayReport.type === 'daily') {
                console.log('\n=== 填充日报内容 ===');
                // 确保todayProgress和tomorrowPlan存在且为数组
                const todayProgress = Array.isArray(todayReport.todayProgress) ? todayReport.todayProgress : [];
                const tomorrowPlan = Array.isArray(todayReport.tomorrowPlan) ? todayReport.tomorrowPlan : [];
                
                console.log('今日进展数据:', JSON.stringify(todayProgress));
                console.log('明日计划数据:', JSON.stringify(tomorrowPlan));
                
                // 填充今日进展
                console.log('开始填充今日进展...');
                await fillContentItems('todayProgress', todayProgress);
                console.log('今日进展填充完成');
                
                // 填充明日计划
                console.log('开始填充明日计划...');
                await fillContentItems('tomorrowPlan', tomorrowPlan);
                console.log('明日计划填充完成');
            } else {
                console.log('\n=== 填充周报内容 ===');
                // 确保weeklyDone和weeklyPlan存在且为数组
                const weeklyDone = Array.isArray(todayReport.weeklyDone) ? todayReport.weeklyDone : [];
                const weeklyPlan = Array.isArray(todayReport.weeklyPlan) ? todayReport.weeklyPlan : [];
                
                console.log('本周完成工作数据:', JSON.stringify(weeklyDone));
                console.log('下周工作计划数据:', JSON.stringify(weeklyPlan));
                
                // 填充本周完成工作
                console.log('开始填充本周完成工作...');
                await fillContentItems('weeklyDone', weeklyDone);
                console.log('本周完成工作填充完成');
                
                // 填充下周工作计划
                console.log('开始填充下周工作计划...');
                await fillContentItems('weeklyPlan', weeklyPlan);
                console.log('下周工作计划填充完成');
            }
            
            console.log('\n=== 报告数据加载完成 ===');
        } else {
            console.log('\n=== 未找到当天报告数据 ===');
            // 没有找到报告，清空表单（除了姓名）
            clearFormExceptName();
            // 注意：这里不清空reportId，让保存时自动生成新ID
            console.log('已清空表单内容（除了姓名）');
        }
    } catch (error) {
        console.error('加载报告数据失败:', error);
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
                    <input type="number" class="log-progress" placeholder="完成进度" min="1" max="100" required>
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
        console.error('加载日志失败:', error);
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
function renderLogs() {
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
    
    // 渲染日志条目
    currentLogs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        
        // 辅助函数：根据进度获取显示文本
        const getProgressText = (progress) => {
            if (progress === null || progress === undefined) return '进行中';
            if (progress === 100) return '已完成';
            return `已完成${progress}%`;
        };

        // 构建日志内容
        let logContent = '';
        if (log.type === 'daily') {
            logContent = `
                <div class="log-detail">
                    <strong>今日进展：</strong>
                    <ul>${log.todayProgress.map(item => `<li>项目: ${item.project || '未选择项目'} - ${item.content || item}${item.progress !== undefined ? '，' + getProgressText(item.progress) : ''}</li>`).join('')}</ul>
                    <strong>明日计划：</strong>
                    <ul>${log.tomorrowPlan.map(item => `<li>项目: ${item.project || '未选择项目'} - ${item.content || item}${item.progress !== undefined ? '，' + getProgressText(item.progress) : ''}</li>`).join('')}</ul>
                </div>
            `;
        } else {
            logContent = `
                <div class="log-detail">
                    <strong>本周完成工作：</strong>
                    <ul>${log.weeklyDone.map(item => `<li>项目: ${item.project || '未选择项目'} - ${item.content || item}${item.progress !== undefined ? '，' + getProgressText(item.progress) : ''}</li>`).join('')}</ul>
                    <strong>下周工作计划：</strong>
                    <ul>${log.weeklyPlan.map(item => `<li>项目: ${item.project || '未选择项目'} - ${item.content || item}${item.progress !== undefined ? '，' + getProgressText(item.progress) : ''}</li>`).join('')}</ul>
                </div>
            `;
        }
        
        // 设置日志条目HTML
        logItem.innerHTML = `
            <div class="log-header">
                <span class="log-date">${log.date}</span>
                <span class="log-type log-type-${log.type}">${log.type === 'daily' ? '日报' : '周报'}</span>
            </div>
            ${logContent}
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

// 重置内容项
function resetContentItems() {
    resetContentContainer('todayProgress');
    resetContentContainer('tomorrowPlan');
    resetContentContainer('weeklyDone');
    resetContentContainer('weeklyPlan');
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
        console.error('Clipboard API复制失败:', err);
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
        console.error('execCommand复制失败:', err);
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
    // 提取所有项目（从每条日志条目中）
    const projects = new Set();
    reports.forEach(report => {
        if (report.todayProgress) {
            report.todayProgress.forEach(item => {
                if (item.project) projects.add(item.project);
            });
        }
        if (report.tomorrowPlan) {
            report.tomorrowPlan.forEach(item => {
                if (item.project) projects.add(item.project);
            });
        }
    });
    const projectList = [...projects];
    
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
            if (progress === 100) return '已完成';
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
    // 提取所有项目（从每条日志条目中）
    const projects = new Set();
    reports.forEach(report => {
        if (report.weeklyDone) {
            report.weeklyDone.forEach(item => {
                if (item.project) projects.add(item.project);
            });
        }
        if (report.weeklyPlan) {
            report.weeklyPlan.forEach(item => {
                if (item.project) projects.add(item.project);
            });
        }
    });
    const projectList = [...projects];
    
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
            if (progress === 100) return '已完成';
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
                
                console.log('报告删除成功:', reportId);
                return; // 删除成功，退出函数
            } catch (error) {
                console.error('删除报告失败:', error);
                
                // 检查是否为版本冲突
                if (error.message && error.message.includes('Version conflict')) {
                    retryAttempts++;
                    console.log(`Version conflict, retrying... (attempt ${retryAttempts}/${maxRetries})`);
                    
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
        if (progress === 100) return '已完成';
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
                html += `<li>${index + 1}. ${project} - ${content}${progressText} (${members})</li>`;
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
                html += `<li>${index + 1}. ${project} - ${content}${progressText} (${members})</li>`;
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
                html += `<li>${index + 1}. ${project} - ${content}${progressText} (${members})</li>`;
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
                html += `<li>${index + 1}. ${project} - ${content}${progressText} (${members})</li>`;
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
    const projects = await getFromLocalStorage('projects', ['项目A', '项目B', '项目C']);
    
    // 成员页面的项目选择器
    const projectSelect = document.getElementById('project');
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">请选择项目</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
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
            projectItem.innerHTML = `
                <span>${project}</span>
                <button onclick="removeProject('${project}')" class="btn btn-remove">×</button>
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
            memberItem.innerHTML = `
                <div class="member-info">
                    <span class="member-name">${member.name}</span>
                    <span class="member-employee-id">${member.employeeId}</span>
                </div>
                <button onclick="removeMember('${member.employeeId}')" class="btn btn-remove">×</button>
            `;
            membersList.appendChild(memberItem);
        });
    }
}

// 添加项目
async function addProject() {
    const newProjectInput = document.getElementById('newProject');
    const projectName = newProjectInput.value.trim();
    
    if (!projectName) {
        alert('请输入项目名称！');
        return;
    }
    
    let retryAttempts = 0;
    const maxRetries = 3;
    
    while (retryAttempts < maxRetries) {
        try {
            const projects = await getFromLocalStorage('projects', []);
            
            if (projects.includes(projectName)) {
                alert('该项目已存在！');
                return;
            }
            
            projects.push(projectName);
            await saveToLocalStorage('projects', projects);
            
            // 重新加载项目列表
            await loadProjects();
            
            // 清空输入框
            newProjectInput.value = '';
            return; // 添加成功，退出函数
        } catch (error) {
            console.error('添加项目失败:', error);
            
            // 检查是否为版本冲突
            if (error.message && error.message.includes('Version conflict')) {
                retryAttempts++;
                console.log(`Version conflict, retrying... (attempt ${retryAttempts}/${maxRetries})`);
                
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

// 删除项目
async function removeProject(projectName) {
    if (confirm(`确定要删除项目 "${projectName}" 吗？`)) {
        let retryAttempts = 0;
        const maxRetries = 3;
        
        while (retryAttempts < maxRetries) {
            try {
                let projects = await getFromLocalStorage('projects', []);
                projects = projects.filter(project => project !== projectName);
                await saveToLocalStorage('projects', projects);
                
                // 重新加载项目列表
                await loadProjects();
                return; // 删除成功，退出函数
            } catch (error) {
                console.error('删除项目失败:', error);
                
                // 检查是否为版本冲突
                if (error.message && error.message.includes('Version conflict')) {
                    retryAttempts++;
                    console.log(`Version conflict, retrying... (attempt ${retryAttempts}/${maxRetries})`);
                    
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
            console.error('添加成员失败:', error);
            
            // 检查是否为版本冲突
            if (error.message && error.message.includes('Version conflict')) {
                retryAttempts++;
                console.log(`Version conflict, retrying... (attempt ${retryAttempts}/${maxRetries})`);
                
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
                console.error('删除成员失败:', error);
                
                // 检查是否为版本冲突
                if (error.message && error.message.includes('Version conflict')) {
                    retryAttempts++;
                    console.log(`Version conflict, retrying... (attempt ${retryAttempts}/${maxRetries})`);
                    
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
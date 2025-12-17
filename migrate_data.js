const fs = require('fs');
const path = require('path');

// 读取数据文件
const dataPath = path.join(__dirname, 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 清理函数：从内容中移除进度信息
const cleanContent = (content) => {
    if (!content) return content;
    // 移除中文逗号+进度信息的模式
    return content.replace(/，(进行中|已完成(\d+%|))$/, '');
};

// 处理报告数据
const reports = data.reports.data;
reports.forEach(report => {
    // 处理今日进展
    if (report.todayProgress) {
        report.todayProgress.forEach(item => {
            if (item.content) {
                item.content = cleanContent(item.content);
            }
        });
    }
    // 处理明日计划
    if (report.tomorrowPlan) {
        report.tomorrowPlan.forEach(item => {
            if (item.content) {
                item.content = cleanContent(item.content);
            }
        });
    }
    // 处理本周完成
    if (report.weeklyDone) {
        report.weeklyDone.forEach(item => {
            if (item.content) {
                item.content = cleanContent(item.content);
            }
        });
    }
    // 处理下周计划
    if (report.weeklyPlan) {
        report.weeklyPlan.forEach(item => {
            if (item.content) {
                item.content = cleanContent(item.content);
            }
        });
    }
});

// 保存清理后的数据
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('数据迁移完成，已清理旧数据中的进度信息');

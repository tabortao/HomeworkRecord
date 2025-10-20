# 项目规则

- 项目启动使用`python -m http.server 8000`。
- 在终端中用 Node 解析 app.js 来快速检查语法错误，预期结果：无语法错误。`node -e "const fs=require('fs'); new Function(fs.readFileSync('g:/Code/Go-WorkSpace/HomeworkRecord/js/app.js','utf8')); console.log('PARSE_OK');"`

const express = require('express');  // 引入 Express 框架
const app = express();  // 创建一个 Express 应用

app.get('/', (req, res) => {  // 配置根路径的 GET 请求处理
    res.send('Hello from Node.js!');  // 返回一个简单的消息
});

app.listen(3000, () => {  // 监听 3000 端口
    console.log('Node.js server running on http://localhost:3000');
});

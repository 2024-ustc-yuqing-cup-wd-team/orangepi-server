使用 **IMAP 协议** 从邮箱服务器获取邮件，可以实现自动获取和处理邮件的功能。以下是一个完整的实现步骤和代码示例。

------

### **1. 什么是 IMAP 协议？**

IMAP（Internet Message Access Protocol）允许客户端从邮件服务器上获取邮件并同步状态。常见邮箱服务器如 Gmail、Outlook、QQ 邮箱等都支持 IMAP。

- 端口：
  - **993**（SSL/TLS）
  - **143**（不推荐，非加密）
- 邮箱设置：
  - 确保 IMAP 功能已在邮箱中启用。
  - 例如，Gmail 用户需要在设置中允许 IMAP，并可能需要开启“允许不太安全的应用访问”或生成应用密码。

------

### **2. 准备工作**

#### **安装 `imap` 和 `mailparser` 库**

在 Node.js 环境中使用以下库：

```bash
npm install imap mailparser
```

- **`imap`**：处理 IMAP 协议。
- **`mailparser`**：解析邮件内容（标题、正文等）。

------

### **3. 代码示例**

以下是通过 IMAP 获取未读邮件并解析内容的完整代码：

```javascript
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imapConfig = {
    user: 'your-email@example.com', // 邮箱账号
    password: 'your-password',     // 邮箱密码（或应用密码）
    host: 'imap.example.com',      // IMAP 服务器地址
    port: 993,                     // IMAP 端口号
    tls: true,                     // 使用加密
};

const imap = new Imap(imapConfig);

function openInbox(cb) {
    imap.openBox('INBOX', false, cb); // 打开收件箱
}

imap.once('ready', function () {
    console.log('IMAP connection ready.');
    openInbox(function (err, box) {
        if (err) throw err;

        // 搜索未读邮件
        imap.search(['UNSEEN'], function (err, results) {
            if (err) throw err;

            if (!results || results.length === 0) {
                console.log('No unread emails found.');
                imap.end();
                return;
            }

            const fetch = imap.fetch(results, { bodies: '' });

            fetch.on('message', function (msg) {
                console.log('Processing new email...');

                msg.on('body', function (stream) {
                    simpleParser(stream, (err, parsed) => {
                        if (err) throw err;

                        // 打印邮件内容
                        console.log(`Subject: ${parsed.subject}`);
                        console.log(`From: ${parsed.from.text}`);
                        console.log(`Body: ${parsed.text}`);
                    });
                });
            });

            fetch.once('end', function () {
                console.log('Done fetching all unread emails.');
                imap.end();
            });
        });
    });
});

imap.once('error', function (err) {
    console.log(err);
});

imap.once('end', function () {
    console.log('IMAP connection ended.');
});

imap.connect();
```

------

### **4. 如何使用这段代码？**

1. **配置邮箱参数**：

   - 替换 

     ```
     imapConfig
     ```

      中的邮箱地址、密码和 IMAP 服务器信息：

     - Gmail：`imap.gmail.com`
     - QQ 邮箱：`imap.qq.com`
     - Outlook：`imap-mail.outlook.com`

2. **开启应用密码**：

   - 如果使用 Gmail 或 QQ 邮箱，你可能需要生成 **应用密码** 而不是直接使用邮箱密码。

3. **运行代码**：

   ```bash
   node imap-email.js
   ```

4. **查看输出**：

   - 控制台会显示未读邮件的主题、发件人和正文。

------

### **5. 前端实时显示邮件**

将获取到的邮件数据通过后端接口发送到前端。

#### **后端示例**

```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/api/emails', (req, res) => {
    // 调用上述 IMAP 获取邮件的代码，返回邮件数据
    const emails = []; // 假设这是获取到的邮件数组
    res.json(emails);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

#### **前端示例**

通过 AJAX 获取邮件数据并显示：

```html
<div id="emails"></div>
<script>
    async function fetchEmails() {
        const response = await fetch('/api/emails');
        const emails = await response.json();
        const container = document.getElementById('emails');
        container.innerHTML = '';
        emails.forEach(email => {
            const div = document.createElement('div');
            div.innerHTML = `<h4>${email.subject}</h4><p>${email.body}</p>`;
            container.appendChild(div);
        });
    }

    setInterval(fetchEmails, 10000); // 每 10 秒刷新一次
</script>
```

------

### **6. 常见问题及解决**

1. **IMAP 连接失败**：
   - 检查邮箱 IMAP 是否启用。
   - 确认端口号和服务器地址是否正确。
   - 确认是否需要应用密码（如 Gmail）。
2. **邮件格式解析问题**：
   - 如果正文不完整，使用 `mailparser` 解析 MIME 格式邮件。
3. **实时性需求**：
   - 如果需要即时获取新邮件，可以增加轮询频率，或使用邮箱服务的 Webhook（如 Gmail 的 Push Notification）。

------

### **7. 总结**

- IMAP 是访问邮箱的一种强大方式，支持多种操作（获取、标记、删除邮件）。
- 推荐结合 `mailparser` 库解析邮件内容。
- 后端通过 IMAP 获取邮件数据，前端通过 API 实现实时展示。
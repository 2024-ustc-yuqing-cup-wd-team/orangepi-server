const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imapConfig = {
    user: '1023219342@example.com', // 邮箱账号
    password: 'REDACTED_MAIL_APP_PASSWORD',     // 邮箱密码（或应用密码）
    host: 'imap.qq.com',      // IMAP 服务器地址
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
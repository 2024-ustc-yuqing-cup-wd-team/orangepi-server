### Nginx 配置

##### Install Nginx

```bash
#更新Orangepi依赖包
sudo apt update
sudo apt upgrade -y

#安装Nginx
sudo apt install nginx -y
```

##### 配置nginx.conf

```bash
#(option)备份默认conf文件
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak

#配置nginx.conf
sudo nano /etc/nginx/nginx.conf
```

此时将默认conf文件内容改为：

```
user www-data;	# Debian为Web服务预留的低权限用户
worker_processes  auto;
worker_rlimit_nofile 8192;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    access_log  /var/log/nginx/access.log;
    error_log   /var/log/nginx/error.log;

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;

    gzip  on;

    server {
        listen       80;
        listen  [::]:80;
        server_name  _;	# 接受所有客户端指令
        root         /home/orangepi/Nginx/YQC_Website;	# 自己的Web前端文件目录

       # 配置静态文件托管
        location /static/ {
            root /home/orangepi/Nginx/YQC_Website;  # 静态资源存放目录
        }

        # 反向代理到 Node.js 服务
        location / {
            proxy_pass http://127.0.0.1:3000;  # 将请求转发到 Node.js 应用
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        error_page 404 /404.html;
            location = /40x.html {
        }

        error_page 500 502 503 504 /50x.html;
            location = /50x.html {
        }
    }
}
```

##### Start Nginx

```bash
systemctl start nginx	# 启动nginx
systemctl enable nginx	# 设置为开机自启动
systemctl status nginx	# 查看状态

systemctl restart nginx	# 重启nginx
sudo nginx -t			# 检查nginx配置语法错误
```

##### Debug

```
# 显示错误报告
sudo tail -f /var/log/nginx/error.log	

# 修改~目录访问权限
sudo chmod 755 /home/orangepi
```



### Node.js配置

##### **下载 ARM64 架构的 Node.js 预构建二进制文件**

1. 前往 Node.js 官方下载页面：
   Node.js Downloads

2. **选择对应的 ARM64 版本：**

   - 找到你需要的版本（如 `v22.11.0 LTS`）。
   - 下载文件名应为类似 `node-v22.11.0-linux-arm64.tar.xz`。

3. **使用命令下载：**

   ```bash
   我这里是在Windows浏览器上下载再传到OrangePi里
   
   // wget https://nodejs.org/dist/v22.11.0/node-v22.11.0-linux-arm64.tar.xz
   ```

4. **解压文件：**

   ```bash
   tar -xf node-v22.11.0-linux-arm64.tar.xz
   ```

5. **移动到系统目录：**

   ```bash
   sudo mv node-v22.11.0-linux-arm64 /usr/local/node-v22.11.0
   ```

6. **设置环境变量：**

   ```bash
   echo 'export PATH=/usr/local/node-v22.11.0/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

7. **验证安装：**

   ```bash
   node -v
   npm -v
   ```

8. **配置仓库为淘宝镜像** 

   ```bash
   npm config set registry https://registry.npmmirror.com
   ```

   

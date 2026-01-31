# 汽车配件库存管理系统 - 部署指南

本文档详细说明如何部署汽车配件库存管理系统到生产环境。

## 目录

- [系统要求](#系统要求)
- [部署方式](#部署方式)
  - [方式一：Manus 内置托管（推荐）](#方式一manus-内置托管推荐)
  - [方式二：自建服务器部署](#方式二自建服务器部署)
- [环境变量配置](#环境变量配置)
- [数据库配置](#数据库配置)
- [域名配置](#域名配置)
- [维护与备份](#维护与备份)
- [常见问题](#常见问题)

---

## 系统要求

### 运行环境
- **Node.js**: 22.x 或更高版本
- **数据库**: MySQL 8.0+ 或 TiDB Cloud
- **内存**: 最低 512MB，推荐 1GB+
- **存储**: 最低 1GB，根据数据量调整

### 浏览器支持
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

---

## 部署方式

### 方式一：Manus 内置托管（推荐）

Manus 提供开箱即用的托管服务，无需配置服务器，支持自定义域名。

#### 步骤 1：保存 Checkpoint

在 Manus 聊天界面中，系统已自动创建 checkpoint。确保看到最新的 checkpoint 卡片。

#### 步骤 2：发布到生产环境

1. 点击右上角的 **"Publish"** 按钮（在 Management UI 头部）
2. 系统会自动部署到生产环境
3. 部署完成后，您将获得一个 `.manus.space` 域名

#### 步骤 3：配置自定义域名（可选）

1. 在 Management UI 中，进入 **Settings → Domains**
2. 两种方式：
   - **修改前缀**：修改 `xxx.manus.space` 中的 `xxx` 部分
   - **绑定自有域名**：
     - 点击 "Add Custom Domain"
     - 输入您的域名（如 `inventory.yourcompany.com`）
     - 按照提示在您的 DNS 服务商处添加 CNAME 记录
     - 等待 DNS 生效（通常 5-30 分钟）

#### 步骤 4：配置 SSL 证书

Manus 自动为所有域名提供免费 SSL 证书（Let's Encrypt），无需手动配置。

#### 步骤 5：访问生产系统

使用您的域名访问系统：
- 默认域名：`https://your-project.manus.space`
- 自定义域名：`https://inventory.yourcompany.com`

#### 步骤 6：创建管理员账户

首次访问时，使用 Manus OAuth 登录。系统会自动创建管理员账户。

---

### 方式二：自建服务器部署

如果您需要完全控制部署环境，可以部署到自己的服务器。

#### 前置准备

1. **准备服务器**
   - Ubuntu 22.04 LTS 或 CentOS 8+
   - 至少 1GB RAM
   - 安装 Node.js 22.x
   - 安装 PM2 进程管理器：`npm install -g pm2`

2. **准备数据库**
   - MySQL 8.0+ 或 TiDB Cloud
   - 创建数据库：`CREATE DATABASE auto_parts_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
   - 创建数据库用户并授权

#### 步骤 1：获取代码

从 Manus Management UI 下载项目代码：

1. 进入 **Code** 面板
2. 点击 **"Download All Files"**
3. 解压到服务器目录（如 `/var/www/auto_parts_inventory`）

或者，如果已连接 GitHub：

```bash
git clone https://github.com/your-username/auto_parts_inventory.git
cd auto_parts_inventory
```

#### 步骤 2：安装依赖

```bash
pnpm install --prod
```

#### 步骤 3：配置环境变量

创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL="mysql://username:password@host:3306/auto_parts_inventory"

# JWT 密钥（生成随机字符串）
JWT_SECRET="your-super-secret-jwt-key-change-this"

# OAuth 配置（如果使用 Manus OAuth）
VITE_APP_ID="your-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://oauth.manus.im"
OWNER_OPEN_ID="your-open-id"
OWNER_NAME="Your Name"

# Manus 内置服务（可选）
BUILT_IN_FORGE_API_URL="https://forge-api.manus.im"
BUILT_IN_FORGE_API_KEY="your-api-key"
VITE_FRONTEND_FORGE_API_KEY="your-frontend-api-key"
VITE_FRONTEND_FORGE_API_URL="https://forge-api.manus.im"

# 分析统计（可选）
VITE_ANALYTICS_ENDPOINT="https://analytics.manus.im"
VITE_ANALYTICS_WEBSITE_ID="your-website-id"

# 应用配置
VITE_APP_TITLE="汽车配件库存管理系统"
VITE_APP_LOGO="/logo.png"
```

**生成 JWT 密钥：**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 步骤 4：数据库迁移

```bash
pnpm db:push
```

#### 步骤 5：构建生产版本

```bash
pnpm build
```

#### 步骤 6：启动服务

使用 PM2 启动：

```bash
pm2 start npm --name "auto-parts-inventory" -- start
pm2 save
pm2 startup  # 设置开机自启
```

或直接启动：

```bash
NODE_ENV=production node server/index.js
```

#### 步骤 7：配置 Nginx 反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/auto-parts-inventory`：

```nginx
server {
    listen 80;
    server_name inventory.yourcompany.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name inventory.yourcompany.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/inventory.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inventory.yourcompany.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/auto-parts-inventory /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 步骤 8：配置 SSL 证书

使用 Let's Encrypt 免费证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d inventory.yourcompany.com
```

#### 步骤 9：配置防火墙

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 环境变量配置

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | JWT 签名密钥 | 64位随机字符串 |

### OAuth 相关（如使用 Manus OAuth）

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `VITE_APP_ID` | Manus 应用 ID | Manus 平台自动配置 |
| `OAUTH_SERVER_URL` | OAuth 服务器地址 | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | OAuth 登录页面 | `https://oauth.manus.im` |
| `OWNER_OPEN_ID` | 所有者 OpenID | Manus 平台自动配置 |
| `OWNER_NAME` | 所有者姓名 | Manus 平台自动配置 |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_APP_TITLE` | 应用标题 | "汽车配件库存管理系统" |
| `VITE_APP_LOGO` | 应用 Logo 路径 | "/logo.png" |
| `PORT` | 服务器端口 | 3000 |

---

## 数据库配置

### MySQL 配置建议

```sql
-- 创建数据库
CREATE DATABASE auto_parts_inventory 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'auto_parts_user'@'%' IDENTIFIED BY 'strong_password_here';

-- 授权
GRANT ALL PRIVILEGES ON auto_parts_inventory.* TO 'auto_parts_user'@'%';
FLUSH PRIVILEGES;
```

### TiDB Cloud（推荐）

1. 访问 [TiDB Cloud](https://tidbcloud.com/)
2. 创建免费集群
3. 获取连接字符串
4. 在环境变量中配置 `DATABASE_URL`

### 数据库性能优化

```sql
-- 为常用查询添加索引
ALTER TABLE parts ADD INDEX idx_sku (sku);
ALTER TABLE parts ADD INDEX idx_line_code (lineCodeId);
ALTER TABLE purchase_orders ADD INDEX idx_order_date (orderDate);
ALTER TABLE sales_invoices ADD INDEX idx_customer (customerId);
```

---

## 域名配置

### DNS 配置

如果使用自定义域名，需要在 DNS 服务商处配置：

**Manus 托管：**
```
类型: CNAME
名称: inventory (或 @)
值: your-project.manus.space
TTL: 自动或 3600
```

**自建服务器：**
```
类型: A
名称: inventory (或 @)
值: 您的服务器 IP 地址
TTL: 3600
```

---

## 维护与备份

### 数据库备份

**自动备份脚本：**

创建 `scripts/backup-db.sh`：

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/auto_parts_inventory"
DB_NAME="auto_parts_inventory"
DB_USER="auto_parts_user"
DB_PASS="your_password"
DB_HOST="localhost"

mkdir -p $BACKUP_DIR

mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 删除 30 天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

**设置定时任务：**

```bash
chmod +x scripts/backup-db.sh
crontab -e
```

添加：
```
0 2 * * * /var/www/auto_parts_inventory/scripts/backup-db.sh
```

### 数据恢复

```bash
gunzip < backup_20260131_020000.sql.gz | mysql -u auto_parts_user -p auto_parts_inventory
```

### 日志管理

**查看应用日志：**

```bash
pm2 logs auto-parts-inventory
```

**查看 Nginx 日志：**

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 系统更新

1. **备份数据库**
2. **拉取最新代码**：
   ```bash
   git pull origin main
   ```
3. **安装依赖**：
   ```bash
   pnpm install --prod
   ```
4. **运行数据库迁移**：
   ```bash
   pnpm db:push
   ```
5. **重新构建**：
   ```bash
   pnpm build
   ```
6. **重启服务**：
   ```bash
   pm2 restart auto-parts-inventory
   ```

---

## 常见问题

### 1. 数据库连接失败

**错误信息：** `Error: connect ECONNREFUSED`

**解决方案：**
- 检查 `DATABASE_URL` 配置是否正确
- 确认数据库服务正在运行
- 检查防火墙是否允许数据库端口
- 验证数据库用户权限

### 2. OAuth 登录失败

**错误信息：** `OAuth authentication failed`

**解决方案：**
- 确认 `VITE_APP_ID` 和 OAuth 相关环境变量配置正确
- 检查回调 URL 是否在 Manus 平台配置
- 清除浏览器 Cookie 后重试

### 3. 端口被占用

**错误信息：** `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案：**
```bash
# 查找占用端口的进程
sudo lsof -i :3000
# 杀死进程
sudo kill -9 <PID>
# 或更改应用端口
export PORT=3001
```

### 4. 静态文件 404

**解决方案：**
- 确认已运行 `pnpm build`
- 检查 `client/dist` 目录是否存在
- 验证 Nginx 配置中的 `proxy_pass` 设置

### 5. 数据库迁移失败

**解决方案：**
```bash
# 重置数据库（警告：会删除所有数据）
pnpm db:push --force

# 或手动执行迁移
cd drizzle
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 6. 内存不足

**解决方案：**
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"
pm2 restart auto-parts-inventory --update-env
```

### 7. SSL 证书过期

Let's Encrypt 证书有效期 90 天，certbot 会自动续期。手动续期：

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 性能优化建议

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### 2. 配置数据库连接池

在代码中已配置，确保环境变量设置合理：

```env
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### 3. 启用 Redis 缓存（可选）

安装 Redis 并配置缓存层以提升查询性能。

### 4. CDN 加速（可选）

将静态资源托管到 CDN，加快全球访问速度。

---

## 安全建议

1. **定期更新依赖**：
   ```bash
   pnpm update
   ```

2. **使用强密码**：
   - 数据库密码至少 16 位
   - JWT 密钥至少 64 位

3. **限制数据库访问**：
   - 仅允许应用服务器 IP 访问数据库
   - 使用防火墙规则限制端口

4. **启用 HTTPS**：
   - 强制所有流量使用 HTTPS
   - 配置 HSTS 头

5. **定期备份**：
   - 每日自动备份数据库
   - 备份文件加密存储

6. **监控日志**：
   - 定期检查访问日志
   - 设置异常告警

---

## 技术支持

如有部署问题，请联系：

- **Manus 平台支持**：https://help.manus.im
- **项目文档**：查看项目根目录下的 README.md
- **GitHub Issues**：（如已连接 GitHub）

---

## 附录

### 推荐的服务器配置

**小型团队（10-50 用户）：**
- CPU: 2 核
- 内存: 2GB
- 存储: 20GB SSD
- 带宽: 5Mbps

**中型企业（50-200 用户）：**
- CPU: 4 核
- 内存: 4GB
- 存储: 50GB SSD
- 带宽: 10Mbps

**大型企业（200+ 用户）：**
- CPU: 8 核
- 内存: 8GB+
- 存储: 100GB+ SSD
- 带宽: 20Mbps+
- 考虑负载均衡和数据库读写分离

---

**祝您部署顺利！**

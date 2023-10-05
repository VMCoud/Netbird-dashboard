# NetBird 控制台

该项目是 NetBird 管理服务的用户界面。

**托管版本：** https://app.netbird.io/

查看 [NetBird 存储库](https://github.com/netbirdio/netbird)

## 为什么？

这个项目的目的很简单 - 简化使用 [NetBird](https://github.com/netbirdio/netbird) 构建 VPN 的管理。
控制台使以下操作成为可能：
- 跟踪对等节点的状态
- 移除对等节点
- 管理设置密钥（用于验证新的对等节点）
- 列出用户
- 定义访问控制

## 一些屏幕截图
<img src="./media/auth.png" alt="auth"/>
<img src="./media/peers.png" alt="peers"/>
<img src="./media/add-peer.png" alt="add-peer"/>

## 使用的技术

- ReactJS
- AntD UI 框架
- Auth0
- Nginx
- Docker
- Let's Encrypt

## 如何运行
免责声明。我们认为适当的用户管理系统并不是一项简单的任务，需要相当多的努力才能做得正确。因此，我们决定使用 Auth0 服务，它涵盖了我们所有的需求（用户管理、社交登录、管理 API 的 JTW）。
到目前为止，Auth0 是唯一无法真正自托管的第三方依赖。

1. 安装 [Docker](https://docs.docker.com/get-docker/)
2. 注册 [Auth0](https://auth0.com/) 帐户
3. 运行 Wiretrustee UI 控制台需要设置以下 Auth0 环境变量（请参阅下面的 Docker 命令）：

   `AUTH0_DOMAIN` `AUTH0_CLIENT_ID` `AUTH0_AUDIENCE`

   要获取这些值，请使用 [Auth0 React SDK 指南](https://auth0.com/docs/quickstart/spa/react/01-login#configure-auth0) 直到 "配置允许的 Web 起源"。

4. Wiretrustee UI 控制台使用 Wiretrustee 管理服务 HTTP API，因此需要设置 `NETBIRD_MGMT_API_ENDPOINT`。如果您在同一服务器上托管管理 API，则大多数情况下它将是 `http://localhost:33071`。
5. 运行不带 SSL（Let's Encrypt）的 Docker 容器：

   ```shell
   docker run -d --name wiretrustee-dashboard \
     --rm -p 80:80 -p 443:443 \
     -e AUTH0_DOMAIN=<设置您的 AUTH 域> \
     -e AUTH0_CLIENT_ID=<设置您的客户端 ID> \
     -e AUTH0_AUDIENCE=<设置您的 AUDIENCE> \
     -e NETBIRD_MGMT_API_ENDPOINT=<设置您的管理 API URL> \
     wiretrustee/dashboard:main
   ```
6. 运行带 SSL（Let's Encrypt）的 Docker 容器：

   ```shell
   docker run -d --name wiretrustee-dashboard \
     --rm -p 80:80 -p 443:443 \
     -e NGINX_SSL_PORT=443 \
     -e LETSENCRYPT_DOMAIN=<您的公共域名> \
     -e LETSENCRYPT_EMAIL=<您的电子邮件> \
     -e AUTH0_DOMAIN=<设置您的 AUTH 域> \
     -e AUTH0_CLIENT_ID=<设置您的客户端 ID> \
     -e AUTH0_AUDIENCE=<设置您的 AUDIENCE> \
     -e NETBIRD_MGMT_API_ENDPOINT=<设置您的管理 API URL> \
     wiretrustee/dashboard:main
   ```

## 如何进行本地开发
1. 安装 node 16
2. 创建并更新 `src/.local-config.json` 文件。该文件应包含要替换 `src/config.json` 中的值。
3. 运行 `npm install`
4. 运行 `npm run start dev`

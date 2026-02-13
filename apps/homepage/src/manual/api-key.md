---
title:  如何获取 API Key
order: 7
---

Craft Agent (妙技) 可使用 Claude 官方、Claude 中转站、或者智谱 GLM 系列模型的 API Key。

## 获取 Claude 官方 API Key

Claude 官方 API Key 可从 [console.anthropic.com](https://console.anthropic.com) 获取。

## 获取 Claude 中转站 API Key

对于中国大陆用户，Claude 官方的账号注册比较困难，所以可以选择购买第三方中转站账号。

我们搜集了一些中转站服务商，请按需购买（非广告，无利益相关）：

[aigocode.com](https://aigocode.com)

[duckcoding.com](https://duckcoding.com)

购买套餐后，在中转站页面创建 API Key，并获取 Base URL:

![](/manual/image.png)

如上图，一般服务商网站的教程页面，都会有设置与 claude 兼容的 base url 的步骤，把这个 base url的网址复制下来，后面使用。

## 获取智谱 GLM 系列 API Key

在 [智谱官网](https://bigmodel.cn/console/overview) 购买套餐后，[创建 API Key](https://bigmodel.cn/usercenter/proj-mgmt/apikeys)。

智谱官方 API 的 Base URL 是：`https://open.bigmodel.cn/api/anthropic`

## 在 Craft Agent （妙技）里配置 API Key

首次使用时，在欢迎页面选择“Anthropic API 密钥“：

![alt text](/manual/image-1.png)

填入在以上三种渠道之一获取的“密钥“和“Base URL“（如果是 claude 官方密钥，base url 可以省略）：

![alt text](/manual/image-2.png)

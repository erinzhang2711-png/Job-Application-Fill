# Job Application Fill

[中文](#中文) · [English](#english)

---

## 中文

### 这是什么？

**Job Application Fill** 是一个用于填写求职官网申请表的浏览器扩展，适用于校招、社招和海外岗位申请。

它不是“一键自动投递”工具：先点击网页上想填写的输入框，再点击扩展右侧面板里对应的资料，内容才会被填入该输入框。这样既能节省重复输入的时间，也保留你对每一项申请资料的检查和控制。

### 主要功能

- 兼容 Chrome 与 Safari，使用同一套扩展源代码。
- 中英文资料库彼此独立，可分别维护。
- 支持基础资料、教育经历、工作经历、实习经历、项目经历、校园经历、技能、语言能力、兴趣爱好、个人评价及常用问答。
- 实习经历可建立多个版本，例如 Finance、Tech 或 AI PM，并按申请岗位选择对应版本。
- 可新增、改名、删除大板块；顶部板块标签可拖拽排序，底下的内容和右侧填入面板会同步调整。
- 支持普通输入框、多行文本、常规下拉选项、复选框、单选框与可编辑文本区域。
- 资料保存在浏览器本地：没有账号、服务器、追踪或自动提交功能。

### 日常使用

1. 打开求职官网的申请页面。
2. 点击浏览器工具栏中的 **Job Application Fill** 图标，打开右侧资料面板。
3. 先点击网页中需要填写的字段，例如“姓名”或“公司名称”。
4. 在右侧面板中切换中文或 English，并点击想填入的资料卡片。
5. 首次使用或需要改资料时，点击面板底部的“编辑资料”。编辑完成后点击“保存资料”。
6. 提交申请前，请逐项核对页面上的内容；扩展不会替你提交申请。

## 在 Chrome 安装

### 第一次安装

1. 在本仓库页面点击 **Code → Download ZIP**，下载后双击解压；也可以使用 Git 克隆仓库。
2. 不要删除或移动解压后的项目文件夹。Chrome 需要一直从这个文件夹读取扩展文件。
3. 在 Chrome 地址栏输入 `chrome://extensions` 并打开。
4. 打开右上角的“开发者模式”。
5. 点击“加载已解压的扩展程序”。
6. 选择刚才解压得到的 **Job Application Fill** 文件夹——请选择包含 `manifest.json` 的文件夹，不是它的上一层或 `src` 文件夹。
7. 扩展卡片出现后，建议点击 Chrome 工具栏右上角的拼图图标，把 **Job Application Fill** 固定到工具栏。
8. 右键点击工具栏中的 **Job Application Fill** 图标，选择“选项”，即可进入资料编辑页，自定义字段、板块与实习经历版本。
9. 进入网申页面后，点击固定在右上角工具栏的 **Job Application Fill** 图标，即可打开资料面板并开始使用。

### 更新 Chrome 版本

1. 从 GitHub 下载最新 ZIP 并解压，或在已克隆的仓库文件夹中执行 `git pull`。
2. 如果换了文件夹，请在 `chrome://extensions` 移除旧的“已解压”扩展，再选择新的项目文件夹重新加载。
3. 如果仍使用同一个文件夹，只需在扩展卡片上点击“重新加载”。
4. 资料通常保留在浏览器扩展的本地存储中；移除扩展或清除浏览器数据前，请确认自己不需要保留其中的资料。

## 在 Safari 安装（macOS + Xcode）

Safari 不能像 Chrome 一样直接加载“已解压”扩展。需要先由 Xcode 将本仓库打包成一个 macOS 应用；该应用中内嵌 Safari 扩展。以下是本地个人使用的完整流程。

### 准备

1. 在 Mac App Store 安装 **Xcode**，首次打开一次并完成其提示的组件安装。

### 方式 A：让 Agent 帮你转换（推荐）

如果你正在使用可操作本地文件和终端的 AI 编程助手，可以把本仓库链接和以下提示词发给它。它可以完成下载、转换、资源同步和构建排错；但选择 Apple Team、确认签名和授权 Safari 网站权限仍需要你本人完成。

```text
请帮我把这个 Chrome 扩展转换成可在 macOS Safari 使用的扩展：
https://github.com/erinzhang2711-png/Job-Application-Fill

我已经安装好 Xcode。请下载或克隆该仓库，使用 Safari Web Extension Packager 生成一个 macOS Xcode 工程，并将应用名称设为 “Job Application Fill”。请保留现有的 manifest、src、images 和 options 页面。完成后告诉我：
1. 生成的 .xcodeproj 文件在哪里；
2. 我需要在 Xcode 哪两个 Target 中选择同一个 Apple Team；
3. 如何运行、并在 Safari 设置中启用扩展。

不要替我选择 Apple Team、登录账号、确认签名或授予 Safari 网站权限；遇到这些步骤时请停下来告诉我操作方法。
```

### 方式 B：手动安装

1. 从 GitHub 下载并解压本仓库。以下假设文件夹名称为 `Job Application Fill`，位于“下载”文件夹；若不一样，后面的路径请按实际位置替换。
2. 打开“终端”（Finder → 应用程序 → 实用工具 → 终端）。

### 从仓库生成 Safari 的 Xcode 工程

1. 在终端粘贴以下命令；它会把浏览器扩展源码转成 Safari 可用的 Xcode 工程。请把两处路径按自己的实际位置修改：

   ```bash
   xcrun safari-web-extension-packager \
     "$HOME/Downloads/Job Application Fill" \
     --project-location "$HOME/Desktop/Job Application Fill Safari" \
     --app-name "Job Application Fill" \
     --bundle-identifier "com.yourname.jobapplicationfill" \
     --swift \
     --macos-only \
     --copy-resources
   ```

2. `com.yourname.jobapplicationfill` 只是示例。请改成一个只属于你的名称，例如 `com.erinzhang.jobapplicationfill`。后续更新时务必使用**同一个** Bundle Identifier，Safari 才会将它识别为同一款扩展。
3. 命令成功后，在桌面打开新生成文件夹中的 `Job Application Fill.xcodeproj`。

> Apple 现在将这个命令行工具称为 `safari-web-extension-packager`；旧教程中的 `safari-web-extension-converter` 是其旧名称。[Apple 官方打包说明](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari?changes=_1)

### 在 Xcode 配置签名

1. 在 Xcode 左侧点击最上方的蓝色项目图标。
2. 在 **TARGETS** 中先选择主应用 **Job Application Fill**，打开 **Signing & Capabilities**。
3. 勾选 **Automatically manage signing**，在 **Team** 中选择自己的 Apple ID / Personal Team。
4. 再选择 **Job Application Fill Extension** target，重复上一步，并确保它选择的是**同一个 Team**。
5. 如果 Xcode 提示 Bundle Identifier 已被占用，请在主应用 target 修改成一个更独特的值；Extension target 会使用相同前缀加扩展后缀。不要在已经安装并保存资料后随意改变它。

### 构建、安装并启用

1. 在 Xcode 顶部运行目标选择 **My Mac**。
2. 点击左上角的播放按钮 `▶`，或按 `⌘R`。Xcode 会先构建扩展，再启动包含它的 macOS 应用。
3. 打开 Safari → **设置** → **扩展**。
4. 在左侧找到 **Job Application Fill** 并勾选启用；Safari 可能询问网站访问权限，请按自己的需要选择。
5. 回到任意网页，Safari 工具栏中会出现扩展图标。点击图标即可打开资料面板。

Apple 的说明确认：在 macOS 上运行包含扩展的应用后，再到 Safari 设置中启用扩展即可使用。[官方运行与更新说明](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)

### Safari 更新方式

Safari 的 Xcode 工程保存的是转换时的一份扩展资源副本；仅下载 GitHub 的新 ZIP 并不会自动更新已经生成的 Xcode 工程。

最简单、最不容易出错的更新方式是：

1. 获取最新仓库文件（下载 ZIP 或 `git pull`）。
2. 再次运行上面的 `safari-web-extension-packager` 命令，使用与之前相同的 `--app-name` 和 Bundle Identifier；为避免覆盖旧工程，可选择一个新的项目输出文件夹。
3. 在新工程的两个 target 中重新选择同一个 Team。
4. 按 `⌘R` 运行新工程；然后在 Safari → 设置 → 扩展中确认扩展仍已启用。

如果你熟悉 Xcode，也可以将更新后的 `manifest.json`、`options.html`、`images/` 和 `src/` 复制到 Xcode 工程内 Extension target 的 `Resources` 目录，再选择 **Product → Build**。Apple 说明 macOS 上后续更新可直接通过 Xcode 构建来部署。[官方更新说明](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)

### Safari 中看不到扩展？

- 确认两个 target 都使用同一个 Team，并再次按 `⌘R`。
- 在 Safari → 设置 → 扩展中确认已勾选；Safari 17 及更高版本如使用多个 Profile，也要在对应 Profile 的扩展设置中启用。
- 本地开发若未签名，Safari 默认会隐藏它。请在 Safari → 设置 → Developer 中开启“允许未签名扩展”；该开关在退出 Safari 后可能需要再次打开。详见 [Apple 的排障说明](https://developer.apple.com/documentation/safariservices/troubleshooting-your-safari-web-extension?language=objc)。

### 隐私提示

个人资料储存在当前浏览器的本地扩展存储中。请不要把真实简历、身份证号、电话号码、账户凭据或其他敏感信息提交到 GitHub、Issue、讨论区或截图中。

---

## English

### What is this?

**Job Application Fill** is a local-first browser extension for filling job-application forms. It is useful for graduate recruiting, experienced-hire applications, and international job portals.

It does **not** auto-apply or auto-submit. Click a field on the application page first, then click the corresponding item in the extension side panel. This removes repetitive typing while keeping every application under your review.

### Key features

- One shared codebase for Chrome and Safari.
- Separate Chinese and English profiles.
- Personal details, education, work experience, internship variants, projects, campus activities, skills, languages, interests, personal statement, and common answers.
- Multiple internship versions, such as Finance, Tech, or AI PM.
- Rename, delete, add, and drag-to-reorder profile sections. The editor and side panel share the same order.
- Local browser storage only: no account, server, analytics, or automatic submission.

### How to use it

1. Open a job application form.
2. Click the **Job Application Fill** icon in the browser toolbar.
3. Click the target field on the webpage.
4. Choose Chinese or English in the side panel, then click the value you want to insert.
5. Select “Edit profile” in the panel whenever you need to update your information, and save your changes.
6. Review every field before submitting the application.

## Install on Chrome

1. Choose **Code → Download ZIP** on this repository page and unzip it, or clone the repository with Git.
2. Keep the extracted project folder in place.
3. Open `chrome://extensions` in Chrome and enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the **Job Application Fill** folder that contains `manifest.json` (not its parent directory and not the `src` folder).
6. Optionally pin Job Application Fill from Chrome’s Extensions menu to make it easier to open.
7. Right-click the Job Application Fill toolbar icon and choose **Options** to edit your profile, fields, sections, and internship variants.
8. On a job application page, click the pinned Job Application Fill toolbar icon to open the side panel and start filling fields.

To update, replace the files in the same folder and press **Reload** on its card in `chrome://extensions`. If you load a different folder instead, remove the old unpacked extension and load the new folder.

## Install on Safari (macOS + Xcode)

Safari packages a web extension inside a macOS app, so an Xcode project is required for local installation.

1. Install Xcode from the Mac App Store and open it once to finish setup.

### Option A: Ask an AI coding agent (recommended)

If you use an AI coding agent that can work with local files and Terminal, send it this repository link and the prompt below. It can download the repository, package the extension, sync resources, and troubleshoot builds. You should still personally choose your Apple Team, approve signing, and grant Safari website permissions.

```text
Please convert this Chrome extension into a macOS Safari extension:
https://github.com/erinzhang2711-png/Job-Application-Fill

I have already installed Xcode. Download or clone the repository, use Safari Web Extension Packager to create a macOS Xcode project, and name the app “Job Application Fill”. Preserve the existing manifest, src, images, and options page. When finished, tell me:
1. Where the generated .xcodeproj file is;
2. Which two Xcode targets need the same Apple Team;
3. How to run the project and enable the extension in Safari Settings.

Do not choose my Apple Team, sign in to an account, approve signing, or grant Safari website permissions on my behalf. Stop and explain the next step whenever one of those actions is required.
```

### Option B: Install manually

1. Download and unzip this repository.
2. Open **Terminal** and run the following command, changing the paths and Bundle Identifier for your Mac:

   ```bash
   xcrun safari-web-extension-packager \
     "$HOME/Downloads/Job Application Fill" \
     --project-location "$HOME/Desktop/Job Application Fill Safari" \
     --app-name "Job Application Fill" \
     --bundle-identifier "com.yourname.jobapplicationfill" \
     --swift \
     --macos-only \
     --copy-resources
   ```

3. Open the generated `Job Application Fill.xcodeproj` in Xcode.
4. Select the project, then configure **Signing & Capabilities** for both the app target and the extension target. Enable **Automatically manage signing** and choose the same Apple ID / Personal Team for both.
5. Select **My Mac**, then press `⌘R` or click `▶` to build and run the app.
6. In Safari, open **Safari → Settings → Extensions**, find **Job Application Fill**, and enable it. Grant website access only as needed.

Use the same Bundle Identifier for future builds. To update, regenerate the project from the latest repository files (the simplest option) or copy the updated extension files into the generated Extension target’s `Resources` folder and build in Xcode again.

If the extension is missing from Safari Settings during local development, check signing first. For unsigned development builds, Safari requires “Allow unsigned extensions” in **Safari → Settings → Developer**. See Apple’s [run/update guide](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension) and [troubleshooting guide](https://developer.apple.com/documentation/safariservices/troubleshooting-your-safari-web-extension?language=objc).

## Privacy

Your profile stays in the current browser’s local extension storage. Never commit a real résumé, identification number, phone number, account credential, or other sensitive personal data to GitHub, Issues, discussions, or screenshots.

## License

[MIT License](LICENSE).

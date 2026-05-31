# Pi Agent xY

[pi 编程智能体](https://github.com/badlogic/pi-mono) 的网页界面。在浏览器中浏览会话、与智能体对话、分叉对话、切换消息分支。

## 快速开始

**无需安装，直接运行：**

```bash
npx @zwbigi/pi-agent-xy@latest
```

**或全局安装后使用：**

```bash
npm install -g @zwbigi/pi-agent-xy
pi-agent-xy
```

启动后打开 [http://localhost:30142](http://localhost:30142)。

**可选参数：**

```bash
pi-agent-xy --port 8080               # 自定义端口
pi-agent-xy --hostname 127.0.0.1      # 仅本机访问
pi-agent-xy -p 8080 -H 127.0.0.1     # 组合使用

PORT=8080 pi-agent-xy                 # 也支持环境变量
```

## 功能介绍

### 核心功能

- **会话浏览器** — 按工作目录分组展示所有 pi 会话
- **实时对话** — 通过 SSE 流式输出与智能体实时交互
- **会话分叉** — 从任意用户消息创建独立的新会话分支
- **会话内分支** — 回退到任意节点继续对话，在同一文件内创建分支
- **分支导航器** — 可视化切换同一会话内的各个分支
- **模型切换** — 对话中途随时切换模型
- **图片反推提示词 (🪄)** — 点击缩略图上的魔棒按钮弹出精美的毛玻璃弹窗，支持将图片一键解析为结构化文本或 `image_prompt` 专属 JSON 格式，并支持一键复制或插入输入框
- **智能多模态视觉处理** — 系统能够智能且高精度地识别当前大模型是否具备视觉能力：
  - **原生视觉透传**：若使用视觉模型（如 `MiMo-V2.5`、`GPT-5.5`、`Claude 4.5`、`Gemini 3.5`、`Kimi K2.6`、`DeepSeek V4` 等），系统将自动进行 Canvas 智能压缩并直接原生透传图片给大模型，无多余转换步骤，避免污染对话历史。
  - **非视觉模型友好拦截**：若试图向纯文本模型（如 `DeepSeek-R1` / `DeepSeek-V3` / `o1-mini`）或纯音频/语音模型（如 `mimo-v2.5-tts` 系列）发送图片，输入框上方会立即弹出红色警示 `"该模型不是视觉模型，不支持识图功能。"` 进行拦截保护。
  - **前沿模型全覆盖**：支持列表中已全面兼容 GPT-5.5/4.5、Claude 4.5/Opus 4.7、Gemini 3.5/Omni、Gemma 3/4/5、Kimi K2.6、DeepSeek V4/VL2/Janus、GLM-4.5V、MiniMax-VL-01、Molmo 等最新发布的前沿大模型。
- **工具面板** — 控制智能体可使用的工具（无 / 默认 / 全部）
- **压缩会话** — 对长会话进行摘要，节省上下文窗口
- **引导 / 追加** — 打断正在运行的智能体，或在其完成后追加消息
- **思考级别** — 支持 auto / off / minimal / low / medium / high / xhigh 级别切换
- **小米 MiMo 语音大模型 v2.5 专业级集成** — 自适应、高质感的完整大语言模型语音生成与克隆工作台：
  - **模型自适应 AI 语音工坊 (Model-Adaptive Workspace)**：右下角齿轮自动根据当前激活的声音模型，进行完全自适应的工坊面板蜕变：
    - **标准朗读 (`mimo-v2.5-tts`)**：提供冰糖 (默认)、茉莉 (温柔女)、苏打 (活力男)、白桦 (稳重男) 等八大官方中英文预设声线。
    - **声线塑造 (`mimo-v2.5-tts-voicedesign`)**：集成 **“多维度声线构造器 (Timbre Constructor Matrix)”**（性别年龄、嗓音特质、口音等 4 大折叠矩阵，智能拼接 Prompt），支持一键重命名保存为“我的声线库”。
    - **声音克隆 (`mimo-v2.5-tts-voiceclone`)**：集成 **“声音克隆提取器 (Voice Clone Source Selector)”**，支持内置 🎤 麦克风录音及文件列表打勾，即时以您的音色播报。
  - **呼吸与情感表达插入 (Audio Tag Assistant)**：在输入栏上方一键插入拟真音效标签（`[吸气] 💨`、`[大笑] 😂`、`[叹气] 😮` 等），使播报充满拟真拟人呼吸感。
  - **状态化高级播放与跳跃动效**：播放时展现高低跳跃的 4 轨声波频谱频谱动画。按钮文本根据就绪状态进行智能变换（`生成并播放 ➡️ 生成中... ➡️ 播放中 ➡️ 播放`），支持单例播放（同一时间全站仅播放一处音频，防止声音重叠）。
  - **持久化 Cache Storage 缓存**：采用 HTML5 规范持久化浏览器缓存技术。刷新页面后，之前生成过的语音能**瞬间秒速加载**并就绪为“播放”状态，不发生任何重复的网络请求或 API Key 额度损耗。
  - **规范化一键下载 (📥)**：就绪后浮现 📥 按钮，智能采用 `mimo-[模型类型]-[随机6位编码].mp3` 规范格式触发本地下载。


### Gem-xY 自定义智能体

支持创建和管理自定义智能体模板，为不同场景预设个性化配置：

- **自定义系统提示词** — 为每个智能体编写专属指令（如翻译官、代码审查员）
- **模型绑定** — 每个智能体可绑定不同的模型和提供商
- **工具过滤** — 限制智能体可访问的工具（如仅允许只读工具）
- **知识库文件** — 附加本地文件作为 RAG 上下文，智能体会话时自动加载
- **可视化编辑器** — 侧边栏内置 Gem 编辑面板，支持头像 emoji、指令编辑、工具勾选、知识文件管理

### 文件浏览

- **文件浏览器** — 侧边栏内置文件树，可浏览当前工作目录
- **文件查看器** — 在标签页中查看文件内容
- **PowerPoint 预览** — 离线 PPTX 高清渲染，支持全屏缩放
- **HTML 预览** — 内嵌 iframe 实时预览 HTML 文件，支持全屏缩放

## 注意事项

- **数据目录** — 默认读取 `~/.pi/agent/sessions` 下的会话文件。可通过环境变量 `PI_CODING_AGENT_DIR` 指定其他目录。
- **模型配置** — 从智能体数据目录下的 `models.json` 读取可用模型，可在侧边栏的「Models」面板中编辑。
- **Gem 配置** — 自定义智能体模板存储在 `~/.pi/agent/gem_xy.json`，通过侧边栏的「Gem-xY」面板管理。

## 开发

```bash
npm install
npm run dev   # 端口 30142
```

> **注意**：开发时请勿运行 `next build`，会污染 `.next/` 目录并导致 `npm run dev` 异常。

类型检查与 Lint：

```bash
node_modules/.bin/tsc --noEmit        # 类型检查
node node_modules/next/dist/bin/next lint   # ESLint
```

## 项目结构

```
app/
  api/
    sessions/          # 读写会话文件
    agent/             # 发送命令、SSE 事件流
    files/             # 文件内容读取
    models/            # 可用模型列表与默认模型
    models-config/     # 读写 models.json
    gem-xy/            # Gem-xY 自定义智能体 CRUD API
components/
  AppShell.tsx         # 布局 + URL 状态 + 标签页管理
  SessionSidebar.tsx   # 会话树 + 文件浏览器 + Gem 面板
  ChatWindow.tsx       # 消息 + 流式输出 + SSE + 分叉/导航
  ChatInput.tsx        # 输入栏 + 模型/思考/工具/压缩控件
  MessageView.tsx      # 渲染单条消息（用户/助手/工具调用/工具结果）
  BranchNavigator.tsx  # 会话内分支切换器
  GemEditorModal.tsx   # Gem-xY 自定义智能体编辑器
  FileExplorer.tsx     # 侧边栏文件树
  FileViewer.tsx       # 文件内容查看（含 PPTX/HTML 预览）
  ToolPanel.tsx        # 工具预设面板
  ModelsConfig.tsx     # models.json 编辑模态框
  TabBar.tsx           # 标签栏（聊天 + 文件标签）
hooks/
  useAgentSession.ts   # 智能体会话状态管理 Hook
lib/
  session-reader.ts    # 解析 .jsonl 会话文件
  rpc-manager.ts       # 管理 AgentSession 生命周期
  agent-client.ts      # 前端 API 请求封装
  gem-xy.ts            # Gem-xY 自定义智能体 CRUD 服务
  normalize.ts         # 规范化 toolCall 字段名
  types.ts             # 共享 TypeScript 类型
```

## 架构

```
浏览器                Next.js 服务端              AgentSession (进程内)
  │                        │                               │
  ├─ GET /api/sessions ────▶ 读取 ~/.pi/agent/sessions/    │
  ├─ GET /api/sessions/[id] 直接读取 .jsonl 文件           │
  │                        │                               │
  ├─ 发送消息 ─────────────▶ POST /api/agent/[id]          │
  │                        │   startRpcSession() ─────────▶│ createAgentSession()
  │                        │   session.send(cmd) ─────────▶│ session.prompt()
  │                        │                               │
  ├─ SSE 连接 ─────────────▶ GET /api/agent/[id]/events    │
  │                        │   session.onEvent() ◀─────────│ session.subscribe()
  │◀── data: {...} ─────────│                               │
```

会话文件存储路径：`~/.pi/agent/sessions/<编码后的工作目录>/<时间戳>_<uuid>.jsonl`

## 许可证

MIT

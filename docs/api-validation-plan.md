# API 输入校验改造计划 — 引入 Zod Schema

## 1. 背景与目标

当前所有 API 路由使用手动 `if (!xxx)` + `as` 类型断言做输入校验，存在以下问题：
- 无统一错误格式，前端难以结构化解析
- 类型断言绕过编译器检查，运行时可能收到意外类型
- 校验逻辑散落在各路由中，难以维护和测试

**目标**：引入 `zod`（已在 node_modules 中），为每个 API 端点定义请求体 schema，统一校验 + 错误格式。

---

## 2. 统一错误响应格式

```ts
// lib/api-validate.ts
import { z } from "zod";
import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  issues?: { path: string; message: string }[];
}

export function validate<T>(schema: z.ZodType<T>, data: unknown):
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<ApiError> } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "请求参数校验失败",
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    ),
  };
}
```

---

## 3. 需要校验的路由清单

按优先级排列（P0 = 核心路径，P1 = 常用，P2 = 低频）：

### P0 — 核心对话链路

| 路由 | 方法 | 当前校验 | Schema 名称 |
|------|------|----------|-------------|
| `/api/agent/new` | POST | 手动检查 `cwd` 存在 | `CreateSessionSchema` |
| `/api/agent/[id]` | POST | 无（`as` 断言） | `AgentCommandSchema` |
| `/api/sessions/[id]` | PATCH | 手动检查 `name` 类型 | `RenameSessionSchema` |
| `/api/sessions/[id]/lock` | POST | 手动检查 `locked` 类型 | `SetLockSchema` |

### P1 — 配置与自定义智能体

| 路由 | 方法 | 当前校验 | Schema 名称 |
|------|------|----------|-------------|
| `/api/models-config` | PUT | 无 | `ModelsConfigSchema` |
| `/api/gem-xy` | POST | 手动检查 name/systemPrompt | `CreateGemSchema` |
| `/api/gem-xy/[id]` | DELETE | 无 | 路径参数即可 |
| `/api/skills` | PATCH | 手动检查 filePath | `ToggleSkillSchema` |
| `/api/skills/install` | POST | 手动检查 package | `InstallSkillSchema` |
| `/api/skills/search` | POST | 手动检查 query | `SearchSkillSchema` |

### P2 — 辅助功能

| 路由 | 方法 | 当前校验 | Schema 名称 |
|------|------|----------|-------------|
| `/api/agent/describe-image` | POST | 手动检查 image/mimeType | `DescribeImageSchema` |
| `/api/tts/synthesize` | POST | 手动检查 text | `TtsSynthesizeSchema` |

### 无需 Schema（纯 GET / 无请求体）

- `GET /api/sessions` — 无参数
- `GET /api/sessions/[id]` — 路径参数 + 可选 `includeState` query
- `GET /api/sessions/[id]/context` — 可选 `leafId` query
- `GET /api/sessions/[id]/lock` — 无参数
- `GET /api/models` — 无参数
- `GET /api/models-config` — 无参数
- `GET /api/gem-xy` — 无参数
- `GET /api/skills?cwd=` — query 校验可选
- `GET /api/agent/[id]/events` — 路径参数
- `POST /api/default-cwd` — 无参数
- `GET /api/home` — 无参数
- `GET /api/auth/*` — 无参数
- `DELETE /api/sessions/[id]` — 路径参数

---

## 4. Schema 定义

文件位置：`lib/schemas.ts`

```ts
import { z } from "zod";

// ============================================================
// P0 — 核心对话链路
// ============================================================

/** POST /api/agent/new */
export const CreateSessionSchema = z.object({
  cwd: z.string().min(1, "cwd 不能为空"),
  message: z.string().optional(),
  type: z.string().optional(),
  provider: z.string().optional(),
  modelId: z.string().optional(),
  toolNames: z.array(z.string()).optional(),
  thinkingLevel: z.enum([
    "auto", "off", "minimal", "low", "medium", "high", "xhigh"
  ]).optional(),
  gemId: z.string().optional(),
  images: z.array(z.object({
    type: z.literal("image"),
    data: z.string(),
    mimeType: z.string(),
  })).optional(),
});
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

/** POST /api/agent/[id] */
export const AgentCommandSchema = z.object({
  type: z.string().min(1, "type 不能为空"),
  message: z.string().optional(),
  images: z.array(z.object({
    type: z.literal("image"),
    data: z.string(),
    mimeType: z.string(),
  })).optional(),
  provider: z.string().optional(),
  modelId: z.string().optional(),
  level: z.string().optional(),
  toolNames: z.array(z.string()).optional(),
  leafId: z.string().optional(),
  name: z.string().optional(),
});
export type AgentCommandInput = z.infer<typeof AgentCommandSchema>;

/** PATCH /api/sessions/[id] */
export const RenameSessionSchema = z.object({
  name: z.string().min(1, "name 不能为空"),
});

/** POST /api/sessions/[id]/lock */
export const SetLockSchema = z.object({
  locked: z.boolean(),
});

// ============================================================
// P1 — 配置与自定义智能体
// ============================================================

/** PUT /api/models-config */
export const ModelsConfigSchema = z.record(z.unknown());

/** POST /api/gem-xy */
export const CreateGemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "name 不能为空"),
  description: z.string().optional().default(""),
  avatar: z.string().optional().default(""),
  systemPrompt: z.string().min(1, "systemPrompt 不能为空"),
  modelId: z.string().optional().default(""),
  provider: z.string().optional().default(""),
  allowedTools: z.array(z.string()).optional().default([]),
  knowledgeFiles: z.array(z.string()).optional().default([]),
});

/** PATCH /api/skills */
export const ToggleSkillSchema = z.object({
  filePath: z.string().min(1, "filePath 不能为空"),
  disableModelInvocation: z.boolean(),
});

/** POST /api/skills/install */
export const InstallSkillSchema = z.object({
  package: z.string().min(1, "package 不能为空"),
  scope: z.enum(["global", "project"]).optional().default("global"),
  cwd: z.string().optional(),
});

/** POST /api/skills/search */
export const SearchSkillSchema = z.object({
  query: z.string().min(1, "query 不能为空"),
  limit: z.number().int().min(1).max(50).optional().default(50),
});

// ============================================================
// P2 — 辅助功能
// ============================================================

/** POST /api/agent/describe-image */
export const DescribeImageSchema = z.object({
  image: z.string().min(1, "image (base64) 不能为空"),
  mimeType: z.string().min(1, "mimeType 不能为空"),
  provider: z.string().optional(),
  modelId: z.string().optional(),
});

/** POST /api/tts/synthesize */
export const TtsSynthesizeSchema = z.object({
  text: z.string().min(1, "text 不能为空"),
  style: z.string().optional(),
  voice: z.string().optional().default("mimo_default"),
  modelId: z.string().optional().default("mimo-v2.5-tts"),
  voiceDesignPrompt: z.string().optional(),
});
```

---

## 5. 改造示例

### 改造前（`/api/agent/new`）：
```ts
const body = await req.json() as { cwd?: string; [key: string]: unknown };
const { cwd, ...command } = body;
if (!cwd || typeof cwd !== "string") {
  return NextResponse.json({ error: "cwd is required" }, { status: 400 });
}
```

### 改造后：
```ts
import { validate } from "@/lib/api-validate";
import { CreateSessionSchema } from "@/lib/schemas";

const body = await req.json();
const check = validate(CreateSessionSchema, body);
if (!check.ok) return check.response;
const { cwd, ...command } = check.data;
// cwd 已保证为非空字符串，其余字段类型安全
```

---

## 6. 实施步骤

### 第一步：创建基础设施
- [ ] 创建 `lib/api-validate.ts`（validate 工具函数）
- [ ] 创建 `lib/schemas.ts`（所有 schema 定义）
- [ ] 确认 `zod` 已在 dependencies 中（当前在 node_modules 但未在 package.json 声明，需 `npm install zod`）

### 第二步：P0 路由改造（核心对话链路）
- [ ] `POST /api/agent/new` — 替换手动校验为 `CreateSessionSchema`
- [ ] `POST /api/agent/[id]` — 添加 `AgentCommandSchema`
- [ ] `PATCH /api/sessions/[id]` — 替换为 `RenameSessionSchema`
- [ ] `POST /api/sessions/[id]/lock` — 替换为 `SetLockSchema`

### 第三步：P1 路由改造（配置类）
- [ ] `PUT /api/models-config` — 添加 `ModelsConfigSchema`
- [ ] `POST /api/gem-xy` — 替换为 `CreateGemSchema`
- [ ] `PATCH /api/skills` — 替换为 `ToggleSkillSchema`
- [ ] `POST /api/skills/install` — 替换为 `InstallSkillSchema`
- [ ] `POST /api/skills/search` — 替换为 `SearchSkillSchema`

### 第四步：P2 路由改造（辅助功能）
- [ ] `POST /api/agent/describe-image` — 替换为 `DescribeImageSchema`
- [ ] `POST /api/tts/synthesize` — 替换为 `TtsSynthesizeSchema`

### 第五步：验证
- [ ] `tsc --noEmit` 类型检查通过
- [ ] 手动测试各端点正常工作
- [ ] 确认校验失败时返回结构化错误（400 + issues 数组）

---

## 7. 注意事项

1. **`zod` 依赖**：`node_modules` 中已有 zod，但 `package.json` 的 dependencies 中未声明。需先 `npm install zod` 确保正式依赖。

2. **`/api/agent/new` 的 `...command` 透传**：该路由会将 body 中未识别的字段透传给 `session.send()`。Schema 中用 `.passthrough()` 或只校验已知字段，其余字段通过 `z.record(z.unknown())` 放行。

3. **`/api/agent/[id]` 的动态 command 类型**：该路由接受多种 command type（prompt/abort/set_model/compact 等），每种的参数不同。建议只校验 `type` 必填 + 其余字段放行，后续可按 type 细化。

4. **`/api/models-config` 的 PUT body**：当前直接写入文件，schema 可以用宽松的 `z.record(z.unknown())`，未来可收紧。

5. **错误信息语言**：建议用中文，与现有手动校验的错误信息风格一致。

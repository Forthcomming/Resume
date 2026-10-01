# REDcowork 源码交付包设计

## 目标

为 `redcowork-demo/` 生成一份可由 REDcowork 解包、识别并在 Node 20 环境构建的源码级 ZIP。交付包用于平台代码导入，不包含本机依赖、构建产物或缓存。

## 包结构

ZIP 根目录直接放置工程文件，不额外嵌套 `redcowork-demo/` 目录：

```text
package.json
package-lock.json
index.html
src/
vite.config.ts
tailwind.config.ts
postcss.config.js
tsconfig.json
tsconfig.app.json
tsconfig.node.json
README.md
```

交付包排除：

- `node_modules/`
- `dist/`
- `*.test.ts` 与 `*.test.tsx`
- `*.tsbuildinfo`
- 生成或残留的 `vite.config.js`、`vite.config.d.ts`
- 环境变量、密钥和编辑器缓存

## Node 20 兼容性

- 将 `unpdf` 固定为 `1.7.0`，避免 `^1.4.0` 解析到要求 Node 22 的 `1.8.1`。
- 同步更新 `package-lock.json`，确保 REDcowork 使用 `npm ci` 时安装相同版本。
- 其余运行依赖保持不变；`react-router-dom@7.18.4` 的最低要求为 Node 20，符合平台环境。

## 输出

生成文件：

`output/resumekit-redcowork-source.zip`

ZIP 使用标准 UTF-8 文件名且不加密。项目路径均为英文，避免 Windows GBK 文件名问题。

## 验证

1. 检查 ZIP 大小低于 50 MB。
2. 列出 ZIP 根目录，确认 `package.json` 位于根级。
3. 解压到新的临时目录。
4. 使用 Node 20 执行 `npm ci` 与 `npm run build`。
5. 确认生成 `dist/index.html`，且源码包中不包含排除项。

## 非目标

- 不改动 Demo 的功能、界面、路由和本地数据结构。
- 不上传 `dist/` 静态产物代替源码。
- 不包含原 Next.js 工程、Supabase 配置或 `.env.local`。

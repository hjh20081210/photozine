import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { loadDB, findByToken } from './auth-db.js';

// 默认免费模型（密钥存后端，不对外暴露完整密钥到非管理员）
const DEFAULT_FREE_MODELS = {
  'gpt-image-2': {
    name: 'gpt-image-2',
    model: 'gpt-image-2',
    endpoint: 'https://www.aiyoyoo.com/v1/chat/completions',
    apiKey: 'sk-52678f321d8e14eb1a056465f6841c297e08361ef63a552270ad77f903dcdd37',
    kind: 'image',
  },
  'rumeng-flash-1': {
    name: '入梦 Flash',
    model: '入梦 Flash',
    endpoint: 'https://speed.toter.me/chat/completions',
    apiKey: 'sk-5mdURsNnT35HgftX0fXwoRK7zjsNj5TnvvZWdnbRcZFLEfSW',
    kind: 'chat',
  },
  'rumeng-flash-2': {
    name: '入梦 Flash',
    model: '入梦 Flash',
    endpoint: 'https://speed.toter.me/chat/completions',
    apiKey: 'sk-GjeCPWiTENHjn18RA51Uax6xjgQgbUfD4ixgXRom6p1dVcKI',
    kind: 'chat',
  },
};

const FILE = '/tmp/free-models.json';
let cache = null;

function normalize(entry) {
  return {
    name: String(entry.name || entry.model || '模型'),
    model: String(entry.model || entry.name || ''),
    endpoint: String(entry.endpoint || entry.baseUrl || ''),
    apiKey: String(entry.apiKey || ''),
    kind: String(entry.kind || 'image'),
  };
}

export function loadFreeModels() {
  if (cache) return cache;
  try {
    if (fs.existsSync(FILE)) {
      const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      cache = raw && typeof raw === 'object' ? raw : { ...DEFAULT_FREE_MODELS };
    } else {
      cache = { ...DEFAULT_FREE_MODELS };
    }
  } catch (e) {
    cache = { ...DEFAULT_FREE_MODELS };
  }
  // 兜底：确保默认键存在
  for (const [id, def] of Object.entries(DEFAULT_FREE_MODELS)) {
    if (!cache[id]) cache[id] = { ...def };
  }
  return cache;
}

function saveFreeModels(models) {
  cache = models;
  fs.writeFileSync(FILE, JSON.stringify(models, null, 2), 'utf8');
}

// 供给 generation.js 使用的运行时映射（含密钥），只读
export function getFreeModelMap() {
  return loadFreeModels();
}

// 供前端展示（脱敏 apiKey，不含完整密钥）
export function getFreeModelList() {
  return Object.entries(loadFreeModels()).map(([id, m]) => ({
    id,
    name: m.name,
    model: m.model,
    endpoint: m.endpoint,
    kind: m.kind,
    apiKey: m.apiKey ? `${m.apiKey.slice(0, 6)}...${m.apiKey.slice(-4)}` : '',
    hasKey: !!m.apiKey,
  }));
}

function requireAdmin(req, res) {
  const tok = (req.headers['x-session'] || '').toString();
  if (!tok) return { error: res.status(401).json({ code: 401, msg: '未登录', data: null }) };
  const db = loadDB();
  const me = findByToken(db, tok);
  if (!me) return { error: res.status(401).json({ code: 401, msg: '登录已过期', data: null }) };
  if (!me.isAdmin) return { error: res.status(403).json({ code: 403, msg: '需要管理员权限', data: null }) };
  return { me };
}

const router = Router();

// GET /api/free-models —— 管理列表（需管理员）
router.get('/manage', (req, res) => {
  try {
    const g = requireAdmin(req, res);
    if (g.error) return;
    res.json({ code: 200, msg: 'ok', data: { models: getFreeModelList() } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '获取失败', error: e.message, data: null });
  }
});

// POST /api/free-models —— 新增（需管理员）
router.post('/', (req, res) => {
  try {
    const g = requireAdmin(req, res);
    if (g.error) return;
    const { id, name, model, endpoint, apiKey, kind } = req.body || {};
    if (!id || !model || !endpoint || !apiKey) {
      return res.status(400).json({ code: 400, msg: '缺少 id / model / endpoint / apiKey', data: null });
    }
    const models = loadFreeModels();
    if (models[id]) {
      return res.status(400).json({ code: 400, msg: '该 id 已存在', data: null });
    }
    models[id] = normalize({ id, name, model, endpoint, apiKey, kind });
    saveFreeModels(models);
    res.json({ code: 200, msg: '已添加', data: { id } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '添加失败', error: e.message, data: null });
  }
});

// PUT /api/free-models/:id —— 编辑（需管理员）
router.put('/:id', (req, res) => {
  try {
    const g = requireAdmin(req, res);
    if (g.error) return;
    const id = req.params.id;
    const models = loadFreeModels();
    if (!models[id]) return res.status(404).json({ code: 404, msg: '模型不存在', data: null });
    const { name, model, endpoint, apiKey, kind } = req.body || {};
    const cur = models[id];
    models[id] = normalize({
      id,
      name: name ?? cur.name,
      model: model ?? cur.model,
      endpoint: endpoint ?? cur.endpoint,
      apiKey: apiKey ?? cur.apiKey,
      kind: kind ?? cur.kind,
    });
    saveFreeModels(models);
    res.json({ code: 200, msg: '已更新', data: { id } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '更新失败', error: e.message, data: null });
  }
});

// DELETE /api/free-models/:id —— 删除（需管理员）
router.delete('/:id', (req, res) => {
  try {
    const g = requireAdmin(req, res);
    if (g.error) return;
    const id = req.params.id;
    const models = loadFreeModels();
    if (!models[id]) return res.status(404).json({ code: 404, msg: '模型不存在', data: null });
    delete models[id];
    saveFreeModels(models);
    res.json({ code: 200, msg: '已删除', data: null });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '删除失败', error: e.message, data: null });
  }
});

// GET /api/free-models —— 公开列表（脱敏，供所有用户展示选择）
router.get('/', (req, res) => {
  try {
    res.json({ code: 200, msg: 'ok', data: { models: getFreeModelList() } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '获取失败', error: e.message, data: null });
  }
});

export default router;

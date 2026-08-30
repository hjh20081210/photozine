import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { loadDB, findByToken } from './auth-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 历史数据文件（开发沙箱用 /tmp 持久化；生产可换数据库）
const DATA_FILE = process.env.HISTORY_FILE || '/tmp/zine-history.json';
const MAX_ITEMS = 200;

function loadHistory() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    }
  } catch (e) {
    console.error('[history] 读取失败', e.message);
  }
  return [];
}

function saveHistory(arr) {
  try {
    // 只保留最近 MAX_ITEMS 条
    const trimmed = arr.slice(0, MAX_ITEMS);
    fs.writeFileSync(DATA_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
    return trimmed;
  } catch (e) {
    console.error('[history] 写入失败', e.message);
    return arr;
  }
}

// 从 x-session 解析当前登录用户 id；未登录/过期返回 null（游客）
function resolveUserId(req) {
  try {
    const tok = (req.headers['x-session'] || '').toString().trim();
    if (!tok) return null;
    const db = loadDB();
    const user = findByToken(db, tok);
    return user ? user.id : null;
  } catch (e) {
    return null;
  }
}

// GET /api/history —— 仅返回当前登录用户自己的历史（倒序：最新在前）
router.get('/', (req, res) => {
  try {
    const uid = resolveUserId(req);
    const list = loadHistory()
      .filter((x) => (x.userId || '') === (uid || ''))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({ code: 200, msg: 'ok', data: list });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '加载历史失败', error: e.message, data: [] });
  }
});

// POST /api/history —— 保存一条历史（记录当前用户）
router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    if (!body.frontUrl && !body.backUrl) {
      return res.status(400).json({ code: 400, msg: '缺少图片地址', data: null });
    }
    const uid = resolveUserId(req);
    const item = {
      id: body.id || `h_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      taskId: body.taskId || null,
      userId: uid || null,
      frontUrl: body.frontUrl || '',
      backUrl: body.backUrl || null,
      thumbUrl: body.thumbUrl || body.frontUrl || '',
      style: body.style || '手绘水彩',
      styleName: body.styleName || body.style || '手绘水彩',
      ratio: body.ratio || { width: 3, height: 2 },
      mode: body.mode || 'POSTCARD',
      sides: body.sides || 'FRONT_BACK',
      title: body.title || '',
      location: body.location || '',
      date: body.date || '',
      backMessage: body.backMessage || '',
      modelName: body.modelName || '',
      createdAt: body.createdAt || new Date().toISOString(),
    };
    const list = loadHistory();
    // 去重（按 id）
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.unshift(item);
    saveHistory(list);
    res.json({ code: 200, msg: 'ok', data: item });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '保存历史失败', error: e.message, data: null });
  }
});

// DELETE /api/history/:id —— 仅删除当前用户自己的记录
router.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const uid = resolveUserId(req);
    let list = loadHistory();
    const before = list.length;
    list = list.filter((x) => x.id !== id || (x.userId || '') !== (uid || ''));
    saveHistory(list);
    res.json({ code: 200, msg: 'ok', data: { deleted: before !== list.length } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '删除失败', error: e.message, data: null });
  }
});

export default router;

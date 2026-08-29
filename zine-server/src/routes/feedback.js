import { Router } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import { loadDB as loadAuthDB, findByToken as authFind } from './auth-db.js';

const router = Router();

const DATA_FILE = process.env.FEEDBACK_FILE || '/tmp/zine-feedback.json';

function loadList() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    }
  } catch (e) {
    console.error('[feedback] 读取失败', e.message);
  }
  return [];
}

function saveList(arr) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  } catch (e) {
    console.error('[feedback] 写入失败', e.message);
  }
}

// POST /api/feedback —— 提交反馈（公开，可带登录态）
router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const content = String(body.content || '').trim();
    if (!content) return res.status(400).json({ code: 400, msg: '反馈内容不能为空', data: null });
    const item = {
      id: `fb_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      content,
      contact: String(body.contact || '').trim(),
      fromUser: String(body.fromUser || '匿名').trim(),
      createdAt: new Date().toISOString(),
    };
    const list = loadList();
    list.unshift(item);
    saveList(list);
    res.json({ code: 200, msg: '反馈已提交，感谢您的建议', data: item });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '提交失败', error: e.message, data: null });
  }
});

// GET /api/feedback —— 管理员查看全部反馈
router.get('/', (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    const db = loadAuthDB();
    const me = authFind(db, tok);
    if (!me) return res.status(401).json({ code: 401, msg: '未登录', data: null });
    if (!me.isAdmin) return res.status(403).json({ code: 403, msg: '无权限', data: null });
    const list = loadList().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ code: 200, msg: 'ok', data: list });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '获取失败', error: e.message, data: [] });
  }
});

export default router;
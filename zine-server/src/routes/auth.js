import { Router } from 'express';
import crypto from 'crypto';
import {
  ADMIN,
  freshSalt,
  hashPassword,
  makeToken,
  loadDB,
  saveDB,
  publicUser,
  findByToken,
  seedAdmin,
} from './auth-db.js';

const router = Router();
const SESSION_DAYS = 30;

seedAdmin();

function makeSession(db, userId) {
  const tok = makeToken();
  const ttl = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
  db.sessions = (db.sessions || []).filter((s) => new Date(s.expiresAt) > new Date());
  db.sessions.push({ token: tok, userId, expiresAt: new Date(ttl).toISOString() });
  saveDB(db);
  return tok;
}

// ===== POST /api/auth/register =====
router.post('/register', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const name = String(username || '').trim();
    const pass = String(password || '');
    if (!name) return res.status(400).json({ code: 400, msg: '请输入昵称', data: null });
    if (pass.length < 6) return res.status(400).json({ code: 400, msg: '密码至少 6 位', data: null });
    const db = loadDB();
    if ((db.users || []).some((u) => u.username === name)) {
      return res.status(400).json({ code: 400, msg: '该昵称已被注册', data: null });
    }
    const salt = freshSalt();
    const user = {
      id: `u_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      username: name,
      salt,
      passwordHash: hashPassword(pass, salt),
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    const tok = makeSession(db, user.id);
    res.json({ code: 200, msg: '注册成功', data: { token: tok, user: publicUser(user) } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '注册失败', error: e.message, data: null });
  }
});

// ===== POST /api/auth/login =====
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const name = String(username || '').trim();
    const pass = String(password || '');
    const db = loadDB();
    const user = (db.users || []).find((u) => u.username === name);
    if (!user) return res.status(401).json({ code: 401, msg: '账号或密码错误', data: null });
    const hash = hashPassword(pass, user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ code: 401, msg: '账号或密码错误', data: null });
    }
    const tok = makeSession(db, user.id);
    res.json({ code: 200, msg: '登录成功', data: { token: tok, user: publicUser(user) } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '登录失败', error: e.message, data: null });
  }
});

// ===== POST /api/auth/github —— GitHub 快捷登录 =====
router.post('/github', async (req, res) => {
  try {
    const { code, username } = req.body || {};
    const clientId = process.env.GITHUB_CLIENT_ID || '';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    if (code && clientId && clientSecret) {
      // 有 OAuth code 时走真实交换
      const tokResp = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      }).then((r) => r.json());
      const accessToken = tokResp.access_token;
      if (!accessToken) return res.status(401).json({ code: 401, msg: 'GitHub 授权失败', data: null });
      const gh = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      }).then((r) => r.json());
      const ghName = gh.login || gh.id || 'github_user';
      const db = loadDB();
      let user = (db.users || []).find((u) => u.username === `gh_${ghName}`);
      if (!user) {
        const salt = freshSalt();
        user = {
          id: `u_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          username: gh.name || gh.login || 'github_user',
          githubLogin: ghName,
          salt,
          passwordHash: hashPassword(crypto.randomBytes(16).toString('hex'), salt),
          isAdmin: false,
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        saveDB(db);
      }
      const tok = makeSession(db, user.id);
      return res.json({ code: 200, msg: '登录成功', data: { token: tok, user: publicUser(user) } });
    }
    // 未配置 OAuth —— 降级：以传入昵称创建/登录一个本地用户，便于体验 GitHub 快捷入口
    const name = String(username || '').trim() || 'GitHub 用户';
    const db = loadDB();
    let user = (db.users || []).find((u) => u.username === `gh_${name}`);
    if (!user) {
      const salt = freshSalt();
      user = {
        id: `u_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        username: name,
        githubLogin: 'local',
        salt,
        passwordHash: hashPassword(crypto.randomBytes(16).toString('hex'), salt),
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      saveDB(db);
    }
    const tok = makeSession(db, user.id);
    return res.json({ code: 200, msg: '登录成功', data: { token: tok, user: publicUser(user) } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: 'GitHub 登录失败', error: e.message, data: null });
  }
});

// ===== GET /api/auth/me =====
router.get('/me', (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    if (!tok) return res.status(401).json({ code: 401, msg: '未登录', data: null });
    const db = loadDB();
    const user = findByToken(db, tok);
    if (!user) return res.status(401).json({ code: 401, msg: '登录已过期', data: null });
    res.json({ code: 200, msg: 'ok', data: { user: publicUser(user) } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '获取失败', error: e.message, data: null });
  }
});

// ===== GET /api/auth/users —— 管理员查看注册用户昵称与人数 =====
router.get('/users', (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    if (!tok) return res.status(401).json({ code: 401, msg: '未登录', data: null });
    const db = loadDB();
    const me = findByToken(db, tok);
    if (!me) return res.status(401).json({ code: 401, msg: '登录已过期', data: null });
    if (!me.isAdmin) return res.status(403).json({ code: 403, msg: '无权限', data: null });
    const users = (db.users || [])
      .map(publicUser)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ code: 200, msg: 'ok', data: { total: users.length, users } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '获取失败', error: e.message, data: null });
  }
});

// ===== POST /api/auth/logout =====
router.post('/logout', (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    const db = loadDB();
    db.sessions = (db.sessions || []).filter((s) => s.token !== tok);
    saveDB(db);
    res.json({ code: 200, msg: '已退出', data: null });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '退出失败', data: null });
  }
});

export default router;
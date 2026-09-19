import { Router } from 'express';
import crypto from 'crypto';
import { sendVerifyCode, verifyCode } from './email.js';
import {
  ADMIN,
  freshSalt,
  hashPassword,
  makeToken,
  loadDB,
  saveDB,
  publicUser,
  findByToken,
  findUserByDeviceId,
  findUserByEmail,
  deleteUser,
  seedAdmin,
} from './auth-db.js';

const router = Router();
const SESSION_DAYS = 30;

seedAdmin();

// 迁移：确保所有老用户都有积分字段
function migratePoints() {
  try {
    const db = loadDB();
    let changed = false;
    for (const u of db.users || []) {
      if (typeof u.points !== 'number') {
        u.points = 1000;
        u.lastCheckInAt = null;
        changed = true;
      }
    }
    if (changed) saveDB(db);
  } catch (e) {
    console.error('[migrate] points 迁移失败', e.message);
  }
}
migratePoints();

function makeSession(db, userId) {
  const tok = makeToken();
  const ttl = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
  db.sessions = (db.sessions || []).filter((s) => new Date(s.expiresAt) > new Date());
  db.sessions.push({ token: tok, userId, expiresAt: new Date(ttl).toISOString() });
  saveDB(db);
  return tok;
}

// ===== POST /api/auth/send-verify-code =====
// 注册发送邮箱验证码
router.post('/send-verify-code', async (req, res) => {
  try {
    const { email } = req.body || {};
    const mail = String(email || '').trim();
    if (!mail) return res.status(400).json({ code: 400, msg: '请输入邮箱', data: null });

    const result = await sendVerifyCode(mail);
    if (!result.success) {
      return res.status(400).json({ code: 400, msg: result.msg, data: null });
    }
    // dev 模式下把验证码返回，方便前端调试
    const respData = { ok: true };
    if (result.code) respData.code = result.code;
    res.json({ code: 200, msg: result.msg, data: respData });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '发送失败', error: e.message, data: null });
  }
});

// ===== POST /api/auth/register =====
router.post('/register', (req, res) => {
  try {
    const { username, email, password, verifyCode: vCode, deviceId } = req.body || {};
    const name = String(username || '').trim();
    const mail = String(email || '').trim().toLowerCase();
    const pass = String(password || '');
    const code = String(vCode || '').trim();
    const devId = String(deviceId || '').trim();
    if (!name) return res.status(400).json({ code: 400, msg: '请输入昵称', data: null });
    if (!mail) return res.status(400).json({ code: 400, msg: '请输入邮箱', data: null });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return res.status(400).json({ code: 400, msg: '邮箱格式不正确', data: null });
    if (!code) return res.status(400).json({ code: 400, msg: '请输入验证码', data: null });
    if (pass.length < 6) return res.status(400).json({ code: 400, msg: '密码至少 6 位', data: null });

    const db = loadDB();

    // 单账号限制：同一设备已有账号时返回 409
    if (devId) {
      const existing = findUserByDeviceId(db, devId);
      if (existing) {
        return res.status(409).json({
          code: 409,
          msg: '该设备已注册账号，仅支持单设备单账号',
          data: { username: existing.username, email: existing.email || '' },
        });
      }
    }

    // 验证邮箱验证码
    const vResult = verifyCode(mail, code);
    if (!vResult.valid) {
      return res.status(400).json({ code: 400, msg: vResult.msg, data: null });
    }

    if ((db.users || []).some((u) => u.username === name)) {
      return res.status(400).json({ code: 400, msg: '该昵称已被注册', data: null });
    }
    if ((db.users || []).some((u) => (u.email || '').toLowerCase() === mail)) {
      return res.status(400).json({ code: 400, msg: '该邮箱已被注册', data: null });
    }
    const salt = freshSalt();
    const user = {
      id: `u_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      username: name,
      email: mail,
      salt,
      passwordHash: hashPassword(pass, salt),
      isAdmin: false,
      createdAt: new Date().toISOString(),
      points: 1000,
      lastCheckInAt: null,
      deviceId: devId || null,
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
    const account = String(username || '').trim();
    const pass = String(password || '');
    const db = loadDB();
    // 支持用户名或邮箱登录
    const user = (db.users || []).find((u) =>
      u.username === account || (u.email && u.email.toLowerCase() === account.toLowerCase())
    );
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

// ===== GitHub OAuth 配置 =====
const GITHUB_CLIENT_ID = '0v231iuWEkgqpkoVayRQ';
const GITHUB_CLIENT_SECRET = '3b9a83b11e9bce3ce421bd0b0ea56f927558f141';
const GITHUB_SCOPE = 'user:email';

const FRONTEND_URL = 'https://photozine.coze.site';

// 固定回调地址（与 GitHub OAuth 应用配置一致）
function getRedirectUri() {
  return 'https://api.photozine.coze.site/oauth2/code/github';
}

// ===== GET /api/auth/github —— 跳转 GitHub 授权页 =====
router.get('/github', (req, res) => {
  const redirectUri = getRedirectUri();
  const state = crypto.randomBytes(16).toString('hex');
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(GITHUB_SCOPE)}&state=${state}`;
  res.redirect(githubAuthUrl);
});

// ===== GET /oauth2/code/github —— GitHub 回调处理 =====
router.get('/oauth2/code/github', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.redirect(`${FRONTEND_URL}/pages/login/login?github_error=${encodeURIComponent(error_description || error)}`);
    }
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/pages/login/login?github_error=授权码缺失`);
    }

    // 交换 code 获取 access_token
    const redirectUri = getRedirectUri();
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.redirect(`${FRONTEND_URL}/pages/login/login?github_error=令牌交换失败`);
    }

    // 获取 GitHub 用户信息
    const userResp = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent': 'zine-app',
      },
    });
    const ghUser = await userResp.json();
    if (!ghUser || !ghUser.login) {
      return res.redirect(`${FRONTEND_URL}/pages/login/login?github_error=获取用户信息失败`);
    }

    // 尝试获取用户邮箱（可能不在 user 接口返回）
    let primaryEmail = ghUser.email || '';
    if (!primaryEmail) {
      try {
        const emailResp = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'User-Agent': 'zine-app',
          },
        });
        const emails = await emailResp.json();
        if (Array.isArray(emails)) {
          const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
          if (primary) primaryEmail = primary.email || '';
        }
      } catch (e) {
        // 邮箱获取失败不影响登录
      }
    }

    const ghLogin = ghUser.login;
    const displayName = ghUser.name || ghLogin;
    const ghEmail = primaryEmail;
    const ghAvatar = ghUser.avatar_url || '';
    const ghId = ghUser.id;

    // 创建或关联本地用户
    const db = loadDB();
    let user = (db.users || []).find((u) => u.githubLogin === ghLogin);
    if (!user) {
      const salt = freshSalt();
      user = {
        id: `u_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        username: displayName,
        githubLogin: ghLogin,
        githubId: ghId,
        email: ghEmail,
        avatar: ghAvatar,
        salt,
        passwordHash: hashPassword(crypto.randomBytes(16).toString('hex'), salt),
        isAdmin: false,
        createdAt: new Date().toISOString(),
        points: 1000,
        lastCheckInAt: null,
      };
      db.users.push(user);
      saveDB(db);
    } else {
      // 更新现有用户的 GitHub 信息
      if (ghAvatar && user.avatar !== ghAvatar) {
        user.avatar = ghAvatar;
        saveDB(db);
      }
    }

    const tok = makeSession(db, user.id);
    // 重定向到前端，携带 token
    return res.redirect(`${FRONTEND_URL}/pages/login/login?github_token=${tok}`);
  } catch (e) {
    console.error('[GitHub OAuth] 回调失败:', e.message);
    return res.redirect(`${FRONTEND_URL}/pages/login/login?github_error=${encodeURIComponent('授权处理失败')}`);
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

// ===== POST /api/auth/change-password —— 修改密码 =====
router.post('/change-password', (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    if (!tok) return res.status(401).json({ code: 401, msg: '未登录', data: null });
    const db = loadDB();
    const user = findByToken(db, tok);
    if (!user) return res.status(401).json({ code: 401, msg: '登录已过期', data: null });

    const { oldPassword, newPassword, confirmPassword } = req.body || {};
    const oldPass = String(oldPassword || '');
    const newPass = String(newPassword || '');
    const confirmPass = String(confirmPassword || '');

    if (!oldPass) return res.status(400).json({ code: 400, msg: '请输入原密码', data: null });
    if (newPass.length < 6) return res.status(400).json({ code: 400, msg: '新密码至少 6 位', data: null });
    if (newPass !== confirmPass) return res.status(400).json({ code: 400, msg: '两次输入的新密码不一致', data: null });

    // 验证原密码
    const oldHash = hashPassword(oldPass, user.salt);
    if (oldHash !== user.passwordHash) {
      return res.status(401).json({ code: 401, msg: '原密码错误', data: null });
    }

    // 更新密码
    const newSalt = freshSalt();
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPass, newSalt);

    // 使其他会话失效（保留当前会话）
    db.sessions = (db.sessions || []).filter((s) => s.token === tok || s.userId !== user.id);
    saveDB(db);

    res.json({ code: 200, msg: '密码修改成功', data: null });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '修改失败', error: e.message, data: null });
  }
});

// ===== POST /api/auth/delete-account —— 注销账号（登录态或设备+密码）=====
router.post('/delete-account', (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    const db = loadDB();
    let user = null;

    if (tok) {
      user = findByToken(db, tok);
    }

    // 也支持通过用户名+密码注销（弹窗场景）
    if (!user) {
      const { username, password } = req.body || {};
      const account = String(username || '').trim();
      const pass = String(password || '');
      user = (db.users || []).find((u) =>
        u.username === account || (u.email && u.email.toLowerCase() === account.toLowerCase())
      );
      if (user && pass) {
        const hash = hashPassword(pass, user.salt);
        if (hash !== user.passwordHash) {
          return res.status(401).json({ code: 401, msg: '密码错误', data: null });
        }
      } else {
        user = null;
      }
    }

    if (!user) return res.status(401).json({ code: 401, msg: '验证失败', data: null });
    if (user.isAdmin) return res.status(400).json({ code: 400, msg: '管理员账号不可注销', data: null });

    deleteUser(db, user.id);
    res.json({ code: 200, msg: '账号已注销', data: null });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '注销失败', error: e.message, data: null });
  }
});

// ===== POST /api/auth/bind-email —— 绑定邮箱 =====
router.post('/bind-email', async (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    if (!tok) return res.status(401).json({ code: 401, msg: '未登录', data: null });
    const db = loadDB();
    const user = findByToken(db, tok);
    if (!user) return res.status(401).json({ code: 401, msg: '登录已过期', data: null });

    const { email, verifyCode: vCode } = req.body || {};
    const mail = String(email || '').trim().toLowerCase();
    const code = String(vCode || '').trim();

    if (!mail) return res.status(400).json({ code: 400, msg: '请输入邮箱', data: null });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return res.status(400).json({ code: 400, msg: '邮箱格式不正确', data: null });
    if (!code) return res.status(400).json({ code: 400, msg: '请输入验证码', data: null });

    // 邮箱已被其他账号绑定
    const existing = findUserByEmail(db, mail);
    if (existing && existing.id !== user.id) {
      return res.status(400).json({ code: 400, msg: '该邮箱已被绑定', data: null });
    }

    const vResult = verifyCode(mail, code);
    if (!vResult.valid) {
      return res.status(400).json({ code: 400, msg: vResult.msg, data: null });
    }

    user.email = mail;
    saveDB(db);
    res.json({ code: 200, msg: '邮箱绑定成功', data: { email: user.email } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '绑定失败', error: e.message, data: null });
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
import fs from 'fs';
import crypto from 'crypto';

const DATA_FILE = process.env.AUTH_FILE || '/tmp/zine-auth.json';
export const ADMIN = {
  username: '何佳壕',
  password: 'hjh_20081210',
  isAdmin: true,
};

export function freshSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const db = JSON.parse(raw || '{}');
      db.users = Array.isArray(db.users) ? db.users : [];
      db.sessions = Array.isArray(db.sessions) ? db.sessions : [];
      return db;
    }
  } catch (e) {
    console.error('[auth] 读取失败', e.message);
  }
  return { users: [], sessions: [] };
}

export function saveDB(db) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('[auth] 写入失败', e.message);
  }
}

export function publicUser(u) {
  return { id: u.id, username: u.username, isAdmin: !!u.isAdmin, createdAt: u.createdAt };
}

export function findByToken(db, tok) {
  const s = (db.sessions || []).find((x) => x.token === tok && new Date(x.expiresAt) > new Date());
  if (!s) return null;
  return (db.users || []).find((u) => u.id === s.userId) || null;
}

// 首次启动 seed 管理员
export function seedAdmin() {
  try {
    const db = loadDB();
    const exists = (db.users || []).some((u) => u.username === ADMIN.username);
    if (!exists) {
      const salt = freshSalt();
      db.users.push({
        id: `u_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        username: ADMIN.username,
        salt,
        passwordHash: hashPassword(ADMIN.password, salt),
        isAdmin: true,
        createdAt: new Date().toISOString(),
      });
      saveDB(db);
      console.log('[auth] 管理员账号已初始化');
    }
  } catch (e) {
    console.error('[auth] seed 失败', e.message);
  }
}
import { Router } from 'express';
import { loadDB, saveDB, findByToken, publicUser } from './auth-db.js';

const router = Router();

const DAILY_CHECK_IN_REWARD = 200;
const NEW_USER_INITIAL_POINTS = 1000;

// 积分消耗配置：免费内置模型每次生成消耗多少积分
export const MODEL_POINTS_COST = {
  'gpt-image-2': 200,
  'rumeng-pro': 100,
  'seedream-4-5': 200,
};

export function getModelPointsCost(modelKey) {
  return MODEL_POINTS_COST[modelKey] || 0; // 自定义模型 0 积分
}

// ===== 每日签到 =====
router.post('/check-in', (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    if (!tok) return res.status(401).json({ code: 401, msg: '未登录', data: null });
    const db = loadDB();
    const user = findByToken(db, tok);
    if (!user) return res.status(401).json({ code: 401, msg: '登录已过期', data: null });

    // 初始化积分
    if (typeof user.points !== 'number') user.points = NEW_USER_INITIAL_POINTS;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const lastCheck = user.lastCheckInAt ? new Date(user.lastCheckInAt) : null;
    const lastStr = lastCheck ? `${lastCheck.getFullYear()}-${lastCheck.getMonth() + 1}-${lastCheck.getDate()}` : '';

    if (lastStr === todayStr) {
      return res.json({ code: 200, msg: '今日已签到', data: { checked: false, points: user.points, reward: 0 } });
    }

    user.points += DAILY_CHECK_IN_REWARD;
    user.lastCheckInAt = new Date().toISOString();
    saveDB(db);

    res.json({
      code: 200,
      msg: '签到成功',
      data: { checked: true, points: user.points, reward: DAILY_CHECK_IN_REWARD },
    });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '签到失败', error: e.message, data: null });
  }
});

// ===== 查询积分状态 =====
router.get('/status', (req, res) => {
  try {
    const tok = (req.headers['x-session'] || '').toString();
    if (!tok) return res.status(401).json({ code: 401, msg: '未登录', data: null });
    const db = loadDB();
    const user = findByToken(db, tok);
    if (!user) return res.status(401).json({ code: 401, msg: '登录已过期', data: null });

    if (typeof user.points !== 'number') {
      user.points = NEW_USER_INITIAL_POINTS;
      saveDB(db);
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const lastCheck = user.lastCheckInAt ? new Date(user.lastCheckInAt) : null;
    const lastStr = lastCheck ? `${lastCheck.getFullYear()}-${lastCheck.getMonth() + 1}-${lastCheck.getDate()}` : '';

    res.json({
      code: 200,
      msg: 'ok',
      data: {
        points: user.points,
        checkedToday: lastStr === todayStr,
        lastCheckInAt: user.lastCheckInAt || null,
        dailyReward: DAILY_CHECK_IN_REWARD,
      },
    });
  } catch (e) {
    res.status(500).json({ code: 500, msg: '获取失败', error: e.message, data: null });
  }
});

// ===== 扣减积分（内部使用）=====
export function deductPoints(db, user, points) {
  if (typeof user.points !== 'number') user.points = NEW_USER_INITIAL_POINTS;
  if (user.points < points) return false;
  user.points -= points;
  saveDB(db);
  return true;
}

// ===== 检查积分是否足够 =====
export function hasEnoughPoints(user, points) {
  if (typeof user.points !== 'number') return NEW_USER_INITIAL_POINTS >= points;
  return user.points >= points;
}

export default router;

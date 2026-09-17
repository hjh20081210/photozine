import nodemailer from 'nodemailer';
import crypto from 'crypto';
import fs from 'fs';

// 验证码存储（内存 + 持久化文件），结构：{ email, code, expiresAt, attempts }
const CODE_FILE = process.env.EMAIL_CODE_FILE || '/tmp/zine-email-codes.json';
const CODE_TTL_MS = 5 * 60 * 1000; // 5 分钟有效
const MAX_ATTEMPTS = 5; // 每个验证码最多验证 5 次
const SEND_COOLDOWN_MS = 60 * 1000; // 发送冷却 60 秒
const DAILY_LIMIT_PER_EMAIL = 20; // 每个邮箱每天最多发 20 次

// 邮件发送模式：
// - 'dev'：开发模式，不真实发送，接口直接返回验证码（默认）
// - 'smtp'：SMTP 模式（需配置 EMAIL_SMTP_* 环境变量）
// - 'ses'：腾讯云 SES 模式（需配置 TENCENT_SES_* 环境变量）
const EMAIL_MODE = process.env.EMAIL_MODE || 'dev';

// 通用发件人配置（优先走环境变量）
const EMAIL_FROM = process.env.EMAIL_FROM || '旅信 Zine <noreply@photozine.coze.site>';

// ---------- SMTP 配置（从环境变量读取，支持自定义任意 SMTP） ----------
function getSmtpConfig() {
  const host = process.env.EMAIL_SMTP_HOST;
  const port = Number(process.env.EMAIL_SMTP_PORT || 465);
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  const secure = process.env.EMAIL_SMTP_SECURE !== 'false';
  if (!host || !user || !pass) return null;
  return { host, port, secure, user, pass, from: EMAIL_FROM };
}

// ---------- QQ / 163 邮箱（保留为兼容配置，生产环境不推荐） ----------
// 注意：云服务器 IP 会触发 QQ/163 异地登录风控（535 Login fail），
// 线上部署推荐使用腾讯云 SES 等 HTTP API 邮件服务。
function getBuiltinSmtp(domain) {
  if (domain === 'qq.com') {
    return {
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      user: 'hjh20081210@qq.com',
      pass: 'vfwbmitmkrgueahi',
      from: '旅信 Zine <hjh20081210@qq.com>',
    };
  }
  if (domain === '163.com' || domain === '126.com') {
    return {
      host: 'smtp.163.com',
      port: 465,
      secure: true,
      user: 'photozine@163.com',
      pass: 'AAvxgC45LrWsvigV',
      from: '旅信 Zine <photozine@163.com>',
    };
  }
  return null;
}

function loadCodes() {
  try {
    if (fs.existsSync(CODE_FILE)) {
      const raw = fs.readFileSync(CODE_FILE, 'utf-8');
      return JSON.parse(raw || '{}');
    }
  } catch (e) {
    console.error('[email] 读取验证码文件失败', e.message);
  }
  return {};
}

function saveCodes(data) {
  try {
    fs.writeFileSync(CODE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[email] 写入验证码文件失败', e.message);
  }
}

// 生成 6 位数字验证码
function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function buildEmailHtml(code) {
  return `
    <div style="max-width: 480px; margin: 0 auto; padding: 32px 28px; background: #FFFDF8; font-family: -apple-system, 'PingFang SC', sans-serif;">
      <div style="font-size: 22px; font-weight: 600; color: #2C241E; margin-bottom: 8px;">注册验证码</div>
      <div style="font-size: 14px; color: #8A7B6A; margin-bottom: 24px;">您正在注册旅信 Zine 账号，验证码 5 分钟内有效。</div>
      <div style="background: #F7F1E5; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #26364A; font-family: 'Courier New', monospace;">${code}</div>
      </div>
      <div style="font-size: 12px; color: #B8B0A5;">如非本人操作，请忽略此邮件。</div>
    </div>
  `;
}

/**
 * 真实发送邮件（内部方法）
 */
async function doSendMail(to, subject, html) {
  // 优先使用环境变量配置的 SMTP
  let smtp = getSmtpConfig();

  // 其次根据收件人域名选内置 SMTP
  if (!smtp) {
    const domain = to.split('@')[1]?.toLowerCase() || '';
    smtp = getBuiltinSmtp(domain);
  }

  if (!smtp) {
    throw new Error('未配置邮件发送通道');
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10000,
  });

  await transporter.sendMail({
    from: smtp.from || EMAIL_FROM,
    to,
    subject,
    html,
  });
}

/**
 * 发送邮箱验证码
 * @param {string} email
 * @returns {Promise<{success: boolean, msg: string, code?: string}>}
 *   dev 模式下 code 字段返回验证码，方便调试
 */
export async function sendVerifyCode(email) {
  const mail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    return { success: false, msg: '邮箱格式不正确' };
  }

  const data = loadCodes();
  const today = getTodayStr();
  const record = data[mail] || {};

  // 冷却检查
  if (record.sentAt && Date.now() - record.sentAt < SEND_COOLDOWN_MS) {
    const remain = Math.ceil((SEND_COOLDOWN_MS - (Date.now() - record.sentAt)) / 1000);
    return { success: false, msg: `发送太频繁，请 ${remain} 秒后再试` };
  }

  // 每日次数限制
  const dailyCount = record.dailyDate === today ? (record.dailyCount || 0) : 0;
  if (dailyCount >= DAILY_LIMIT_PER_EMAIL) {
    return { success: false, msg: '今日发送次数已达上限' };
  }

  const code = genCode();
  const html = buildEmailHtml(code);

  try {
    if (EMAIL_MODE === 'dev') {
      // 开发模式：不真实发送，直接返回验证码
      console.info(`[email] dev 模式，验证码已生成：${mail} -> ${code}`);
    } else {
      await doSendMail(mail, '【旅信 Zine】您的注册验证码', html);
    }

    // 保存验证码
    data[mail] = {
      code,
      sentAt: Date.now(),
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
      dailyDate: today,
      dailyCount: dailyCount + 1,
    };
    saveCodes(data);

    const result = { success: true, msg: EMAIL_MODE === 'dev' ? '验证码已发送（开发模式）' : '验证码已发送' };
    // 开发模式下把验证码也返回，方便前端调试
    if (EMAIL_MODE === 'dev') result.code = code;
    return result;
  } catch (e) {
    console.error('[email] 发送失败', e.message);
    return { success: false, msg: '验证码发送失败，请稍后重试' };
  }
}

/**
 * 验证邮箱验证码
 * @param {string} email
 * @param {string} code
 * @returns {{valid: boolean, msg: string}}
 */
export function verifyCode(email, code) {
  const mail = email.trim().toLowerCase();
  const data = loadCodes();
  const record = data[mail];

  if (!record) {
    return { valid: false, msg: '请先获取验证码' };
  }
  if (Date.now() > record.expiresAt) {
    delete data[mail];
    saveCodes(data);
    return { valid: false, msg: '验证码已过期' };
  }
  if ((record.attempts || 0) >= MAX_ATTEMPTS) {
    delete data[mail];
    saveCodes(data);
    return { valid: false, msg: '验证次数过多，请重新获取' };
  }
  record.attempts = (record.attempts || 0) + 1;
  saveCodes(data);

  if (record.code !== code.trim()) {
    return { valid: false, msg: '验证码错误' };
  }
  // 验证成功后删除（一次性使用）
  delete data[mail];
  saveCodes(data);
  return { valid: true, msg: '验证成功' };
}

// 当前模式（供接口调试使用）
export function getEmailMode() {
  return EMAIL_MODE;
}

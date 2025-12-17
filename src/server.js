const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ORDER_CHAT_ID = process.env.ORDER_CHAT_ID;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    return sendJson(res, { status: 'ok' });
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/order') {
    return handleOrder(req, res);
  }

  return serveStatic(res, parsedUrl.pathname);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Telegram mini shop running on port ${PORT}`);
});

function serveStatic(res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      return res.end('Not found');
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
}

async function handleOrder(req, res) {
  try {
    const body = await readJsonBody(req);
    const { user, items, total } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendJson(res, { error: 'No items provided' }, 400);
    }

    const message = buildOrderMessage({ user, items, total });

    if (!BOT_TOKEN) {
      return sendJson(res, {
        status: 'skipped',
        message: 'BOT_TOKEN not set. Order message not sent to Telegram.',
        preview: message,
      });
    }

    const chatId = ORDER_CHAT_ID || user?.id;
    if (!chatId) {
      return sendJson(res, { error: 'Missing ORDER_CHAT_ID or user.id to send the order.' }, 400);
    }

    const telegramResponse = await sendTelegramMessage({ chatId, message });
    return sendJson(res, { status: 'sent', telegramResponse });
  } catch (error) {
    console.error('Failed to handle order', error);
    return sendJson(res, { error: 'Failed to process order.' }, 500);
  }
}

function buildOrderMessage({ user, items, total }) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const username = user?.username ? `@${user.username}` : null;
  const header = `🛍️ Nouvelle commande`;
  const client = [fullName || 'Client', username].filter(Boolean).join(' · ');

  const lines = items.map((item) => `• ${item.name} x${item.quantity} — ${item.price.toFixed(2)}€`);
  const footer = `Total: ${Number(total || 0).toFixed(2)}€`;

  return [header, client, '', ...lines, '', footer].join('\n');
}

async function sendTelegramMessage({ chatId, message }) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Telegram API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

function sendJson(res, payload, status = 200) {
  const data = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => {
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString() || '{}');
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

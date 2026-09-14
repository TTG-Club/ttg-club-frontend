/**
 * Растровые копии карты деревни для шапки главной.
 *
 * Карта `public/img/<тема>/hero-map.svg` — сотни фигур и шумовые фильтры.
 * Видеокарта растрирует её при первом показе долго: даже на игровой
 * видеокарте почти секунду, на телефоне — несколько секунд, и всё это время
 * страница не рисует кадры и не прокручивается. Поэтому шапка показывает
 * заранее отрисованную WebP — её достаточно декодировать. SVG остаётся
 * исходником.
 *
 * Скрипт рисует SVG в headless Chromium (цвета карты заданы через oklch и
 * color-mix, которые понимают только браузеры) и сохраняет рядом с ней:
 * - `hero-map.webp` — весь холст;
 * - `hero-map-sm.webp` — середина холста шириной с экран до 768px: на
 *   телефоне края карты всё равно за экраном.
 *
 * Картинки непрозрачные: карта сразу наложена на цвет страницы темы
 * (`bg-main` из colors.scss), на котором она лежит в шапке. С прозрачностью
 * шумовая текстура бумаги весила бы в пять раз больше, а наложение с
 * бледностью и маской шапки даёт тот же цвет, что и прозрачная карта.
 *
 * Запуск после правки `hero-map.svg` или цвета страницы темы:
 *   node scripts/render-hero-map.mjs
 * Путь к Chrome или Edge, если он не на стандартном месте:
 *   CHROME_PATH=/path/to/chrome node scripts/render-hero-map.mjs
 */
import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Тема сайта → её карта таблицы цветов в colors.scss */
const THEMES = { dark: '$theme-dark', light: '$theme-light' };

/** Холст карты — `viewBox` в `hero-map.svg` */
const CANVAS = { width: 3200, height: 1100 };

/**
 * На телефоне карта шириной 1600px, а видна середина шириной с экран (до
 * 768px): это 1536 единиц карты. Пиксель картинки — единица карты, то есть
 * два пикселя экрана на CSS-пиксель.
 */
const SMALL_CROP_WIDTH = 1536;

/** Выше глаз разницы не видит, ниже мылится дорога */
const QUALITY = 75;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const root = fileURLToPath(new URL('..', import.meta.url));
const chromePath = CHROME_CANDIDATES.find((path) => existsSync(path));

if (!chromePath) {
  throw new Error('Chrome или Edge не найден — укажите путь в CHROME_PATH');
}

const colors = readFileSync(
  join(root, 'src', 'assets', 'styles', 'variables', 'colors.scss'),
  'utf8',
);

/**
 * Цвет страницы темы — `bg-main` из её таблицы в colors.scss.
 * @param {string} table - имя таблицы, например `$theme-dark`
 */
function getPageColor(table) {
  const block = colors.slice(colors.indexOf(`${table}: (`));
  const color = block.match(/'bg-main':\s*(#[0-9a-f]{3,8})/i)?.[1];

  if (!color) {
    throw new Error(`Не нашёл bg-main в ${table}`);
  }

  return color;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const port = 9500 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'hero-map-'));

const browser = spawn(
  chromePath,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let endpoint;

for (let attempt = 0; attempt < 50 && !endpoint; attempt += 1) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`);

    endpoint = (await response.json()).webSocketDebuggerUrl;
  } catch {
    await sleep(200);
  }
}

const socket = new WebSocket(endpoint);

await new Promise((resolve) => socket.addEventListener('open', resolve));

let lastId = 0;
const pending = new Map();

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const request = pending.get(message.id);

  if (!request) {
    return;
  }

  pending.delete(message.id);

  if (message.error) {
    request.reject(new Error(JSON.stringify(message.error)));
  } else {
    request.resolve(message.result);
  }
});

const send = (method, params = {}, sessionId = undefined) =>
  new Promise((resolve, reject) => {
    lastId += 1;
    pending.set(lastId, { resolve, reject });
    socket.send(JSON.stringify({ id: lastId, method, params, sessionId }));
  });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });

const { sessionId } = await send('Target.attachToTarget', {
  targetId,
  flatten: true,
});

await send('Page.enable', {}, sessionId);

await send(
  'Emulation.setDeviceMetricsOverride',
  { ...CANVAS, deviceScaleFactor: 1, mobile: false },
  sessionId,
);

try {
  for (const [theme, table] of Object.entries(THEMES)) {
    const dir = join(root, 'public', 'img', theme);
    const page = join(profile, `${theme}.html`);

    writeFileSync(
      page,
      `<style>html,body{margin:0;background:${getPageColor(table)}}</style>` +
        `<img src="${pathToFileURL(join(dir, 'hero-map.svg')).href}" ` +
        `width="${CANVAS.width}" height="${CANVAS.height}" style="display:block">`,
    );

    await send('Page.navigate', { url: pathToFileURL(page).href }, sessionId);

    // Фильтры карты рисуются не мгновенно — ждём, пока кадр устоится
    await sleep(3000);

    const shots = [
      { file: 'hero-map.webp', x: 0, width: CANVAS.width },
      {
        file: 'hero-map-sm.webp',
        x: (CANVAS.width - SMALL_CROP_WIDTH) / 2,
        width: SMALL_CROP_WIDTH,
      },
    ];

    for (const shot of shots) {
      const { data } = await send(
        'Page.captureScreenshot',
        {
          format: 'webp',
          quality: QUALITY,
          clip: {
            x: shot.x,
            y: 0,
            width: shot.width,
            height: CANVAS.height,
            scale: 1,
          },
        },
        sessionId,
      );

      const bytes = Buffer.from(data, 'base64');

      writeFileSync(join(dir, shot.file), bytes);

      console.log(
        `${theme}/${shot.file}: ${shot.width}×${CANVAS.height}, ${Math.round(bytes.length / 1024)} КБ`,
      );
    }
  }
} finally {
  socket.close();
  browser.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
}

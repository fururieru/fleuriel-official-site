import { readFile, readdir, writeFile, mkdir, copyFile, cp, rm, stat } from 'node:fs/promises';
import { dirname, join, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const castDir = join(root, 'content', 'casts');
const output = join(root, 'dist');
const colors = new Set(['blue', 'ice', 'pink', 'mint', 'lilac', 'peach']);
const localFile = async (input, kind) => {
  if (typeof input !== 'string' || !input.trim()) return '';
  const normalized = input.trim().replace(/^\/+/, '');
  const regex = kind === 'image'
    ? /^assets\/casts\/[\w.-]+\.(png|jpg|jpeg|webp)$/i
    : /^assets\/voices\/[\w.-]+\.(mp3|ogg|wav|m4a)$/i;
  if (!regex.test(normalized)) {
    console.warn(`Unsupported ${kind} path: ${input}`);
    return '';
  }
  try { await stat(join(root, normalized)); return normalized; }
  catch { console.warn(`Missing ${kind} file: ${normalized}`); return ''; }
};
const files = (await readdir(castDir)).filter(name => name.endsWith('.json')).sort();
const casts = [];
let people = 0;
for (const file of files) {
  const data = JSON.parse(await readFile(join(castDir, file), 'utf8'));
  if (data.visible === false || !data.name || !(data.maid || data.staff)) continue;
  people++;
  const id = String(data.id || basename(file, '.json'));
  const image = await localFile(data.image, 'image');
  const voice = await localFile(data.voice, 'voice');
  const base = {
    name: String(data.name),
    roman: String(data.roman || ''),
    reading: String(data.reading || data.name),
    color: colors.has(data.color) ? data.color : 'blue',
    image,
    message: String(data.message || '自己紹介は準備中です。'),
    voice,
    x: String(data.x || ''),
  };
  for (const type of ['maid','staff']) {
    if (data[type]) casts.push({ id: `${id}-${type}`, type, ...base });
  }
}
const js = '/* Generated from content/casts/*.json. Do not edit by hand. */\nwindow.FLEURIEL_CASTS = ' + JSON.stringify(casts, null, 2) + ';\n';
await writeFile(join(root, 'casts.js'), js, 'utf8');

// YouTube CM metadata. Pages CMS edits a full URL; the build accepts only real YouTube hosts.
const rawSite = JSON.parse(await readFile(join(root, 'content', 'site.json'), 'utf8'));
const parseYoutubeId = (input) => {
  if (typeof input !== 'string' || !input.trim()) return '';
  try {
    const url = new URL(input.trim());
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:') return '';
    const id = host === 'youtu.be'
      ? url.pathname.split('/')[1]
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)
        ? (url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(shorts|embed|live)\//.test(url.pathname) ? url.pathname.split('/')[2] : '')
        : '';
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : '';
  } catch { return ''; }
};
const youtubeId = parseYoutubeId(rawSite.youtube_url);
if (rawSite.youtube_url && !youtubeId) console.warn('YouTube URL is invalid or not a specific YouTube video URL.');
const youtubeSettings = {
  youtube_enabled: rawSite.youtube_enabled === true && !!youtubeId,
  youtube_title: String(rawSite.youtube_title || 'フルリエル公式CM').slice(0, 100),
  youtube_id: youtubeId,
};
await writeFile(join(root, 'site-settings.js'),
  '/* Generated from content/site.json */\nwindow.FLEURIEL_SITE = ' + JSON.stringify(youtubeSettings).replace(/</g, '\\u003c') + ';\n', 'utf8');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'casts.js', 'youtube.js', 'site-settings.js']) {
  await copyFile(join(root, name), join(output, name));
}
await cp(join(root, 'assets'), join(output, 'assets'), { recursive: true });
console.log(`Built ${casts.length} entries from ${people} people → dist/`);

import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const repoRoot = path.resolve(projectRoot, '..');
const backupsDir = path.join(repoRoot, 'backend', 'backups');
const outputFile = path.join(projectRoot, 'src', 'app', 'data', 'embeddedScrapbook.generated.ts');

function mimeTypeForExtension(ext) {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.mp3':
      return 'audio/mpeg';
    case '.m4a':
      return 'audio/mp4';
    case '.mp4':
      return 'audio/mp4';
    case '.aac':
      return 'audio/aac';
    case '.wav':
      return 'audio/wav';
    case '.webm':
      return 'audio/webm';
    case '.ogg':
      return 'audio/ogg';
    default:
      return 'application/octet-stream';
  }
}

async function findLatestBundle() {
  const entries = await fs.readdir(backupsDir, { withFileTypes: true });
  const bundleDirs = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith('bundle-'));

  if (bundleDirs.length === 0) {
    throw new Error(`No bundle directories found in ${backupsDir}`);
  }

  bundleDirs.sort((left, right) => right.name.localeCompare(left.name));
  return path.join(backupsDir, bundleDirs[0].name);
}

async function toDataUrl(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const ext = path.extname(filePath);
  const mimeType = mimeTypeForExtension(ext);
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

function parseMediaPath(urlString) {
  const url = new URL(urlString);
  const normalizedPath = url.pathname.replace(/^\/+/, '');
  if (!normalizedPath.startsWith('media/')) {
    throw new Error(`Unsupported media URL: ${urlString}`);
  }

  return normalizedPath.split('/').slice(1);
}

async function inlineMilestones(bundleDir) {
  const bundlePath = path.join(bundleDir, 'bundle.json');
  const bundle = JSON.parse(await fs.readFile(bundlePath, 'utf8'));

  for (const milestone of bundle.milestones) {
    for (const photo of milestone.photos ?? []) {
      const mediaPath = parseMediaPath(photo.url);
      photo.url = await toDataUrl(path.join(bundleDir, 'media', ...mediaPath));
    }

    for (const clip of milestone.audioClips ?? []) {
      const mediaPath = parseMediaPath(clip.url);
      clip.url = await toDataUrl(path.join(bundleDir, 'media', ...mediaPath));
    }
  }

  return bundle.milestones;
}

async function main() {
  const bundleDir = await findLatestBundle();
  const milestones = await inlineMilestones(bundleDir);
  const source = `import type { Milestone } from './types';\n\nexport const embeddedMilestones: Milestone[] = ${JSON.stringify(milestones, null, 2)};\n\nexport async function getEmbeddedMilestones(): Promise<Milestone[]> {\n  return embeddedMilestones;\n}\n`;
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, source, 'utf8');
  console.log(`Embedded scrapbook written from ${path.basename(bundleDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
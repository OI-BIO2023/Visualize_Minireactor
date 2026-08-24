import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const source = join(root, 'public', 'logo_biologik.png');
const target = join(root, 'src', 'generated', 'logoData.ts');

const bytes = await readFile(source);
const base64 = bytes.toString('base64');

await mkdir(dirname(target), { recursive: true });
await writeFile(
  target,
  `export const logoDataUri = 'data:image/png;base64,${base64}';\n`,
  'utf8'
);

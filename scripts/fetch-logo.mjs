import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const logoPath = join(root, 'public', 'logo_biologik.png');
const liveDashboardPath = join(root, 'src', 'components', 'LiveDashboard.tsx');

async function main() {
  const [logoBytes, liveDashboardSource] = await Promise.all([
    readFile(logoPath),
    readFile(liveDashboardPath, 'utf8')
  ]);

  const logoDataUri = `data:image/png;base64,${logoBytes.toString('base64')}`;
  const updated = liveDashboardSource.replace(
    /const logoSrc = .*?;/,
    `const logoSrc = '${logoDataUri}';`
  );

  if (updated === liveDashboardSource) {
    throw new Error('Could not find the logo source line in LiveDashboard.tsx');
  }

  await writeFile(liveDashboardPath, updated, 'utf8');
  console.log('Embedded the original logo into LiveDashboard.tsx');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

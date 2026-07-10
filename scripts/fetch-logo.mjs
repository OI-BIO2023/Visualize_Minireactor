import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const logoUrl = 'https://raw.githubusercontent.com/OI-BIO2023/Visualize_Minireactor/main/public/logo_biologik.png';
const outputPath = fileURLToPath(new URL('../public/logo_biologik.png', import.meta.url));

async function main() {
  const response = await fetch(logoUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
  console.log(`Fetched original logo to ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

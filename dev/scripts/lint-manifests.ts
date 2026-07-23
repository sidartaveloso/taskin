import { readdir, readFile } from 'fs/promises';
import path from 'path';

const requiredFields = ['motivation', 'solve', 'scope', 'status'];
const packagesDir = path.resolve(process.cwd(), 'packages');

const checkManifests = async () => {
  console.log('🔍 Checking Taskin package manifests...');
  const packages = await readdir(packagesDir);
  let failed = 0;

  for (const pkg of packages) {
    const manifestPath = path.join(packagesDir, pkg, 'package.json');
    try {
      const content = await readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);
      const missingFields = requiredFields.filter((field) => !manifest[field]);

      if (missingFields.length > 0) {
        console.error(`❌ ${manifest.name} → missing fields: ${missingFields.join(', ')}`);
        failed++;
      } else {
        console.log(`✅ ${manifest.name} → OK`);
      }
    } catch (error) {
      // Ignore if package.json doesn't exist (e.g., .DS_Store)
    }
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} package(s) failed validation.`);
    process.exit(1);
  } else {
    console.log('\n✅ All package manifests are valid.');
  }
};

checkManifests();

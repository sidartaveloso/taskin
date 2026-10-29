import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { encontrarDependenciasLocais } from './dependencias-locais';

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
      const localDependencies = encontrarDependenciasLocais(manifest);

      if (missingFields.length > 0) {
        console.error(`❌ ${manifest.name} → missing fields: ${missingFields.join(', ')}`);
      }
      for (const { campo, nome, versao } of localDependencies) {
        console.error(
          `❌ ${manifest.name} → ${campo}.${nome} points to a local folder (${versao}); it only exists on this machine. Use a published version or workspace:.`,
        );
      }

      if (missingFields.length > 0 || localDependencies.length > 0) {
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

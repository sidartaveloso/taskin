import { LABS_FEATURES, type LabsFeature } from '@opentask/taskin-types';
import { error, info } from '../colors.js';
import { ConfigManager } from '../config-manager.js';

/** O que cada funcionalidade de labs faz, para o `config --show` e para a recusa. */
export const LABS_DESCRIPTIONS: Readonly<Record<LabsFeature, string>> = {
  estimate:
    '`taskin estimate`: Jev and Laya suggest task difficulty, judged by a rinha against the human scores (beta)',
};

export function isLabsFeature(nome: string): nome is LabsFeature {
  return (LABS_FEATURES as readonly string[]).includes(nome);
}

/** A frase de quem tenta usar uma funcionalidade de labs desligada. */
export function labsRefusal(feature: LabsFeature): string {
  return `taskin ${feature} is a labs feature: it is beta, and off until this project turns it on. Enable it with \`taskin config --labs ${feature}\`.`;
}

/**
 * Sai com erro quando a funcionalidade esta desligada no `.taskin.json`. Labs
 * e opt-in por projeto, como no Google Labs: quem nao pediu nao esbarra.
 */
export function requireLabs(feature: LabsFeature, projectRoot: string = process.cwd()): void {
  if (new ConfigManager(projectRoot).isLabsEnabled(feature)) return;
  error(labsRefusal(feature));
  info(LABS_DESCRIPTIONS[feature]);
  process.exit(1);
}

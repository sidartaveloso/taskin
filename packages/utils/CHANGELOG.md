# @opentask/taskin-utils

## 1.1.0

### Minor Changes

- Normalização de acentos em nomes de arquivos (feat)Pacotes afetados: @opentask/taskin-utils, @opentask/taskin-file-system-provider, taskinImplementada função slugify() que remove acentos de títulos ao criar arquivos de tarefasExemplo: "Configuração inicial" → task-001-configuracao-inicial.mdTítulo original com acentos é preservado dentro do arquivo2. Supressão de sons durante testes (fix)Pacote afetado: taskinSons dos comandos start e finish agora são automaticamente suprimidos quando CI=true ou NODE_ENV=testTestes E2E executam mais rápido e sem interferências3. Correção de dependências workspace (fix)Pacotes afetados: @opentask/taskin-git-utils, @opentask/taskin-file-system-provider, @opentask/taskin-task-manager, taskinMudança de ^1.0.5 para workspace:\* nas dependências de @opentask/taskin-typesGarante uso da versão local durante desenvolvimento e resolução correta no publishTipo de release sugerido: minor (nova feature de normalização de acentos)

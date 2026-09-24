# 🧩 Task 108 — o lint do provider de arquivos barra anexo acima do teto configurável e ensina a reduzi-lo

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso

## Description
O diretório de tasks do provider de arquivos guarda também os anexos — as
evidências em `TASKS/assets/` —, e eles vão para o git, que guarda para sempre
o que entra no histórico. Não há limite nenhum. Medido em 2026-09-23:

- no `directus-extension-mapgrid`, a primeira evidência em vídeo da task-010
  (quatro `.webm` e quatro GIFs) somou 16 MB, oito vezes o pack inteiro do
  repositório (2 MiB). Refeita como tira de quadros parados, ficou em ~40 KB
  por arquivo;
- no `geohub`, 20 arquivos de `TASKS/assets` passam de 500 KB e somam 29,3 MB;
  com teto de 300 KB, são 21.

O `taskin lint` passa a reprovar anexo acima de um teto configurável, com uma
lista de exceções versionada para o que já existe, e a **ensinar como reduzir**
o arquivo, com os comandos prontos, conforme o tipo.

## Em que camada — decidido em 2026-09-24

No **provider de arquivos**, não no núcleo do taskin.

- O `lint` já é método do provider (`provider.lint(fix)`); a CLI só imprime as
  `issues`, que têm `suggestion`. A regra nova entra no mesmo lugar em que as
  do formato do arquivo já estão.
- O custo que o teto combate — repositório inchando, histórico que não se
  apaga — só existe porque este provider guarda anexo como arquivo no git. Um
  provider remoto (Redmine, Jira, Directus) guarda anexo no servidor, que tem
  limite e custo próprios; para ele um teto em KB não significaria a mesma
  coisa, e a configuração não teria dono.
- A configuração de provider já mora em `provider.config` do `.taskin.json`,
  declarada no `configSchema` do provider em
  `packages/cli/src/lib/provider-registry/provider-registry.ts` — é onde
  `tasksDir` e `metadataStyle` estão.

O que é genérico, e por isso fica fora do provider: a CLI imprimir uma
`suggestion` de **várias linhas** com o recuo certo, porque a dica traz
comandos.

## O desenho

**Configuração**, em `provider.config` do `.taskin.json`:

```json
{ "provider": { "type": "fs", "config": { "tasksDir": "TASKS", "maxAttachmentKb": 300 } } }
```

Ausente, não há teto — quem atualiza o taskin não passa a reprovar de um dia
para o outro. Presente, arquivo acima dele é **erro**. Vale para todo arquivo
dentro de `tasksDir` que não é task (os `.md` das tasks ficam de fora).

**Exceções**, em `.taskin/.taskin-attachment-exceptions.json`, ao lado de
`.taskin-users.json` e `.taskin-groups.json`:

```json
{
  "exceptions": {
    "assets/task-148-blueprint-ecops.png": {
      "bytes": 2181120,
      "reason": "anterior ao teto de 300 KB (2026-09-23)"
    }
  }
}
```

Caminho relativo a `tasksDir`. A entrada **trava o tamanho** registrado e se
limpa sozinha, como a allowlist de `check-scripts-engolem-falha` do geohub:

- arquivo isento que cresceu além do `bytes` registrado → erro;
- entrada cujo arquivo sumiu, ou que já cabe no teto → erro, pedindo para
  remover a entrada — exceção esquecida cobre o próximo arquivo pesado;
- entrada sem `reason` → erro.

**Dica por tipo**, na `suggestion` do erro, sempre com o comando:

- imagem (`png`, `jpg`, `jpeg`, `webp`): recortar a área que importa; reduzir
  a resolução (`ffmpeg -i in.png -vf scale=1280:-1 out.png`); reduzir a paleta
  (`palettegen`/`paletteuse`, mantém o nome e o formato — foi o que levou a
  captura da task-008 do mapgrid de 316 KB a 132 KB). Se o uso é só
  demonstrativo e a fidelidade não precisa ser mantida, converter para JPEG ou
  WebP com qualidade 70 — avisando que muda a extensão, e portanto o link no
  `.md`;
- vídeo (`webm`, `mp4`, `mov`, `mkv`) e GIF: menos quadros por segundo
  (`fps=6`), menos largura, cortar início e fim — e, antes de tudo, considerar a
  tira de quadros parados (`select` + `tile`), que é como a evidência de
  movimento cabe no teto;
- PDF e o resto: dica genérica de comprimir, ou de guardar fora do repositório
  e linkar.

Os comandos usam o `ffmpeg`, que cobre imagem e vídeo, roda em macOS e Linux e
dispensa uma ferramenta por formato.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] TDD: teste de aceitação no provider — anexo acima do teto reprova o lint,
      abaixo passa, sem `maxAttachmentKb` não há checagem
- [ ] TDD: `maxAttachmentKb` declarado no `configSchema` do `fs` e repassado
      pela `buildFileSystemProvider` ao provider
- [ ] TDD: as exceções — travam o tamanho, reprovam entrada órfã, que já cabe
      ou sem motivo
- [ ] TDD: a dica por tipo (imagem, vídeo/GIF, outro), com os comandos
- [ ] TDD: a CLI imprime `suggestion` de várias linhas com recuo em cada linha
- [ ] Documentar a opção e o arquivo de exceções no README do provider
- [ ] Adoção: geohub com `maxAttachmentKb: 300` e as 21 exceções; mapgrid com
      o teto, removendo o `scripts/tamanho-de-evidencia/` que antecipou a regra

## Notes
- O teto de 300 KB é decisão de Sidarta (2026-09-23), depois dos 16 MB da
  evidência em vídeo do mapgrid.
- A regra já existe provisoriamente como teste do mapgrid,
  `scripts/tamanho-de-evidencia/` na branch `feat/task-010-centralizador-de-mapa`;
  as provas negativas dele são ponto de partida para as daqui.
- `taskin new -u sidartaveloso` escreveu o nome de exibição no `Assignee:`, o
  bug já registrado em task própria; corrigido à mão para o id.

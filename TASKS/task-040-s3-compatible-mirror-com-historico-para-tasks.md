# Task 040 — S3-compatible mirror com historico para TASKS

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description

Espelhar TASKS/ em MinIO/AWS S3/R2 com writer/reader keys separadas, cache local, import remoto e historico; complementa o autoSync git da task-019. Referencia: task-033.

## Tasks

- [ ] Fluxo NVIDIA-style local-first espelhado do localstudio: storage local primario, bucket S3
      opcional (MinIO/AWS/R2), bucket staging p/ old versions e "version root" (s3/gitlab ds)
- [ ] Comando/servico "Mirror Now" (push de TASKS/ + assets da task-036) e "Import Remote"
      (sink remoto -> local) com historico de versoes
- [ ] Keys separadas: writer/reader (writer somente no servidor/CI; reader publico no dashboard)
- [ ] Suporte a lord cloud (S3-compatible) e fallback c/ autoSync git (task-019) como opcao sem nuvem
- [ ] Testes: mirror round-trip, historico/restore de versao e casos de conflito local vs remoto

## Notes

- Referencia: task-033 item "S3-compatible mirror com historico"; LocalStudio docs/ARCHITECTURE.md
  (local-first storage + S3 mirrors); localstudio sync (fs access + s3 mirror)
- Independe de 035-038 (ajuda na distribuicao dos assets de capa quando existirem)
- Criterio de aceite: time sem git consegue compartilhar TASKS/ via bucket com historico e
  restaurar versoes pelo CLI

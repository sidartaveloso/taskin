# 🧩 Task 213 — Consciência situacional: o taskin conhece os recursos à disposição e as restrições

- Status: in-progress
- Type: docs
- Assignee: sidartaveloso

## Description
RDT que define percepção, compreensão e projeção no taskin, os papéis de um recurso, o requisito no lugar do nome da máquina e a ordem das etapas

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `docs/RDT/consciencia-situacional.md` com os três níveis de Endsley aplicados ao taskin, os papéis de um recurso (onde, quem, com o quê, avisar, perceber) e o requisito no lugar do nome da máquina — evidência: seções "Os três níveis no taskin", "Recurso é qualquer coisa que pesa no como, com papéis" e "A task declara requisitos, não lugares" do RDT
- [x] O inventário em duas camadas, a do repositório (versionada, só nomes lógicos, capacidades e restrições) e a da pessoa (fora do repositório), com as três regras da soma: o repositório oferece e o acesso é de cada pessoa; recurso pessoal só entra no repositório que a pessoa liberou; a restrição do repositório vence — evidência: seção "O inventário tem duas camadas" do RDT
- [x] Regra de privacidade escrita no RDT: a camada da pessoa nunca entra no repositório, a do repositório não leva endereço nem credencial, e as tasks falam só de requisitos — evidência: seção "O que pode ser versionado" do RDT
- [x] Vocabulário, etapas (percepção declarada, requisitos nas tasks, percepção viva, canais por presença, projeção) e decisões em aberto no RDT — evidência: seções "Vocabulário", "Etapas" e "Decisões em aberto" do RDT
- [x] Nota na task-195 apontando para o RDT — evidência: `## Notes` da task-195, commit `d97461e`
- [x] Busca no RDT e nesta task pelos nomes do inventário real sem resultado — evidência: `grep -niE` pelos nomes de máquina, rede, hardware e projetos pessoais nos dois arquivos, sem nenhuma linha
- [x] RDT aprovado pelo usuário em 2026-10-29 — evidência: `- Status: aprovada` no cabeçalho do RDT
- [x] `pnpm taskin lint` verde — evidência: "All task files are valid!"

## Notes
Só documento: nenhuma etapa vira task de implementação antes de as decisões em aberto do RDT serem respondidas.

### Onde executar
Em conversa com o usuário: é decisão de produto. Não é task para o sandcastle.

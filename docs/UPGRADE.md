# Guia de upgrade

## `taskin@3.x` → `taskin@4.0.0`: o registro de usuários muda de lugar

A partir do `taskin@4.0.0` (`@opentask/taskin-file-system-provider@3.1.0`) o registro de usuários
é lido de **`.taskin/.taskin-users.json`**. Até o `taskin@3.x` ele vivia na raiz do projeto, em
`.taskin-users.json`, onde a 4.x não lê nada — todo assignee fica sem resolver até a migração.

A migração é do `taskin lint --fix`, e termina num commit. Esse commit é o passo que importa.

### Só existe o arquivo da raiz

```bash
taskin lint --fix        # git mv .taskin-users.json .taskin/.taskin-users.json
git commit -m "chore: registro de usuarios em .taskin/"
```

O `git mv` só acontece com arquivo versionado. Arquivo fora do Git — ou projeto sem Git — é movido
por rename comum, e o `taskin lint` passa a avisar que o registro não está versionado.

### Existem os dois (a raiz e `.taskin/`)

O de `.taskin/` é a fonte de verdade e não é tocado. O da raiz sai como
`.taskin/.taskin-users.legacy.json`, para comparação à mão, e **fica fora do índice**: é uma cópia
de trabalho, destinada a ser apagada. O que vai para o índice é a remoção do arquivo da raiz
**junto com** a adição do `.taskin/.taskin-users.json`.

```bash
taskin lint --fix
git status --short
# D  .taskin-users.json
# A  .taskin/.taskin-users.json
# ?? .taskin/.taskin-users.legacy.json

# copie para .taskin/.taskin-users.json quem só existe no estacionado, e então:
rm .taskin/.taskin-users.legacy.json
git add .taskin/.taskin-users.json
git commit -m "chore: registro de usuarios em .taskin/"
```

Se o `.taskin/.taskin-users.json` já estava versionado, ele não aparece como `A` — já tem o próprio
histórico. Se o `.gitignore` o exclui, o `--fix` respeita e não o adiciona; o registro é dado de
time, então vale rever essa regra.

### Por que a remoção e a adição precisam cair no mesmo commit

O Git não grava renomeação. `git mv` é só `mv` + `git rm` + `git add`; o rename é **inferido na
hora do diff**, por similaridade entre um arquivo removido e um adicionado **no mesmo commit**. Em
commits separados, nada liga o registro novo ao antigo.

E mesmo no mesmo commit a similaridade costuma ficar abaixo do limiar padrão de 50%: o arquivo da
raiz tem, em geral, só o usuário sintético que o `initialize()` antigo semeava, enquanto o
canônico já tem o time todo. Numa migração real ficou em 15%. Para seguir o histórico nesse caso,
baixe o limiar:

```bash
git log --follow -M15% -- .taskin/.taskin-users.json
```

### Conferindo

```bash
taskin lint              # sem avisos sobre o registro de usuários
git ls-files .taskin/.taskin-users.json   # imprime o caminho: está versionado
```

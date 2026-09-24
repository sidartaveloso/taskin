import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  type DeleteGroupOptions,
  type DeleteGroupResult,
  type IGroupRegistry,
  validarAninhamento,
} from '@opentask/taskin-task-manager';
import { type Group, type GroupId, GroupSchema } from '@opentask/taskin-types';

/** O que o arquivo guarda. */
interface Arquivo {
  groups: Record<string, Group>;
}

/**
 * Como o provider de arquivos guarda os grupos.
 *
 * Num arquivo proprio, `<taskinDir>/.taskin-groups.json`, ao lado do registro de
 * usuarios — e **nao** dentro de cada tarefa.
 *
 * A objecao natural e que a tarefa deixa de ser autocontida. Ela ja nao era: o
 * registro de usuarios vive separado desde sempre e ninguem considera isso
 * violacao. O que o registro de usuarios ensina de errado, e que aqui nao se
 * repete, e gravar o **nome de exibicao** dentro da tarefa: `Assignee: Sidarta
 * Veloso` em vez do id custou 52 avisos de lint num repositorio consumidor e um
 * comando de CLI inteiro para limpar. A tarefa guarda `Group: <id>`, e so.
 */
export class FileSystemGroupRegistry implements IGroupRegistry {
  /** Onde o registro mora — o `lint` aponta para ele. */
  readonly caminho: string;

  /**
   * @param taskinDir - O diretorio `.taskin` do projeto
   * @param reatribuir - Como mover os membros de um grupo. Recebe o grupo que
   *   sai e para onde os membros vao (`undefined` = ficam sem grupo), e devolve
   *   quantos foram afetados. Injetado em vez de embutido porque quem sabe
   *   mexer em tarefa e o provider, nao o registro.
   */
  constructor(
    taskinDir: string,
    private readonly reatribuir: (de: GroupId, para: GroupId | undefined) => Promise<number>,
  ) {
    this.caminho = path.join(taskinDir, '.taskin-groups.json');
  }

  private async ler(): Promise<Arquivo> {
    try {
      const bruto = await fs.readFile(this.caminho, 'utf-8');
      const { groups } = JSON.parse(bruto) as Partial<Arquivo>;
      return { groups: groups ?? {} };
    } catch {
      // Sem arquivo ainda, ou ilegivel: um projeto sem grupo nenhum.
      return { groups: {} };
    }
  }

  private async gravar(arquivo: Arquivo): Promise<void> {
    await fs.mkdir(path.dirname(this.caminho), { recursive: true });
    await fs.writeFile(this.caminho, `${JSON.stringify(arquivo, null, 2)}\n`, 'utf-8');
  }

  async listGroups(): Promise<Group[]> {
    const { groups } = await this.ler();
    return Object.values(groups);
  }

  async findGroup(id: GroupId): Promise<Group | undefined> {
    const { groups } = await this.ler();
    return groups[id];
  }

  async createGroup(group: Group): Promise<void> {
    const validado = GroupSchema.parse(group);
    const arquivo = await this.ler();

    if (arquivo.groups[validado.id]) {
      throw new Error(`Group '${validado.id}' already exists.`);
    }
    if (validado.parentId !== undefined) {
      validarAninhamento(Object.values(arquivo.groups), validado.id, validado.parentId);
    }

    arquivo.groups[validado.id] = validado;
    await this.gravar(arquivo);
  }

  async renameGroup(id: GroupId, name: string): Promise<void> {
    const arquivo = await this.ler();
    const atual = arquivo.groups[id];

    if (!atual) throw new Error(`Group '${id}' not found.`);

    /*
     * A escrita e **uma**, e nenhuma tarefa e tocada. Era esse o ponto de tirar
     * o nome de dentro da tarefa: antes, renomear um grupo de quatro membros
     * eram quatro gravacoes, sem transacao, e um erro no meio deixava o grupo
     * com dois nomes.
     */
    arquivo.groups[id] = GroupSchema.parse({ ...atual, name });
    await this.gravar(arquivo);
  }

  /**
   * Grupo dentro de grupo (task-119). O pai mora no proprio grupo, como
   * `parentId` no `.taskin-groups.json`; nenhuma tarefa e tocada, porque a
   * tarefa continua guardando so o grupo mais interno.
   */
  async setParent(id: GroupId, parentId: GroupId | undefined): Promise<void> {
    const arquivo = await this.ler();
    const atual = arquivo.groups[id];
    if (!atual) throw new Error(`Group '${id}' not found.`);

    const { parentId: _anterior, ...semPai } = atual;
    if (parentId === undefined) {
      arquivo.groups[id] = semPai;
    } else {
      validarAninhamento(Object.values(arquivo.groups), id, parentId);
      arquivo.groups[id] = { ...semPai, parentId };
    }
    await this.gravar(arquivo);
  }

  async deleteGroup(id: GroupId, options: DeleteGroupOptions = {}): Promise<DeleteGroupResult> {
    const arquivo = await this.ler();
    const apagado = arquivo.groups[id];
    if (!apagado) throw new Error(`Group '${id}' not found.`);

    if (options.reassignTo !== undefined && !arquivo.groups[options.reassignTo]) {
      throw new Error(`Group '${options.reassignTo}' not found — nothing was deleted.`);
    }

    /*
     * Os membros primeiro, o grupo depois: se a reatribuicao falhar, o grupo
     * continua existindo e ninguem fica apontando para o vazio.
     */
    const reassigned = await this.reatribuir(id, options.reassignTo);

    /*
     * Os subgrupos sobem para o pai do apagado, ou para a raiz — a mesma regra
     * de nao deixar ninguem apontando para o vazio.
     */
    for (const [filhoId, filho] of Object.entries(arquivo.groups)) {
      if (filho.parentId !== id) continue;
      const { parentId: _apagado, ...semPai } = filho;
      arquivo.groups[filhoId] = apagado.parentId === undefined ? semPai : { ...semPai, parentId: apagado.parentId };
    }

    delete arquivo.groups[id];
    await this.gravar(arquivo);

    return { reassigned };
  }
}

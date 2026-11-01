# @opentask/taskin-situation

Situational awareness for Taskin: which resources are at hand (machines, LLM
accesses, people, channels), against what limits, and how each task should run.

> Experimental. The design lives in
> [`docs/RDT/consciencia-situacional.md`](../../docs/RDT/consciencia-situacional.md).

## Layout

The package follows "contract before code", in two levels:

| Folder | What |
| --- | --- |
| `src/use-cases/` | Level 1: actors, typestate flows, ports, scenarios and the contract suite of the use cases |
| `src/system/` | Level 2: `ISituation`, the plugins and their events in envelopes, one contract suite per plugin |
| `src/memory/` | The in-memory implementation of every plugin, green against all suites |
| `src/simulated/` | Simulated LLM providers with fake windows and limits |
| `src/local/` | Local implementations: the inventory in files, this machine's probe, the run ledger, the `env:` secret store |
| `src/report/` | The situation board as data, drawn as text, JSON, HTML or Markdown |

## Use

```ts
import { createMemorySituation } from '@opentask/taskin-situation';
```

The `taskin status` command of the CLI reads the local implementations.

## Testing your own implementation

The contract suites ship in the `./testing` subpath and need `vitest`:

```ts
import { describeSituationContract } from '@opentask/taskin-situation/testing';

describeSituationContract('my implementation', createMySituationActors);
```

An implementation passes only by running every suite unchanged.

## License

MIT

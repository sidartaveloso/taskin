# @opentask/taskin-difficulty-estimator

Suggests how hard a task is (1 to 5, the scale of `TaskSchema.difficulty`) by
asking two System One decision models, and runs a rinha against the tasks a
human already scored to tell which one to trust.

- **Jev** (TypeSafe, hosted) and **Laya** (ConvAI Innovations, local through
  `laya-serve`) speak the same `POST /v1/systemone` protocol. One
  `SystemOneProvider` covers both.
- **layerall** (`@layerall/core`) sits in front: one `fan_out` call per task
  brings both answers. The Router never merges them; deciding is the caller's.
- **rinhany** (`@rinhany/core`) runs the rinha: Jev, Laya, their calibrated
  versions and two baselines (`always-2` and `heuristic`) against the human
  scores. The score stays with the runner; a competitor only ever sees the task
  without it.
- **Calibration** (`QuantileCalibration`) reads a model's continuous `score` by
  position against the scores it gave the tasks a human scored, and answers the
  human score at the same position. In the rinha each task is calibrated on the
  others only (leave-one-out).

The question is one `score` with five levels. `DIFFICULTY_QUESTION_VERSION`
goes into the cache key: an answer to another version of the question never
comes back as an answer to this one.

## Use

```ts
import {
  answerKeyFrom,
  DifficultyBenchmark,
  EstimatorRouter,
  resolveEstimators,
  RinhaStoreFs,
} from '@opentask/taskin-difficulty-estimator';

const store = new RinhaStoreFs('.taskin/rinhas');
const router = new EstimatorRouter(resolveEstimators(process.env), store);
await router.probe(); // Laya down → unavailable, with the reason

const scoreboard = await new DifficultyBenchmark(router).run(answerKeyFrom(tasks));
scoreboard.bestModel; // { source: 'jev-calibrated', byWalkover: false, beatsBaselines: true }
```

The CLI exposes it as `taskin estimate` (see the `taskin` README).

## Environment

| Variable | Default | |
|---|---|---|
| `TYPESAFE_API_KEY` | — | Without it Jev does not run, and the rinha says why |
| `JEV_URL` / `JEV_MODEL` | `https://api.typesafe.ai` / `jev-latest` | |
| `LAYA_URL` | `http://localhost:8000` | `uvx --from "laya[serve]" laya-serve` |
| `LAYA_MODEL` | none (laya-serve routes by language) | `english`, `multilingual` |
| `LAYA_MAX_LEN` | `2048` | token budget sent to laya-serve |

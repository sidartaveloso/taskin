import { rinhaStoreContract } from './rinha-store.contract';
import { RinhaStoreMemory } from './rinha-store.memory';

rinhaStoreContract(() => new RinhaStoreMemory());

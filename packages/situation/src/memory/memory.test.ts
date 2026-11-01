import { describeAccessBrokerContract } from '../system/plugins/access-broker/access-broker.contract';
import { describeChannelsContract } from '../system/plugins/channels/channels.contract';
import { describeFlowsContract } from '../system/plugins/flows/flows.contract';
import { describeInventoryContract } from '../system/plugins/inventory/inventory.contract';
import { describePeopleContract } from '../system/plugins/people/people.contract';
import { describeProbeContract } from '../system/plugins/probe/probe.contract';
import { describeRunLedgerContract } from '../system/plugins/run-ledger/run-ledger.contract';
import { describeSchedulerContract } from '../system/plugins/scheduler/scheduler.contract';
import { describeSystemContract } from '../system/situation.contract';
import type { DemoEvents } from '../system/system.fake-ports';
import { describeSituationContract } from '../use-cases/situation.contract';
import { createMemoryAccessBroker } from './access-broker.memory';
import { createMemoryChannels } from './channels.memory';
import { createMemoryFlows } from './flows.memory';
import { createMemoryInventory } from './inventory.memory';
import { createMemoryPeople } from './people.memory';
import { createMemoryProbe } from './probe.memory';
import { createMemoryRunLedger } from './run-ledger.memory';
import { createMemoryScheduler } from './scheduler.memory';
import { createMemorySituation, createMemorySituationActors } from './situation.memory';

/** As suites de quem especificou, sem caso editado, contra a implementacao em memoria. */

describeSituationContract('em memoria', createMemorySituationActors);

describeInventoryContract('inventory em memoria', createMemoryInventory);
describeProbeContract('probe em memoria', createMemoryProbe);
describeAccessBrokerContract('access-broker em memoria', createMemoryAccessBroker);
describeRunLedgerContract('run-ledger em memoria', createMemoryRunLedger);
describeSchedulerContract('scheduler em memoria', createMemoryScheduler);
describeChannelsContract('channels em memoria', createMemoryChannels);
describePeopleContract('people em memoria', createMemoryPeople);
describeFlowsContract('flows em memoria', createMemoryFlows<DemoEvents>);

describeSystemContract('em memoria', createMemorySituation);

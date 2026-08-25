import { runPublicConsumerProbe } from "./effect-consumer-probe";

console.log(JSON.stringify(await runPublicConsumerProbe(), null, 2));

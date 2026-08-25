import { runPublicConsumerProbe } from "./effect-consumer-probe-r2";

console.log(JSON.stringify(await runPublicConsumerProbe(), null, 2));

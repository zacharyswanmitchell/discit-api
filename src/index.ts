import Config from "./helpers/config";
import cluster from "cluster";

import app from "./services/server";

(async () => {
	const cpus = Config.IS_PROD ? Config.CORES : 1;
	if (cluster.isPrimary) {
		for (let i = 0; i < cpus; i++) {
			cluster.fork();
		}
	}
	else await app.start();
})();
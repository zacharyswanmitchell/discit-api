import express, { Request, Response, NextFunction } from "express";

//import { fetchDiscs } from "../db/populate";
import Config from "../helpers/config";
//import { Disc } from "../models/Disc";
//import Cron from "../services/cron";
import { Database } from "../services/db";
import log from "../services/log";
import router from "../controllers";

export default class App {
	private static instance = express();

	private static async setup() {
		App.instance.use((req: Request, res: Response, next: NextFunction) => {
			res.locals.em = Database.Manager.fork();
			next();
		});

		App.instance.use("/", router);
	}

	public static async start() {
		try {
			console.log("Connecting to database...");
			await Database.Connect();

			console.log("Setting up app...");
			await App.setup();

			App.instance.listen(Config.PORT);
			log.info(`Listening on http://${Config.HOST}:${Config.PORT}`);

			// const manager = Database.Manager.fork().getRepository(Disc);
			// const cron = new Cron(manager);
			// cron.autoDiscMaintenance.start();

			// await fetchDiscs(manager);

		} catch (error) {
			console.log(error);
			log.error(error);
			process.exit(1);
		}
	}
}
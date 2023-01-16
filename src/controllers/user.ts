import { NextFunction, Request, Response, Router } from "express";

import Jwt from "../helpers/jwt";
import { Password } from "../helpers/password";
import { newId, validateEmail } from "../helpers/util";
import { validate } from "../middleware/jwt";
import { User } from "../models/user";
import { IResponse, IUser } from "../types/abstract";
import { Routes } from "../types/constants";

const userRouter = Router();

userRouter.post(Routes.register, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { username, email, password } = req.body as IUser;

		if (username.length < 3) {
			throw "Username must be at least 3 characters.";
		} else if (username.length > 16) {
			throw "Username must be no more than 16 characters.";
		}
		if (password.length < 8) throw "Password must be at least 8 characters.";
		if (!validateEmail(email)) throw "Invalid email format.";

		const [usernameExists, emailExists] = await Promise.all([User._exists({ username }), User._exists({ email })]);
		if (usernameExists && emailExists) throw "Username and email already taken.";
		if (usernameExists) throw "Username already taken.";
		if (emailExists) throw "Email already taken.";

		const user = await User._createOrUpdate({
			id: newId(),
			username,
			email,
			password: await Password.hash(password)
		});

		const token = await Jwt.SignUser({
			id: user.id,
			email: user.email,
			username: user.username
		});

		return res.status(200).send({
			ok: true,
			status: 200,
			data: { token }
		} as IResponse<{ token: string }>);
	} catch (error) {
		next(error);
	}
});

userRouter.post(Routes.login, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { username, password } = req.body as IUser;
		const user = await User._findOne({ username });
		if (!user) throw "Invalid username.";

		const passwordMatch = await Password.compare(password, user.password);
		if (!passwordMatch) throw "Invalid password.";

		const token = await Jwt.SignUser({
			id: user.id,
			email: user.email,
			username: user.username
		});

		return res.status(200).send({
			ok: true,
			status: 200,
			data: { token }
		} as IResponse<{ token: string }>);
	} catch (error) {
		next(error);
	}
});

userRouter.post(Routes.validate, validate, async (_req: Request, res: Response, next: NextFunction) => {
	try {
		return res.status(200).send({
			ok: true,
			status: 200,
			data: res.locals.jwt
		} as IResponse);
	} catch (error) {
		next(error);
	}
});

export default userRouter;
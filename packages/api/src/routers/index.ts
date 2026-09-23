import { protectedProcedure, publicProcedure, router } from "../index";
import { avatarsRouter } from "./avatars";
import { doorsRouter } from "./doors";
import { friendsRouter } from "./friends";
import { leaderboardRouter } from "./leaderboard";
import { pointsRouter } from "./points";
import { purchasesRouter } from "./purchases";
import { ringsRouter } from "./rings";
import { usersRouter } from "./users";

export const appRouter = router({
	avatars: avatarsRouter,
	doors: doorsRouter,
	friends: friendsRouter,
	healthCheck: publicProcedure.query(() => "OK"),
	leaderboard: leaderboardRouter,
	points: pointsRouter,
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	purchases: purchasesRouter,
	rings: ringsRouter,
	users: usersRouter,
});
export type AppRouter = typeof appRouter;

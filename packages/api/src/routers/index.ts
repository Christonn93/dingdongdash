import { protectedProcedure, publicProcedure, router } from "../index";
import { friendsRouter } from "./friends";
import { leaderboardRouter } from "./leaderboard";
import { pointsRouter } from "./points";
import { purchasesRouter } from "./purchases";
import { ringsRouter } from "./rings";
import { usersRouter } from "./users";

export const appRouter = router({
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

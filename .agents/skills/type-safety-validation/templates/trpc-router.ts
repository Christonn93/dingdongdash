/**
 * tRPC Router Template
 *
 * Production-ready tRPC router with authentication, validation, and error handling.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { z } from "zod";

// ====================
// Context Definition
// ====================

export interface Context {
	// db: PrismaClient
	// redis: Redis
	req: Request;
	sessionId?: string;
	userId?: string;
}

export async function createContext(
	opts: CreateNextContextOptions,
): Promise<Context> {
	// Extract auth token
	const token = opts.req.headers.get("authorization")?.replace("Bearer ", "");

	// Verify token and get user ID
	const userId = token ? await verifyJWT(token) : undefined;
	const sessionId = token ? await getSessionId(token) : undefined;

	return {
		req: opts.req,
		sessionId,
		userId,
	};
}

// ====================
// tRPC Initialization
// ====================

const t = initTRPC.context<Context>().create({
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof z.ZodError ? error.cause.flatten() : null,
			},
		};
	},
	transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// ====================
// Middleware
// ====================

// Authentication middleware
const enforceAuth = middleware(async ({ ctx, next }) => {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in",
		});
	}

	return next({
		ctx: {
			...ctx,
			userId: ctx.userId, // Now guaranteed non-null
		},
	});
});

// Rate limiting middleware
const rateLimit = (limit: number, windowMs: number) =>
	middleware(async ({ ctx, next, path }) => {
		const key = `ratelimit:${ctx.userId || "anon"}:${path}`;

		// Implement rate limiting logic
		// const count = await redis.incr(key)
		// if (count === 1) await redis.expire(key, windowMs / 1000)
		// if (count > limit) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' })

		return next();
	});

// Logging middleware
const logger = middleware(async ({ ctx, next, path, type }) => {
	const start = Date.now();

	console.log(`→ ${type} ${path}`, {
		sessionId: ctx.sessionId,
		userId: ctx.userId,
	});

	const result = await next();

	const duration = Date.now() - start;
	console.log(`← ${type} ${path} - ${duration}ms`);

	return result;
});

// ====================
// Procedures
// ====================

export const protectedProcedure = publicProcedure.use(logger).use(enforceAuth);

export const rateLimitedProcedure = publicProcedure
	.use(logger)
	.use(rateLimit(100, 60_000)); // 100 requests per minute

export const adminProcedure = protectedProcedure.use(
	middleware(async ({ ctx, next }) => {
		// Check if user is admin
		// const user = await db.user.findUnique({ where: { id: ctx.userId } })
		// if (user?.role !== 'admin') {
		//   throw new TRPCError({ code: 'FORBIDDEN' })
		// }
		return next();
	}),
);

// ====================
// Example Router: Posts
// ====================

const PostInputSchema = z.object({
	content: z.string().min(1),
	published: z.boolean().default(false),
	tags: z.array(z.string()).max(10).default([]),
	title: z.string().min(1).max(200),
});

export const postRouter = router({
	// Get single post by ID
	byId: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			// const post = await db.post.findUnique({
			//   where: { id: input.id },
			//   include: { author: true, comments: true },
			// })

			const post = null;

			if (!post) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Post with ID ${input.id} not found`,
				});
			}

			return post;
		}),

	// Get multiple posts by IDs (batching example)
	byIds: publicProcedure
		.input(
			z.object({
				ids: z.array(z.string()).min(1).max(100),
			}),
		)
		.query(async ({ input }) => {
			// const posts = await db.post.findMany({
			//   where: { id: { in: input.ids } },
			// })

			return [];
		}),

	// Create post (protected)
	create: protectedProcedure
		.input(PostInputSchema)
		.mutation(async ({ ctx, input }) => {
			// Create post in database
			// const post = await db.post.create({
			//   data: {
			//     ...input,
			//     authorId: ctx.userId,
			//   },
			// })

			const post = { id: "mock-id", ...input, authorId: ctx.userId };

			return post;
		}),

	// Delete post (protected)
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Check ownership
			// const post = await db.post.findUnique({
			//   where: { id: input.id },
			// })

			const post = null;

			if (!post) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			// if (post.authorId !== ctx.userId) {
			//   throw new TRPCError({ code: 'FORBIDDEN' })
			// }

			// Delete post
			// await db.post.delete({ where: { id: input.id } })

			return { success: true };
		}),

	// Infinite query variant
	infinite: publicProcedure
		.input(
			z.object({
				cursor: z.string().optional(),
				limit: z.number().min(1).max(50).default(10),
			}),
		)
		.query(async ({ input }) => {
			// Same as list, but optimized for infinite scroll
			const posts: any[] = [];

			return {
				items: posts,
				nextCursor: posts.length > 0 ? posts[posts.length - 1].id : undefined,
			};
		}),
	// List posts with cursor pagination
	list: publicProcedure
		.input(
			z.object({
				authorId: z.string().optional(),
				cursor: z.string().optional(),
				limit: z.number().min(1).max(100).default(10),
				published: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Fetch posts from database
			// const posts = await db.post.findMany({
			//   take: input.limit + 1,
			//   cursor: input.cursor ? { id: input.cursor } : undefined,
			//   where: {
			//     published: input.published,
			//     authorId: input.authorId,
			//   },
			//   orderBy: { createdAt: 'desc' },
			//   include: { author: true },
			// })

			// Mock data
			const posts: any[] = [];

			let nextCursor: string | undefined;
			if (posts.length > input.limit) {
				const nextItem = posts.pop();
				nextCursor = nextItem!.id;
			}

			return {
				items: posts,
				nextCursor,
			};
		}),

	// Publish/unpublish post
	publish: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				published: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ownership and update
			// const post = await db.post.update({
			//   where: {
			//     id: input.id,
			//     authorId: ctx.userId, // Only author can publish
			//   },
			//   data: { published: input.published },
			// })

			return { success: true };
		}),

	// Update post (protected)
	update: protectedProcedure
		.input(
			z.object({
				data: PostInputSchema.partial(),
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ownership
			// const existing = await db.post.findUnique({
			//   where: { id: input.id },
			// })

			const existing = null;

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Post not found",
				});
			}

			// if (existing.authorId !== ctx.userId) {
			//   throw new TRPCError({
			//     code: 'FORBIDDEN',
			//     message: 'You can only edit your own posts',
			//   })
			// }

			// Update post
			// const updated = await db.post.update({
			//   where: { id: input.id },
			//   data: input.data,
			// })

			return existing;
		}),
});

// ====================
// Example Router: Users
// ====================

export const userRouter = router({
	// Get user by ID (public profile)
	byId: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			// const user = await db.user.findUnique({
			//   where: { id: input.id },
			//   select: {
			//     id: true,
			//     name: true,
			//     bio: true,
			//     avatar: true,
			//   },
			// })

			return null;
		}),
	// Get current user
	me: protectedProcedure.query(async ({ ctx }) => {
		// const user = await db.user.findUnique({
		//   where: { id: ctx.userId },
		//   select: {
		//     id: true,
		//     email: true,
		//     name: true,
		//     role: true,
		//   },
		// })

		return null;
	}),

	// Update current user
	update: protectedProcedure
		.input(
			z.object({
				bio: z.string().max(500).optional(),
				name: z.string().min(1).max(100).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// const updated = await db.user.update({
			//   where: { id: ctx.userId },
			//   data: input,
			// })

			return { success: true };
		}),
});

// ====================
// Root Router
// ====================

export const appRouter = router({
	// Health check
	health: publicProcedure.query(() => ({
		status: "ok",
		timestamp: new Date(),
	})),
	post: postRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;

// ====================
// Helper Functions
// ====================

async function verifyJWT(token: string): Promise<string | undefined> {}

async function getSessionId(token: string): Promise<string | undefined> {}

// ====================
// Server-Side Caller
// ====================

export const createCaller = t.createCallerFactory(appRouter);

// Usage in server components:
// const caller = createCaller(await createContext(...))
// const posts = await caller.post.list({ limit: 10 })

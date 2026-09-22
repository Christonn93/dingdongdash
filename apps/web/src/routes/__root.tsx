import { Toaster } from "@dingdongdash/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "@/components/header";
import { PageTransition } from "@/components/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
	queryClient: QueryClient;
	trpc: typeof trpc;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "DingDongDitch — Ring the doorbell. Beat the clock.",
			},
			{
				name: "description",
				content:
					"Ring a friend and see if they answer the door in time. Catch them, or they ditch you.",
			},
			{
				name: "theme-color",
				content: "#f0563d",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.svg",
				type: "image/svg+xml",
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest",
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png",
			},
		],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="light"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<Shell />
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
		</>
	);
}

function Shell() {
	const isImmersive = useRouterState({
		select: (state) => state.location.pathname === "/",
	});

	if (isImmersive) {
		return (
			<PageTransition>
				<Outlet />
			</PageTransition>
		);
	}

	return (
		<div className="grid h-svh grid-rows-[auto_1fr]">
			<Header />
			<PageTransition>
				<Outlet />
			</PageTransition>
		</div>
	);
}

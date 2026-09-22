import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthPanel } from "@/components/auth-panel";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-10">
			<div
				aria-hidden="true"
				className="absolute inset-0 -z-10"
				style={{
					background:
						"linear-gradient(180deg, #171233 0%, #2b2350 55%, #6b4059 100%)",
				}}
			/>
			<div
				aria-hidden="true"
				className="absolute top-[10%] right-[12%] -z-10 h-16 w-16 rounded-full bg-amber-50 opacity-90 shadow-[0_0_40px_16px_rgba(255,236,179,0.3)]"
			/>
			<div
				aria-hidden="true"
				className="absolute inset-0 -z-10"
				style={{
					background:
						"radial-gradient(circle at 50% 120%, rgba(255,190,120,0.25), transparent 60%)",
				}}
			/>

			<AuthPanel />

			<Link
				className="mt-6 rounded-full px-3 py-1.5 text-amber-100/70 text-sm underline-offset-4 transition-colors hover:text-amber-50 hover:underline"
				to="/"
			>
				← Back to the door
			</Link>
		</div>
	);
}

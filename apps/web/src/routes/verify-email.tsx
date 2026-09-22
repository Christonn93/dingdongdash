import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Reveal } from "@/components/reveal";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-email")({
	component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
	const { data: session } = authClient.useSession();
	const verified = Boolean(session?.user?.emailVerified);

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
			<Reveal>
				<Card className="w-[min(92vw,26rem)] border-none bg-background/95 shadow-2xl backdrop-blur-xl">
					<CardHeader className="items-center gap-2 text-center">
						<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
							<svg
								aria-hidden="true"
								className="h-6 w-6"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								viewBox="0 0 24 24"
							>
								<title>Verified</title>
								<path
									d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
						<CardTitle className="font-display font-extrabold text-xl tracking-tight">
							{verified ? "Email verified!" : "Verifying…"}
						</CardTitle>
						<CardDescription>
							{verified
								? "Your doorbell's all wired up. Time to start ringing."
								: "Confirming your email address."}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center gap-2">
						{verified && (
							<Link className="w-full" to="/dashboard">
								<Button className="w-full rounded-full" size="lg">
									Go to dashboard
								</Button>
							</Link>
						)}
					</CardContent>
				</Card>
			</Reveal>
		</div>
	);
}

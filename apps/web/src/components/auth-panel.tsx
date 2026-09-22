import {
	Card,
	CardContent,
	CardHeader,
} from "@dingdongdash/ui/components/card";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { softSpring } from "@/lib/motion";

import SignInForm from "./sign-in-form";
import SignUpForm from "./sign-up-form";

interface AuthPanelProps {
	/** When provided, renders a "back to the door" affordance. */
	onBack?: () => void;
}

/** The sign-in / create-account panel, shared by the home door reveal and /login. */
export function AuthPanel({ onBack }: AuthPanelProps) {
	const reduceMotion = useReducedMotion();
	const [mode, setMode] = useState<"signup" | "signin">("signup");

	return (
		<motion.div
			animate={{ opacity: 1, scale: 1, y: 0 }}
			initial={
				reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 32 }
			}
			transition={softSpring}
		>
			<Card className="w-[min(92vw,26rem)] border-none bg-background/95 shadow-2xl backdrop-blur-xl">
				<CardHeader className="items-center gap-2 text-center">
					<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30 shadow-lg">
						<svg
							aria-hidden="true"
							className="h-6 w-6 text-white"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
						</svg>
					</span>
					<h2 className="font-display font-extrabold text-xl tracking-tight">
						{mode === "signup" ? "Welcome to the block" : "Welcome back"}
					</h2>
					<p className="text-muted-foreground text-sm">
						{mode === "signup"
							? "Ring the doorbell. Beat the clock. You start with 100 points."
							: "Your door's been waiting for you."}
					</p>
				</CardHeader>
				<CardContent className="pt-2">
					{mode === "signup" ? (
						<SignUpForm onSwitchToSignIn={() => setMode("signin")} />
					) : (
						<SignInForm onSwitchToSignUp={() => setMode("signup")} />
					)}
				</CardContent>
			</Card>

			{onBack ? (
				<div className="mt-4 text-center">
					<button
						className="rounded-full font-medium text-muted-foreground text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline"
						onClick={onBack}
						type="button"
					>
						← Back to the door
					</button>
				</div>
			) : null}
		</motion.div>
	);
}

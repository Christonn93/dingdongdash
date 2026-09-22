import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { Input } from "@dingdongdash/ui/components/input";
import { Label } from "@dingdongdash/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";

import { Reveal } from "@/components/reveal";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordRoute,
});

function ForgotPasswordRoute() {
	const [submitted, setSubmitted] = useState(false);

	const form = useForm({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.requestPasswordReset({
				email: value.email,
				redirectTo: `${window.location.origin}/reset-password`,
			});
			setSubmitted(true);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
			}),
		},
	});

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
						<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
							<svg
								aria-hidden="true"
								className="h-6 w-6"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								viewBox="0 0 24 24"
							>
								<title>Password reset</title>
								<path
									d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
						<CardTitle className="font-display font-extrabold text-xl tracking-tight">
							{submitted ? "Check your inbox" : "Forgot your password?"}
						</CardTitle>
						<CardDescription>
							{submitted
								? "If an account exists for that email, we just sent a reset link. It expires in one hour."
								: "Enter the email you signed up with and we'll send you a reset link."}
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-2">
						{submitted ? (
							<div className="flex flex-col items-center gap-2">
								<Link className="w-full" to="/login">
									<Button className="w-full rounded-full" size="lg">
										Back to sign in
									</Button>
								</Link>
							</div>
						) : (
							<form
								className="space-y-4"
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									form.handleSubmit();
								}}
							>
								<div>
									<form.Field name="email">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>Email</Label>
												<Input
													autoComplete="email"
													id={field.name}
													name={field.name}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="you@example.com"
													type="email"
													value={field.state.value}
												/>
												{field.state.meta.errors.map((error) => (
													<p className="text-destructive" key={error?.message}>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>
								</div>

								<form.Subscribe
									selector={(state) => ({
										canSubmit: state.canSubmit,
										isSubmitting: state.isSubmitting,
									})}
								>
									{({ canSubmit, isSubmitting }) => (
										<Button
											className="w-full rounded-full"
											disabled={!canSubmit || isSubmitting}
											size="lg"
											type="submit"
										>
											{isSubmitting ? "Sending…" : "Send reset link"}
										</Button>
									)}
								</form.Subscribe>
							</form>
						)}
					</CardContent>
				</Card>
			</Reveal>
			<Link
				className="mt-6 rounded-full px-3 py-1.5 text-amber-100/70 text-sm underline-offset-4 transition-colors hover:text-amber-50 hover:underline"
				to="/login"
			>
				← Back to sign in
			</Link>
		</div>
	);
}

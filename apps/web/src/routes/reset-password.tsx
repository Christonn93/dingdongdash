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
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { Reveal } from "@/components/reveal";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/reset-password")({
	component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
	const params = new URLSearchParams(window.location.search);
	const token = params.get("token");
	const linkError = params.get("error");
	const [resetDone, setResetDone] = useState(false);

	const form = useForm({
		defaultValues: {
			confirmPassword: "",
			password: "",
		},
		onSubmit: async ({ value, formApi }) => {
			if (!token) {
				return;
			}
			const { error } = await authClient.resetPassword({
				newPassword: value.password,
				token,
			});
			if (error) {
				toast.error(error.message ?? "Could not reset your password");
				return;
			}
			formApi.reset();
			setResetDone(true);
		},
		validators: {
			onSubmit: z
				.object({
					confirmPassword: z.string(),
					password: z.string().min(8, "Password must be at least 8 characters"),
				})
				.refine(
					({ confirmPassword, password }) => confirmPassword === password,
					{
						message: "Passwords don't match",
						path: ["confirmPassword"],
					}
				),
		},
	});

	const invalidLink = Boolean(linkError) || !token;

	let title: string;
	let description: string;
	let content: ReactNode;

	if (resetDone) {
		title = "Password updated!";
		description = "Your password was reset. Sign in with your new one.";
		content = (
			<div className="flex flex-col items-center gap-2">
				<Link className="w-full" to="/login">
					<Button className="w-full rounded-full" size="lg">
						Sign in
					</Button>
				</Link>
			</div>
		);
	} else if (invalidLink) {
		title = "Link expired";
		description =
			"This reset link is invalid or has expired. Request a fresh one and try again.";
		content = (
			<div className="flex flex-col items-center gap-2">
				<Link className="w-full" to="/forgot-password">
					<Button className="w-full rounded-full" size="lg">
						Request a new link
					</Button>
				</Link>
			</div>
		);
	} else {
		title = "Set a new password";
		description = "Choose a new password for your account.";
		content = (
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>New password</Label>
								<Input
									autoComplete="new-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									type="password"
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

				<div>
					<form.Field name="confirmPassword">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Confirm password</Label>
								<Input
									autoComplete="new-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									type="password"
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
							{isSubmitting ? "Saving…" : "Update password"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		);
	}

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
								<title>New password</title>
								<path
									d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
						<CardTitle className="font-display font-extrabold text-xl tracking-tight">
							{title}
						</CardTitle>
						<CardDescription>{description}</CardDescription>
					</CardHeader>
					<CardContent className="pt-2">{content}</CardContent>
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

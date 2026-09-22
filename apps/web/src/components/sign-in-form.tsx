import { Button } from "@dingdongdash/ui/components/button";
import { Input } from "@dingdongdash/ui/components/input";
import { Label } from "@dingdongdash/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();
	const [needsVerification, setNeedsVerification] = useState<string | null>(
		null
	);
	const [resending, setResending] = useState(false);

	const handleResend = useCallback(async () => {
		if (!needsVerification) {
			return;
		}
		setResending(true);
		try {
			const { error } = await authClient.sendVerificationEmail({
				callbackURL: `${window.location.origin}/verify-email`,
				email: needsVerification,
			});
			if (error) {
				toast.error(error.message ?? "Could not resend verification email");
			} else {
				toast.success("Verification email sent — check your inbox");
			}
		} finally {
			setResending(false);
		}
	}, [needsVerification]);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onError: (error) => {
						const message = error.error.message ?? error.error.statusText;
						toast.error(message);
						if (message.toLowerCase().includes("verif")) {
							setNeedsVerification(value.email);
						}
					},
					onSuccess: () => {
						navigate({
							to: "/dashboard",
						});
						toast.success("Welcome back!");
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="space-y-4">
			{needsVerification ? (
				<div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
					<p className="text-muted-foreground">
						You need to verify your email before signing in. We can resend the
						link to{" "}
						<span className="font-medium text-foreground">
							{needsVerification}
						</span>
						.
					</p>
					<Button
						className="mt-2 rounded-full"
						disabled={resending}
						onClick={handleResend}
						size="sm"
					>
						{resending ? "Sending…" : "Resend verification email"}
					</Button>
				</div>
			) : null}
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

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Password</Label>
								<Input
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

				<div className="flex justify-end">
					<Link
						className="font-semibold text-primary text-sm underline-offset-4 hover:underline"
						to="/forgot-password"
					>
						Forgot password?
					</Link>
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
							{isSubmitting ? "Opening the door…" : "Sign In"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p className="text-center text-muted-foreground text-sm">
				New here?{" "}
				<Button
					className="h-auto p-0 font-semibold text-primary"
					onClick={onSwitchToSignUp}
					variant="link"
				>
					Create an account
				</Button>
			</p>
		</div>
	);
}

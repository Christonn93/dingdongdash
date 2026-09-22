import { Button } from "@dingdongdash/ui/components/button";
import { Input } from "@dingdongdash/ui/components/input";
import { Label } from "@dingdongdash/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			name: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					name: value.name,
					password: value.password,
				},
				{
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
					onSuccess: () => {
						navigate({
							to: "/dashboard",
						});
						toast.success("Welcome to the neighborhood!");
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				name: z.string().min(2, "Name must be at least 2 characters"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="space-y-4">
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Name</Label>
								<Input
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Doorbell legend"
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
							{isSubmitting ? "Opening the door…" : "Create account"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p className="text-center text-muted-foreground text-sm">
				Already have a key?{" "}
				<Button
					className="h-auto p-0 font-semibold text-primary"
					onClick={onSwitchToSignIn}
					variant="link"
				>
					Sign in
				</Button>
			</p>
		</div>
	);
}

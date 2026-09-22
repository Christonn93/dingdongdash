import { useForm } from "@tanstack/react-form";
import {
	Button,
	FieldError,
	Input,
	Label,
	Spinner,
	Surface,
	TextField,
	useToast,
} from "heroui-native";
import { useCallback, useRef, useState } from "react";
import { Pressable, Text, type TextInput, View } from "react-native";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { ENV } from "../src/env";

const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Use at least 8 characters"),
});

const forgotPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
});

const TRAILING_SLASH = /\/$/;

function getErrorMessage(error: unknown): string | null {
	if (!error) {
		return null;
	}

	if (typeof error === "string") {
		return error;
	}

	if (Array.isArray(error)) {
		for (const issue of error) {
			const message = getErrorMessage(issue);
			if (message) {
				return message;
			}
		}
		return null;
	}

	if (typeof error === "object" && error !== null) {
		const maybeError = error as { message?: unknown };
		if (typeof maybeError.message === "string") {
			return maybeError.message;
		}
	}

	return null;
}

// Stable selector reference: defined outside the component so it is never
// recreated on render, which is what triggers noJsxPropsBind.
function formStateSelector(state: {
	isSubmitting: boolean;
	errorMap: { onSubmit?: unknown };
}) {
	return {
		isSubmitting: state.isSubmitting,
		validationError: getErrorMessage(state.errorMap.onSubmit),
	};
}

interface SignInProps {
	onSwitchToSignUp?: () => void;
}

function ForgotPassword({ onBack }: { onBack: () => void }) {
	const { toast } = useToast();

	const form = useForm({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value, formApi }) => {
			const { error } = await authClient.requestPasswordReset({
				email: value.email.trim(),
				redirectTo: `${ENV.EXPO_PUBLIC_WEB_URL.replace(TRAILING_SLASH, "")}/reset-password`,
			});
			if (error) {
				toast.show({
					label: error.message ?? "Could not send a reset link",
					variant: "danger",
				});
				return;
			}
			formApi.reset();
			toast.show({
				label: "If that email exists, a reset link is on its way",
				variant: "success",
			});
			onBack();
		},
		validators: {
			onSubmit: forgotPasswordSchema,
		},
	});

	return (
		<form.Subscribe selector={formStateSelector}>
			{({ isSubmitting, validationError }) => (
				<>
					<FieldError className="mb-3" isInvalid={!!validationError}>
						{validationError}
					</FieldError>

					<View className="gap-3">
						<form.Field name="email">
							{(field) => (
								<TextField>
									<Label>Email</Label>
									<Input
										autoCapitalize="none"
										autoComplete="email"
										keyboardType="email-address"
										onBlur={field.handleBlur}
										onChangeText={field.handleChange}
										onSubmitEditing={() => form.handleSubmit()}
										placeholder="email@example.com"
										returnKeyType="send"
										textContentType="emailAddress"
										value={field.state.value}
									/>
									<FieldError isInvalid={field.state.meta.errors.length > 0}>
										{getErrorMessage(field.state.meta.errors[0])}
									</FieldError>
								</TextField>
							)}
						</form.Field>

						<Button
							className="mt-1"
							isDisabled={isSubmitting}
							onPress={() => form.handleSubmit()}
						>
							{isSubmitting ? (
								<Spinner color="default" size="sm" />
							) : (
								<Button.Label>Send reset link</Button.Label>
							)}
						</Button>

						<View className="mt-4 flex-row justify-center">
							<Pressable onPress={onBack}>
								<Text className="font-semibold text-foreground">
									Back to sign in
								</Text>
							</Pressable>
						</View>
					</View>
				</>
			)}
		</form.Subscribe>
	);
}

function SignIn({ onSwitchToSignUp }: SignInProps) {
	const passwordInputRef = useRef<TextInput>(null);
	const { toast } = useToast();
	const [view, setView] = useState<"forgot" | "sign-in">("sign-in");

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value, formApi }) => {
			await authClient.signIn.email(
				{
					email: value.email.trim(),
					password: value.password,
				},
				{
					onError(error) {
						toast.show({
							label: error.error?.message || "Failed to sign in",
							variant: "danger",
						});
					},
					onSuccess() {
						formApi.reset();
						toast.show({
							label: "Signed in successfully",
							variant: "success",
						});
						queryClient.refetchQueries();
					},
				}
			);
		},
		validators: {
			onSubmit: signInSchema,
		},
	});

	const focusPasswordField = useCallback(() => {
		passwordInputRef.current?.focus();
	}, []);

	const handleSubmit = useCallback(() => {
		form.handleSubmit();
	}, [form]);

	const showForgot = useCallback(() => setView("forgot"), []);
	const showSignIn = useCallback(() => setView("sign-in"), []);

	return (
		<Surface className="rounded-lg p-4" variant="secondary">
			<Text className="mb-4 font-medium text-foreground">
				{view === "forgot" ? "Reset your password" : "Sign In"}
			</Text>

			{view === "forgot" ? (
				<ForgotPassword onBack={showSignIn} />
			) : (
				<form.Subscribe selector={formStateSelector}>
					{({ isSubmitting, validationError }) => {
						const formError = validationError;

						return (
							<>
								<FieldError className="mb-3" isInvalid={!!formError}>
									{formError}
								</FieldError>

								<View className="gap-3">
									<form.Field name="email">
										{(field) => (
											<TextField>
												<Label>Email</Label>
												<Input
													autoCapitalize="none"
													autoComplete="email"
													blurOnSubmit={false}
													keyboardType="email-address"
													onBlur={field.handleBlur}
													onChangeText={field.handleChange}
													onSubmitEditing={focusPasswordField}
													placeholder="email@example.com"
													returnKeyType="next"
													textContentType="emailAddress"
													value={field.state.value}
												/>
												<FieldError
													isInvalid={field.state.meta.errors.length > 0}
												>
													{getErrorMessage(field.state.meta.errors[0])}
												</FieldError>
											</TextField>
										)}
									</form.Field>

									<form.Field name="password">
										{(field) => (
											<TextField>
												<Label>Password</Label>
												<Input
													autoComplete="password"
													onBlur={field.handleBlur}
													onChangeText={field.handleChange}
													onSubmitEditing={handleSubmit}
													placeholder="Enter your password"
													ref={passwordInputRef}
													returnKeyType="go"
													secureTextEntry
													textContentType="password"
													value={field.state.value}
												/>
												<FieldError
													isInvalid={field.state.meta.errors.length > 0}
												>
													{getErrorMessage(field.state.meta.errors[0])}
												</FieldError>
											</TextField>
										)}
									</form.Field>

									<View className="flex-row justify-end">
										<Pressable onPress={showForgot}>
											<Text className="font-semibold text-foreground text-xs">
												Forgot password?
											</Text>
										</Pressable>
									</View>

									<Button
										className="mt-1"
										isDisabled={isSubmitting}
										onPress={handleSubmit}
									>
										{isSubmitting ? (
											<Spinner color="default" size="sm" />
										) : (
											<Button.Label>Sign In</Button.Label>
										)}
									</Button>

									{onSwitchToSignUp ? (
										<View className="mt-4 flex-row justify-center">
											<Text className="text-foreground">
												Don't have an account?{" "}
											</Text>
											<Pressable onPress={onSwitchToSignUp}>
												<Text className="font-semibold text-foreground">
													Sign Up
												</Text>
											</Pressable>
										</View>
									) : null}
								</View>
							</>
						);
					}}
				</form.Subscribe>
			)}
		</Surface>
	);
}

export { SignIn };

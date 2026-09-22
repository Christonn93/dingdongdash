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
import { useCallback, useRef } from "react";
import { Pressable, Text, type TextInput, View } from "react-native";
import z from "zod";

import { signUpEmail } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

const signUpSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.min(2, "Name must be at least 2 characters"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Use at least 8 characters"),
	username: z
		.string()
		.trim()
		.min(3, "Username must be at least 3 characters")
		.regex(USERNAME_REGEX, "Only letters, numbers, and underscores (max 24)"),
});

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

interface SignUpProps {
	onSwitchToSignIn?: () => void;
}

export function SignUp({ onSwitchToSignIn }: SignUpProps) {
	const emailInputRef = useRef<TextInput>(null);
	const passwordInputRef = useRef<TextInput>(null);
	const usernameInputRef = useRef<TextInput>(null);
	const { toast } = useToast();

	const form = useForm({
		defaultValues: {
			email: "",
			name: "",
			password: "",
			username: "",
		},
		onSubmit: async ({ value, formApi }) => {
			await signUpEmail(
				{
					email: value.email.trim(),
					name: value.name.trim(),
					password: value.password,
					username: value.username.trim().toLowerCase(),
				},
				{
					onError(error) {
						toast.show({
							label: error.error?.message || "Failed to sign up",
							variant: "danger",
						});
					},
					onSuccess() {
						formApi.reset();
						toast.show({
							label: "Account created successfully",
							variant: "success",
						});
						queryClient.refetchQueries();
					},
				}
			);
		},
		validators: {
			onSubmit: signUpSchema,
		},
	});

	const focusEmailField = useCallback(() => {
		emailInputRef.current?.focus();
	}, []);

	const focusUsernameField = useCallback(() => {
		usernameInputRef.current?.focus();
	}, []);

	const focusPasswordField = useCallback(() => {
		passwordInputRef.current?.focus();
	}, []);

	const handleSubmit = useCallback(() => {
		form.handleSubmit();
	}, [form]);

	return (
		<Surface className="rounded-lg p-4" variant="secondary">
			<Text className="mb-4 font-medium text-foreground">Create Account</Text>

			<form.Subscribe selector={formStateSelector}>
				{({ isSubmitting, validationError }) => {
					const formError = validationError;

					return (
						<>
							<FieldError className="mb-3" isInvalid={!!formError}>
								{formError}
							</FieldError>

							<View className="gap-3">
								<form.Field name="name">
									{(field) => (
										<TextField>
											<Label>Name</Label>
											<Input
												autoCapitalize="words"
												blurOnSubmit={false}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												onSubmitEditing={focusEmailField}
												placeholder="John Doe"
												returnKeyType="next"
												textContentType="name"
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
												onSubmitEditing={focusUsernameField}
												placeholder="email@example.com"
												ref={emailInputRef}
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

								<form.Field name="username">
									{(field) => (
										<TextField>
											<Label>Username</Label>
											<Input
												autoCapitalize="none"
												autoComplete="username"
												blurOnSubmit={false}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												onSubmitEditing={focusPasswordField}
												placeholder="doorbell_legend"
												ref={usernameInputRef}
												returnKeyType="next"
												textContentType="username"
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
												placeholder="Use at least 8 characters"
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

								<Button
									className="mt-1"
									isDisabled={isSubmitting}
									onPress={handleSubmit}
								>
									{isSubmitting ? (
										<Spinner color="default" size="sm" />
									) : (
										<Button.Label>Create Account</Button.Label>
									)}
								</Button>

								{onSwitchToSignIn ? (
									<View className="mt-4 flex-row justify-center">
										<Text className="text-foreground">
											Already have an account?{" "}
										</Text>
										<Pressable onPress={onSwitchToSignIn}>
											<Text className="font-semibold text-foreground">
												Sign In
											</Text>
										</Pressable>
									</View>
								) : null}
							</View>
						</>
					);
				}}
			</form.Subscribe>
		</Surface>
	);
}

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

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

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

function SignIn({ onSwitchToSignUp }: SignInProps) {
	const passwordInputRef = useRef<TextInput>(null);
	const { toast } = useToast();

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

	return (
		<Surface className="rounded-lg p-4" variant="secondary">
			<Text className="mb-4 font-medium text-foreground">Sign In</Text>

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
		</Surface>
	);
}

export { SignIn };

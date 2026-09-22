import { APP_META } from "@dingdongdash/api/lib/app-meta";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Button,
	Input,
	Label,
	Surface,
	Switch,
	TextField,
	useToast,
} from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { trpc } from "@/utils/trpc";

const SMS_PHONE_REGEX = /^\+[1-9][0-9]{6,14}$/;

type BooleanPrefKey =
	| "resultsEmail"
	| "resultsPush"
	| "resultsSms"
	| "ringsEmail"
	| "ringsPush"
	| "ringsSms";

export default function SettingsScreen() {
	const { toast } = useToast();
	const [smsPhone, setSmsPhone] = useState("");

	const prefs = useQuery(trpc.users.getNotificationPreferences.queryOptions());
	const updatePrefs = useMutation(
		trpc.users.updateNotificationPreferences.mutationOptions({
			onError: (error) => {
				toast.show({ label: error.message, variant: "danger" });
			},
			onSuccess: () => {
				toast.show({ label: "Saved", variant: "success" });
				prefs.refetch();
			},
		})
	);

	const p = prefs.data;

	const dnd = useQuery(trpc.users.getDndSettings.queryOptions());
	const updateDnd = useMutation(
		trpc.users.updateDndSettings.mutationOptions({
			onSuccess: () => {
				dnd.refetch();
			},
		})
	);
	const [dndFrom, setDndFrom] = useState("22");
	const [dndTo, setDndTo] = useState("8");

	const toggleDnd = (value: boolean) => {
		updateDnd.mutate({ dndEnabled: value });
	};

	const saveDndWindow = () => {
		const from = Number(dndFrom);
		const to = Number(dndTo);
		if (
			!(Number.isInteger(from) && Number.isInteger(to)) ||
			from < 0 ||
			from > 23 ||
			to < 0 ||
			to > 23
		) {
			toast.show({ label: "Hours must be 0–23", variant: "danger" });
			return;
		}
		updateDnd.mutate({ dndFrom: from, dndTo: to });
		toast.show({ label: "Quiet hours saved", variant: "success" });
	};

	const set = (key: BooleanPrefKey, value: boolean) => {
		updatePrefs.mutate({ [key]: value });
	};

	const handleSavePhone = () => {
		if (!SMS_PHONE_REGEX.test(smsPhone)) {
			toast.show({
				label: "Use a full number like +15550001234",
				variant: "danger",
			});
			return;
		}
		updatePrefs.mutate({ smsPhone });
	};

	let content: React.ReactNode;
	if (prefs.isLoading) {
		content = (
			<Text className="py-8 text-center text-muted text-sm">Loading…</Text>
		);
	} else if (p) {
		content = (
			<View className="gap-4">
				<Surface className="rounded-lg p-4" variant="secondary">
					<Text className="mb-3 font-medium text-foreground">
						Incoming rings
					</Text>
					<ToggleRow
						label="Push notifications"
						onChange={(value) => set("ringsPush", value)}
						value={p.ringsPush}
					/>
					<ToggleRow
						label="Email"
						onChange={(value) => set("ringsEmail", value)}
						value={p.ringsEmail}
					/>
					<ToggleRow
						label="SMS"
						onChange={(value) => set("ringsSms", value)}
						value={p.ringsSms}
					/>
				</Surface>

				<Surface className="rounded-lg p-4" variant="secondary">
					<Text className="mb-3 font-medium text-foreground">Ring results</Text>
					<ToggleRow
						label="Push notifications"
						onChange={(value) => set("resultsPush", value)}
						value={p.resultsPush}
					/>
					<ToggleRow
						label="Email"
						onChange={(value) => set("resultsEmail", value)}
						value={p.resultsEmail}
					/>
					<ToggleRow
						label="SMS"
						onChange={(value) => set("resultsSms", value)}
						value={p.resultsSms}
					/>
				</Surface>

				{p.ringsSms || p.resultsSms ? (
					<Surface className="rounded-lg p-4" variant="secondary">
						<Text className="mb-1 font-medium text-foreground">
							SMS phone number
						</Text>
						<Text className="mb-3 text-muted text-xs">
							Used only for SMS notifications. Stored in plain text for
							delivery.
						</Text>
						<View className="flex-row items-end gap-2">
							<View className="flex-1">
								<TextField>
									<Label>Phone</Label>
									<Input
										keyboardType="phone-pad"
										onChangeText={setSmsPhone}
										placeholder={p.smsPhone ?? "+15550001234"}
										value={smsPhone}
									/>
								</TextField>
							</View>
							<Button
								isDisabled={!smsPhone.trim()}
								onPress={handleSavePhone}
								size="sm"
							>
								<Button.Label>Save</Button.Label>
							</Button>
						</View>
					</Surface>
				) : null}

				<Surface className="rounded-lg p-4" variant="secondary">
					<Text className="mb-1 font-medium text-foreground">
						Do Not Disturb
					</Text>
					<Text className="mb-3 text-muted text-xs">
						Friends can't ring you during these quiet hours.
					</Text>
					<View className="mb-3 flex-row items-center justify-between py-2">
						<Text className="text-foreground text-sm">Quiet hours</Text>
						<Switch
							isSelected={dnd.data?.dndEnabled ?? false}
							onSelectedChange={toggleDnd}
						>
							<Switch.Thumb />
						</Switch>
					</View>
					<View className="flex-row items-end gap-2">
						<View className="flex-1">
							<TextField>
								<Label>From (hour)</Label>
								<Input
									keyboardType="number-pad"
									onChangeText={setDndFrom}
									placeholder={String(dnd.data?.dndFrom ?? 22)}
									value={dndFrom}
								/>
							</TextField>
						</View>
						<View className="flex-1">
							<TextField>
								<Label>To (hour)</Label>
								<Input
									keyboardType="number-pad"
									onChangeText={setDndTo}
									placeholder={String(dnd.data?.dndTo ?? 8)}
									value={dndTo}
								/>
							</TextField>
						</View>
						<Button onPress={saveDndWindow} size="sm">
							<Button.Label>Save</Button.Label>
						</Button>
					</View>
				</Surface>

				<Text className="px-1 text-muted text-xs">
					Push uses Expo's push service. Email uses Resend and SMS uses Twilio
					behind the scenes.
				</Text>

				<Surface className="rounded-lg p-4" variant="secondary">
					<Text className="mb-1 font-medium text-foreground">About</Text>
					<Text className="mb-1 text-muted text-xs">
						Created by {APP_META.author}. Open source under the MIT License.
					</Text>
					<Text className="font-mono text-muted text-xs">
						{APP_META.fingerprint}
					</Text>
				</Surface>
			</View>
		);
	}

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="mb-4 py-2">
					<Text className="font-semibold text-2xl text-foreground tracking-tight">
						Notifications
					</Text>
					<Text className="mt-1 text-muted text-sm">
						Choose how DingDongDitch reaches you. Ring alerts should stay on if
						you want to catch your friends.
					</Text>
				</View>
				{content}
			</ScrollView>
		</Container>
	);
}

function ToggleRow({
	label,
	value,
	onChange,
}: {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<View className="flex-row items-center justify-between py-2">
			<Text className="text-foreground text-sm">{label}</Text>
			<Switch isSelected={value} onSelectedChange={onChange}>
				<Switch.Thumb />
			</Switch>
		</View>
	);
}

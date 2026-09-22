import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useInstallPrompt() {
	const [promptEvent, setPromptEvent] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isStandalone, setIsStandalone] = useState(false);

	useEffect(() => {
		const isStandaloneMode =
			window.matchMedia("(display-mode: standalone)").matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		setIsStandalone(isStandaloneMode);

		const onBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setPromptEvent(event as BeforeInstallPromptEvent);
		};

		window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
		};
	}, []);

	const promptInstall = useCallback(async () => {
		if (!promptEvent) {
			return false;
		}
		await promptEvent.prompt();
		const { outcome } = await promptEvent.userChoice;
		if (outcome === "accepted") {
			setPromptEvent(null);
		}
		return outcome === "accepted";
	}, [promptEvent]);

	return { isInstallable: promptEvent !== null, isStandalone, promptInstall };
}

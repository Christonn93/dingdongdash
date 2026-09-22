import { useCallback, useEffect, useState } from "react";

import { useInstallPrompt } from "@/utils/use-install-prompt";

export function InstallAppButton() {
	const { isInstallable, isStandalone, promptInstall } = useInstallPrompt();
	const [justInstalled, setJustInstalled] = useState(false);

	useEffect(() => {
		const onInstalled = () => setJustInstalled(true);
		window.addEventListener("appinstalled", onInstalled);
		return () => window.removeEventListener("appinstalled", onInstalled);
	}, []);

	const handleInstall = useCallback(() => {
		promptInstall();
	}, [promptInstall]);

	if (isStandalone || justInstalled) {
		return null;
	}

	return (
		<button
			className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
			disabled={!isInstallable}
			onClick={handleInstall}
			title={
				isInstallable
					? "Install DingDongDitch on this device"
					: "Use your browser's “Add to Home Screen” option to install"
			}
			type="button"
		>
			<svg
				aria-hidden="true"
				className="h-4 w-4"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				viewBox="0 0 24 24"
			>
				<path
					d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			{isInstallable ? "Install app" : "Install"}
		</button>
	);
}

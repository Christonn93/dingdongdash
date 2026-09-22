import { Button } from "@dingdongdash/ui/components/button";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { spring } from "@/lib/motion";

import { InstallAppButton } from "./install-app-button";
import { ModeToggle } from "./mode-toggle";
import { NavLinks } from "./nav-links";

const SHEET_LINK_CLASS =
	"rounded-xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:font-semibold [&.active]:text-primary";

/** Mobile-only navigation drawer (below `md`). Desktop keeps the inline nav. */
export function MobileNav() {
	const [open, setOpen] = useState(false);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const close = useCallback(() => setOpen(false), []);

	useEffect(() => {
		if (!open) {
			return;
		}
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};
		document.addEventListener("keydown", onKeyDown);
		closeButtonRef.current?.focus();
		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	return (
		<>
			<Button
				aria-expanded={open}
				aria-label="Open navigation menu"
				className="md:hidden"
				onClick={() => setOpen(true)}
				size="icon"
				variant="ghost"
			>
				<Menu className="h-5 w-5" />
			</Button>

			<AnimatePresence>
				{open ? (
					<div className="fixed inset-0 z-50 md:hidden">
						<motion.button
							animate={{ opacity: 1 }}
							aria-label="Close navigation menu"
							className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							onClick={close}
							tabIndex={-1}
							transition={{ duration: 0.2 }}
							type="button"
						/>
						<motion.div
							animate={{ x: 0 }}
							aria-label="Navigation menu"
							aria-modal="true"
							className="absolute inset-y-0 right-0 flex w-[min(85vw,20rem)] flex-col bg-card shadow-2xl ring-1 ring-border"
							exit={{ x: "100%" }}
							initial={{ x: "100%" }}
							role="dialog"
							transition={spring}
						>
							<div className="flex items-center justify-between border-border/60 border-b px-4 py-3">
								<span className="font-display font-extrabold text-sm tracking-tight">
									Menu
								</span>
								<Button
									aria-label="Close navigation menu"
									onClick={close}
									ref={closeButtonRef}
									size="icon"
									variant="ghost"
								>
									<X className="h-5 w-5" />
								</Button>
							</div>

							<nav aria-label="Primary" className="flex-1 overflow-y-auto p-3">
								<NavLinks
									className="flex flex-col gap-1"
									linkClassName={SHEET_LINK_CLASS}
									onNavigate={close}
								/>
							</nav>

							<div className="space-y-3 border-border/60 border-t p-4">
								<InstallAppButton />
								<ModeToggle />
							</div>
						</motion.div>
					</div>
				) : null}
			</AnimatePresence>
		</>
	);
}

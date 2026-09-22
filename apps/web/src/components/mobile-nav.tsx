import { Button } from "@dingdongdash/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@dingdongdash/ui/components/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

import { InstallAppButton } from "./install-app-button";
import { ModeToggle } from "./mode-toggle";
import { NavLinks } from "./nav-links";

const SHEET_LINK_CLASS =
	"rounded-xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:font-semibold [&.active]:text-primary";

/** Mobile-only navigation drawer (below `md`). Desktop keeps the inline nav. */
export function MobileNav() {
	const [open, setOpen] = useState(false);

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger
				aria-label="Open navigation menu"
				className="md:hidden"
				render={<Button size="icon" variant="ghost" />}
			>
				<Menu className="h-5 w-5" />
			</SheetTrigger>

			<SheetContent
				className="w-[min(100%,24rem)] p-0"
				showCloseButton
				side="right"
			>
				<SheetHeader className="border-border/60 border-b px-5 py-4">
					<SheetTitle>Menu</SheetTitle>
					<SheetDescription className="sr-only">
						Navigate the application and access preferences.
					</SheetDescription>
				</SheetHeader>

				<nav
					aria-label="Primary"
					className="flex flex-1 flex-col gap-1 overflow-y-auto p-4"
				>
					<NavLinks
						className="flex flex-col gap-1"
						linkClassName={SHEET_LINK_CLASS}
						onNavigate={() => setOpen(false)}
					/>
				</nav>

				<div className="space-y-3 border-border/60 border-t p-4">
					<InstallAppButton />
					<ModeToggle />
				</div>
			</SheetContent>
		</Sheet>
	);
}

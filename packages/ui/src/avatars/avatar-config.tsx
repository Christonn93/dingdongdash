import type { AvatarId } from "@dingdongdash/db/game";

export interface AvatarSpec {
	/** Tailwind gradient stops for the avatar's backdrop. */
	backdrop: string;
	/** Human-readable name used for accessible labels and the picker. */
	label: string;
}

export const avatarSpecs: Record<AvatarId, AvatarSpec> = {
	bee: { backdrop: "from-amber-300 to-yellow-500", label: "Bee" },
	cat: { backdrop: "from-violet-400 to-indigo-600", label: "Cat" },
	cloud: { backdrop: "from-sky-200 to-sky-400", label: "Cloud" },
	dog: { backdrop: "from-amber-200 to-amber-500", label: "Dog" },
	doorbell: { backdrop: "from-red-400 to-red-600", label: "Doorbell" },
	duck: { backdrop: "from-yellow-200 to-amber-400", label: "Rubber duck" },
	frog: { backdrop: "from-emerald-300 to-green-600", label: "Frog" },
	ghost: { backdrop: "from-slate-200 to-slate-400", label: "Ghost" },
	house: { backdrop: "from-amber-300 to-orange-500", label: "House" },
	mailbox: { backdrop: "from-blue-300 to-indigo-500", label: "Mailbox" },
	mushroom: { backdrop: "from-pink-300 to-rose-500", label: "Mushroom" },
	pizza: { backdrop: "from-yellow-300 to-orange-500", label: "Pizza slice" },
	raccoon: { backdrop: "from-stone-300 to-stone-500", label: "Raccoon" },
	robot: { backdrop: "from-cyan-300 to-blue-500", label: "Robot" },
	rocket: { backdrop: "from-fuchsia-400 to-purple-600", label: "Rocket" },
	"wizard-hat": {
		backdrop: "from-purple-400 to-violet-600",
		label: "Wizard hat",
	},
};

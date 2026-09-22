import type { AvatarId } from "@dingdongdash/db/game";

export interface AvatarSpec {
	/** Human-readable name used for accessible labels and the picker. */
	label: string;
	/** Tailwind gradient stops for the avatar's backdrop. */
	backdrop: string;
}

export const avatarSpecs: Record<AvatarId, AvatarSpec> = {
	doorbell: { label: "Doorbell", backdrop: "from-red-400 to-red-600" },
	house: { label: "House", backdrop: "from-amber-300 to-orange-500" },
	cat: { label: "Cat", backdrop: "from-violet-400 to-indigo-600" },
	dog: { label: "Dog", backdrop: "from-amber-200 to-amber-500" },
	frog: { label: "Frog", backdrop: "from-emerald-300 to-green-600" },
	ghost: { label: "Ghost", backdrop: "from-slate-200 to-slate-400" },
	robot: { label: "Robot", backdrop: "from-cyan-300 to-blue-500" },
	mushroom: { label: "Mushroom", backdrop: "from-pink-300 to-rose-500" },
	pizza: { label: "Pizza slice", backdrop: "from-yellow-300 to-orange-500" },
	duck: { label: "Rubber duck", backdrop: "from-yellow-200 to-amber-400" },
	cloud: { label: "Cloud", backdrop: "from-sky-200 to-sky-400" },
	bee: { label: "Bee", backdrop: "from-amber-300 to-yellow-500" },
	rocket: { label: "Rocket", backdrop: "from-fuchsia-400 to-purple-600" },
	mailbox: { label: "Mailbox", backdrop: "from-blue-300 to-indigo-500" },
	raccoon: { label: "Raccoon", backdrop: "from-stone-300 to-stone-500" },
	"wizard-hat": {
		label: "Wizard hat",
		backdrop: "from-purple-400 to-violet-600",
	},
};
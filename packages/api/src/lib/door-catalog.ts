/**
 * The door-customization catalog — the single source of truth for door skins
 * and house upgrades. Purely presentational data + economy values; imported by
 * the server router (catalog + point purchases) and by the web/native clients
 * (rendering the house). The art tokens drive both SVG renderers.
 */

export type BellStyle = "bell" | "knocker" | "crank" | "touch" | "neon";
export type DoorShape = "rect" | "arch";

export interface DoorSkinTheme {
	/** House wall behind the door (vertical gradient). */
	wall: { from: string; to: string };
	/** Accent for wall details (siding lines, planks on the facade). */
	wallAccent: string;
	/** Door frame / trim color. */
	frame: string;
	/** Door body gradient. */
	door: { from: string; to: string };
	/** Recessed panel / plank accent on the door face. */
	doorAccent: string;
	/** Knob, hinges, peephole metal. */
	hardware: string;
	/** What "rings" the door. */
	bellStyle: BellStyle;
	/** Door silhouette. */
	shape: DoorShape;
	/** Neon accent used only by the neon bell. */
	neon?: string;
}

export interface DoorSkin {
	id: string;
	name: string;
	description: string;
	pricePoints: number;
	theme: DoorSkinTheme;
}

export const DOOR_SKINS: DoorSkin[] = [
	{
		id: "classic",
		name: "The Classic",
		description: "A warm honey-oak door with a brass bell. Where every door story starts.",
		pricePoints: 0,
		theme: {
			bellStyle: "bell",
			door: { from: "#a8642e", to: "#663a15" },
			doorAccent: "#7a4418",
			frame: "#4a2c16",
			hardware: "#c9a24a",
			shape: "rect",
			wall: { from: "#8a4f3f", to: "#7a4638" },
			wallAccent: "#5f372c",
		},
	},
	{
		id: "cottage",
		name: "The Cottage",
		description: "A sage-plank cottage door with an iron knocker. Bang-bang, who's there?",
		pricePoints: 500,
		theme: {
			bellStyle: "knocker",
			door: { from: "#7a9b6e", to: "#54704a" },
			doorAccent: "#436038",
			frame: "#3d4a30",
			hardware: "#5d6b5b",
			shape: "arch",
			wall: { from: "#e7dfc8", to: "#cfc2a6" },
			wallAccent: "#b7a888",
		},
	},
	{
		id: "victorian",
		name: "The Victorian",
		description: "An emerald door with carved trim and an antique brass crank bell.",
		pricePoints: 1200,
		theme: {
			bellStyle: "crank",
			door: { from: "#2e6b4f", to: "#1e4835" },
			doorAccent: "#1a3b2b",
			frame: "#33251a",
			hardware: "#c9a24a",
			shape: "rect",
			wall: { from: "#9c4038", to: "#7e2f2a" },
			wallAccent: "#6b241f",
		},
	},
	{
		id: "modern",
		name: "The Modern",
		description: "A matte charcoal slab door with a glowing touch bell. Minimal, slick.",
		pricePoints: 2000,
		theme: {
			bellStyle: "touch",
			door: { from: "#3b3b40", to: "#232327" },
			doorAccent: "#2b2b30",
			frame: "#1a1a1e",
			hardware: "#d4d4d8",
			shape: "rect",
			wall: { from: "#6e6e74", to: "#4c4c51" },
			wallAccent: "#5a5a60",
		},
	},
	{
		id: "neon",
		name: "The Neon Night",
		description: "A glossy violet door with a glowing neon bell. Night owls only.",
		pricePoints: 3500,
		theme: {
			bellStyle: "neon",
			door: { from: "#5b3aa6", to: "#341f66" },
			doorAccent: "#452b80",
			frame: "#241743",
			hardware: "#e0cfff",
			neon: "#ff5cf0",
			shape: "rect",
			wall: { from: "#2b1a4a", to: "#1c1133" },
			wallAccent: "#3a2566",
		},
	},
];

export interface DoorUpgrade {
	id: "spy_camera" | "camera_doorbell";
	name: string;
	description: string;
	pricePoints: number;
	/** A camera doorbell reveals who is ringing; without one, ringers are anonymous. */
	revealsRinger: boolean;
}

export const DOOR_UPGRADES: DoorUpgrade[] = [
	{
		id: "spy_camera",
		name: "Spy Camera",
		description: "A tiny camera peeks from above the door. Mostly for peace of mind…",
		pricePoints: 800,
		revealsRinger: false,
	},
	{
		id: "camera_doorbell",
		name: "Camera Doorbell",
		description: "See exactly who's at your door before you answer. No more mystery ringers.",
		pricePoints: 2500,
		revealsRinger: true,
	},
];

export interface RingSound {
	id: string;
	name: string;
	description: string;
	pricePoints: number;
}

/** Buyable doorbell ring sounds. The equipped one plays when someone rings you. */
export const RING_SOUNDS: RingSound[] = [
	{
		id: "dingdong",
		name: "Classic Ding-Dong",
		description: "The timeless two-tone bell. Where every door story starts.",
		pricePoints: 0,
	},
	{
		id: "knock",
		name: "Knock Knock",
		description: "A heavy wooden knock at the door.",
		pricePoints: 400,
	},
	{
		id: "crank",
		name: "Old Crank",
		description: "The clattering spin of an antique ringer.",
		pricePoints: 600,
	},
	{
		id: "neon",
		name: "Neon Glide",
		description: "A rising synth pulse for night owls.",
		pricePoints: 800,
	},
	{
		id: "deepbell",
		name: "Deep Bell",
		description: "A warm, low chime that echoes through the hallway.",
		pricePoints: 1200,
	},
	{
		id: "marimba",
		name: "Marimba",
		description: "A cheerful rising marimba riff.",
		pricePoints: 2000,
	},
];

export function doorSkinById(id: string): DoorSkin | undefined {
	return DOOR_SKINS.find((skin) => skin.id === id);
}

export function doorUpgradeById(id: string): DoorUpgrade | undefined {
	return DOOR_UPGRADES.find((upgrade) => upgrade.id === id);
}

export function ringSoundById(id: string): RingSound | undefined {
	return RING_SOUNDS.find((sound) => sound.id === id);
}

/** The default skin every user starts with. */
export const DEFAULT_DOOR_SKIN = "classic";

/** The default ring sound every user starts with. */
export const DEFAULT_RING_SOUND = "dingdong";
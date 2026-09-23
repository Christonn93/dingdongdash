import type { BellStyle } from "@dingdongdash/api/lib/door-catalog";
import { Platform } from "react-native";

/**
 * DingDongDitch sound effects.
 *
 * Uses expo-audio behind a lazy, guarded `require` so the app keeps working
 * (and type-checks) even before the package finishes installing. Audio only
 * plays on native; on web it's a silent no-op.
 */

type SoundName =
	| "chime"
	| "fanfare"
	| "downer"
	| "blip"
	| "creak"
	| "shield"
	| "knock"
	| "crank"
	| "touch"
	| "neon"
	| "deepbell"
	| "marimba";

interface AudioPlayerLike {
	play: () => void;
	remove: () => void;
	seekTo: (seconds: number) => void;
	volume: number;
}

interface AudioApi {
	createAudioPlayer: (source: number | { uri: string }) => AudioPlayerLike;
	setAudioModeAsync: (mode: {
		playsInSilentMode?: boolean;
		staysActiveInBackground?: boolean;
		shouldPlayInBackground?: boolean;
	}) => Promise<void>;
}

const SOURCES: Record<SoundName, number> = {
	blip: require("@/assets/audio/blip.wav"),
	chime: require("@/assets/audio/chime.wav"),
	crank: require("@/assets/audio/crank.wav"),
	creak: require("@/assets/audio/creak.wav"),
	deepbell: require("@/assets/audio/deepbell.wav"),
	downer: require("@/assets/audio/downer.wav"),
	fanfare: require("@/assets/audio/fanfare.wav"),
	knock: require("@/assets/audio/knock.wav"),
	marimba: require("@/assets/audio/marimba.wav"),
	neon: require("@/assets/audio/neon.wav"),
	shield: require("@/assets/audio/shield.wav"),
	touch: require("@/assets/audio/touch.wav"),
};

const VOLUMES: Record<SoundName, number> = {
	blip: 0.45,
	chime: 0.9,
	crank: 0.8,
	creak: 0.7,
	deepbell: 0.9,
	downer: 0.85,
	fanfare: 1,
	knock: 0.9,
	marimba: 0.7,
	neon: 0.7,
	shield: 0.95,
	touch: 0.6,
};

let api: AudioApi | null | undefined;

function loadApi(): AudioApi | null {
	if (api !== undefined) {
		return api;
	}
	if (Platform.OS === "web") {
		api = null;
		return api;
	}
	try {
		api = require("expo-audio") as AudioApi;
		api.setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
	} catch {
		api = null;
	}
	return api;
}

const players = new Map<SoundName, AudioPlayerLike>();

function playerFor(name: SoundName): AudioPlayerLike | null {
	const cached = players.get(name);
	if (cached) {
		return cached;
	}
	const audio = loadApi();
	if (!audio) {
		return null;
	}
	try {
		const player = audio.createAudioPlayer(SOURCES[name]);
		player.volume = VOLUMES[name];
		players.set(name, player);
		return player;
	} catch {
		return null;
	}
}

/** Plays a sound effect. Safe to call anywhere — no-ops if audio is unavailable. */
export function playSound(name: SoundName): void {
	const player = playerFor(name);
	if (!player) {
		return;
	}
	try {
		player.seekTo(0);
		player.play();
	} catch {
		// Audio is best-effort; never let it crash the game.
	}
}

/** Plays the ring sound of a door design (each door announces itself differently). */
export function playRingSound(bellStyle: BellStyle): void {
	switch (bellStyle) {
		case "knocker":
			playSound("knock");
			break;
		case "crank":
			playSound("crank");
			break;
		case "touch":
			playSound("touch");
			break;
		case "neon":
			playSound("neon");
			break;
		default:
			playSound("chime");
	}
}

/** Plays a purchased ring sound by its catalog id (dingdong, knock, crank, neon, deepbell, marimba). */
export function playSoundById(soundId: string): void {
	switch (soundId) {
		case "knock":
			playSound("knock");
			break;
		case "crank":
			playSound("crank");
			break;
		case "neon":
			playSound("neon");
			break;
		case "deepbell":
			playSound("deepbell");
			break;
		case "marimba":
			playSound("marimba");
			break;
		default:
			playSound("chime");
	}
}

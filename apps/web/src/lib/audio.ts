let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") {
		return null;
	}
	const AudioCtor =
		window.AudioContext ??
		(window as typeof window & { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	if (!AudioCtor) {
		return null;
	}
	if (!audioContext) {
		audioContext = new AudioCtor();
	}
	return audioContext;
}

/** Resumes a suspended AudioContext, then schedules `schedule` so its tones
 * land on a running clock. Browsers freeze `currentTime` while suspended;
 * scheduling before resume makes every note collapse onto one instant. */
function playOnReady(schedule: () => void): void {
	const context = getAudioContext();
	if (!context) {
		return;
	}
	if (context.state === "suspended") {
		context.resume().then(schedule).catch(schedule);
		return;
	}
	schedule();
}

interface ToneOptions {
	delay?: number;
	duration?: number;
	type?: OscillatorType;
	volume?: number;
}

function tone(frequency: number, options: ToneOptions = {}): void {
	const context = getAudioContext();
	if (!context) {
		return;
	}
	const { delay = 0, duration = 0.5, type = "sine", volume = 0.25 } = options;
	const start = context.currentTime + delay;
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, start);
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.start(start);
	oscillator.stop(start + duration + 0.05);
}

/** Classic two-tone doorbell: ding… dong. */
export function playDingDong(): void {
	playOnReady(() => {
		tone(987.77, { delay: 0, duration: 0.4, volume: 0.3 }); // B5
		tone(783.99, { delay: 0.26, duration: 0.55, volume: 0.34 }); // G5
	});
}

/** Rising sparkle arpeggio for catches and success moments. */
export function playSparkle(): void {
	playOnReady(() => {
		const notes = [523.25, 659.25, 783.99, 1046.5];
		for (const [index, note] of notes.entries()) {
			tone(note, {
				delay: index * 0.09,
				duration: 0.4,
				type: "triangle",
				volume: 0.22,
			});
		}
	});
}

/** Soft thud for a door swinging open. */
export function playThud(): void {
	playOnReady(() => {
		tone(140, { delay: 0, duration: 0.22, type: "sine", volume: 0.4 });
		tone(70, { delay: 0.02, duration: 0.28, type: "sine", volume: 0.28 });
	});
}

/** Gentle descending tone for a missed ring / loss. */
export function playMiss(): void {
	playOnReady(() => {
		tone(392, { delay: 0, duration: 0.3, type: "triangle", volume: 0.22 });
		tone(311.13, { delay: 0.18, duration: 0.4, type: "triangle", volume: 0.2 });
	});
}

/**
 * Door-specific ring sounds — every door design announces itself differently.
 * A brass bell ding-dongs, a cottage knocker knocks, a Victorian crank
 * clatters, a modern touch pad pings, and a neon bell glides.
 */
export function playRingSound(
	bellStyle: "bell" | "knocker" | "crank" | "touch" | "neon"
): void {
	switch (bellStyle) {
		case "knocker":
			playKnock();
			break;
		case "crank":
			playCrank();
			break;
		case "touch":
			playTouchPing();
			break;
		case "neon":
			playNeonGlide();
			break;
		default:
			playDingDong();
	}
}

/** Two low, heavy knocks — the cottage iron knocker. */
function playKnock(): void {
	playOnReady(() => {
		tone(160, { delay: 0, duration: 0.14, type: "sine", volume: 0.6 });
		tone(120, { delay: 0.28, duration: 0.2, type: "sine", volume: 0.6 });
	});
}

/** A bright mechanical rattle — an antique crank bell being turned. */
function playCrank(): void {
	playOnReady(() => {
		const clicks = [0, 0.06, 0.13, 0.2, 0.28, 0.36];
		for (const [index, delay] of clicks.entries()) {
			tone(820 + (index % 2) * 220, {
				delay,
				duration: 0.05,
				type: "square",
				volume: 0.22,
			});
		}
	});
}

/** A clean, crisp double ping — the modern touch bell. */
function playTouchPing(): void {
	playOnReady(() => {
		tone(1318.5, { delay: 0, duration: 0.3, type: "sine", volume: 0.3 });
		tone(1760, { delay: 0.08, duration: 0.24, type: "sine", volume: 0.18 });
	});
}

/** A rising synth glide — the neon night doorbell. */
function playNeonGlide(): void {
	playOnReady(() => {
		const context = getAudioContext();
		if (!context) {
			return;
		}
		const start = context.currentTime;
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.type = "sawtooth";
		oscillator.frequency.setValueAtTime(220, start);
		oscillator.frequency.exponentialRampToValueAtTime(880, start + 0.35);
		gain.gain.setValueAtTime(0.0001, start);
		gain.gain.exponentialRampToValueAtTime(0.2, start + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
		oscillator.connect(gain);
		gain.connect(context.destination);
		oscillator.start(start);
		oscillator.stop(start + 0.52);
	});
}

/** A warm, low two-tone that echoes — the deep doorbell. */
function playDeepBell(): void {
	playOnReady(() => {
		tone(392, { delay: 0, duration: 0.7, type: "sine", volume: 0.36 });
		tone(293.66, { delay: 0.32, duration: 0.95, type: "sine", volume: 0.34 });
	});
}

/** A cheerful rising marimba riff. */
function playMarimba(): void {
	playOnReady(() => {
		const notes = [523.25, 659.25, 783.99, 1046.5];
		for (const [index, note] of notes.entries()) {
			tone(note, {
				delay: index * 0.1,
				duration: 0.3,
				type: "triangle",
				volume: 0.26,
			});
		}
	});
}

/** Plays a ring sound by its catalog id (dingdong, knock, crank, neon, deepbell, marimba). */
export function playSoundById(soundId: string): void {
	switch (soundId) {
		case "knock":
			playKnock();
			break;
		case "crank":
			playCrank();
			break;
		case "neon":
			playNeonGlide();
			break;
		case "deepbell":
			playDeepBell();
			break;
		case "marimba":
			playMarimba();
			break;
		default:
			playDingDong();
	}
}

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
	if (audioContext.state === "suspended") {
		audioContext.resume().catch(() => undefined);
	}
	return audioContext;
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
	tone(987.77, { delay: 0, duration: 0.4, volume: 0.2 }); // B5
	tone(783.99, { delay: 0.26, duration: 0.55, volume: 0.24 }); // G5
}

/** Rising sparkle arpeggio for catches and success moments. */
export function playSparkle(): void {
	const notes = [523.25, 659.25, 783.99, 1046.5];
	for (const [index, note] of notes.entries()) {
		tone(note, {
			delay: index * 0.09,
			duration: 0.4,
			type: "triangle",
			volume: 0.16,
		});
	}
}

/** Soft thud for a door swinging open. */
export function playThud(): void {
	tone(140, { delay: 0, duration: 0.22, type: "sine", volume: 0.4 });
	tone(70, { delay: 0.02, duration: 0.28, type: "sine", volume: 0.28 });
}

/** Gentle descending tone for a missed ring / loss. */
export function playMiss(): void {
	tone(392, { delay: 0, duration: 0.3, type: "triangle", volume: 0.2 });
	tone(311.13, { delay: 0.18, duration: 0.4, type: "triangle", volume: 0.18 });
}

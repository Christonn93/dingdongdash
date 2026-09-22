import { useEffect } from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	useAnimatedProps,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import Svg, {
	Circle,
	Defs,
	Ellipse,
	G,
	LinearGradient,
	Path,
	RadialGradient,
	Rect,
	Stop,
} from "react-native-svg";
import { useUniwind } from "uniwind";

/**
 * DingDongDitch · the doorstep.
 *
 * A warm wooden front door at night (or dawn in light mode) with a brass
 * doorbell, a glowing porch light and a welcome mat. The door physically
 * jitters when someone rings, the bell pulses, and it swings open on its
 * left hinge when you answer.
 *
 * All scene geometry lives in a fixed 300×420 viewBox so it scales cleanly
 * to any container size.
 */

const SCENE_W = 300;
const SCENE_H = 420;

const DOOR = {
	bellRed: "#ef4444",
	day: {
		floor: "#bfc7d9",
		floorLight: "#d3dae8",
		skyBottom: "#fde9c8",
		skyMid: "#e0e7ff",
		skyTop: "#eef2ff",
		wall: "#d7dce9",
		wallLight: "#e6eaf5",
	},
	handle: "#fcd34d",
	handleDark: "#d97706",
	interior: "#241209",
	interiorGlow: "#ffb86b",
	mat: "#e8663c",
	matDark: "#c14f2a",
	metal: "#d4d4d8",
	night: {
		floor: "#140f2c",
		floorLight: "#241c46",
		skyBottom: "#372b63",
		skyMid: "#1b1240",
		skyTop: "#0a0620",
		wall: "#231c44",
		wallLight: "#2b2352",
	},
	panel: "#96500f",
	panelDark: "#7c3a08",
	panelLight: "#b46214",
	trim: "#4a2c16",
	trimLight: "#6b4223",
	woodBottom: "#7c3a08",
	woodMid: "#a84c0d",
	woodTop: "#c2620f",
};

export type DoorPhase = "idle" | "ringing" | "open" | "closed";

interface DoorSceneProps {
	/** 0 → 1 fraction of countdown remaining. Drives the bell ring. */
	countdownFraction?: number;
	disabled?: boolean;
	/**
	 * What tapping the door does while `phase` is "idle":
	 * - "ring" → press the doorbell (default, dashboard)
	 * - "open" → swing the door open (game entry)
	 */
	idleAction?: "ring" | "open";
	onOpen?: () => void;
	onRing?: () => void;
	phase: DoorPhase;
	size?: number;
	style?: StyleProp<ViewStyle>;
}

const BELL_CX = 247;
const BELL_CY = 250;
const BELL_RADIUS = 21;
const BELL_CIRCUMFERENCE = 2 * Math.PI * BELL_RADIUS;

export function DoorScene({
	phase,
	countdownFraction = 1,
	onOpen,
	onRing,
	size = 320,
	disabled = false,
	idleAction = "ring",
	style,
}: DoorSceneProps) {
	const reducedMotion = useReducedMotion();
	const { theme } = useUniwind();
	const isDark = theme === "dark";

	// Animation drivers
	const jitter = useSharedValue(0);
	const bellPulse = useSharedValue(0);
	const lightPulse = useSharedValue(0);
	const swing = useSharedValue(0);
	const countdown = useSharedValue(countdownFraction);

	// Swing the door open / reset
	useEffect(() => {
		if (phase === "open") {
			swing.value = withSpring(1, { damping: 13, mass: 0.9, stiffness: 120 });
		} else if (phase === "idle") {
			swing.value = withTiming(0, { duration: 350 });
		}
	}, [phase, swing]);

	// Sync countdown ring from React prop
	useEffect(() => {
		countdown.value = countdownFraction;
	}, [countdownFraction, countdown]);

	// Porch light: slow breathe when idle, frantic flash when ringing
	useEffect(() => {
		if (reducedMotion) {
			lightPulse.value = 0.8;
			return;
		}
		if (phase === "ringing") {
			lightPulse.value = withRepeat(
				withSequence(
					withTiming(1, { duration: 180 }),
					withTiming(0.25, { duration: 180 })
				),
				-1,
				false
			);
		} else {
			lightPulse.value = withRepeat(
				withSequence(
					withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
					withTiming(0.55, { duration: 1800, easing: Easing.inOut(Easing.sin) })
				),
				-1,
				true
			);
		}
		return () => cancelAnimation(lightPulse);
	}, [phase, reducedMotion, lightPulse]);

	// Doorbell: gentle throb idle, frantic red pulse when ringing
	useEffect(() => {
		if (reducedMotion) {
			bellPulse.value = 0.6;
			return;
		}
		if (phase === "ringing") {
			bellPulse.value = withRepeat(
				withSequence(
					withTiming(1, { duration: 160 }),
					withTiming(0.2, { duration: 160 })
				),
				-1,
				false
			);
		} else {
			bellPulse.value = withRepeat(
				withSequence(
					withTiming(0.75, {
						duration: 1200,
						easing: Easing.inOut(Easing.sin),
					}),
					withTiming(0.35, { duration: 1200, easing: Easing.inOut(Easing.sin) })
				),
				-1,
				true
			);
		}
		return () => cancelAnimation(bellPulse);
	}, [phase, reducedMotion, bellPulse]);

	// Door jitter while ringing
	useEffect(() => {
		if (reducedMotion || phase !== "ringing") {
			jitter.value = 0;
			return;
		}
		jitter.value = withRepeat(
			withSequence(
				withTiming(-2.5, { duration: 45 }),
				withTiming(2.5, { duration: 45 }),
				withTiming(-2, { duration: 45 }),
				withTiming(2, { duration: 45 }),
				withTiming(0, { duration: 45 })
			),
			-1,
			true
		);
		return () => cancelAnimation(jitter);
	}, [phase, reducedMotion, jitter]);

	const doorStyle = useAnimatedStyle(() => {
		const rotateY = interpolate(swing.value, [0, 1], [0, -86]);
		return {
			transform: [
				{ translateX: jitter.value },
				{ perspective: 900 },
				{ rotateY: `${rotateY}deg` },
			],
		};
	});

	const porchLightProps = useAnimatedProps(() => ({
		opacity: interpolate(lightPulse.value, [0, 1], [0.3, 0.95]),
		r: interpolate(lightPulse.value, [0, 1], [34, 44]),
	}));

	const bellHaloProps = useAnimatedProps(() => {
		const ringing = phase === "ringing";
		return {
			opacity: interpolate(
				bellPulse.value,
				[0, 1],
				[0.3, ringing ? 0.95 : 0.7]
			),
			r: interpolate(bellPulse.value, [0, 1], [24, ringing ? 33 : 28]),
		};
	});

	const bellButtonProps = useAnimatedProps(() => ({
		opacity: 1,
		r: interpolate(bellPulse.value, [0, 1], [11, 9.4]),
	}));

	const bellRingProps = useAnimatedProps(() => {
		const progress = Math.min(Math.max(countdown.value, 0), 1);
		return {
			strokeDashoffset: BELL_CIRCUMFERENCE * (1 - progress),
		};
	});

	const spillProps = useAnimatedProps(() => ({
		opacity: interpolate(swing.value, [0, 0.35, 1], [0, 0.55, 0.75]),
	}));

	const palette = isDark ? DOOR.night : DOOR.day;
	const sceneH = size * (SCENE_H / SCENE_W);

	return (
		<View
			style={[
				{
					borderRadius: size * 0.06,
					height: sceneH,
					overflow: "hidden",
					position: "relative",
					width: size,
				},
				style,
			]}
		>
			{/* ── Backdrop: sky, wall, porch, interior glow, frame, light, bell ── */}
			<Svg height="100%" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} width="100%">
				<Defs>
					<LinearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
						<Stop offset="0" stopColor={palette.skyTop} />
						<Stop offset="0.6" stopColor={palette.skyMid} />
						<Stop offset="1" stopColor={palette.skyBottom} />
					</LinearGradient>
					<LinearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
						<Stop offset="0" stopColor={palette.wallLight} />
						<Stop offset="1" stopColor={palette.wall} />
					</LinearGradient>
					<LinearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
						<Stop offset="0" stopColor={palette.floorLight} />
						<Stop offset="1" stopColor={palette.floor} />
					</LinearGradient>
					<LinearGradient id="wood" x1="0" x2="0" y1="0" y2="1">
						<Stop offset="0" stopColor={DOOR.woodTop} />
						<Stop offset="0.5" stopColor={DOOR.woodMid} />
						<Stop offset="1" stopColor={DOOR.woodBottom} />
					</LinearGradient>
					<RadialGradient cx="50%" cy="50%" id="porchGlow" r="50%">
						<Stop offset="0" stopColor="#ffd28a" stopOpacity="0.95" />
						<Stop offset="0.55" stopColor="#ffb14e" stopOpacity="0.5" />
						<Stop offset="1" stopColor="#ffb14e" stopOpacity="0" />
					</RadialGradient>
					<RadialGradient cx="50%" cy="42%" id="hallway" r="70%">
						<Stop offset="0" stopColor={DOOR.interiorGlow} stopOpacity="0.9" />
						<Stop offset="0.55" stopColor="#a85a1c" stopOpacity="0.55" />
						<Stop offset="1" stopColor={DOOR.interior} stopOpacity="0.95" />
					</RadialGradient>
					<RadialGradient cx="50%" cy="50%" id="bellGlow" r="50%">
						<Stop offset="0" stopColor="#ffdf9e" stopOpacity="0.95" />
						<Stop offset="0.6" stopColor="#ff9e2c" stopOpacity="0.45" />
						<Stop offset="1" stopColor="#ff9e2c" stopOpacity="0" />
					</RadialGradient>
					<LinearGradient id="handleGold" x1="0" x2="1" y1="0" y2="1">
						<Stop offset="0" stopColor="#ffe08a" />
						<Stop offset="0.5" stopColor={DOOR.handle} />
						<Stop offset="1" stopColor={DOOR.handleDark} />
					</LinearGradient>
				</Defs>

				{/* Sky */}
				<Rect fill="url(#sky)" height={SCENE_H} width={SCENE_W} x="0" y="0" />

				{/* Stars (night only) */}
				{isDark ? (
					<G opacity="0.8">
						<Circle cx="36" cy="52" fill="#fff" opacity="0.9" r="1.6" />
						<Circle cx="62" cy="26" fill="#fff" opacity="0.6" r="1.1" />
						<Circle cx="252" cy="38" fill="#fff" opacity="0.8" r="1.5" />
						<Circle cx="276" cy="70" fill="#fff" opacity="0.5" r="1" />
						<Circle cx="20" cy="110" fill="#fff" opacity="0.5" r="1" />
						<Circle cx="286" cy="150" fill="#fff" opacity="0.6" r="1.2" />
					</G>
				) : null}

				{/* Wall */}
				<Rect fill="url(#wall)" height="328" width={SCENE_W} x="0" y="42" />

				{/* Interior / lit hallway (revealed when the door swings open) */}
				<Rect
					fill="url(#hallway)"
					height="300"
					rx="16"
					width="160"
					x="70"
					y="64"
				/>

				{/* Door frame trim */}
				<Rect
					fill="none"
					height="312"
					rx="18"
					stroke={DOOR.trimLight}
					strokeWidth="8"
					width="172"
					x="64"
					y="58"
				/>
				<Rect
					fill="none"
					height="300"
					rx="14"
					stroke={DOOR.trim}
					strokeWidth="3"
					width="160"
					x="70"
					y="64"
				/>

				{/* Porch light glow + fixture */}
				<AnimatedCircle
					animatedProps={porchLightProps}
					cx={150}
					cy={26}
					fill="url(#porchGlow)"
					r={40}
				/>
				<Rect
					fill={DOOR.trimLight}
					height="14"
					rx="3"
					width="20"
					x="140"
					y="8"
				/>
				<Rect fill="#ffe9b3" height="9" rx="2" width="12" x="144" y="20" />

				{/* Doorbell: glow halo, brass base, button, countdown ring */}
				<AnimatedCircle
					animatedProps={bellHaloProps}
					cx={BELL_CX}
					cy={BELL_CY}
					fill="url(#bellGlow)"
					r={26}
				/>
				<Circle cx={BELL_CX} cy={BELL_CY} fill={DOOR.trimLight} r={15} />
				<AnimatedCircle
					animatedProps={bellButtonProps}
					cx={BELL_CX}
					cy={BELL_CY}
					fill="url(#handleGold)"
					r={11}
				/>
				<Circle
					cx={BELL_CX - 2.5}
					cy={BELL_CY - 3}
					fill="#fff8e1"
					opacity="0.85"
					r={3.5}
				/>
				{phase === "ringing" ? (
					<AnimatedCircle
						animatedProps={bellRingProps}
						cx={BELL_CX}
						cy={BELL_CY}
						fill="none"
						r={BELL_RADIUS}
						stroke={DOOR.bellRed}
						strokeDasharray={`${BELL_CIRCUMFERENCE}`}
						strokeLinecap="round"
						strokeWidth="3.5"
					/>
				) : null}

				{/* Porch floor + welcome mat */}
				<Rect fill="url(#floor)" height="52" width={SCENE_W} x="0" y="368" />
				{/* Warm light spilling onto the step when the door opens */}
				<AnimatedEllipse
					animatedProps={spillProps}
					cx={150}
					cy={396}
					fill="#ffc266"
					rx={96}
					ry={26}
				/>
				<Rect fill={DOOR.mat} height="32" rx="10" width="96" x="102" y="376" />
				<Rect
					fill="none"
					height="20"
					rx="7"
					stroke={DOOR.matDark}
					strokeWidth="2.5"
					width="84"
					x="108"
					y="382"
				/>
				<Path
					d="M118 392 h64 M118 398 h64"
					opacity="0.55"
					stroke={DOOR.matDark}
					strokeWidth="2"
				/>
			</Svg>

			{/* ── The door (a real 3D-swinging layer) ── */}
			<Animated.View
				pointerEvents="none"
				style={[
					{
						height: `${(300 / SCENE_H) * 100}%`,
						left: `${(70 / SCENE_W) * 100}%`,
						position: "absolute",
						top: `${(64 / SCENE_H) * 100}%`,
						transformOrigin: "left center",
						width: `${(160 / SCENE_W) * 100}%`,
					},
					doorStyle,
				]}
			>
				<Svg height="100%" viewBox="0 0 160 300" width="100%">
					<Defs>
						<LinearGradient id="doorWood" x1="0" x2="0" y1="0" y2="1">
							<Stop offset="0" stopColor={DOOR.woodTop} />
							<Stop offset="0.5" stopColor={DOOR.woodMid} />
							<Stop offset="1" stopColor={DOOR.woodBottom} />
						</LinearGradient>
						<LinearGradient id="knob" x1="0" x2="1" y1="0" y2="1">
							<Stop offset="0" stopColor="#ffe08a" />
							<Stop offset="0.5" stopColor={DOOR.handle} />
							<Stop offset="1" stopColor={DOOR.handleDark} />
						</LinearGradient>
					</Defs>

					{/* Door body */}
					<Rect fill="url(#doorWood)" height="300" width="160" x="0" y="0" />
					<Rect fill="#fff" height="4" opacity="0.18" width="160" x="0" y="0" />

					{/* Panels (2×2) */}
					<PanelRect h={92} w={52} x={14} y={26} />
					<PanelRect h={92} w={52} x={94} y={26} />
					<PanelRect h={108} w={52} x={14} y={146} />
					<PanelRect h={108} w={52} x={94} y={146} />

					{/* Peephole */}
					<Circle cx={80} cy={46} fill={DOOR.panelDark} r={6.5} />
					<Circle cx={80} cy={46} fill="#1c0f05" r={4} />
					<Circle cx={80} cy={46} fill="#ffe9b3" opacity="0.9" r={1.4} />

					{/* Hinges (left edge) */}
					<Rect fill={DOOR.metal} height="7" rx="3" width="16" x="0" y="52" />
					<Rect fill={DOOR.metal} height="7" rx="3" width="16" x="0" y="150" />
					<Rect fill={DOOR.metal} height="7" rx="3" width="16" x="0" y="248" />

					{/* Handle (right edge, far from hinge) */}
					<Rect
						fill={DOOR.handleDark}
						height="58"
						rx="6"
						width="13"
						x="118"
						y="118"
					/>
					<Rect
						fill="url(#knob)"
						height="54"
						rx="4"
						width="9"
						x="120"
						y="120"
					/>
					<Circle cx={144} cy={147} fill={DOOR.panelDark} r={8} />
					<Circle cx={144} cy={147} fill="url(#knob)" r={6.4} />
					<Circle cx={142} cy={145} fill="#fff" opacity="0.8" r={1.8} />
				</Svg>
			</Animated.View>

			{/* Tap surface: the door opens when ringing… or when idleAction is "open" */}
			<Pressable
				accessibilityLabel="Open the door"
				disabled={
					disabled ||
					phase === "open" ||
					phase === "closed" ||
					(phase === "idle" && idleAction !== "open")
				}
				onPress={() => onOpen?.()}
				style={{
					borderRadius: 16,
					height: `${(300 / SCENE_H) * 100}%`,
					left: `${(70 / SCENE_W) * 100}%`,
					position: "absolute",
					top: `${(64 / SCENE_H) * 100}%`,
					width: `${(160 / SCENE_W) * 100}%`,
				}}
			/>

			{/* …and the doorbell is its own button when idle */}
			<Pressable
				accessibilityLabel={
					idleAction === "open" ? "Open the door" : "Ring the doorbell"
				}
				disabled={disabled || phase === "ringing"}
				hitSlop={10}
				onPress={() => {
					if (idleAction === "open") {
						onOpen?.();
					} else {
						onRing?.();
					}
				}}
				style={{
					borderRadius: 999,
					height: `${(60 / SCENE_H) * 100}%`,
					left: `${(BELL_CX / SCENE_W) * 100}%`,
					position: "absolute",
					top: `${(BELL_CY / SCENE_H) * 100}%`,
					transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
					width: `${(60 / SCENE_W) * 100}%`,
				}}
			/>
		</View>
	);
}

/** Inset door panel: darker recessed rect with a lit inner edge. */
function PanelRect({
	x,
	y,
	w,
	h,
}: {
	x: number;
	y: number;
	w: number;
	h: number;
}) {
	return (
		<G>
			<Rect
				fill={DOOR.panel}
				height={h}
				rx={10}
				stroke={DOOR.panelLight}
				strokeWidth="1.5"
				width={w}
				x={x}
				y={y}
			/>
			<Rect
				fill={DOOR.panelDark}
				height={h - 10}
				opacity="0.65"
				rx={7}
				width={w - 10}
				x={x + 5}
				y={y + 5}
			/>
			<Rect
				fill="#fff"
				height={3}
				opacity="0.12"
				rx={1.5}
				width={w - 10}
				x={x + 5}
				y={y + 5}
			/>
		</G>
	);
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

import {
	type BellStyle,
	DOOR_SKINS,
	type DoorSkinTheme,
} from "@dingdongdash/api/lib/door-catalog";
import type { ComponentProps } from "react";
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
	Line,
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
	handle: "#f2c14e",
	handleDark: "#b07a24",
	interior: "#241209",
	interiorGlow: "#ffb86b",
	mat: "#e8663c",
	matDark: "#c14f2a",
	metal: "#c9a24a",
	night: {
		floor: "#140f2c",
		floorLight: "#241c46",
		skyBottom: "#372b63",
		skyMid: "#1b1240",
		skyTop: "#0a0620",
		wall: "#231c44",
		wallLight: "#2b2352",
	},
	panel: "#b9782f",
	panelDark: "#7a4418",
	panelLight: "#c98a3e",
	trim: "#4a2c16",
	trimLight: "#6b4223",
	woodBottom: "#663a15",
	woodMid: "#864e1f",
	woodTop: "#a8642e",
};

export type DoorPhase = "idle" | "ringing" | "open" | "closed";

interface DoorSceneProps {
	/** Camera doorbell installed — replaces the bell with a camera unit. */
	cameraDoorbell?: boolean;
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
	/** The owner's chosen door-skin theme (defaults to The Classic). */
	skin?: DoorSkinTheme;
	/** Spy camera installed above the door. */
	spyCamera?: boolean;
	style?: StyleProp<ViewStyle>;
}

const BELL_CX = 252;
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
	cameraDoorbell = false,
	skin,
	spyCamera = false,
	style,
}: DoorSceneProps) {
	const reducedMotion = useReducedMotion();
	const { theme } = useUniwind();
	const isDark = theme === "dark";
	const skinTheme = skin ?? DOOR_SKINS[0].theme;
	const isArch = skinTheme.shape === "arch";
	const hasKnocker = skinTheme.bellStyle === "knocker";
	const isWoodSkin =
		skinTheme.bellStyle !== "touch" && skinTheme.bellStyle !== "neon";

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
			testID="house"
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
						<Stop offset="0" stopColor={skinTheme.wall.from} />
						<Stop offset="1" stopColor={skinTheme.wall.to} />
					</LinearGradient>
					<LinearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
						<Stop offset="0" stopColor={palette.floorLight} />
						<Stop offset="1" stopColor={palette.floor} />
					</LinearGradient>
					<LinearGradient id="wood" x1="0" x2="0" y1="0" y2="1">
						<Stop offset="0" stopColor={skinTheme.door.from} />
						<Stop offset="0.55" stopColor={skinTheme.door.to} />
						<Stop offset="1" stopColor={skinTheme.door.to} />
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
						<Stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
						<Stop offset="0.5" stopColor={skinTheme.hardware} />
						<Stop offset="1" stopColor={skinTheme.hardware} />
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
				<WallTexture bellStyle={skinTheme.bellStyle} frame={skinTheme.frame} />

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
					stroke={skinTheme.frame}
					strokeWidth="8"
					width="172"
					x="64"
					y="58"
				/>
				<Rect
					fill="none"
					height="300"
					rx="14"
					stroke={skinTheme.frame}
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
					fill={skinTheme.frame}
					height="14"
					rx="3"
					width="20"
					x="140"
					y="8"
				/>
				<Rect fill="#ffe9b3" height="9" rx="2" width="12" x="144" y="20" />

				{/* Spy camera above the door */}
				{spyCamera ? <SpyCamera /> : null}

				{/* Lit window on the right wall */}
				<WallWindow frame={skinTheme.frame} />

				{/* Doorbell (wall-mounted for all but knocker skins) */}
				{hasKnocker ? null : (
					<WallBell
						bellButtonProps={bellButtonProps}
						bellHaloProps={bellHaloProps}
						bellRingProps={bellRingProps}
						cameraDoorbell={cameraDoorbell}
						phase={phase}
						skinTheme={skinTheme}
					/>
				)}

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
				style={[
					{
						height: `${(300 / SCENE_H) * 100}%`,
						left: `${(70 / SCENE_W) * 100}%`,
						pointerEvents: "none",
						position: "absolute",
						top: `${(64 / SCENE_H) * 100}%`,
						transformOrigin: "left center",
						width: `${(160 / SCENE_W) * 100}%`,
					},
					doorStyle,
				]}
				testID="door"
			>
				<Svg height="100%" viewBox="0 0 160 300" width="100%">
					<Defs>
						<LinearGradient id="doorWood" x1="0" x2="0" y1="0" y2="1">
							<Stop offset="0" stopColor={skinTheme.door.from} />
							<Stop offset="0.55" stopColor={skinTheme.door.to} />
							<Stop offset="1" stopColor={skinTheme.door.to} />
						</LinearGradient>
						<LinearGradient id="knob" x1="0" x2="1" y1="0" y2="1">
							<Stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
							<Stop offset="0.5" stopColor={skinTheme.hardware} />
							<Stop offset="1" stopColor={skinTheme.hardware} />
						</LinearGradient>
					</Defs>

					{/* Door body — rect, or an arched cottage door */}
					{isArch ? (
						<Path
							d="M0 300 L0 96 A80 80 0 0 1 160 96 L160 300 Z"
							fill="url(#doorWood)"
						/>
					) : (
						<Rect
							fill="url(#doorWood)"
							height="300"
							rx="8"
							width="160"
							x="0"
							y="0"
						/>
					)}

					{/* Top sheen */}
					<Rect fill="#fff" height="5" opacity="0.16" width="160" x="0" y="0" />
					<Rect
						fill="#2a1507"
						height="2"
						opacity="0.2"
						width="160"
						x="0"
						y="5"
					/>

					{/* Subtle vertical grain (wood skins) */}
					{isWoodSkin ? (
						<G opacity="0.07" stroke="#1f1105" strokeWidth="1.6">
							<Path d="M26 0v300M52 0v300M80 0v300M106 0v300M134 0v300" />
						</G>
					) : null}

					{/* Plank seams (cottage) */}
					{hasKnocker ? (
						<G opacity="0.14" stroke="#2b331f" strokeWidth="2">
							<Path d="M0 16h160M0 150h160M0 284h160" />
						</G>
					) : null}

					{/* Face treatment per skin */}
					<DoorFace
						bellStyle={skinTheme.bellStyle}
						doorAccent={skinTheme.doorAccent}
						frame={skinTheme.frame}
						hardware={skinTheme.hardware}
						isArch={isArch}
						neon={skinTheme.neon}
					/>

					{/* Peephole */}
					{isArch ? null : (
						<G>
							<Circle cx={80} cy={44} fill="#1f1105" r={7} />
							<Circle cx={80} cy={44} fill="#0c0601" r={4.2} />
							<Circle cx={80} cy={44} fill="#ffe9b3" opacity="0.9" r={1.4} />
						</G>
					)}

					{/* Hinges (left edge) */}
					<Rect
						fill={skinTheme.hardware}
						height="7"
						rx="3"
						width="16"
						x="0"
						y="52"
					/>
					<Rect
						fill={skinTheme.hardware}
						height="7"
						rx="3"
						width="16"
						x="0"
						y="150"
					/>
					<Rect
						fill={skinTheme.hardware}
						height="7"
						rx="3"
						width="16"
						x="0"
						y="248"
					/>
					<G fill="#6b4a14">
						<Circle cx="6" cy="55.5" r="1.6" />
						<Circle cx="6" cy="153.5" r="1.6" />
						<Circle cx="6" cy="251.5" r="1.6" />
					</G>

					{/* Handle (right edge, far from hinge) */}
					<Rect
						fill={skinTheme.hardware}
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
					<Circle cx={144} cy={147} fill={skinTheme.hardware} r={8} />
					<Circle cx={144} cy={147} fill="url(#knob)" r={6.4} />
					<Circle cx={142} cy={145} fill="#fff" opacity="0.8" r={1.8} />

					{/* Iron door knocker (cottage) */}
					{hasKnocker ? <DoorKnocker hardware={skinTheme.hardware} /> : null}

					{/* Bottom rail shadow */}
					<Rect
						fill="#2a1507"
						height="6"
						opacity="0.25"
						width="160"
						x="0"
						y="294"
					/>
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
				testID="door-tap"
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
				testID="bell"
			/>
		</View>
	);
}

/** Subtle wall texture behind the door, per skin. */
function WallTexture({
	bellStyle,
	frame,
}: {
	bellStyle: BellStyle;
	frame: string;
}) {
	if (bellStyle === "neon") {
		return (
			<G opacity="0.9">
				<Circle cx={232} cy={120} fill="#ff5cf0" opacity="0.16" r={48} />
				<Circle cx={64} cy={200} fill="#7c6cff" opacity="0.18" r={36} />
			</G>
		);
	}
	const vertical = bellStyle === "touch";
	const step = vertical ? 30 : 26;
	const count = vertical ? 8 : 12;
	return (
		<G opacity="0.12" stroke={frame} strokeWidth="2">
			{Array.from({ length: count }, (_, i) => {
				const pos = 66 + i * step;
				return vertical ? (
					<Line key={pos} x1={pos} x2={pos} y1={42} y2={370} />
				) : (
					<Line key={pos} x1={0} x2={SCENE_W} y1={pos} y2={pos} />
				);
			})}
		</G>
	);
}

/** Wall-mounted bell — brass bell, antique crank, touch pad, neon ring, or camera doorbell. */
function WallBell({
	bellButtonProps,
	bellHaloProps,
	bellRingProps,
	cameraDoorbell,
	phase,
	skinTheme,
}: {
	bellButtonProps: ComponentProps<typeof AnimatedCircle>["animatedProps"];
	bellHaloProps: ComponentProps<typeof AnimatedCircle>["animatedProps"];
	bellRingProps: ComponentProps<typeof AnimatedCircle>["animatedProps"];
	cameraDoorbell: boolean;
	phase: DoorPhase;
	skinTheme: DoorSkinTheme;
}) {
	const tag = cameraDoorbell ? "camera-doorbell" : skinTheme.bellStyle;

	return (
		<G>
			<AnimatedCircle
				animatedProps={bellHaloProps}
				cx={BELL_CX}
				cy={BELL_CY}
				fill="url(#bellGlow)"
				r={26}
			/>
			<BellBody
				bellButtonProps={bellButtonProps}
				skinTheme={skinTheme}
				tag={tag}
			/>
			{phase === "ringing" ? (
				<AnimatedCircle
					animatedProps={bellRingProps}
					cx={BELL_CX}
					cy={BELL_CY}
					fill="none"
					r={BELL_RADIUS}
					stroke="#ef4444"
					strokeDasharray={`${BELL_CIRCUMFERENCE}`}
					strokeLinecap="round"
					strokeWidth="3.5"
				/>
			) : null}
		</G>
	);
}

function BellBody({
	tag,
	skinTheme,
	bellButtonProps,
}: {
	tag: string;
	skinTheme: DoorSkinTheme;
	bellButtonProps: ComponentProps<typeof AnimatedCircle>["animatedProps"];
}) {
	if (tag === "bell") {
		return (
			<G>
				<Circle cx={BELL_CX} cy={BELL_CY} fill={skinTheme.frame} r={15} />
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
			</G>
		);
	}
	if (tag === "crank") {
		return (
			<G>
				<Rect
					fill="url(#handleGold)"
					height="8"
					rx="2"
					width="14"
					x={BELL_CX - 7}
					y={BELL_CY - 4}
				/>
				<Circle cx={BELL_CX} cy={BELL_CY} fill="url(#handleGold)" r={7} />
				<Circle
					cx={BELL_CX}
					cy={BELL_CY}
					fill="none"
					r={7}
					stroke="#5b3a10"
					strokeWidth="1.5"
				/>
				<Rect
					fill="#5b3a10"
					height="2"
					rx="1"
					width="14"
					x={BELL_CX - 7}
					y={BELL_CY - 1}
				/>
			</G>
		);
	}
	if (tag === "touch") {
		return (
			<G>
				<Rect
					fill="url(#handleGold)"
					height="18"
					rx="3"
					width="14"
					x={BELL_CX - 7}
					y={BELL_CY - 9}
				/>
				<Circle cx={BELL_CX} cy={BELL_CY} fill="#6ee7b7" r={2.5} />
			</G>
		);
	}
	if (tag === "neon") {
		return (
			<G>
				<Circle
					cx={BELL_CX}
					cy={BELL_CY}
					fill={skinTheme.neon ?? "#ff5cf0"}
					r={10}
				/>
				<Circle cx={BELL_CX} cy={BELL_CY} fill="#fff" r={4} />
			</G>
		);
	}
	return (
		<G>
			<Rect
				fill="#f5f5f7"
				height="24"
				rx="3"
				width="18"
				x={BELL_CX - 9}
				y={BELL_CY - 12}
			/>
			<Circle cx={BELL_CX} cy={BELL_CY - 2} fill="#1a1a1f" r={5} />
			<Circle cx={BELL_CX} cy={BELL_CY - 2} fill="#3b4cff" r={2} />
			<Circle cx={BELL_CX + 3} cy={BELL_CY + 7} fill="#f87171" r={1.5} />
		</G>
	);
}

/** A little black security camera peeking from the left wall. */
function SpyCamera() {
	return (
		<G>
			<Rect fill="#1c1c22" height="12" rx="2" width="18" x="28" y="74" />
			<Circle cx="35" cy="80" fill="#0ea5e9" r="3.5" />
			<Rect fill="#18181b" height="3" rx="1.5" width="22" x="26" y="86" />
		</G>
	);
}

/** A warm, lit window with cross bars and a sill, set into the right wall. */
function WallWindow({ frame }: { frame: string }) {
	return (
		<G>
			<Rect fill="#ffe8c0" height="66" rx="8" width="42" x="244" y="64" />
			<Rect
				fill="none"
				height="66"
				rx="8"
				stroke={frame}
				strokeWidth="4"
				width="42"
				x="244"
				y="64"
			/>
			<Rect fill={frame} height="2" width="42" x="244" y="95" />
			<Rect fill={frame} height="66" width="2" x="265" y="64" />
			<Rect fill={frame} height="4" rx="2" width="48" x="241" y="132" />
			<Ellipse cx="265" cy="146" fill="#ffc266" opacity="0.4" rx="30" ry="10" />
		</G>
	);
}

/** The door's face: recessed panels, cottage planks, a modern slab or a neon strip. */
function DoorFace({
	bellStyle,
	doorAccent,
	frame,
	hardware,
	isArch,
	neon,
}: {
	bellStyle: BellStyle;
	doorAccent: string;
	frame: string;
	hardware: string;
	isArch: boolean;
	neon?: string;
}) {
	if (bellStyle === "knocker") {
		return (
			<G>
				<G opacity="0.2" stroke="#2b331f" strokeWidth="2.5">
					<Line x1="40" x2="40" y1="0" y2="300" />
					<Line x1="80" x2="80" y1="0" y2="300" />
					<Line x1="120" x2="120" y1="0" y2="300" />
				</G>
				<Rect
					fill="#2b331f"
					height="14"
					opacity="0.5"
					width="160"
					x="0"
					y="146"
				/>
				<Path
					d="M80 66 L100 84 L80 102 L60 84 Z"
					fill="#cfe8ff"
					stroke={frame}
					strokeWidth="4"
				/>
				<Path d="M80 66 v36 M60 84 h40" stroke="#9cc7ec" strokeWidth="1.5" />
			</G>
		);
	}
	if (bellStyle === "touch") {
		return (
			<G>
				<Rect
					fill="#fff"
					height="160"
					opacity="0.03"
					width="160"
					x="0"
					y="80"
				/>
				<Rect fill={hardware} height="160" rx="7" width="9" x="120" y="80" />
				<Rect
					fill="#fff"
					height="120"
					opacity="0.25"
					rx="3"
					width="3"
					x="123"
					y="100"
				/>
			</G>
		);
	}
	if (bellStyle === "neon") {
		return (
			<G>
				<Rect fill={neon} height="220" rx="4" width="6" x="118" y="40" />
				<Path
					d="M0 20 q80 60 0 160"
					fill="none"
					stroke="#fff"
					strokeOpacity="0.18"
					strokeWidth="10"
				/>
			</G>
		);
	}
	return (
		<G>
			<Panel doorAccent={doorAccent} h={92} w={52} x={14} y={26} />
			<Panel doorAccent={doorAccent} h={92} w={52} x={94} y={26} />
			<Panel doorAccent={doorAccent} h={108} w={52} x={14} y={146} />
			<Panel doorAccent={doorAccent} h={108} w={52} x={94} y={146} />
			{isArch ? null : (
				<Rect fill="#fff" height="5" opacity="0.2" width="160" x="0" y="292" />
			)}
		</G>
	);
}

/** Iron door knocker bolted to the door (cottage). */
function DoorKnocker({ hardware }: { hardware: string }) {
	return (
		<G>
			<Circle cx="80" cy="150" fill={hardware} r="14" />
			<Circle cx="80" cy="150" fill="url(#doorWood)" r="10" />
			<Circle
				cx="80"
				cy="150"
				fill="none"
				r="10"
				stroke={hardware}
				strokeWidth="3"
			/>
			<Circle cx="80" cy="137" fill={hardware} r="3.5" />
		</G>
	);
}

/** Recessed door panel: raised light edge, darker inset, top shadow + bottom light. */
function Panel({
	doorAccent,
	x,
	y,
	w,
	h,
}: {
	doorAccent: string;
	x: number;
	y: number;
	w: number;
	h: number;
}) {
	return (
		<G>
			<Rect
				fill="url(#doorWood)"
				height={h}
				rx={12}
				stroke="#ffffff"
				strokeOpacity="0.25"
				strokeWidth="1.5"
				width={w}
				x={x}
				y={y}
			/>
			<Rect
				fill={doorAccent}
				height={h - 8}
				rx={8}
				width={w - 8}
				x={x + 4}
				y={y + 4}
			/>
			<Rect
				fill="#000"
				height={4}
				opacity="0.35"
				rx={2}
				width={w - 8}
				x={x + 4}
				y={y + 4}
			/>
			<Rect
				fill="#fff"
				height={4}
				opacity="0.18"
				rx={2}
				width={w - 8}
				x={x + 4}
				y={y + h - 8}
			/>
		</G>
	);
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

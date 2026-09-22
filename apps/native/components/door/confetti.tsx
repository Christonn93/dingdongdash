import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from "react-native-reanimated";

/**
 * ConfettiBurst — a one-shot burst of confetti that flies out from the
 * center of its parent. Re-mount it (change `key`) to fire it again.
 */

const CONFETTI_COLORS = [
	"#ff6b6b",
	"#ffc94d",
	"#43e8a4",
	"#6c8cff",
	"#ff8bcb",
	"#ffffff",
	"#ffa04d",
	"#8f7bff",
];

const PIECE_COUNT = 26;

interface PieceConfig {
	angle: number;
	aspect: number;
	color: string;
	delay: number;
	distance: number;
	duration: number;
	id: number;
	round: boolean;
	size: number;
	spin: number;
}

function randomBetween(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

function makePiece(index: number): PieceConfig {
	const angle = (index / PIECE_COUNT) * Math.PI * 2 + randomBetween(-0.3, 0.3);
	return {
		angle,
		aspect: randomBetween(0.4, 1.6),
		color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
		delay: randomBetween(0, 90),
		distance: randomBetween(70, 150),
		duration: randomBetween(700, 1200),
		id: index,
		round: index % 3 === 0,
		size: randomBetween(6, 12),
		spin: randomBetween(-540, 540),
	};
}

function ConfettiPiece({ piece }: { piece: PieceConfig }) {
	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const rotate = useSharedValue(0);
	const opacity = useSharedValue(1);
	const scale = useSharedValue(1);

	const dx = Math.cos(piece.angle) * piece.distance;
	const dy = Math.sin(piece.angle) * piece.distance - 26;

	useEffect(() => {
		tx.value = withDelay(
			piece.delay,
			withSpring(dx, { damping: 14, mass: 0.9, stiffness: 60 })
		);
		ty.value = withDelay(
			piece.delay,
			withSpring(dy, { damping: 14, mass: 0.9, stiffness: 60 })
		);
		rotate.value = withDelay(
			piece.delay,
			withTiming(piece.spin, { duration: piece.duration })
		);
		scale.value = withDelay(
			piece.delay,
			withTiming(0, { duration: piece.duration })
		);
		opacity.value = withDelay(
			piece.delay + 420,
			withTiming(0, { duration: piece.duration - 420 })
		);
	}, [dx, dy, opacity, piece, rotate, scale, tx, ty]);

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [
			{ translateX: tx.value },
			{ translateY: ty.value },
			{ rotate: `${rotate.value}deg` },
			{ scale: scale.value },
		],
	}));

	return (
		<Animated.View
			style={[
				{
					backgroundColor: piece.color,
					borderRadius: piece.round ? piece.size / 2 : 2,
					height: piece.size * piece.aspect,
					position: "absolute",
					width: piece.size,
				},
				style,
			]}
		/>
	);
}

export function ConfettiBurst() {
	const reducedMotion = useReducedMotion();
	const pieces = useMemo(
		() => Array.from({ length: PIECE_COUNT }, (_, i) => makePiece(i)),
		[]
	);

	if (reducedMotion) {
		return null;
	}

	return (
		<View
			style={{
				alignItems: "center",
				inset: 0,
				pointerEvents: "none",
				position: "absolute",
			}}
		>
			{pieces.map((piece) => (
				<ConfettiPiece key={piece.id} piece={piece} />
			))}
		</View>
	);
}

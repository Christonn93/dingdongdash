import type { DoorSkinTheme } from "@dingdongdash/api/lib/door-catalog";
import { useId } from "react";

/**
 * The front door itself — the part that swings on its hinge. Rendered per
 * door-skin theme: wood with recessed panels, planks, or a flush slab, plus
 * the matching hardware. The door knocker is drawn here too (it lives on the
 * door), while wall-mounted bells live on the HouseBackdrop.
 *
 * Hinges are on the LEFT edge and the handle on the RIGHT, matching the
 * left-hinge swing used everywhere. viewBox is 0 0 160 300.
 */
export function DoorArt({
	className,
	theme,
	id,
}: {
	className?: string;
	theme: DoorSkinTheme;
	id?: string;
}) {
	const woodId = useId();
	const knobId = useId();

	const isWood = theme.bellStyle !== "touch" && theme.bellStyle !== "neon";
	const isArch = theme.shape === "arch";

	return (
		<svg
			aria-hidden="true"
			className={className}
			id={id}
			preserveAspectRatio="xMidYMid meet"
			viewBox="0 0 160 300"
		>
			<title>Front door</title>
			<defs>
				<linearGradient id={woodId} x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stopColor={theme.door.from} />
					<stop offset="0.55" stopColor={theme.door.to} />
					<stop offset="1" stopColor={theme.door.to} />
				</linearGradient>
				<linearGradient id={knobId} x1="0" x2="1" y1="0" y2="1">
					<stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
					<stop offset="0.5" stopColor={theme.hardware} />
					<stop offset="1" stopColor={theme.hardware} />
				</linearGradient>
			</defs>

			{/* Door body (rect or arched silhouette) */}
			{isArch ? (
				<path
					d="M0 300 L0 96 A80 80 0 0 1 160 96 L160 300 Z"
					fill={`url(#${woodId})`}
				/>
			) : (
				<rect fill={`url(#${woodId})`} height="300" rx="8" width="160" />
			)}

			{/* Top sheen */}
			<rect fill="#fff" height="5" opacity="0.16" width="160" />
			<rect fill="#000" height="2" opacity="0.18" width="160" y="5" />

			{/* Wood grain (wood skins) */}
			{isWood ? (
				<g opacity="0.07" stroke="#1f1105" strokeWidth="1.6">
					<path d="M26 0v300M52 0v300M80 0v300M106 0v300M134 0v300" />
				</g>
			) : null}

			{/* Plank seams (cottage: planks) */}
			{theme.bellStyle === "knocker" ? (
				<g opacity="0.14" stroke="#2b331f" strokeWidth="2">
					<path d="M0 18h160M0 150h160M0 282h160" />
				</g>
			) : null}

			{/* Face treatment per skin */}
			<DoorFace theme={theme} woodId={woodId} />

			{/* Peephole */}
			{isArch ? null : (
				<>
					<circle cx="80" cy="46" fill="#1f1105" r="7" />
					<circle cx="80" cy="46" fill="#0c0601" r="4.2" />
					<circle cx="80" cy="46" fill="#ffe9b3" opacity="0.9" r="1.4" />
				</>
			)}

			{/* Brass hinges (left edge) */}
			<g fill={theme.hardware}>
				<rect height="7" rx="3" width="16" x="0" y="52" />
				<rect height="7" rx="3" width="16" x="0" y="150" />
				<rect height="7" rx="3" width="16" x="0" y="248" />
			</g>

			{/* Lever handle + knob (right edge, far from the hinge) */}
			<rect
				fill={theme.hardware}
				height="58"
				rx="6"
				width="13"
				x="118"
				y="118"
			/>
			<rect
				fill={`url(#${knobId})`}
				height="54"
				rx="4"
				width="9"
				x="120"
				y="120"
			/>
			<circle cx="144" cy="147" fill={theme.hardware} r="8" />
			<circle cx="144" cy="147" fill={`url(#${knobId})`} r="6.4" />
			<circle cx="142" cy="145" fill="#fff" opacity="0.8" r="1.8" />

			{/* Iron door knocker — sits on the door (cottage) */}
			{theme.bellStyle === "knocker" ? <DoorKnocker theme={theme} /> : null}

			{/* Bottom rail shadow */}
			<rect fill="#000" height="6" opacity="0.2" width="160" y="294" />
		</svg>
	);
}

function DoorFace({ theme, woodId }: { theme: DoorSkinTheme; woodId: string }) {
	if (theme.bellStyle === "knocker") {
		return <CottagePlanks theme={theme} />;
	}
	if (theme.bellStyle === "touch") {
		return <ModernSlab theme={theme} />;
	}
	if (theme.bellStyle === "neon") {
		return <NeonSlab theme={theme} />;
	}
	return <RecessedPanels theme={theme} woodId={woodId} />;
}

/** Classic-style door: 2×2 recessed panels with a raised light edge. */
function RecessedPanels({
	theme,
	woodId,
}: {
	theme: DoorSkinTheme;
	woodId: string;
}) {
	const panel = (x: number, y: number, w: number, h: number) => (
		<g key={`${x}-${y}`}>
			<rect
				fill={`url(#${woodId})`}
				height={h}
				rx="12"
				stroke="#ffffff"
				strokeOpacity="0.25"
				strokeWidth="1.5"
				width={w}
				x={x}
				y={y}
			/>
			<rect
				fill={theme.doorAccent}
				height={h - 8}
				rx="8"
				width={w - 8}
				x={x + 4}
				y={y + 4}
			/>
			<rect
				fill="#000"
				height="4"
				opacity="0.35"
				rx="2"
				width={w - 8}
				x={x + 4}
				y={y + 4}
			/>
			<rect
				fill="#fff"
				height="4"
				opacity="0.18"
				rx="2"
				width={w - 8}
				x={x + 4}
				y={y + h - 8}
			/>
		</g>
	);
	return (
		<>
			{panel(14, 26, 52, 92)}
			{panel(94, 26, 52, 92)}
			{panel(14, 146, 52, 108)}
			{panel(94, 146, 52, 108)}
		</>
	);
}

/** Cottage: vertical plank door with a mid-rail and a small diamond window. */
function CottagePlanks({ theme }: { theme: DoorSkinTheme }) {
	return (
		<>
			<g opacity="0.2" stroke="#2b331f" strokeWidth="2.5">
				<path d="M40 0v300M80 0v300M120 0v300" />
			</g>
			{/* Mid rail */}
			<rect fill="#2b331f" height="14" opacity="0.5" width="160" y="146" />
			{/* Small diamond window */}
			<path
				d="M80 66 L100 84 L80 102 L60 84 Z"
				fill="#cfe8ff"
				stroke={theme.frame}
				strokeWidth="4"
			/>
			<path d="M80 66 v36 M60 84 h40" stroke="#9cc7ec" strokeWidth="1.5" />
		</>
	);
}

/** Modern: flush slab with a slim full-height pull handle. */
function ModernSlab({ theme }: { theme: DoorSkinTheme }) {
	return (
		<>
			<rect fill="#ffffff" height="200" opacity="0.03" width="160" y="60" />
			<rect
				fill={theme.hardware}
				height="160"
				rx="7"
				width="9"
				x="120"
				y="80"
			/>
			<rect
				fill="#ffffff"
				height="120"
				opacity="0.25"
				rx="3"
				width="3"
				x="123"
				y="100"
			/>
		</>
	);
}

/** Neon: glossy slab with a vertical neon strip. */
function NeonSlab({ theme }: { theme: DoorSkinTheme }) {
	return (
		<>
			<rect fill="#ffffff" height="300" opacity="0.06" width="160" />
			{/* Gloss highlight */}
			<path
				d="M0 20 q80 60 0 160"
				fill="none"
				stroke="#fff"
				strokeOpacity="0.18"
				strokeWidth="10"
			/>
			{/* Neon strip near the handle edge */}
			<rect fill={theme.neon} height="220" rx="4" width="6" x="118" y="40">
				<title>Neon strip</title>
			</rect>
		</>
	);
}

/** An iron door knocker: a ring on a striker plate, bolted to the door. */
function DoorKnocker({ theme }: { theme: DoorSkinTheme }) {
	return (
		<g>
			<circle cx="80" cy="150" fill={theme.hardware} r="14" />
			<circle cx="80" cy="150" fill={theme.door.to} r="10" />
			<circle
				cx="80"
				cy="150"
				fill="none"
				r="10"
				stroke={theme.hardware}
				strokeWidth="3"
			/>
			<circle cx="80" cy="137" fill={theme.hardware} r="3.5" />
		</g>
	);
}

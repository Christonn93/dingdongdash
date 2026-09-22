import type { AvatarId } from "@dingdongdash/db/game";

/**
 * Bold, simple local SVG illustrations for the DingDongDitch avatar set.
 * Every illustration lives in a 64×64 viewBox so it stays crisp and
 * recognizable from 24px to 64px. No remote assets, no OS emoji.
 */
export function AvatarArt({
	id,
	className,
}: {
	id: AvatarId;
	className?: string;
}) {
	switch (id) {
		case "doorbell":
			return <DoorbellArt className={className} />;
		case "house":
			return <HouseArt className={className} />;
		case "cat":
			return <CatArt className={className} />;
		case "dog":
			return <DogArt className={className} />;
		case "frog":
			return <FrogArt className={className} />;
		case "ghost":
			return <GhostArt className={className} />;
		case "robot":
			return <RobotArt className={className} />;
		case "mushroom":
			return <MushroomArt className={className} />;
		case "pizza":
			return <PizzaArt className={className} />;
		case "duck":
			return <DuckArt className={className} />;
		case "cloud":
			return <CloudArt className={className} />;
		case "bee":
			return <BeeArt className={className} />;
		case "rocket":
			return <RocketArt className={className} />;
		case "mailbox":
			return <MailboxArt className={className} />;
		case "raccoon":
			return <RaccoonArt className={className} />;
		case "wizard-hat":
			return <WizardHatArt className={className} />;
		default:
			return null;
	}
}

const INK = "#2c2136";
const CREAM = "#fff7e6";
const CORAL = "#f0563d";
const AMBER = "#ffd166";
const WOOD = "#6f4626";

function DoorbellArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Doorbell</title>
			<path
				d="M32 12c7.5 0 13 5.6 13 12.6V27a4 4 0 0 0 4 4h-1.4a4 4 0 0 1-4 4H20.4a4 4 0 0 1-4-4H15a4 4 0 0 0 4-4v-2.4C19 17.6 24.5 12 32 12z"
				fill={CORAL}
			/>
			<path
				d="M26 16a9 8 0 0 0-3 11"
				fill="none"
				opacity="0.5"
				stroke={CREAM}
				strokeLinecap="round"
				strokeWidth="2.4"
			/>
			<rect fill={WOOD} height="13" rx="3.5" width="16" x="24" y="37" />
			<rect fill={AMBER} height="7" rx="2" width="9" x="27.5" y="40" />
		</svg>
	);
}

function HouseArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>House</title>
			<path d="M12 28 32 12l20 16z" fill={WOOD} />
			<rect fill={CORAL} height="24" rx="2" width="32" x="16" y="28" />
			<rect fill={AMBER} height="18" rx="2" width="11" x="26.5" y="34" />
			<circle cx="34" cy="43" fill={WOOD} r="1.7" />
		</svg>
	);
}

function CatArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Cat</title>
			<path d="M20 28 24 14l9 8z" fill={WOOD} />
			<path d="M44 28 40 14l-9 8z" fill={WOOD} />
			<circle cx="32" cy="34" fill={WOOD} r="16" />
			<path d="M23 22h5l-1.5 6zM41 22h-5l1.5 6z" fill={CORAL} />
			<circle cx="26" cy="33" fill={AMBER} r="2.6" />
			<circle cx="38" cy="33" fill={AMBER} r="2.6" />
			<path d="M30 39h4l-2 3z" fill={CORAL} />
			<path
				d="M20 40l6-1M44 40l-6-1"
				stroke={CREAM}
				strokeLinecap="round"
				strokeWidth="1.8"
			/>
		</svg>
	);
}

function DogArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Dog</title>
			<path d="M19 27c-4 3-5 12-2 16l5-2-2-9z" fill={WOOD} />
			<path d="M45 27c4 3 5 12 2 16l-5-2 2-9z" fill={WOOD} />
			<rect fill="#c98d4e" height="26" rx="11" width="26" x="19" y="22" />
			<ellipse cx="32" cy="41" fill={CREAM} rx="9" ry="7" />
			<circle cx="32" cy="38.5" fill={INK} r="2.6" />
			<circle cx="25.5" cy="31" fill={INK} r="2.1" />
			<circle cx="38.5" cy="31" fill={INK} r="2.1" />
		</svg>
	);
}

function FrogArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Frog</title>
			<circle cx="25" cy="22" fill="#38b864" r="6" />
			<circle cx="39" cy="22" fill="#38b864" r="6" />
			<circle cx="25" cy="22" fill={INK} r="2.6" />
			<circle cx="39" cy="22" fill={INK} r="2.6" />
			<ellipse cx="32" cy="38" fill="#38b864" rx="17" ry="15" />
			<circle cx="24" cy="40" fill="#f2b8c6" opacity="0.8" r="3" />
			<circle cx="40" cy="40" fill="#f2b8c6" opacity="0.8" r="3" />
			<path
				d="M24 40q8 5 16 0"
				fill="none"
				stroke="#1f6e3f"
				strokeLinecap="round"
				strokeWidth="2.4"
			/>
		</svg>
	);
}

function GhostArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Ghost</title>
			<path
				d="M18 15a14 14 0 0 1 28 0v31h-3.6l-3.4-3-3.4 3-3.4-3-3.4 3-3.4-3-3.4 3H18z"
				fill="#e2e8f0"
			/>
			<ellipse cx="26" cy="28" fill={INK} rx="2.4" ry="3.4" />
			<ellipse cx="38" cy="28" fill={INK} rx="2.4" ry="3.4" />
			<circle cx="22" cy="34" fill="#f2b8c6" opacity="0.8" r="2" />
			<circle cx="42" cy="34" fill="#f2b8c6" opacity="0.8" r="2" />
		</svg>
	);
}

function RobotArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Robot</title>
			<rect fill="#94a3b8" height="6" width="2" x="31" y="9" />
			<circle cx="32" cy="7" fill={CORAL} r="2.6" />
			<circle cx="16" cy="31" fill={CORAL} r="2.2" />
			<circle cx="48" cy="31" fill={CORAL} r="2.2" />
			<rect fill="#94a3b8" height="31" rx="6" width="32" x="16" y="16" />
			<rect fill="#e2e8f0" height="19" rx="4" width="24" x="20" y="22" />
			<circle cx="27" cy="30" fill={INK} r="3" />
			<circle cx="37" cy="30" fill={INK} r="3" />
			<path
				d="M24 37h16"
				stroke={INK}
				strokeLinecap="round"
				strokeWidth="2.4"
			/>
		</svg>
	);
}

function MushroomArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Mushroom</title>
			<path d="M14 30a18 18 0 0 1 36 0z" fill={CORAL} />
			<circle cx="26" cy="21" fill={CREAM} r="3.2" />
			<circle cx="39" cy="26" fill={CREAM} r="2.6" />
			<circle cx="31" cy="28" fill={CREAM} r="2" />
			<rect fill={CREAM} height="21" rx="4" width="12" x="26" y="30" />
		</svg>
	);
}

function PizzaArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Pizza slice</title>
			<path d="M17 45 45 41 23 17z" fill="#ffd166" />
			<path d="M17 45 45 41 43.5 48.5 18.5 50.5z" fill="#c98d4e" />
			<circle cx="30" cy="33" fill={CORAL} r="2.6" />
			<circle cx="28" cy="26" fill={CORAL} r="2.2" />
		</svg>
	);
}

function DuckArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Rubber duck</title>
			<ellipse cx="32" cy="45" fill="#ffd166" rx="15" ry="10" />
			<circle cx="40" cy="24" fill="#ffd166" r="8.5" />
			<path d="M46 22h8l-5 4z" fill={CORAL} />
			<circle cx="43" cy="22" fill={INK} r="1.7" />
			<ellipse cx="28" cy="45" fill="#ffc93c" rx="7" ry="5" />
		</svg>
	);
}

function CloudArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Cloud</title>
			<circle cx="24" cy="38" fill="#f8fafc" r="9" />
			<circle cx="38" cy="32" fill="#f8fafc" r="11" />
			<circle cx="46" cy="42" fill="#f8fafc" r="8" />
			<circle cx="31" cy="44" fill="#f8fafc" r="9" />
		</svg>
	);
}

function BeeArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Bee</title>
			<path
				d="M28 23l-3-9M36 23l3-9"
				stroke={INK}
				strokeLinecap="round"
				strokeWidth="2"
			/>
			<circle cx="24" cy="12" fill={INK} r="1.6" />
			<circle cx="40" cy="12" fill={INK} r="1.6" />
			<ellipse fill="#e0f2fe" rx="6" ry="4" transform="rotate(-22 25 25)" />
			<ellipse fill="#e0f2fe" rx="6" ry="4" transform="rotate(22 39 25)" />
			<ellipse cx="32" cy="37" fill="#ffd166" rx="12" ry="13" />
			<path d="M22 32h20M22 40h20" stroke={INK} strokeWidth="3" />
			<path d="M44 42l5 5" stroke={INK} strokeLinecap="round" strokeWidth="3" />
			<circle cx="27" cy="35" fill={INK} r="2" />
		</svg>
	);
}

function RocketArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Rocket</title>
			<path d="M26 17h12l-6-9z" fill={CORAL} />
			<path
				d="M32 8c7 0 10 12 10 22a10 10 0 0 1-20 0c0-10 3-22 10-22z"
				fill="#f8fafc"
			/>
			<circle cx="32" cy="27" fill="#38bdf8" r="4" />
			<path d="M24 31 18 40h8zM40 31l6 9h-8z" fill={CORAL} />
			<path
				d="M32 42c-4 4-6 6-6 10a6 6 0 0 0 12 0c0-4-2-6-6-10z"
				fill={AMBER}
			/>
			<path
				d="M32 46c-2 3-3 4.5-3 7a3 3 0 0 0 6 0c0-2.5-1-4-3-7z"
				fill={CORAL}
			/>
		</svg>
	);
}

function MailboxArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Mailbox</title>
			<rect fill={WOOD} height="18" width="4" x="30" y="40" />
			<path d="M18 25a14 10 0 0 1 28 0v11H18z" fill={CORAL} />
			<path d="M18 27a14 9 0 0 1 28 0z" fill="#c73f2c" />
			<rect fill={WOOD} height="7" rx="1.4" width="4" x="30" y="28" />
			<rect fill={AMBER} height="8" width="3" x="44" y="17" />
			<rect fill={AMBER} height="3" rx="1.5" width="9" x="40" y="15" />
		</svg>
	);
}

function RaccoonArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Raccoon</title>
			<path d="M21 27 25 13l8 9zM43 27 39 13l-8 9z" fill="#4c4a48" />
			<circle cx="32" cy="35" fill="#9a958f" r="15" />
			<path d="M21 35a11 7 0 0 1 22 0z" fill={INK} />
			<circle cx="27" cy="34" fill={AMBER} r="2.8" />
			<circle cx="37" cy="34" fill={AMBER} r="2.8" />
			<circle cx="32" cy="41" fill="#e2e8f0" r="5" />
			<circle cx="32" cy="40" fill={INK} r="2" />
		</svg>
	);
}

function WizardHatArt({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 64 64">
			<title>Wizard hat</title>
			<path d="M19 44 32 11l13 33z" fill="#7c3aed" />
			<path
				d="M32 20l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.4-2.5 1.4.5-2.8-2-2 2.8-.4z"
				fill={AMBER}
			/>
			<circle cx="27" cy="31" fill={AMBER} r="1.4" />
			<circle cx="38" cy="25" fill={AMBER} r="1.4" />
			<rect fill={CORAL} height="6" rx="2" width="22" x="21" y="38" />
			<rect fill={INK} height="5" rx="2.5" width="34" x="15" y="43" />
		</svg>
	);
}

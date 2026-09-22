const ALPHABET =
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_LENGTH = 10;

/** Generate a short, URL-safe, guess-resistant invite code. */
export function generateInviteCode(): string {
	const bytes = new Uint8Array(CODE_LENGTH);
	crypto.getRandomValues(bytes);
	let code = "";
	for (const byte of bytes) {
		code += ALPHABET[byte % ALPHABET.length];
	}
	return code;
}

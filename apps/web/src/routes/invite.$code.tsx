import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Reveal } from "@/components/reveal";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/invite/$code")({
	component: InviteRoute,
});

function InviteRoute() {
	const { code } = Route.useParams();
	const { data: session } = authClient.useSession();
	const authed = !!session?.user;
	const [acceptedName, setAcceptedName] = useState<string | null>(null);

	const inviter = useQuery(
		trpc.friends.getInviter.queryOptions({ code }, { enabled: authed })
	);

	const accept = useMutation(
		trpc.friends.acceptInvite.mutationOptions({
			onSuccess: (result) => {
				setAcceptedName(result.friend?.name ?? null);
			},
		})
	);

	useEffect(() => {
		if (authed) {
			accept.mutate({ code });
		}
	}, [accept, authed, code]);

	const friendName = acceptedName ?? inviter.data?.name;

	let content: React.ReactNode;
	if (!authed) {
		content = (
			<div className="flex w-full flex-col gap-2">
				<Link className="w-full" to="/login">
					<Button className="w-full">Sign in</Button>
				</Link>
				<Link className="w-full" to="/login">
					<Button className="w-full" variant="outline">
						Create account
					</Button>
				</Link>
			</div>
		);
	} else if (accept.isPending) {
		content = (
			<div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span className="text-sm">Accepting invite…</span>
			</div>
		);
	} else if (accept.isError) {
		content = (
			<div className="text-center">
				<p className="text-destructive text-sm">{accept.error.message}</p>
				<Button className="mt-3" onClick={() => accept.mutate({ code })}>
					Try again
				</Button>
			</div>
		);
	} else {
		content = (
			<div className="text-center">
				<p className="text-foreground text-sm">
					{friendName
						? `You're now friends with ${friendName}!`
						: "You're now friends!"}
				</p>
				<Link className="mt-4 inline-block" to="/friends">
					<Button>Go to friends</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto flex w-full justify-center px-4 py-14 sm:px-6 sm:py-20">
			<Reveal className="w-full max-w-sm sm:max-w-md">
				<Card className="w-full">
					<CardHeader className="text-center">
						<CardTitle className="font-display font-extrabold text-xl tracking-tight sm:text-2xl">
							{authed ? "Join the friends circle" : "You've been invited"}
						</CardTitle>
						<CardDescription className="text-sm sm:text-base">
							{authed
								? "Accepting the invite adds you as friends instantly."
								: "Sign in or create an account to accept this invite."}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center gap-4 p-5 sm:p-6">
						{content}
					</CardContent>
				</Card>
			</Reveal>
		</div>
	);
}

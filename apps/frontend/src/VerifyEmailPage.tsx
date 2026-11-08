import { type FormEvent, useState } from "react";
import { CircleCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import AuthLayout from "@/components/auth-layout";
import { CheckInbox } from "@/components/check-inbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { resendVerificationEmail } from "@/lib/email-verification";

const ERRORS: Record<string, string> = {
	TOKEN_EXPIRED: "This confirmation link has expired.",
	INVALID_TOKEN: "This confirmation link is invalid or was already used.",
	USER_NOT_FOUND: "We couldn't find an account for this link.",
};

/**
 * Landing page after clicking the confirmation email.
 * The backend has already confirmed the email (and logged the user in) before redirecting here,
 * or redirected with ?error=… if the link was bad.
 */
export default function VerifyEmailPage() {
	const [searchParams] = useSearchParams();
	const error = searchParams.get("error");
	const { data: session, isPending } = authClient.useSession();

	if (error) return <LinkProblem message={ERRORS[error] ?? "This confirmation link didn't work."} />;

	return (
		<AuthLayout
			title="Email confirmed"
			description="Your RAUDEV account is active."
			footer={
				<Link to="/" className="font-medium text-primary hover:underline">
					Back to home
				</Link>
			}
		>
			<div className="flex flex-col items-center space-y-4 py-2 text-center">
				<div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-600/10 text-green-600 dark:text-green-400">
					<CircleCheck className="h-5 w-5" />
				</div>
				<p className="text-sm text-muted-foreground">
					{session ? `Welcome, ${session.user.name}! You're logged in.` : "You can now log in to your account."}
				</p>
				<Button
					className="h-11 w-full text-sm font-semibold"
					disabled={isPending}
					render={<Link to={session ? "/home" : "/login"} replace />}
					nativeButton={false}
				>
					{session ? "Continue to RAUDEV" : "Log in"}
				</Button>
			</div>
		</AuthLayout>
	);
}

function LinkProblem({ message }: { message: string }) {
	const [email, setEmail] = useState("");
	const [sending, setSending] = useState(false);
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSending(true);
		setFormError(null);
		try {
			await resendVerificationEmail(email.trim());
			setSentTo(email.trim());
		} catch (err) {
			setFormError((err as Error).message);
		} finally {
			setSending(false);
		}
	}

	return (
		<AuthLayout
			title="Link not valid"
			description={message}
			footer={
				<Link to="/login" className="font-medium text-primary hover:underline">
					Back to log in
				</Link>
			}
		>
			{sentTo ? (
				<CheckInbox email={sentTo} />
			) : (
				<form onSubmit={handleSubmit} className="space-y-4">
					<p className="text-xs text-muted-foreground sm:text-sm">
						Enter your email and we&apos;ll send you a new confirmation link.
					</p>
					<div className="space-y-1.5">
						<Label htmlFor="email" className="text-xs sm:text-sm">
							Email
						</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							placeholder="@email.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					{formError && (
						<p role="alert" className="text-xs text-destructive sm:text-sm">
							{formError}
						</p>
					)}
					<Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={sending}>
						{sending ? "Sending…" : "Send new link"}
					</Button>
				</form>
			)}
		</AuthLayout>
	);
}

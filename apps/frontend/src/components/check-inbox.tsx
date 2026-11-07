import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/lib/email-verification";

const COOLDOWN_SECONDS = 60;

/** "We sent you a confirmation link" panel with a rate-limited Resend button. */
export function CheckInbox({ email, title = "Check your inbox" }: { email: string; title?: string }) {
	const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
	const [sending, setSending] = useState(false);
	const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	async function resend() {
		setSending(true);
		setMessage(null);
		try {
			await resendVerificationEmail(email);
			setMessage({ ok: true, text: "A new link is on its way." });
			setCooldown(COOLDOWN_SECONDS);
		} catch (err) {
			setMessage({ ok: false, text: (err as Error).message });
		} finally {
			setSending(false);
		}
	}

	return (
		<div className="flex flex-col items-center space-y-3 py-2 text-center">
			<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
				<MailCheck className="h-5 w-5" />
			</div>
			<p className="text-sm font-semibold">{title}</p>
			<p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
				We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it to
				activate your account. The link is valid for 24 hours.
			</p>
			<p className="text-xs text-muted-foreground">Can&apos;t find it? Check your spam or promotions folder.</p>

			<Button variant="outline" size="sm" disabled={sending || cooldown > 0} onClick={resend}>
				{sending ? "Sending…" : cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend email"}
			</Button>
			{message && (
				<p
					role={message.ok ? "status" : "alert"}
					className={message.ok ? "text-xs text-green-600 dark:text-green-400" : "text-xs text-destructive"}
				>
					{message.text}
				</p>
			)}
		</div>
	);
}

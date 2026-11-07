import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import AuthLayout from "@/components/auth-layout";
import { CheckInbox } from "@/components/check-inbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { verifyCallbackURL } from "@/lib/email-verification";

export default function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	/** Set when the password was right but the email isn't confirmed yet (a new link was emailed) */
	const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	// Set by ResetPage after a successful password reset
	const [searchParams] = useSearchParams();
	const passwordReset = searchParams.get("reset") === "success";

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);

		await authClient.signIn.email(
			{
				email: email.trim(),
				password,
				// Used by the fresh confirmation link the backend sends to unverified accounts
				callbackURL: verifyCallbackURL(),
			},
			{
				onRequest: () => {
					setLoading(true);
				},
				onSuccess: () => {
					setLoading(false);
					navigate("/home", { replace: true });
				},
				onError: (ctx) => {
					setLoading(false);
					if (ctx.error.code === "EMAIL_NOT_VERIFIED") {
						setUnverifiedEmail(email.trim());
						return;
					}
					setError(ctx.error.message || "Invalid email or password.");
				},
			},
		);
	}

	return (
		<AuthLayout
			title="Welcome back"
			description="Log in to your RAUDEV account."
			footer={
				<>
					Don&apos;t have an account?{" "}
					<Link
						to="/signup"
						className="font-medium text-primary hover:underline"
					>
						Sign up
					</Link>
				</>
			}
		>
			{unverifiedEmail ? (
				<div className="space-y-3">
					<CheckInbox email={unverifiedEmail} title="Confirm your email to log in" />
					<button
						type="button"
						onClick={() => {
							setUnverifiedEmail(null);
							setPassword("");
						}}
						className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
					>
						Use a different account
					</button>
				</div>
			) : (
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="email" className="text-xs sm:text-sm">
						Email
					</Label>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						placeholder="you@student.rau.ro"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>

				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<Label htmlFor="password" className="text-xs sm:text-sm">
							Password
						</Label>
						<Link
							to="/forgot"
							className="text-xs sm:text-sm font-medium text-primary hover:underline"
						>
							Forgot password?
						</Link>
					</div>
					<Input
						id="password"
						type="password"
						autoComplete="current-password"
						placeholder="••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>

				{passwordReset && !error && (
					<p role="status" className="text-xs sm:text-sm text-green-600 dark:text-green-400">
						Your password was changed. Log in with your new password.
					</p>
				)}

				{error && (
					<p role="alert" className="text-xs sm:text-sm text-destructive">
						{error}
					</p>
				)}

				<Button
					type="submit"
					className="w-full h-11 text-sm font-semibold shadow-md transition-transform active:scale-[0.98]"
					disabled={loading}
				>
					{loading ? "Logging in..." : "Log in"}
				</Button>
			</form>
			)}
		</AuthLayout>
	);
}

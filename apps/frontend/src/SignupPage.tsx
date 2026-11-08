import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import AuthLayout from "@/components/auth-layout";
import { CheckInbox } from "@/components/check-inbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { verifyCallbackURL } from "@/lib/email-verification";

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	/** Set after sign-up: the account must be confirmed by email before logging in */
	const [sentTo, setSentTo] = useState<string | null>(null);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);

		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		await authClient.signUp.email(
			{
				email: email.trim(),
				password,
				name,
				callbackURL: verifyCallbackURL(),
			},
			{
				onRequest: () => {
					setLoading(true);
				},
				onSuccess: () => {
					setLoading(false);
					setSentTo(email.trim());
				},
				onError: (ctx) => {
					setLoading(false);
					setError(
						ctx.error.message ||
							"Could not create your account. Please try again.",
					);
				},
			},
		);
	}

	return (
		<AuthLayout
			title="Create your account"
			description="Join the RAUDEV student community."
			footer={
				<>
					Already have an account?{" "}
					<Link
						to="/login"
						className="font-medium text-primary hover:underline"
					>
						Log in
					</Link>
				</>
			}
		>
			{sentTo ? (
				<CheckInbox email={sentTo} title="Confirm your email" />
			) : (
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="name" className="text-xs sm:text-sm">
						Full name
					</Label>
					<Input
						id="name"
						type="text"
						autoComplete="name"
						placeholder="Ion Popescu"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

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

				<div className="space-y-1.5">
					<Label htmlFor="password" className="text-xs sm:text-sm">
						Password
					</Label>
					<Input
						id="password"
						type="password"
						autoComplete="new-password"
						placeholder="At least 8 characters"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="confirm-password" className="text-xs sm:text-sm">
						Confirm password
					</Label>
					<Input
						id="confirm-password"
						type="password"
						autoComplete="new-password"
						placeholder="Repeat your password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
					/>
				</div>

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
					{loading ? "Creating account..." : "Sign up"}
				</Button>
			</form>
			)}
		</AuthLayout>
	);
}

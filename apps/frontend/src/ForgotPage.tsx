import { MailCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			// TODO: replace with your real request, e.g. await requestPasswordReset(email);
			await new Promise((resolve) => setTimeout(resolve, 600));

			setSent(true);
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout
			title="Reset your password"
			description="Enter your email and we'll send you a reset link."
			footer={
				<>
					Remembered it?{" "}
					<Link
						to="/login"
						className="font-medium text-primary hover:underline"
					>
						Back to log in
					</Link>
				</>
			}
		>
			{sent ? (
				<div className="flex flex-col items-center text-center space-y-3 py-2">
					<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
						<MailCheck className="h-5 w-5" />
					</div>
					<p className="text-sm font-semibold">Check your inbox</p>
					<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
						If an account exists for{" "}
						<span className="font-medium">{email}</span>, you&apos;ll receive a
						password reset link shortly.
					</p>
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
						{loading ? "Sending..." : "Send reset link"}
					</Button>
				</form>
			)}
		</AuthLayout>
	);
}

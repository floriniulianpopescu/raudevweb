import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
	const navigate = useNavigate();
	// The emailed link looks like /reset-password?token=abc123
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

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

		setLoading(true);
		try {
			// TODO: replace with your real call, e.g. await resetPassword({ token, password });
			await new Promise((resolve) => setTimeout(resolve, 600));

			navigate("/login", { replace: true });
		} catch {
			setError("This reset link is invalid or has expired.");
		} finally {
			setLoading(false);
		}
	}

	if (!token) {
		return (
			<AuthLayout
				title="Invalid reset link"
				description="This link is missing or has expired."
				footer={
					<Link
						to="/login"
						className="font-medium text-primary hover:underline"
					>
						Back to log in
					</Link>
				}
			>
				<Button
					className="w-full h-11 text-sm font-semibold"
					render={<Link to="/forgot-password" />}
					nativeButton={false}
				>
					Request a new link
				</Button>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			title="Choose a new password"
			description="Enter a new password for your account."
			footer={
				<Link to="/login" className="font-medium text-primary hover:underline">
					Back to log in
				</Link>
			}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="password" className="text-xs sm:text-sm">
						New password
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
						Confirm new password
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
					{loading ? "Saving..." : "Reset password"}
				</Button>
			</form>
		</AuthLayout>
	);
}

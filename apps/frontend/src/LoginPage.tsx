import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			// TODO: replace with your real login call, e.g. await login({ email, password });
			await new Promise((resolve) => setTimeout(resolve, 600));

			navigate("/dashboard", { replace: true });
		} catch {
			setError("Invalid email or password.");
		} finally {
			setLoading(false);
		}
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
					<Label htmlFor="password" className="text-xs sm:text-sm">
						Password
					</Label>
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
		</AuthLayout>
	);
}

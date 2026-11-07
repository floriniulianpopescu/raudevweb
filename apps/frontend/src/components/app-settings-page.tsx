import { useState } from "react";
import { SignUpInputSchema } from "@raudevweb/shared";
import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { sendPasswordResetEmail } from "@/lib/password-reset";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export function AppSettingsPage() {
	const navigate = useNavigate();
	const [usernameOpen, setUsernameOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);
	const [sendingReset, setSendingReset] = useState(false);
	const [resetError, setResetError] = useState<string | null>(null);
	const [resetSent, setResetSent] = useState<string | null>(null);
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);
	const [logoutError, setLogoutError] = useState<string | null>(null);
	const [newUsername, setNewUsername] = useState("");
	const [savingUsername, setSavingUsername] = useState(false);
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [usernameSaved, setUsernameSaved] = useState<string | null>(null);
	const { data: session } = authClient.useSession();
	const currentName = session?.user.name ?? "";

	const openUsernameDialog = () => {
		setNewUsername(currentName);
		setUsernameError(null);
		setUsernameOpen(true);
	};

	const handleChangeUsername = async (e: React.FormEvent) => {
		e.preventDefault();
		// Same rules the backend enforces on /update-user
		const parsed = SignUpInputSchema.shape.name.max(100, "Name must not exceed 100 characters").safeParse(newUsername);
		if (!parsed.success) {
			setUsernameError(parsed.error.issues[0]?.message ?? "Invalid name");
			return;
		}
		if (parsed.data === currentName) {
			setUsernameOpen(false);
			return;
		}

		setSavingUsername(true);
		setUsernameError(null);
		// Updates the user on the server; useSession() refreshes so the new name shows everywhere
		const { error } = await authClient.updateUser({ name: parsed.data });
		setSavingUsername(false);
		if (error) {
			setUsernameError(error.message ?? "Couldn't update your username. Please try again.");
			return;
		}
		setUsernameOpen(false);
		setNewUsername("");
		setUsernameSaved(`Username changed to "${parsed.data}".`);
	};

	const handleResetPassword = async () => {
		const email = session?.user.email;
		if (!email) return;
		setSendingReset(true);
		setResetError(null);
		try {
			await sendPasswordResetEmail(email);
			setResetOpen(false);
			setResetSent(`We sent a password reset link to ${email}. It's valid for 1 hour.`);
		} catch (err) {
			setResetError((err as Error).message);
		} finally {
			setSendingReset(false);
		}
	};

	const handleLogout = async () => {
		setLoggingOut(true);
		setLogoutError(null);
		// Ends the session on the server and clears the session cookie
		const { error } = await authClient.signOut();
		setLoggingOut(false);
		if (error) {
			setLogoutError(error.message ?? "Couldn't log out. Please try again.");
			return;
		}
		setLogoutOpen(false);
		navigate("/login", { replace: true });
	};

	return (
		<div>
			<h1 className="text-2xl font-bold">Settings</h1>
			<p className="text-muted-foreground mt-2">Manage your account details.</p>
			{currentName && (
				<p className="mt-4 text-sm">
					Signed in as <span className="font-semibold">{currentName}</span>
					{session?.user.email && <span className="text-muted-foreground"> · {session.user.email}</span>}
				</p>
			)}
			{resetSent && (
				<p role="status" className="mt-2 text-sm text-green-600 dark:text-green-400">
					{resetSent}
				</p>
			)}
			{usernameSaved && (
				<p role="status" className="mt-2 text-sm text-green-600 dark:text-green-400">
					{usernameSaved}
				</p>
			)}

			<div className="mt-6 flex max-w-xs flex-col gap-3">
				<Button variant="outline" onClick={openUsernameDialog}>
					<UserPen />
					Change username
				</Button>
				<Button variant="outline" onClick={() => setResetOpen(true)}>
					<KeyRound />
					Reset password
				</Button>
				<Button variant="destructive" onClick={() => setLogoutOpen(true)}>
					<LogOut />
					Log out
				</Button>
			</div>

			{/* Change username */}
			<Dialog
				open={usernameOpen}
				onOpenChange={(open) => {
					setUsernameOpen(open);
					if (!open) {
						setNewUsername("");
						setUsernameError(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-sm">
					<form onSubmit={handleChangeUsername} className="grid gap-4">
						<DialogHeader>
							<DialogTitle>Change username</DialogTitle>
							<DialogDescription>
								Enter the new username you'd like to use for your account.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-2">
							<Label htmlFor="new-username">New username</Label>
							<Input
								id="new-username"
								value={newUsername}
								onChange={(e) => setNewUsername(e.target.value)}
								autoComplete="username"
								autoFocus
								maxLength={100}
								aria-invalid={!!usernameError}
								disabled={savingUsername}
							/>
							{usernameError && (
								<p role="alert" className="text-sm text-destructive">
									{usernameError}
								</p>
							)}
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setUsernameOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={!newUsername.trim() || savingUsername}>
								{savingUsername ? "Saving…" : "Save username"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Reset password confirmation */}
			<AlertDialog
				open={resetOpen}
				onOpenChange={(open) => {
					setResetOpen(open);
					if (!open) setResetError(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Reset your password?</AlertDialogTitle>
						<AlertDialogDescription>
							We'll email a reset link to{" "}
							<span className="font-medium text-foreground">{session?.user.email}</span>. After you
							choose a new password, you'll be signed out on every device.
						</AlertDialogDescription>
						{resetError && (
							<p role="alert" className="text-sm text-destructive">
								{resetError}
							</p>
						)}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={sendingReset} onClick={handleResetPassword}>
							{sendingReset ? "Sending…" : "Send reset link"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Logout confirmation */}
			<AlertDialog
				open={logoutOpen}
				onOpenChange={(open) => {
					setLogoutOpen(open);
					if (!open) setLogoutError(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Log out?</AlertDialogTitle>
						<AlertDialogDescription>
							You'll be signed out of your account and returned to the login
							page.
						</AlertDialogDescription>
						{logoutError && (
							<p role="alert" className="text-sm text-destructive">
								{logoutError}
							</p>
						)}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={loggingOut}>Cancel</AlertDialogCancel>
						<AlertDialogAction variant="destructive" disabled={loggingOut} onClick={handleLogout}>
							{loggingOut ? "Logging out…" : "Log out"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}


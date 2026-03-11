import { useState } from "react";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  onUnlock: (password: string) => void;
  memorialName: string;
}

const PasswordGate = ({ onUnlock, memorialName }: PasswordGateProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnlock(pin);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-card text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-secondary p-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-foreground">Protected Memorial</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          The memorial for <strong>{memorialName}</strong> is password protected.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password" value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="Enter password..."
            className="mb-3 w-full rounded-md border border-border bg-background px-4 py-3 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          {error && <p className="mb-3 text-sm text-destructive">Wrong password. Try again.</p>}
          <button type="submit" disabled={!pin}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Access Memorial
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordGate;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { firstError, loginOrganizer, setToken } from "../lib/api";
import { BackLink, Field, Page, inputClass, primaryBtn } from "../components/ui";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await loginOrganizer(username, password);
      setToken(data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(firstError(err.data));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page>
      <BackLink to="/" label="Back to register" />
      <h1 className="page-title">Organizer</h1>
      <p className="mt-1 text-sm text-ink-muted">Sign in to the list.</p>
      <p className={`alert-slot mt-2 text-sm font-medium ${error ? "text-terracotta" : "invisible"}`}>
        {error || "\u00a0"}
      </p>

      <form onSubmit={handleSubmit} className="form-card mt-3 rounded-xl p-4 sm:rounded-2xl sm:p-6">
        <div>
          <Field id="username" label="Username">
            <input
              id="username"
              className={inputClass}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>
          <Field id="password" label="Password">
            <input
              id="password"
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
        </div>
        <button type="submit" disabled={submitting} className={primaryBtn}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Page>
  );
}

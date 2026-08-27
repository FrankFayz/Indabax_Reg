import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { firstError, loginOrganizer, setToken } from "../lib/api";
import { Field, Page, inputClass, primaryBtn } from "../components/ui";

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
      <h1 className="font-display text-[1.75rem] text-indaba-dark sm:text-4xl">
        Organizer
      </h1>
      <p className="mt-1 text-sm text-ink-muted sm:text-base">Sign in to the list.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 rounded-xl border border-cream-dark border-t-4 border-t-gold bg-white p-3 sm:mt-5 sm:rounded-2xl sm:p-6"
      >
        {error ? (
          <div className="mb-4 rounded-xl bg-terracotta/10 px-3 py-2.5 text-sm text-terracotta">
            {error}
          </div>
        ) : null}
        <div className="space-y-3">
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
        <button type="submit" disabled={submitting} className={`${primaryBtn} mt-5`}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Page>
  );
}

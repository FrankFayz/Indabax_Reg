import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchChoices, firstError, registerStudent } from "../lib/api";
import { Field, Page, ChoiceSelect, primaryBtn, inputClass } from "../components/ui";

const EMPTY = {
  full_name: "",
  student_number: "",
  faculty: "",
  program: "",
  year_of_study: "",
  phone: "",
  email: "",
  gender: "",
  experience_level: "",
  heard_from: "",
  code_of_conduct_agreed: false,
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [choices, setChoices] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChoices()
      .then(setChoices)
      .catch(() => setFormError("Could not load the form."));
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    setErrors({});
    try {
      const nextErrors = {};
      if (!form.year_of_study) nextErrors.year_of_study = "Select your year.";
      if (!form.faculty) nextErrors.faculty = "Choose your faculty.";
      const email = form.email.trim().toLowerCase();
      if (!email.endsWith("@kab.ac.ug")) {
        nextErrors.email = "Use your Kabale University email (@kab.ac.ug).";
      }
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        setFormError(Object.values(nextErrors)[0]);
        return;
      }
      const result = await registerStudent({ ...form, email });
      navigate("/success", { state: result });
    } catch (error) {
      if (error.data && typeof error.data === "object") {
        const next = {};
        for (const [key, value] of Object.entries(error.data)) {
          next[key] = Array.isArray(value) ? value[0] : String(value);
        }
        setErrors(next);
        setFormError(firstError(error.data));
      } else {
        setFormError("Could not register. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page
      right={
        <Link
          to="/organizer"
          className="shrink-0 rounded-full bg-indaba px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white no-underline shadow-[0_6px_14px_rgba(15,122,74,0.28)] hover:bg-indaba-dark sm:px-3.5"
        >
          Organizer
        </Link>
      }
    >
      <h1 className="page-title">Register</h1>
      <p className="page-kicker mt-1.5">IndabaX Kabale University</p>
      {choices?.open_event ? (
        <p className="mt-1 text-sm font-semibold text-indaba-dark">
          {choices.open_event.name}
          {choices.open_event.event_date
            ? ` · ${new Date(`${choices.open_event.event_date}T00:00:00`).toLocaleDateString("en-UG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : ""}
        </p>
      ) : null}
      <p className={`alert-slot mt-2 text-sm font-medium ${formError ? "text-terracotta" : "invisible"}`}>
        {formError || "\u00a0"}
      </p>

      {choices && !choices.open_event ? (
        <div className="form-card mt-3 rounded-xl p-6 text-center sm:rounded-2xl sm:p-8">
          <p className="font-display text-2xl text-indaba-dark">Registration is closed</p>
          <p className="mt-2 text-sm text-ink-muted">
            The organizer has not opened a session yet. Check back for the next IndabaX event.
          </p>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="form-card mt-3 rounded-xl p-4 sm:rounded-2xl sm:p-6">
        <div className="flex flex-col">
          <Field id="full_name" label="Full name" error={errors.full_name}>
            <input
              id="full_name"
              className={inputClass}
              autoComplete="name"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="Aisha Ninsiima"
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Field
              id="student_number"
              label="Student number"
              error={errors.student_number}
            >
              <input
                id="student_number"
                className={inputClass}
                value={form.student_number}
                onChange={(e) => update("student_number", e.target.value)}
                placeholder="2023/A/1234"
                required
              />
            </Field>
            <Field id="year_of_study" label="Year" error={errors.year_of_study}>
              <ChoiceSelect
                id="year_of_study"
                value={form.year_of_study}
                onChange={(value) => update("year_of_study", value)}
                options={choices?.years || []}
                placeholder="Select"
                required
              />
            </Field>
          </div>

          <Field id="faculty" label="Faculty" error={errors.faculty}>
            <ChoiceSelect
              id="faculty"
              value={form.faculty}
              onChange={(value) => update("faculty", value)}
              options={choices?.faculties || []}
              placeholder="Choose"
              required
            />
          </Field>

          <Field id="program" label="Program" error={errors.program}>
            <input
              id="program"
              className={inputClass}
              value={form.program}
              onChange={(e) => update("program", e.target.value)}
              placeholder="BSc Computer Science"
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Field id="phone" label="Phone" error={errors.phone}>
              <input
                id="phone"
                className={inputClass}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="07xx xxx xxx"
                required
              />
            </Field>
            <Field id="email" label="University email" error={errors.email}>
              <input
                id="email"
                className={inputClass}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="name@kab.ac.ug"
                required
              />
            </Field>
          </div>
        </div>

        <div className="mt-1 border-t border-cream-dark pt-4">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Optional
          </p>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Field id="gender" label="Gender" error={errors.gender}>
              <ChoiceSelect
                id="gender"
                value={form.gender}
                onChange={(value) => update("gender", value)}
                options={choices?.genders || []}
                placeholder="Skip"
              />
            </Field>
            <Field
              id="experience_level"
              label="ML / AI level"
              error={errors.experience_level}
            >
              <ChoiceSelect
                id="experience_level"
                value={form.experience_level}
                onChange={(value) => update("experience_level", value)}
                options={choices?.experience || []}
                placeholder="Skip"
              />
            </Field>
          </div>
          <Field
            id="heard_from"
            label="How did you hear?"
            error={errors.heard_from}
          >
            <ChoiceSelect
              id="heard_from"
              value={form.heard_from}
              onChange={(value) => update("heard_from", value)}
              options={choices?.heard_from || []}
              placeholder="Skip"
            />
          </Field>
        </div>

        <label className="mt-1 flex min-h-11 items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-indaba"
            checked={form.code_of_conduct_agreed}
            onChange={(e) => update("code_of_conduct_agreed", e.target.checked)}
            required
          />
          <span>I agree to the IndabaX code of conduct.</span>
        </label>
        <p
          className={`field-hint ${errors.code_of_conduct_agreed ? "text-terracotta" : "invisible"}`}
        >
          {errors.code_of_conduct_agreed || "\u00a0"}
        </p>

        <button type="submit" disabled={submitting || !choices?.open_event} className={primaryBtn}>
          {submitting ? "Saving…" : "Register"}
        </button>
      </form>
      )}
    </Page>
  );
}

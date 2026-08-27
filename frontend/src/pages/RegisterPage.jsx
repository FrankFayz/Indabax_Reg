import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchChoices, firstError, registerStudent } from "../lib/api";
import { Field, Page, inputClass, primaryBtn } from "../components/ui";

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
  const [showMore, setShowMore] = useState(false);
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
      const email = form.email.trim().toLowerCase();
      if (!email.endsWith("@kab.ac.ug")) {
        setErrors({ email: "Use your Kabale University email (@kab.ac.ug)." });
        setFormError("Use your Kabale University email (@kab.ac.ug).");
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
          className="shrink-0 rounded-full bg-indaba px-3 py-1.5 text-[10px] font-bold tracking-wide text-white uppercase no-underline hover:bg-indaba-dark sm:px-3.5 sm:text-[11px]"
        >
          Organizer
        </Link>
      }
    >
      <h1 className="font-display text-2xl leading-tight text-indaba-dark sm:text-4xl">
        Register
      </h1>
      <p className="mt-1 text-sm text-ink-muted sm:text-base">
        IndabaX Kabale — one minute.
      </p>

      <form
        onSubmit={handleSubmit}
        className="form-card mt-4 rounded-xl border border-cream-dark border-t-4 border-t-gold bg-white p-4 sm:mt-5 sm:rounded-2xl sm:p-6"
      >
        {formError ? (
          <div
            className="mb-4 rounded-lg bg-terracotta/10 px-3 py-2.5 text-sm text-terracotta"
            role="alert"
          >
            {formError}
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <select
                id="year_of_study"
                className={inputClass}
                value={form.year_of_study}
                onChange={(e) => update("year_of_study", e.target.value)}
                required
              >
                <option value="">Select</option>
                {(choices?.years || []).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field id="faculty" label="Faculty" error={errors.faculty}>
            <select
              id="faculty"
              className={inputClass}
              value={form.faculty}
              onChange={(e) => update("faculty", e.target.value)}
              required
            >
              <option value="">Choose</option>
              {(choices?.faculties || []).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <button
          type="button"
          className="mt-4 text-left text-sm font-semibold text-indaba underline-offset-2 hover:underline"
          onClick={() => setShowMore((open) => !open)}
        >
          {showMore ? "Hide extras" : "Optional extras"}
        </button>

        {showMore ? (
          <div className="mt-3 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field id="gender" label="Gender" error={errors.gender}>
                <select
                  id="gender"
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                >
                  <option value="">Skip</option>
                  {(choices?.genders || []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id="experience_level"
                label="ML / AI level"
                error={errors.experience_level}
              >
                <select
                  id="experience_level"
                  className={inputClass}
                  value={form.experience_level}
                  onChange={(e) => update("experience_level", e.target.value)}
                >
                  <option value="">Skip</option>
                  {(choices?.experience || []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              id="heard_from"
              label="How did you hear?"
              error={errors.heard_from}
            >
              <select
                id="heard_from"
                className={inputClass}
                value={form.heard_from}
                onChange={(e) => update("heard_from", e.target.value)}
              >
                <option value="">Skip</option>
                {(choices?.heard_from || []).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        <label className="mt-4 flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-indaba"
            checked={form.code_of_conduct_agreed}
            onChange={(e) => update("code_of_conduct_agreed", e.target.checked)}
            required
          />
          <span>I agree to the IndabaX code of conduct.</span>
        </label>
        {errors.code_of_conduct_agreed ? (
          <p className="mt-1 text-xs font-medium text-terracotta">
            {errors.code_of_conduct_agreed}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className={`${primaryBtn} mt-5`}
        >
          {submitting ? "Saving…" : "Register"}
        </button>
      </form>
    </Page>
  );
}

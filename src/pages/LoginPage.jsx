import {
  createElement,
  useState,
} from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import saaLogo from "../assets/saa-logo.png";

function LoginPage({ profileError }) {
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        "Enter your email address."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "Enter your password."
      );
      return;
    }

    setSubmitting(true);

    try {
      const { error } =
        await supabase.auth
          .signInWithPassword({
            email: normalizedEmail,
            password,
          });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setPassword("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const displayedError =
    errorMessage || profileError;

  return (
    <main className="login-page">
      <section className="login-card">
        {createElement("img", {
          className: "login-logo",
          src: saaLogo,
          alt: "South African Airways",
        })}

        {displayedError && (
          <div
            id="loginError"
            className="login-error"
            role="alert"
          >
            {displayedError}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="login-field">
            <label htmlFor="loginEmail">
              Email address
            </label>

            <input
              id="loginEmail"
              name="email"
              type="email"
              value={email}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={submitting}
              aria-invalid={Boolean(
                displayedError
              )}
              aria-describedby={
                displayedError
                  ? "loginError"
                  : undefined
              }
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />
          </div>

          <div className="login-field">
            <label htmlFor="loginPassword">
              Password
            </label>

            <div className="login-password-field">
              <input
                id="loginPassword"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={submitting}
                aria-invalid={Boolean(
                  displayedError
                )}
                aria-describedby={
                  displayedError
                    ? "loginError"
                    : undefined
                }
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="password-visibility-button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                aria-pressed={showPassword}
                disabled={submitting}
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    size={18}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="primary-button login-submit-button"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoaderCircle
                  className="login-spinner"
                  size={19}
                  aria-hidden="true"
                />

                <span>Signing in</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
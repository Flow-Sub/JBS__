import {
  ArrowUpRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';

const SERVICE_CATEGORIES = [
  'UX/UI Design',
  'Brand Identity',
  'Web Development',
  'App Development',
  'Customer Support',
  'Data Entry & Processing',
  'Back Office Operations',
  'IT Help Desk Support',
  'HR Outsourcing',
  'Other',
];

const BUDGET_RANGES = [
  'Under $500',
  '$500 - $1,500',
  '$1,500 - $5,000',
  '$5,000 - $10,000',
  '$10,000+',
  "Let's discuss",
];

type SubmitStatus =
  | { type: 'idle'; message: '' }
  | { type: 'submitting'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export default function ContactForm() {
  const startedAt = useRef(Date.now());
  const [status, setStatus] = useState<SubmitStatus>({
    type: 'idle',
    message: '',
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus({
      type: 'submitting',
      message: 'Sending your project details...',
    });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          budget: formData.get('budget'),
          category: formData.get('category'),
          description: formData.get('description'),
          company: formData.get('company'),
          startedAt: startedAt.current,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok || !result?.message) {
        throw new Error(
          result?.message ??
            'Your message could not be sent. Please try again shortly.',
        );
      }

      form.reset();
      startedAt.current = Date.now();
      setStatus({
        type: 'success',
        message:
          result?.message ??
          'Thank you. Your project details have been sent successfully.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Your message could not be sent. Please try again shortly.',
      });
    }
  };

  const isSubmitting = status.type === 'submitting';

  return (
    <section className="contact-form-section" aria-labelledby="contact-title">
      <div className="contact-form__inner">
        <div className="contact-form__intro">
          <p className="contact-form__eyebrow">Start a conversation</p>
          <h2 id="contact-title" className="contact-form__title">
            Tell us about your project.
          </h2>
          <p className="contact-form__description">
            Share the essentials and our team will get back to you with a
            practical next step.
          </p>

          <div className="contact-form__direct-links">
            <a
              className="contact-form__direct-link"
              href="mailto:junaidjbsglobals@gmail.com"
            >
              <Mail aria-hidden="true" size={19} strokeWidth={1.8} />
              <span>
                <small>Email us</small>
                junaidjbsglobals@gmail.com
              </span>
              <ArrowUpRight
                className="contact-form__link-arrow"
                aria-hidden="true"
                size={19}
              />
            </a>
            <a
              className="contact-form__direct-link"
              href="https://wa.me/923001766258"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" size={19} strokeWidth={1.8} />
              <span>
                <small>WhatsApp</small>
                +92 300 1766258
              </span>
              <ArrowUpRight
                className="contact-form__link-arrow"
                aria-hidden="true"
                size={19}
              />
            </a>
          </div>
        </div>

        <form
          className="contact-form"
          onSubmit={handleSubmit}
          aria-describedby={status.message ? 'contact-form-status' : undefined}
        >
          <div className="contact-form__fields">
            <div className="contact-field">
              <label htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                minLength={2}
                maxLength={80}
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                maxLength={160}
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-phone">Phone number</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+92 300 0000000"
                minLength={7}
                maxLength={25}
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-budget">Budget</label>
              <select id="contact-budget" name="budget" defaultValue="" required>
                <option value="" disabled>
                  Select a budget
                </option>
                {BUDGET_RANGES.map((budget) => (
                  <option key={budget} value={budget}>
                    {budget}
                  </option>
                ))}
              </select>
            </div>

            <div className="contact-field contact-field--full">
              <label htmlFor="contact-category">Service category</label>
              <select
                id="contact-category"
                name="category"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select a service
                </option>
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="contact-field contact-field--full">
              <label htmlFor="contact-description">Project description</label>
              <textarea
                id="contact-description"
                name="description"
                placeholder="A short overview of what you need, your goals, and any timing requirements."
                minLength={20}
                maxLength={2000}
                rows={5}
                required
              />
            </div>

            <div className="contact-form__honeypot" aria-hidden="true">
              <label htmlFor="contact-company">Company website</label>
              <input
                id="contact-company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="contact-form__footer">
            <p className="contact-form__privacy">
              Your details are used only to respond to this enquiry.
            </p>
            <button
              className="contact-form__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderCircle
                  className="contact-form__spinner"
                  aria-hidden="true"
                  size={19}
                />
              ) : (
                <Send aria-hidden="true" size={19} />
              )}
              <span>{isSubmitting ? 'Sending' : 'Send enquiry'}</span>
            </button>
          </div>

          {status.message ? (
            <div
              id="contact-form-status"
              className={`contact-form__status contact-form__status--${status.type}`}
              role={status.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {status.type === 'success' ? (
                <CheckCircle2 aria-hidden="true" size={19} />
              ) : null}
              <span>{status.message}</span>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}

import { Form, Link, useNavigation } from "react-router";
import { SETTING_LABEL, SETTINGS, type Setting } from "~/lib/moves";
import { ArrowButton, FieldError, RATING_WORDS } from "./ui";

type Values = {
  moveId: string;
  date: string;
  setting: Setting;
  attempts: number;
  successes: number;
  rating: number;
  feeling: string | null;
};

export function JournalForm({
  moves,
  defaults,
  errors = {},
  submitLabel,
  cancelTo,
}: {
  moves: { id: string; name: string }[];
  defaults: Partial<Values>;
  errors?: Partial<Record<string, string>>;
  submitLabel: string;
  cancelTo: string;
}) {
  const busy = useNavigation().state === "submitting";

  return (
    <Form method="post" className="bg-pink p-3 sm:p-5">
      <div className="space-y-7 bg-paper p-5 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div>
            <label htmlFor="moveId" className="field-label">
              Move
            </label>
            <select id="moveId" name="moveId" defaultValue={defaults.moveId ?? ""} className="field" required>
              <option value="" disabled>
                Choose a move…
              </option>
              {moves.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <FieldError>{errors.moveId}</FieldError>
          </div>
          <div>
            <label htmlFor="date" className="field-label">
              Day
            </label>
            <input id="date" name="date" type="date" defaultValue={defaults.date} className="field" required />
            <FieldError>{errors.date}</FieldError>
          </div>
        </div>

        <fieldset>
          <legend className="field-label">Where</legend>
          <div className="grid grid-cols-3 gap-2">
            {SETTINGS.map((s) => (
              <label key={s} className="cursor-pointer">
                <input
                  type="radio"
                  name="setting"
                  value={s}
                  defaultChecked={(defaults.setting ?? "class") === s}
                  className="peer sr-only"
                />
                <span className="font-label block border-2 border-ink bg-white px-2 py-3 text-center text-sm transition-colors peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-blue/40 sm:text-base">
                  {SETTING_LABEL[s]}
                </span>
              </label>
            ))}
          </div>
          <FieldError>{errors.setting}</FieldError>
        </fieldset>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="attempts" className="field-label">
              Times you went for it
            </label>
            <input
              id="attempts"
              name="attempts"
              type="number"
              inputMode="numeric"
              min={1}
              defaultValue={defaults.attempts ?? 1}
              className="field font-display text-4xl tabular-nums"
              required
            />
            <FieldError>{errors.attempts}</FieldError>
          </div>
          <div>
            <label htmlFor="successes" className="field-label">
              Times it landed
            </label>
            <input
              id="successes"
              name="successes"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={defaults.successes ?? 0}
              className="field font-display text-4xl tabular-nums"
              required
            />
            <FieldError>{errors.successes}</FieldError>
          </div>
        </div>

        <fieldset>
          <legend className="field-label">How did it feel?</legend>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  defaultChecked={(defaults.rating ?? 3) === n}
                  className="peer sr-only"
                />
                <span className="block border-2 border-ink bg-white px-1 pt-2 pb-2.5 text-center transition-colors peer-checked:bg-blue peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-blue/40">
                  <span className="font-display block text-4xl">{n}</span>
                  <span className="font-serif text-base sm:text-lg">{RATING_WORDS[n]}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError>{errors.rating}</FieldError>
        </fieldset>

        <div>
          <label htmlFor="feeling" className="field-label">
            What happened
          </label>
          <textarea
            id="feeling"
            name="feeling"
            rows={4}
            defaultValue={defaults.feeling ?? ""}
            placeholder="Got the sweep twice off a bad base, lost my grip on the third. Felt calmer than last week."
            className="field font-serif text-xl leading-snug"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <ArrowButton type="submit" disabled={busy}>
            {busy ? "Saving…" : submitLabel}
          </ArrowButton>
          <Link to={cancelTo} className="font-label text-sm underline-offset-4 hover:underline">
            Cancel
          </Link>
        </div>
      </div>
    </Form>
  );
}

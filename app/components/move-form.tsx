import { useState } from "react";
import { Form, Link, useNavigation } from "react-router";
import { ART_CAST, ART_CAST_LABEL, CATEGORIES, CATEGORY_SINGULAR, CATEGORY_TONE, type ArtCast, type Category, type Step } from "~/lib/moves";
import { ArrowButton, FieldError } from "./ui";

type Values = {
  name: string;
  position: string;
  category: Category;
  description: string;
  steps: Step[];
  videoUrl: string | null;
  artNote: string | null;
  artCast: ArtCast | null;
};

let nextKey = 0;
const row = (s: Step) => ({ ...s, key: nextKey++ });

export function MoveForm({
  defaults,
  errors = {},
  accept,
  submitLabel,
  cancelTo,
}: {
  defaults?: Values;
  errors?: Partial<Record<string, string>>;
  accept: string;
  submitLabel: string;
  cancelTo: string;
}) {
  const busy = useNavigation().state === "submitting";
  const [category, setCategory] = useState<Category>(defaults?.category ?? "submission");
  const [steps, setSteps] = useState(() =>
    (defaults?.steps.length ? defaults.steps : [{ title: "", detail: "" }, { title: "", detail: "" }]).map(row),
  );

  const move = (i: number, by: -1 | 1) =>
    setSteps((s) => {
      const next = [...s];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });

  return (
    <Form method="post" encType="multipart/form-data" className={`${CATEGORY_TONE[category].frame} p-3 transition-colors sm:p-5`}>
      <div className="space-y-7 bg-paper p-5 sm:p-8">
        <div>
          <label htmlFor="name" className="field-label">
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={defaults?.name}
            placeholder="Scissor sweep"
            className="field font-display text-5xl"
            required
          />
          <FieldError>{errors.name}</FieldError>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="position" className="field-label">
              Starts from
            </label>
            <input
              id="position"
              name="position"
              defaultValue={defaults?.position}
              placeholder="Closed guard, bottom"
              className="field font-serif text-xl"
              required
            />
            <FieldError>{errors.position}</FieldError>
          </div>
          <div>
            <label htmlFor="category" className="field-label">
              Kind of move
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="field"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_SINGULAR[c]}
                </option>
              ))}
            </select>
            <FieldError>{errors.category}</FieldError>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="field-label">
            What it is
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaults?.description}
            placeholder="When it works, why it works, and what your partner gives you to set it up."
            className="field font-serif text-xl leading-snug"
            required
          />
          <FieldError>{errors.description}</FieldError>
        </div>

        <fieldset>
          <legend className="field-label">Steps, in order</legend>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={s.key} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-2 border-ink bg-white p-3">
                <span className="font-serif text-5xl leading-[0.85] tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-2">
                  <input
                    name="stepTitle"
                    defaultValue={s.title}
                    aria-label={`Step ${i + 1} title`}
                    placeholder="Short title, e.g. Break their posture"
                    className="font-label w-full border-b-2 border-ink/20 bg-transparent py-1 text-lg focus:border-ink focus:outline-none"
                  />
                  <textarea
                    name="stepDetail"
                    defaultValue={s.detail}
                    aria-label={`Step ${i + 1} detail`}
                    rows={2}
                    placeholder="What your hands, hips and feet do."
                    className="w-full resize-y bg-transparent py-1 leading-relaxed focus:outline-none"
                  />
                  <div className="font-label flex gap-4 text-xs text-mute">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="cursor-pointer hover:text-ink disabled:opacity-30">
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={i === steps.length - 1}
                      onClick={() => move(i, 1)}
                      className="cursor-pointer hover:text-ink disabled:opacity-30"
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      onClick={() => setSteps((all) => all.filter((x) => x.key !== s.key))}
                      className="cursor-pointer hover:text-red"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setSteps((all) => [...all, row({ title: "", detail: "" })])}
            className="font-label mt-3 cursor-pointer border-2 border-dashed border-ink px-4 py-2 text-sm hover:bg-white"
          >
            + Add a step
          </button>
          <FieldError>{errors.steps}</FieldError>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="media" className="field-label">
              Add photos or clips
            </label>
            <input
              id="media"
              name="media"
              type="file"
              multiple
              accept={accept}
              className="field file:font-label file:mr-3 file:cursor-pointer file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:text-white"
            />
            <p className="mt-1.5 text-sm text-mute">JPG, PNG, WebP, MP4, MOV or WebM.</p>
            <FieldError>{errors.media}</FieldError>
          </div>
          <div>
            <label htmlFor="videoUrl" className="field-label">
              Instructional link
            </label>
            <input
              id="videoUrl"
              name="videoUrl"
              type="url"
              defaultValue={defaults?.videoUrl ?? ""}
              placeholder="https://youtube.com/…"
              className="field"
            />
            <FieldError>{errors.videoUrl}</FieldError>
          </div>
        </div>

        <div>
          <label htmlFor="artNote" className="field-label">
            Cover art note
          </label>
          <textarea
            id="artNote"
            name="artNote"
            rows={2}
            defaultValue={defaults?.artNote ?? ""}
            placeholder="Optional. Where each body should be if the drawing gets it wrong, e.g. Blue is on their back with legs around pink's waist."
            className="field leading-relaxed"
          />
          <p className="mt-1.5 text-sm text-mute">Only used for the drawn cover. Blue does the move, pink receives it.</p>
        </div>

        <div>
          <label htmlFor="artCast" className="field-label">
            Who&rsquo;s in the cover art
          </label>
          <select id="artCast" name="artCast" defaultValue={defaults?.artCast ?? ""} className="field">
            <option value="">Made-up people</option>
            {ART_CAST.map((c) => (
              <option key={c} value={c}>
                {ART_CAST_LABEL[c]}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-sm text-mute">Draws the two of you from the photos in art/people.</p>
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

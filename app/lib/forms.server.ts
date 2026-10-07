import { isArtCast, isCategory, isSetting, type Category, type Setting, type Step } from "./moves";

export type Errors = Partial<Record<string, string>>;

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export function parseEntry(form: FormData) {
  const errors: Errors = {};
  const moveId = str(form, "moveId");
  const date = str(form, "date");
  const setting = str(form, "setting");
  const attempts = Number(str(form, "attempts"));
  const successes = Number(str(form, "successes"));
  const rating = Number(str(form, "rating"));
  const feeling = str(form, "feeling");

  if (!moveId) errors.moveId = "Pick the move you went for.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Pick the day you trained.";
  if (!isSetting(setting)) errors.setting = "Pick where it happened.";
  if (!Number.isInteger(attempts) || attempts < 1) errors.attempts = "Count at least one attempt.";
  if (!Number.isInteger(successes) || successes < 0) errors.successes = "Enter how many landed, or 0.";
  else if (successes > attempts) errors.successes = "Landed can't be more than attempts.";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Rate how it felt, 1 to 5.";

  if (Object.keys(errors).length) return { errors } as const;
  return {
    values: {
      moveId,
      date,
      setting: setting as Setting,
      attempts,
      successes,
      rating,
      feeling: feeling || null,
    },
  } as const;
}

export function parseMove(form: FormData) {
  const errors: Errors = {};
  const name = str(form, "name");
  const position = str(form, "position");
  const category = str(form, "category");
  const description = str(form, "description");
  const videoUrl = str(form, "videoUrl");
  const artNote = str(form, "artNote");
  const artCast = str(form, "artCast");

  // Steps arrive as parallel stepTitle/stepDetail lists; drop fully blank rows
  const titles = form.getAll("stepTitle").map((v) => String(v).trim());
  const details = form.getAll("stepDetail").map((v) => String(v).trim());
  const steps: Step[] = titles
    .map((title, i) => ({ title, detail: details[i] ?? "" }))
    .filter((s) => s.title || s.detail);

  if (!name) errors.name = "Give the move a name.";
  if (!position) errors.position = "Say where the move starts from.";
  if (!isCategory(category)) errors.category = "Pick what kind of move it is.";
  if (!description) errors.description = "Describe the move in a sentence or two.";
  if (steps.some((s) => !s.title)) errors.steps = "Every step needs a short title.";
  if (videoUrl && !/^https?:\/\/\S+$/i.test(videoUrl)) errors.videoUrl = "Paste a full link starting with https://";

  if (Object.keys(errors).length) return { errors } as const;
  return {
    values: {
      name,
      position,
      category: category as Category,
      description,
      steps,
      videoUrl: videoUrl || null,
      artNote: artNote || null,
      artCast: isArtCast(artCast) ? artCast : null,
    },
  } as const;
}

// Non-empty files from a multi-file input
export function uploadedFiles(form: FormData, key: string) {
  return form.getAll(key).filter((f): f is File => f instanceof File && f.size > 0);
}

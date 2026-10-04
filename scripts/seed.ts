// Seeds the move library. Runs under plain Node (type stripping), so imports
// are relative with .ts extensions.
//
//   npm run db:seed                       add the starter moves (never overwrites your edits)
//   npm run db:seed -- --examples         also add example journal entries
//   npm run db:seed -- --remove-examples  delete the example journal entries again
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { journalEntries, moves } from "../app/db/schema.ts";
import type { Category, Setting, Step } from "../app/lib/moves.ts";

const dbPath = process.env.DATABASE_PATH ?? "./data/shrimp.db";
mkdirSync(path.dirname(dbPath), { recursive: true });
const client = createClient({ url: `file:${dbPath}` });
const db = drizzle(client);

type SeedMove = {
  id: string;
  name: string;
  position: string;
  category: Category;
  description: string;
  steps: Step[];
};

const MOVES: SeedMove[] = [
  {
    id: "scissor-sweep",
    name: "Scissor sweep",
    position: "Closed guard, bottom",
    category: "sweep",
    description:
      "Usually the first sweep you learn. Your legs work like the blades of a pair of scissors: one shin across their belly, one leg chopping their knee, while your grips pull their weight over the top.",
    steps: [
      { title: "Grip sleeve and collar", detail: "Take a deep collar grip with one hand and grab their opposite sleeve with the other. The sleeve grip decides which way they'll fall." },
      { title: "Shrimp onto your side", detail: "Open your guard and hip escape so you're on your side, facing them at an angle instead of flat on your back." },
      { title: "Shin across the belly", detail: "Slide your top shin across their belly with the knee blocking their far hip. Keep the foot hooked on their near hip." },
      { title: "Chop the knee", detail: "Drop your bottom leg to the mat behind their knee, on the same side as the arm you're holding." },
      { title: "Scissor and pull", detail: "Pull them forward onto your shin with both grips, then kick the top leg over while the bottom leg chops back. Keep the sleeve so they can't post." },
      { title: "Come up in mount", detail: "Follow them over and land in mount, still holding the collar grip." },
    ],
  },
  {
    id: "kimura-closed-guard",
    name: "Kimura",
    position: "Closed guard, bottom",
    category: "submission",
    description:
      "A shoulder lock that shows up everywhere. From closed guard it's the punishment for posting a hand on the mat: you trap the wrist, figure-four the arm and turn it behind their back.",
    steps: [
      { title: "Catch the posted hand", detail: "Break their posture so they put a hand on the mat. Grab that wrist with your same-side hand, four fingers on top." },
      { title: "Sit up and reach over", detail: "Open your guard and sit up on your elbow. Reach your free arm over their shoulder, past the triceps." },
      { title: "Lock the figure four", detail: "Grab your own wrist from underneath. Both your thumbs point the same way." },
      { title: "Fall back at an angle", detail: "Fall back to the mat while shifting your hips out to the side so you're nearly perpendicular to them. Throw your leg over their back to stop them rolling out." },
      { title: "Turn it slowly", detail: "Keep their elbow tight to your chest and rotate their hand up behind their back, toward their head. Go slow: the tap comes fast." },
    ],
  },
  {
    id: "triangle-choke",
    name: "Triangle",
    position: "Closed guard, bottom",
    category: "submission",
    description:
      "A choke made with your legs. You trap their head and one arm inside a figure four, so their own shoulder presses one side of their neck and your thigh presses the other.",
    steps: [
      { title: "Break the posture", detail: "Pull their head down with your closed guard and grips so they can't stand up tall." },
      { title: "One arm in, one arm out", detail: "Control a wrist and push that arm past your hip, so one arm ends up outside your legs while the other stays between them." },
      { title: "Shoot the leg high", detail: "Throw the leg on the side of the arm you pushed out high over their shoulder, across the back of their neck." },
      { title: "Cut an angle", detail: "Swivel your hips so your thigh lies along the side of their neck. Grab your own shin and pull it tight." },
      { title: "Lock the figure four", detail: "Fold your other leg over your ankle so the shin sits in the crook of your knee." },
      { title: "Squeeze", detail: "Pull their head down, pinch your knees together and lift your hips. Dragging the trapped arm across their body tightens it." },
    ],
  },
  {
    id: "armbar-from-mount",
    name: "Armbar",
    position: "Mount, top",
    category: "submission",
    description:
      "The classic finish from mount. When your partner pushes on your chest to escape, they hand you an arm. You swing around it, pinch it between your thighs and straighten it.",
    steps: [
      { title: "Climb to high mount", detail: "Walk your knees up toward their armpits so their elbows come off the mat." },
      { title: "Trap an arm", detail: "When they push on your chest, clamp that arm to you with both hands." },
      { title: "Pivot and swing the leg", detail: "Post a hand on their chest, turn your hips toward the trapped arm and swing your leg over their face." },
      { title: "Sit close and pinch", detail: "Sit your hips down close to their shoulder, knees squeezed together. Hold the wrist to your chest with their thumb pointing up." },
      { title: "Lift the hips", detail: "Keep the knees tight and lift your hips slowly. Ease off the moment they tap." },
    ],
  },
  {
    id: "hip-escape",
    name: "Shrimp",
    position: "Side control, bottom",
    category: "escape",
    description:
      "The hip escape. Every class warms up with it because almost every escape uses it: move your hips away to make space, then fill that space with a knee before they can take it back.",
    steps: [
      { title: "Frame", detail: "Put a forearm across their collarbone or neck and your other hand on their hip. Frames hold distance; don't push with straight arms." },
      { title: "Bridge", detail: "Plant your feet and bridge into them. It only buys a moment of space, which is all you need." },
      { title: "Shrimp away", detail: "Push off your foot, turn onto your side and drive your hips away from them." },
      { title: "Knee in", detail: "Slide your bottom knee into the gap between you, shin across their hip." },
      { title: "Recover guard", detail: "Bring your other leg around, square up and close your guard or set up an open guard." },
    ],
  },
  {
    id: "upa-escape",
    name: "Upa",
    position: "Mount, bottom",
    category: "escape",
    description:
      "The trap-and-roll escape from mount. Take away their arm and leg on the same side so they have nothing to post with, then bridge them over.",
    steps: [
      { title: "Trap the arm", detail: "Overhook one arm at the elbow, or grab the wrist, and pin it to your chest." },
      { title: "Trap the foot", detail: "On the same side, step your foot over the outside of their foot so they can't post the leg." },
      { title: "Bridge over the shoulder", detail: "Drive your hips up hard and bridge over your shoulder toward the trapped side." },
      { title: "Land in their guard", detail: "Roll with them and come up on top in their guard. Posture up straight away." },
    ],
  },
  {
    id: "knee-slice-pass",
    name: "Knee slice",
    position: "Half guard, top",
    category: "pass",
    description:
      "A fast, pressure-based pass. Your knee cuts across their thigh like a blade while your upper body keeps them flat, and you slide straight through to side control.",
    steps: [
      { title: "Pin the leg", detail: "Grip their pants at the knee, or their lapel, and keep their bottom leg flat on the mat." },
      { title: "Knee across the thigh", detail: "Slide your knee across their thigh toward the mat on the far side, your shin pinning their leg." },
      { title: "Get the underhook", detail: "Win the far-side underhook or a crossface so they can't turn into you. Keep your weight forward." },
      { title: "Slice through", detail: "Keep cutting the knee to the mat and free your trailing foot from their legs." },
      { title: "Settle in side control", detail: "Sprawl your hips back as you land and press your chest into theirs." },
    ],
  },
  {
    id: "double-leg",
    name: "Double leg",
    position: "Standing",
    category: "takedown",
    description:
      "The takedown wrestlers build everything on. Drop your level, step in deep and drive through their hips with your head tight to their side.",
    steps: [
      { title: "Set it up", detail: "Shoot when they step toward you or reach for a grip, not from far away." },
      { title: "Change levels", detail: "Bend your knees and drop your hips, keeping your back straight and head up." },
      { title: "Penetration step", detail: "Step deep with your lead foot, landing that knee between their feet." },
      { title: "Head outside, hands behind the knees", detail: "Put your head tight against their side, not in the middle, and wrap both hands behind their knees." },
      { title: "Drive and turn the corner", detail: "Step up with your back leg and drive through at an angle, turning toward your head's side." },
      { title: "Finish on top", detail: "Land in side control or keep passing their legs before they can recover guard." },
    ],
  },
  {
    id: "rear-naked-choke",
    name: "Rear naked choke",
    position: "Back control",
    category: "submission",
    description:
      "The highest-percentage finish in jiu-jitsu. From the back, your arm wraps the neck from both sides, and once it's locked the escape is mostly gone.",
    steps: [
      { title: "Secure the back", detail: "Get both hooks in and a seatbelt grip: one arm over their shoulder, one under their arm." },
      { title: "Slide the choking arm under the chin", detail: "Feed your top arm under their chin until the crook of your elbow is under their throat." },
      { title: "Lock your bicep", detail: "Grab your other bicep with the choking hand. Put your free hand behind their head." },
      { title: "Squeeze", detail: "Tuck your head next to theirs, pull your elbows together and expand your chest. Give them time to tap." },
    ],
  },
];

// Example entries so the journal shows what it's for. Ids start "example-" so
// --remove-examples can find them.
type SeedEntry = [moveId: string, date: string, setting: Setting, attempts: number, successes: number, rating: number, feeling: string];

const EXAMPLES: SeedEntry[] = [
  ["hip-escape", "2026-08-11", "class", 6, 3, 2, "Everyone kept flattening me out. I keep forgetting to frame before I shrimp."],
  ["scissor-sweep", "2026-08-13", "class", 5, 1, 2, "Kept losing the sleeve. When I did hold it the sweep was easy."],
  ["upa-escape", "2026-08-20", "class", 4, 2, 3, "Trapping the foot is the whole thing. Got it twice on bigger guys."],
  ["triangle-choke", "2026-08-27", "open_mat", 4, 1, 3, "Legs too short for the angle at first. Grabbing my shin made it work."],
  ["kimura-closed-guard", "2026-09-03", "class", 5, 3, 4, "Caught two people posting hands. Falling back at an angle was the fix."],
  ["scissor-sweep", "2026-09-05", "class", 6, 4, 4, "Finally clicked. Pulling them onto my shin first makes it effortless."],
  ["knee-slice-pass", "2026-09-10", "class", 7, 3, 3, "Good when I get the underhook, flattened out when I don't."],
  ["double-leg", "2026-09-20", "competition", 3, 1, 3, "Shot from too far twice. The third one landed and I scored two points."],
  ["armbar-from-mount", "2026-09-20", "competition", 2, 1, 5, "Won my second match with it. Nerves were bad until I got to mount, then I felt calm."],
  ["hip-escape", "2026-09-24", "class", 5, 4, 4, "Calmer underneath side control. Frames first, then move."],
  ["rear-naked-choke", "2026-09-27", "open_mat", 3, 2, 4, "Hand fighting is the real fight. Once the arm was under the chin it was over."],
  ["triangle-choke", "2026-10-01", "class", 5, 3, 4, "Hit it from closed guard and once off a failed armbar. Angle is everything."],
];

const args = process.argv.slice(2);

if (args.includes("--remove-examples")) {
  const removed = await db.delete(journalEntries).where(like(journalEntries.id, "example-%")).returning();
  console.log(`Removed ${removed.length} example journal entries.`);
  process.exit(0);
}

const inserted = await db
  .insert(moves)
  .values(MOVES)
  .onConflictDoNothing()
  .returning({ id: moves.id });
console.log(`Added ${inserted.length} of ${MOVES.length} starter moves (existing ones left as they are).`);

if (args.includes("--examples")) {
  const rows = EXAMPLES.map(([moveId, date, setting, attempts, successes, rating, feeling], i) => ({
    id: `example-${i + 1}`,
    moveId,
    date,
    setting,
    attempts,
    successes,
    rating,
    feeling,
  }));
  const added = await db.insert(journalEntries).values(rows).onConflictDoNothing().returning();
  console.log(`Added ${added.length} example journal entries. Remove them with: npm run db:seed -- --remove-examples`);
}

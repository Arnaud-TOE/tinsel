// Who gives to whom. Plain code, not the model: a draw has to be fair, secret and checkable.

export type Draw = Record<string, string>;
type Pairs = readonly (readonly [string, string])[];

const apart = (a: string, b: string, keptApart: Pairs) => keptApart.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const allowed = (giver: string, recipient: string, keptApart: Pairs) => giver !== recipient && !apart(giver, recipient, keptApart);

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Draws names as one big circle: everyone gives to the next person round it. That rules out anyone
 * drawing themselves and, in a group of three or more, two people who just swap gifts. Returns null
 * when the rules leave no way to do it.
 */
export function drawNames(ids: readonly string[], keptApart: Pairs = [], random: () => number = Math.random): Draw | null {
  if (ids.length < 2) return null;
  for (let attempt = 0; attempt < 2000; attempt++) {
    const circle = shuffled(ids, random);
    if (circle.every((id, i) => allowed(id, circle[(i + 1) % circle.length], keptApart))) {
      return Object.fromEntries(circle.map((id, i) => [id, circle[(i + 1) % circle.length]]));
    }
  }
  return null;
}

/** Whether a draw follows the rules: each person gives once and gets once, never to themselves or someone they're kept apart from. */
export function isValidDraw(draw: Draw, ids: readonly string[], keptApart: Pairs = []): boolean {
  const givers = Object.keys(draw).sort();
  const recipients = Object.values(draw).sort();
  const sorted = [...ids].sort();
  if (givers.join() !== sorted.join() || recipients.join() !== sorted.join()) return false;
  return Object.entries(draw).every(([giver, recipient]) => allowed(giver, recipient, keptApart));
}

export type Repair = {
  draw: Draw;
  /** Givers whose person changed: their ideas and pick no longer apply. */
  changed: string[];
};

/**
 * Someone leaves after the draw. Whoever had them takes over the person they had, which touches one
 * giver. If the rules forbid that, one more giver swaps, and failing that the givers still free are
 * rearranged. `locked` givers have already bought their gift, so their person can't change. Returns
 * null when there's no way to keep everyone's gift.
 */
export function repairDraw(draw: Draw, leaving: string, keptApart: Pairs = [], locked: ReadonlySet<string> = new Set()): Repair | null {
  const giver = Object.keys(draw).find((id) => draw[id] === leaving);
  const recipient = draw[leaving];
  if (!giver || !recipient || giver === recipient) return null;
  if (locked.has(giver)) return null;

  const next: Draw = { ...draw };
  delete next[leaving];
  if (allowed(giver, recipient, keptApart)) {
    next[giver] = recipient;
    return { draw: next, changed: [giver] };
  }

  for (const other of Object.keys(next)) {
    if (other === giver || locked.has(other)) continue;
    const theirs = next[other];
    if (allowed(giver, theirs, keptApart) && allowed(other, recipient, keptApart)) {
      next[giver] = theirs;
      next[other] = recipient;
      return { draw: next, changed: [giver, other] };
    }
  }

  // No single swap works, which happens in small groups. Search the free givers, keeping each one's
  // person where possible.
  const free = [giver, ...Object.keys(next).filter((id) => id !== giver && !locked.has(id))];
  const people = free.map((id) => (id === giver ? recipient : next[id]));
  const placed: Draw = {};
  const place = (index: number, left: string[]): boolean => {
    if (index === free.length) return true;
    const id = free[index];
    const choices = [...left].sort((a, b) => Number(b === draw[id]) - Number(a === draw[id]));
    return choices.some((choice) => {
      if (!allowed(id, choice, keptApart)) return false;
      placed[id] = choice;
      return place(
        index + 1,
        left.filter((person) => person !== choice),
      );
    });
  };
  if (!place(0, people)) return null;
  const rearranged = { ...next, ...placed };
  return { draw: rearranged, changed: free.filter((id) => rearranged[id] !== draw[id]) };
}

/** Gives each giver a slot number in an order that says nothing about who they are. */
export function assignSlots(givers: readonly string[], random: () => number = Math.random): Record<string, string> {
  return Object.fromEntries(shuffled(givers, random).map((giver, i) => [`slot-${i + 1}`, giver]));
}

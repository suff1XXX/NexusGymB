// Keep the lower bound numeric for existing volume and record calculations.
export function parseReps(value, { min = 0 } = {}) {
  const text = String(value ?? '').trim();
  const match = /^(\d{1,4})(?:\s*[-–—]\s*(\d{1,4}))?$/.exec(text);
  const reps = match ? Number(match[1]) : NaN;
  const repsMax = match?.[2] === undefined ? reps : Number(match[2]);
  if (!Number.isInteger(reps) || reps < min || repsMax < reps || repsMax > 1000)
    throw Error(`Повторення: число або діапазон від ${min} до 1000, наприклад 10-12.`);
  return { reps, repsMax };
}

export function repsLabel(log) {
  return log.repsMax > log.reps ? `${log.reps}-${log.repsMax}` : String(log.reps);
}

export function validReps(log) {
  return Number.isInteger(log.reps) && log.reps >= 0 && log.reps <= 1000 &&
    (log.repsMax === undefined || Number.isInteger(log.repsMax) && log.repsMax >= log.reps && log.repsMax <= 1000);
}

export function machineName(value = '') {
  if (typeof value !== 'string' || value.length > 80) throw Error('Назва залу / тренажера — до 80 символів.');
  return value.trim().replace(/\s+/g, ' ');
}

export function sameMachine(log, machine = '') {
  const canonical=value=>{const name=machineName(value || '').toLocaleLowerCase('uk');return name === 'profile:profile-1' ? '' : name;};
  return canonical(log.machine) === canonical(machine);
}

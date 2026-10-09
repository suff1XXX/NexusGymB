export function matchesExercise(e, query) {
  const normalize = (value) => String(value ?? "").toLocaleLowerCase("uk").replace(/[’'`ʼ]/g, "").replace(/\s+/g, " ").trim();
  const text = normalize(`${e.name ?? ""} ${e.equipment ?? ""} ${e.primary ?? ""} ${e.secondary ?? ""}`);
  return normalize(query).split(" ").filter(Boolean).every((word) => text.includes(word));
}

export function filterExercises(exercises, filters, preferences = {}, hasPhoto = (e) => !!e.image) {
  return exercises.filter((e) =>
    (filters.archive === "all" || (filters.archive === "archived" ? e.archived : !e.archived)) &&
    (!filters.favoritesOnly || preferences[e.id]?.favorite) &&
    (filters.catalogScope === "all" || (filters.catalogScope === "personal" ? e.personal : !e.personal)) &&
    (filters.filter === "Усі" || e.primary === filters.filter) &&
    (!filters.equipment || e.equipment === filters.equipment) &&
    (!filters.withPhoto || hasPhoto(e)) && matchesExercise(e, filters.query)
  ).sort((a, b) => (filters.catalogSort === "group" ? String(a.primary || "").localeCompare(String(b.primary || ""), "uk") : 0) ||
    String(a.name || "").localeCompare(String(b.name || ""), "uk"));
}

async function loadJSON(file) {
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error("Failed to load " + file);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function JupiterStrict() {
  try {
    const response = await fetch("https://token.jup.ag/strict");
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

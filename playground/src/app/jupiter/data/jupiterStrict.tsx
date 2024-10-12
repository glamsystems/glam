export default async function JupiterStrict() {
  try {
    const response = await fetch("https://tokens.jup.ag/tokens?tags=verified");
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

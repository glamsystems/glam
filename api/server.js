const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const { base58 } = require("@scure/base");

const app = express();

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hello from App Engine!");
});

app.get("/_/health", (req, res) => {
  res.send("ok");
});

app.get("/image/:pubkey.png", async (req, res) => {
  // convert pubkey from base58 to bytes[32]
  const pubkey = req.params.pubkey;
  if (pubkey.length > 50) {
    return res.sendStatus(404);
  }
  let key;
  try {
    key = base58.decode(pubkey);
  } catch(_e) {
    return res.sendStatus(404);
  }
  if (key.length != 32) {
    return res.sendStatus(404);
  }

  // fetch params from the key bytes
  const angle = 6.28 * (key[0] / 256.0);     // between 0.0 and 2*pi
  const alpha = (key[1] / 256.0) / 4 + 0.75; // between 0.5 and 1.0
  const colorR = key[2];                     // between 0 and 255
  const colorG = key[3];
  const colorB = key[4];

  const fullSize = 512;     // size of the input
  const size = fullSize / 2; // size of the output
  const offset = size / 2;   // offset for rotation/translation

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // base color
  ctx.fillStyle = rgbToHex(colorR, colorG, colorB);
  ctx.fillRect(0, 0, size, size);

  // rotation (relative to image center)
  ctx.translate(offset,offset);
  ctx.rotate(angle);
  ctx.translate(-offset,-offset);

  // render the image full size, on half size canvas
  // so that we don't see broken corners
  ctx.globalAlpha = alpha;
  const image = await loadImage('./public/glam.png');
  ctx.drawImage(image, -offset, -offset, fullSize, fullSize);  

  // return the image
  const buffer = canvas.toBuffer("image/png");
  res.set("content-type", "image/png");
  res.send(buffer);
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

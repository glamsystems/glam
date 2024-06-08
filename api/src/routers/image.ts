import { Router } from "express";
import crypto from "crypto";
import puppeteer from "puppeteer";
import { PublicKey } from "@solana/web3.js";
import { validatePubkey } from "../validation";

const router = Router();

function publicKeyToAttributes(pubKey: PublicKey, numColors) {
  const keyBytes = pubKey.toBytes();
  const hash = crypto.createHash("sha256").update(keyBytes).digest("hex");
  const attributes: any = {};

  // Generate the specified number of colors
  for (let i = 0; i < numColors; i++) {
    const offset = i * 12;
    const r = parseInt(hash.substring(offset, offset + 4), 16) % 256;
    const g = parseInt(hash.substring(offset + 4, offset + 8), 16) % 256;
    const b = parseInt(hash.substring(offset + 8, offset + 12), 16) % 256;
    attributes[`color${i + 1}`] = `rgb(${r},${g},${b})`;
  }

  // Angle
  const angleOffset = numColors * 12;
  attributes.angle =
    parseInt(hash.substring(angleOffset, angleOffset + 6), 16) % 360;

  return attributes;
}
function generateSVGContent(attributes) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" style="padding: 0; margin: 0;">
        <foreignObject width="100%" height="100%" style="margin: 0; background: conic-gradient(from ${attributes.angle}deg at 50% 50%, ${attributes.color1}, rgba(0,0,0,0));">
          <div></div>
        </foreignObject>
      </svg>
    `;
}

router.get("/image/:pubkey.:format", async (req, res) => {
  const { pubkey, format } = req.params;
  console.log("pubkey:", pubkey, "format", format);

  const pubKey = validatePubkey(pubkey);
  if (!pubKey || !format || !["svg", "png"].includes(format.toLowerCase())) {
    res.status(400).send({ error: "Bad request params" });
    return;
  }

  // Calculate attributes from public key and generate SVG content
  const attributes = publicKeyToAttributes(pubKey, 1); // Only one color for now
  const svgContent = generateSVGContent(attributes);

  if (format === "svg") {
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svgContent);
    return;
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });
    const page = await browser.newPage();

    // Set viewport size to match SVG dimensions
    const svgWidth = 1024;
    const svgHeight = 1024;
    await page.setViewport({ width: svgWidth, height: svgHeight });

    // Set page margin and padding to zero
    await page.evaluate(() => {
      document.body.style.margin = "0";
      document.body.style.padding = "0";
    });

    await page.setContent(svgContent);

    // Take a screenshot with transparent background
    const imageBuffer = await page.screenshot({
      type: "png",
      omitBackground: true,
      clip: {
        x: 0 + 16,
        y: 0 + 16,
        width: svgWidth - 16,
        height: svgHeight - 16
      } // Clip the screenshot to match SVG dimensions
    });
    res.set("Content-Type", "image/png");
    res.send(imageBuffer);

    await browser.close();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;

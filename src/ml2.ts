import debug from "debug";
import { pipeline, RawImage } from "@huggingface/transformers";
import { log } from "console";
import sharp from "sharp";
const logger = debug("myapp");

export async function loadModel(global: any) {
  const detector = await pipeline(
    "object-detection",
    "Xenova/table-transformer-structure-recognition"
  );

  global.model = detector;
  logger("Load model successfully");
}
export const predict = async (imgBase64: any, model: any) => {
  // const imageBuffer = Buffer.from(imgBase64, "base64");
  let buffer = Buffer.from(imgBase64, "base64");
  let bufferPNG = await sharp(buffer).toFormat("png").toBuffer();
  const uint8 = new Uint8Array(
    bufferPNG.buffer,
    bufferPNG.byteOffset,
    bufferPNG.byteLength
  );
  // const dataUrl = `data:image/png;base64,${imgBase64}`;
  const url = "uploads/08a32be069967490fe4bc8bf34a6ac02";
  const results = await model(url, { threshold: 0.1 });
  logger(results);
  return results;
};

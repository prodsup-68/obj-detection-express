import debug from "debug";
import "dotenv/config";
import fs from "fs";
// @ts-ignore
import * as PImage from "pureimage";
import sharp from "sharp";
import { Readable } from "stream";
import promisify from "util.promisify";
import { SERVER_URL } from "./utils/env.ts";
import { type Prediction } from "./types.ts";

const logger = debug("myapp");
const readFile = promisify(fs.readFile);
const unlinkFile = promisify(fs.unlink);
const readDirFile = promisify(fs.readdir);

const font = PImage.registerFont(
  "src/utils/fonts/NotoSans-Medium.ttf",
  "NotoSans"
);
font.loadSync();

export const bufferToStream = (binary: Buffer) => {
  const readableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });

  return readableInstanceStream;
};

export async function readImageFile(filePath: string, contentType: string) {
  let buffer = await readFile(filePath);
  // let bufferPNG = await sharp(buffer).resize(300).toFormat("png").toBuffer();
  let bufferPNG = await sharp(buffer).toFormat("png").toBuffer();
  const stream = bufferToStream(bufferPNG);
  const imageBitmap = await PImage.decodePNGFromStream(stream);
  return imageBitmap;
}

export function annotateImage(imageBitmap: any, predictions: Prediction[]) {
  // Validation
  const ctx = imageBitmap.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, ctx.width, ctx.height);
  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      if (prediction.score > 0) {
        drawBox(prediction, ctx);
      }
    });
  }
}

function drawBox(prediction: Prediction, ctx: any) {
  let bboxLeft = prediction.box.xmin;
  let bboxTop = prediction.box.ymin;
  let bboxWidth = prediction.box.xmax - prediction.box.xmin;
  let bboxHeight = prediction.box.ymax - prediction.box.ymin;

  ctx.beginPath();
  ctx.font = "12px NotoSans";
  ctx.fillStyle = "red";

  ctx.fillText(
    prediction.label + ": " + Math.round(prediction.score * 100) + "%",
    bboxLeft + 5,
    bboxTop + 30
  );

  ctx.rect(bboxLeft, bboxTop, bboxWidth, bboxHeight);
  ctx.strokeStyle = "#FF0000";
  ctx.fillStyle = "rgba(140, 41, 162, 0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fill();
}

export async function writeImageFile(imageBitmap: any) {
  // Remove all png files in the public folder
  const files = await readDirFile("public");
  const filesPng = files.filter((f) => f.includes(".png"));
  for (const file of filesPng) {
    await unlinkFile(`public/${file}`);
  }
  // Write a new file
  const timestamp = new Date().getTime();
  const filename = `output_${timestamp}.png`;
  const imageURL = `${SERVER_URL}/static/${filename}`;
  await PImage.encodePNGToStream(
    imageBitmap,
    fs.createWriteStream(`public/${filename}`)
  );
  return imageURL;
}

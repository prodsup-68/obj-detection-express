import "dotenv/config";
import cors from "cors";
import debug from "debug";
import multer from "multer";
import express, { type ErrorRequestHandler } from "express";
import {
  loadModel,
  predict,
  getClassCounts,
  annotateImage,
  writeImageFile,
  readImageFile,
} from "./ml.ts";
import { PORT } from "./utils/env.js";

let global: { model: any } = { model: null };
const logger = debug("myapp");

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors({ origin: false }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());
app.use("/static", express.static("public"));

app.get("/", (req, res) => {
  res.json({ hello: "world" });
});

app.get("/load", async (req, res, next) => {
  try {
    await loadModel(global);
    res.json({ model: "Test loading successfully" });
  } catch (err) {
    next(err);
  }
});

app.post("/upload", upload.single("img"), async (req, res, next) => {
  try {
    if (!global.model) await loadModel(global);
    const contentType = req.file?.mimetype ?? "";
    const filePath = req.file?.path ?? "";
    logger(filePath, contentType);
    if (!global.model) {
      throw new Error("No model loaded");
    }
    const predictions = await predict(filePath, global.model);
    const imageBitmap = await readImageFile(filePath, contentType);
    const { countsArr, countsObj } = getClassCounts(predictions);
    annotateImage(imageBitmap, predictions);
    const imageURL = await writeImageFile(imageBitmap);
    res.json({ predictions, imageURL, countsArr, countsObj });
  } catch (err) {
    next(err);
  }
});

// JSON Error Middleware
const jsonErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let serializedError = JSON.stringify(err, Object.getOwnPropertyNames(err));
  serializedError = serializedError.replace(/\/+/g, "/");
  serializedError = serializedError.replace(/\\+/g, "/");
  res.status(500).send({
    error: serializedError,
    predictions: [],
  });
};
app.use(jsonErrorHandler);

app.on("mount", () => {
  logger("Here");
});

// Running app
app.listen(PORT, async () => {
  logger(`Listening on port ${PORT}: http://localhost:${PORT}`);
  await loadModel(global);
});

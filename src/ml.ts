import debug from "debug";
import { type Prediction } from "./types.ts";
import { pipeline } from "@huggingface/transformers";
import { MODEL } from "./utils/env.js";
const logger = debug("myapp");

// Load model function
export async function loadModel(global: any) {
  logger(`Loading model: ${MODEL} ...`);
  const detector = await pipeline("object-detection", MODEL);
  global.model = detector;
  logger(`Load model successfully: ${MODEL}`);
}

// Predict function
export const predict = async (filepath: string, model: any) => {
  const results = (await model(filepath, { threshold: 0.9 })) as Prediction[];
  logger(results);
  return results;
};

// Get class counts
export const getClassCounts = (predictions: Prediction[]) => {
  const countsObj = {} as any;

  predictions.forEach((pred) => {
    const val = countsObj?.[pred.label] ?? 0;
    countsObj[pred.label] = val + 1;
  });

  const countsArr: any[] = [];
  for (const [key, value] of Object.entries(countsObj)) {
    countsArr.push({ class: key, count: value });
  }

  countsArr.sort(function (a, b) {
    const na = a.count;
    const nb = b.count;
    if (na < nb) return 1;
    if (nb > na) return -1;
    return 0;
  });

  return { countsObj, countsArr };
};

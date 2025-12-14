export interface Prediction {
  score: number;
  label: string;
  box: Box;
}

export interface Box {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

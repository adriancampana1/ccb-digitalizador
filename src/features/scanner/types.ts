import type { RoomContext } from "../../shared/api/context";
export type Point = { x: number; y: number };
export type Quad = [Point, Point, Point, Point];
export type PageEdit = {
  corners: Quad;
  rotation: 0 | 90 | 180 | 270;
  mode: "color" | "grayscale";
  contrast: number;
};
export type ScanPage = {
  id: string;
  source: Blob;
  width: number;
  height: number;
  edit: PageEdit;
};
export type ScanBatch = {
  context: RoomContext;
  pages: ScanPage[];
  importedPdf?: File;
  draft?: {
    name: string;
    format: OutputFormat;
    folderPath: string;
    originals: boolean;
  };
  phase: "editing" | "processing" | "uploading" | "uncertain";
};
export type OutputFormat = "pdf" | "jpeg";

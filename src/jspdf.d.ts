declare module "jspdf" {
  export default class jsPDF {
    constructor(opts?: { orientation?: string; unit?: string; format?: string });
    text(text: string, x: number, y: number, options?: { align?: string }): this;
    addPage(): this;
    save(filename: string): void;
    setFontSize(size: number): this;
    setTextColor(r: number, g: number, b: number): this;
    setDrawColor(r: number, g: number, b: number): this;
    setFillColor(r: number, g: number, b: number): this;
    setLineWidth(width: number): this;
    line(x1: number, y1: number, x2: number, y2: number): this;
    rect(x: number, y: number, w: number, h: number, style?: string): this;
    getNumberOfPages(): number;
    internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  }
}

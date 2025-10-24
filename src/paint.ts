import { type LayoutBox } from "./layout";

export class Painter {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public paint(layoutRoot: LayoutBox) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    for (const childBox of layoutRoot.children) {
      this.paintBox(childBox);
    }
  }

  private paintBox(box: LayoutBox) {
    // Futuramente: desenhar background, borders, etc.

    // Desenhar o texto
    if (box.renderInfo?.text && box.renderInfo?.font) {
      // USA A COR DO ESTILO DA CAIXA!
      this.ctx.fillStyle = box.style.color || 'black';
      this.ctx.font = box.renderInfo.font;
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(box.renderInfo.text, box.dimensions.x, box.dimensions.y);
    }

    // Recursão para desenhar os filhos
    for (const child of box.children) {
      this.paintBox(child);
    }
  }
}
import { type LayoutBox } from "./layout";

const DESCENDER_CHARS = new Set(['g', 'j', 'p', 'q', 'y']);

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
    if (box.renderInfo?.text && box.renderInfo?.font && box.renderInfo?.fontMetrics) {
      this.ctx.fillStyle = box.style.color || 'black';
      this.ctx.font = box.renderInfo.font;
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(box.renderInfo.text, box.dimensions.x, box.dimensions.y);

      if (box.style.textDecoration === 'underline') {
        this.drawUnderline(box);
      }
    }

    for (const child of box.children) {
      this.paintBox(child);
    }
  }

  /**
   * Desenha uma linha sob uma caixa de layout.
   */
  private drawUnderline(box: LayoutBox) {
    const metrics = box.renderInfo!.fontMetrics!;
    const text = box.renderInfo!.text!;

    this.ctx.strokeStyle = box.style.color || 'black';
    const lineWidth = Math.max(1, Math.floor(box.style.fontSize / 16));
    this.ctx.lineWidth = lineWidth;

    const ascent = metrics.fontBoundingBoxAscent;
    const baselineY = box.dimensions.y + ascent;
    const underlineOffsetY = lineWidth;

    // 1. APLICAÇÃO DO AJUSTE FINO SUGERIDO
    let lineY = baselineY + underlineOffsetY - 1.5;

    // A posição X inicial para o primeiro caractere
    let currentX = box.dimensions.x;

    // 2. LÓGICA DE DESENHO CARACTERE POR CARACTERE
    this.ctx.beginPath();

    for (const char of text) {
      const charWidth = this.ctx.measureText(char).width;

      // Se o caractere NÃO for um descendente, desenhamos um segmento de linha.
      if (!DESCENDER_CHARS.has(char)) {
        this.ctx.moveTo(currentX, lineY);
        this.ctx.lineTo(currentX + charWidth, lineY);
      }
      // Se for um descendente, simplesmente avançamos a posição sem desenhar,
      // deixando uma lacuna. A caneta é "levantada" implicitamente.

      // Avança a posição para o próximo caractere
      currentX += charWidth;
    }

    // Desenha todos os segmentos de linha acumulados de uma só vez.
    this.ctx.stroke();
  }

}
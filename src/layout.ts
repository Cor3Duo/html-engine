import { type StyledNode, type ComputedStyle } from './style';

// --- TIPOS DE DADOS ---

// Representa a caixa de um elemento, com geometria definida.
export interface LayoutBox {
  style: ComputedStyle; // Mantém uma referência ao estilo
  dimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  children: LayoutBox[];
  // Propriedades específicas de renderização (para desacoplar do paint)
  renderInfo?: {
    text?: string;
    font?: string;
  }
}

// Interface para um medidor, abstraindo o canvas (DIP)
interface TextMeasurer {
  measure(text: string, font: string): { width: number };
}

// --- LÓGICA DE LAYOUT ---

export class Layout {
  private measurer: TextMeasurer;

  // DIP: Recebemos a dependência (medidor) em vez de criá-la.
  constructor(measurer: TextMeasurer) {
    this.measurer = measurer;
  }

  public buildLayoutTree(styledRoot: StyledNode): LayoutBox {
    const canvasWidth = 600; // Poderia vir como parâmetro
    const canvasHeight = 600;

    // A caixa raiz é o "viewport"
    const rootBox: LayoutBox = {
      style: styledRoot.computedStyle,
      dimensions: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
      children: [],
    };

    let currentY = rootBox.style.marginTop;
    let previousMarginBottom = 0;

    for (const childNode of styledRoot.children) {
      // Por enquanto, apenas layout de bloco
      const childBox = this.layoutBlock(childNode, rootBox, currentY, previousMarginBottom);
      rootBox.children.push(childBox);

      currentY = childBox.dimensions.y + childBox.dimensions.height;
      previousMarginBottom = childBox.style.marginBottom;
    }

    return rootBox;
  }

  private layoutBlock(node: StyledNode, parent: LayoutBox, y: number, prevMargin: number): LayoutBox {
    const style = node.computedStyle;

    // Calcular dimensões
    const fontString = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    const textMetrics = this.measurer.measure(node.domNode.textContent || '', fontString);

    const availableWidth = parent.dimensions.width - parent.style.marginLeft - parent.style.marginRight;

    const width = Math.min(textMetrics.width, availableWidth);
    const height = style.fontSize; // Simplificação, sem quebra de linha

    // Calcular posição
    const margin = Math.max(prevMargin, style.marginTop);
    const finalX = parent.style.marginLeft;
    const finalY = y + margin;

    const box: LayoutBox = {
      style: style,
      dimensions: { x: finalX, y: finalY, width: width, height: height },
      children: [],
      renderInfo: {
        text: node.domNode.textContent || '',
        font: fontString,
      }
    };

    // Futuro: Lógica recursiva para os filhos do filho
    // for (const child of node.children) { ... }

    return box;
  }
}
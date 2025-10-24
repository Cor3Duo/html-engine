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
    // Adicionamos um lugar para as métricas detalhadas da fonte
    fontMetrics?: TextMetrics;
  }
}

// 2. ATUALIZAR A ABSTRAÇÃO DO MEDIDOR
interface TextMeasurer {
  // Agora ele retorna o objeto TextMetrics completo
  measure(text: string, font: string): TextMetrics;
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
      },
    };

    // NOVA LÓGICA: Em vez de preencher renderInfo, geramos filhos inline
    box.children = this.layoutInlineChildren(node, box);
    box.renderInfo = undefined; // O texto agora está nos filhos

    // Futuro: Lógica recursiva para os filhos do filho
    // for (const child of node.children) { ... }

    return box;
  }

  /**
   * Gera uma lista de LayoutBoxes para o conteúdo inline de um nó de bloco.
   * @param parentStyledNode - O nó de estilo do container (ex: o <p>).
   * @param parentLayoutBox - A caixa de layout já calculada para o container.
   * @returns Um array de LayoutBoxes inline.
   */
  private layoutInlineChildren(parentStyledNode: StyledNode, parentLayoutBox: LayoutBox): LayoutBox[] {
    const inlineBoxes: LayoutBox[] = [];
    let currentX = parentLayoutBox.dimensions.x;
    const currentY = parentLayoutBox.dimensions.y;

    // Precisamos de um mapa para encontrar facilmente o StyledNode de um ElementNode
    const elementStyleMap = new Map(parentStyledNode.children.map(child => [child.domNode, child]));

    // Iteramos sobre os FILHOS REAIS do DOM (incluindo nós de texto)
    for (const childDomNode of Array.from(parentStyledNode.domNode.childNodes)) {
      if (childDomNode.nodeType === Node.TEXT_NODE) {
        const text = childDomNode.textContent || '';
        if (text.trim().length === 0) continue; // Ignora nós de texto vazios

        // Nós de texto herdam o estilo do pai (<p>)
        const style = parentStyledNode.computedStyle;
        const fontString = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
        const metrics = this.measurer.measure(text, fontString);

        inlineBoxes.push({
          style: style,
          dimensions: { x: currentX, y: currentY, width: metrics.width, height: style.fontSize },
          children: [],
          renderInfo: { text: text, font: fontString, fontMetrics: metrics } // Armazena aqui!
        });

        currentX += metrics.width;
      }
      else if (childDomNode.nodeType === Node.ELEMENT_NODE) {
        // Elementos (como <a>) usam seu próprio estilo específico
        const styledNode = elementStyleMap.get(childDomNode as HTMLElement)!;
        if (!styledNode) continue;

        const style = styledNode.computedStyle;
        const text = styledNode.domNode.textContent || '';
        const fontString = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
        const metrics = this.measurer.measure(text, fontString);

        inlineBoxes.push({
          style: style, // AQUI está o estilo do <a> com a cor azul!
          dimensions: { x: currentX, y: currentY, width: metrics.width, height: style.fontSize },
          children: [],
          renderInfo: { text: text, font: fontString, fontMetrics: metrics } // Armazena aqui!
        });

        currentX += metrics.width;
      }
    }
    return inlineBoxes;
  }
}
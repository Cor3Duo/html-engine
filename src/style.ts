// --- TIPOS DE DADOS ---
export type CSSUnit = 'px' | 'em';
export type CSSValue = { value: number, unit: CSSUnit };

// Interface para um objeto de estilo computado (valores em pixels)
export interface ComputedStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  color: string;
  textDecoration: string;
}

// Nó do DOM com seu estilo computado anexado
export interface StyledNode {
  domNode: HTMLElement;
  computedStyle: ComputedStyle;
  children: StyledNode[];
}

// --- BANCO DE DADOS DE ESTILOS PADRÃO (USER-AGENT STYLESHEET) ---
// Agora com uma estrutura mais robusta para os valores
const defaultStyles: { [key: string]: any } = {
  html: { fontSize: '16px', fontFamily: 'Times New Roman', color: 'black', textDecoration: 'none' },
  body: { display: 'block', marginTop: '8px', marginRight: '8px', marginBottom: '8px', marginLeft: '8px', fontSize: '1em' },
  h1: { display: 'block', fontSize: '2em', marginTop: '0.67em', marginBottom: '0.67em', fontWeight: 'bold', textDecoration: 'none' },
  p: { display: 'block', fontSize: '1em', marginTop: '1em', marginBottom: '1em', fontWeight: 'normal', textDecoration: 'none' },
  a: { display: 'inline', color: 'blue', textDecoration: 'underline' },
};

// --- LÓGICA DE COMPUTAÇÃO ---

/**
 * Constrói a Árvore de Estilos, computando o CSS para cada nó do DOM.
 * @param domRoot - O nó raiz do DOM (ex: dom.body)
 * @returns A raiz da StyledNode.
 */
export function buildStyleTree(domRoot: HTMLElement): StyledNode {
  const documentStyle: ComputedStyle = {
    fontSize: 16,
    fontFamily: 'Times New Roman',
    fontWeight: 'normal',
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
    color: 'black',
    textDecoration: 'none',
  };

  function computeNodeStyle(domNode: HTMLElement, parentStyle: ComputedStyle): StyledNode {
    const specifiedStyle = defaultStyles[domNode.tagName.toLowerCase()] || {};
    const computedStyle = getComputedStyle(specifiedStyle, parentStyle);

    const children = Array.from(domNode.children as HTMLCollectionOf<HTMLElement>)
      .map(child => computeNodeStyle(child, computedStyle));

    return { domNode, computedStyle, children };
  }

  return computeNodeStyle(domRoot, documentStyle);
}

function getComputedStyle(specifiedStyle: any, parentStyle: ComputedStyle): ComputedStyle {
  // Lógica de herança
  const computed: any = {
    fontFamily: specifiedStyle.fontFamily || parentStyle.fontFamily,
    fontWeight: specifiedStyle.fontWeight || parentStyle.fontWeight || 'normal',
  };

  computed.color = specifiedStyle.color || parentStyle.color;
  computed.textDecoration = specifiedStyle.textDecoration || 'none';

  // Lógica de computação de unidades
  const parentFontSize = parentStyle.fontSize;
  computed.fontSize = computePixelValue(specifiedStyle.fontSize || '1em', parentFontSize, parentFontSize);

  const selfFontSize = computed.fontSize;
  computed.marginTop = computePixelValue(specifiedStyle.marginTop || '0px', selfFontSize, parentFontSize);
  computed.marginRight = computePixelValue(specifiedStyle.marginRight || '0px', selfFontSize, parentFontSize);
  computed.marginBottom = computePixelValue(specifiedStyle.marginBottom || '0px', selfFontSize, parentFontSize);
  computed.marginLeft = computePixelValue(specifiedStyle.marginLeft || '0px', selfFontSize, parentFontSize);

  return computed as ComputedStyle;
}

// OCP: Agora, para adicionar uma nova unidade (ex: 'rem'), basta adicionar um case.
function computePixelValue(value: string, selfFontSize: number, parentFontSize: number): number {
  if (value.endsWith('em')) return parseFloat(value) * selfFontSize;
  if (value.endsWith('px')) return parseFloat(value);
  // Adicionar 'rem', '%', etc. aqui
  return 0;
}
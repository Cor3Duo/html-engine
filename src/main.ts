import { buildStyleTree } from './style';
import { Layout } from './layout';
import { Painter } from './paint';

// --- SETUP ---
const cvs = document.createElement('canvas');
cvs.width = innerWidth;
cvs.height = innerHeight;
document.body.appendChild(cvs);
const ctx = cvs.getContext('2d')!;

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>html-engine</title>
  </head>
  <body>
    <h1>Example Domain</h1>
    <p>This domain is for use in documentation examples without needing permission. Avoid use in operations.</p>
    <p><a href="https://iana.org/domains/example">Learn moregk</a></p>
  </body>
</html>`;
const dom = new DOMParser().parseFromString(html, 'text/html');

// --- PROCESSO DE RENDERIZAÇÃO ---

// 1. Fase de Estilo: DOM Tree -> Style Tree
const styledTree = buildStyleTree(dom.body);
console.log("Style Tree:", styledTree);

// 2. Fase de Layout: Style Tree -> Layout Tree
const layoutEngine = new Layout({ 
  // Nenhuma mudança funcional necessária aqui, pois ctx.measureText já retorna o objeto completo.
  // Apenas garantimos que nossa tipagem e lógica estejam alinhadas.
  measure: (text, font) => {
    ctx.font = font;
    return ctx.measureText(text);
  }
});
const layoutTree = layoutEngine.buildLayoutTree(styledTree);
console.log("Layout Tree:", layoutTree);

// 3. Fase de Pintura: Layout Tree -> Pixels no Canvas
const painter = new Painter(ctx);
painter.paint(layoutTree);
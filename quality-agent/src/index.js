#!/usr/bin/env node
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { auditCatalog, summarizeFindings } from './audit.js';
import { explainFindings } from './explain.js';
import { connectProductMcp } from './mcp-client.js';

const fixMode = process.argv.includes('--fix');
const maxUpdates = Number(process.env.AGENT_MAX_UPDATES || 10);
const mcp = await connectProductMcp();

function printFindings(findings) {
  if (!findings.length) {
    console.info('No se encontraron inconsistencias con las reglas configuradas.');
    return;
  }

  console.table(findings.map((item) => ({
    producto: item.productName,
    campo: item.field,
    valor: JSON.stringify(item.currentValue),
    problema: item.code,
    correcciónSegura: item.safeFix ? 'sí' : 'no',
  })));
}

try {
  const products = await mcp.getProducts();
  const findings = auditCatalog(products);
  const summary = summarizeFindings(findings);

  console.info(`Productos auditados: ${products.length}`);
  console.info('Resumen:', summary);
  printFindings(findings);
  console.info('\nExplicación del agente:\n');
  console.info(await explainFindings(findings, summary));

  if (!fixMode) {
    console.info('\nModo solo lectura. Ejecutá npm run agent:fix para revisar correcciones seguras.');
  } else {
    const proposals = findings.filter((item) => item.safeFix).slice(0, maxUpdates);
    const terminal = createInterface({ input, output });
    let updated = 0;

    try {
      for (const proposal of proposals) {
        console.info('\nCorrección propuesta:');
        console.info(`Producto: ${proposal.productName} (${proposal.productId})`);
        console.info(`Campo: ${proposal.field}`);
        console.info(`Valor actual: ${JSON.stringify(proposal.currentValue)}`);
        console.info(`Valor propuesto: ${JSON.stringify(proposal.proposedValue)}`);
        console.info(`Motivo: ${proposal.message}`);

        const answer = await terminal.question('¿Autorizar esta modificación? (s/N): ');
        if (!['s', 'si', 'sí', 'y', 'yes'].includes(answer.trim().toLowerCase())) {
          console.info('Corrección rechazada.');
          continue;
        }

        const product = await mcp.updateProduct(proposal.productId, proposal.safeFix);
        updated += 1;
        console.info(`Actualización confirmada. Nuevo valor: ${JSON.stringify(product[proposal.field])}`);
      }
    } finally {
      terminal.close();
    }

    const secondProducts = await mcp.getProducts();
    const secondFindings = auditCatalog(secondProducts);
    console.info('\nResultado de la segunda auditoría:');
    console.info({
      actualizacionesAprobadas: updated,
      hallazgosAntes: findings.length,
      hallazgosDespués: secondFindings.length,
    });
  }
} finally {
  await mcp.close();
}

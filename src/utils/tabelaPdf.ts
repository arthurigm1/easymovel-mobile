import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { formatCurrencyExact, formatDate, getEmpresaNome } from './format';
import type { Empreendimento, UnidadeItem } from '@/types';

// PDF da tabela de vendas — mesmas regras do createTabelaUnidadesPdf do PWA:
//  - unidades "Vendido" ficam de fora (o PDF é material de venda)
//  - cabeçalho com logo da empresa, nome, endereço e data de atualização
//  - rodapé com as formas de pagamento (parcelamentos) e o aviso da construtora
// Gerado como HTML → expo-print, e entregue via expo-sharing.

function escapeHtml(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function areaFmt(area?: number): string {
  if (!area) return '—';
  return `${area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

function compareUnits(a: UnidadeItem, b: UnidadeItem): number {
  const bloco = (a.bloco ?? '').localeCompare(b.bloco ?? '', 'pt-BR', { numeric: true });
  if (bloco !== 0) return bloco;
  return (a.descricao ?? '').localeCompare(b.descricao ?? '', 'pt-BR', { numeric: true });
}

function buildHtml(e: Empreendimento, units: UnidadeItem[]): string {
  const empresa = getEmpresaNome(e.empresa);
  const logo = e.empresa?.anexos?.find((a) => a.categoria === 'logo_empresa')?.link;
  const hasBlocos = !!e.varios_blocos || units.some((u) => u.bloco);

  const endereco = [
    [e.endereco, e.numero].filter(Boolean).join(', '),
    e.bairro_comercial || e.bairro,
    [e.cidade, e.uf].filter(Boolean).join('/'),
  ]
    .filter(Boolean)
    .join(' · ');

  const rows = [...units]
    .sort(compareUnits)
    .map((u) => {
      const valor =
        u.valor != null && Number(u.valor) > 0 ? formatCurrencyExact(u.valor) : 'A consultar';
      return `
        <tr>
          ${hasBlocos ? `<td>${escapeHtml(u.bloco) || '—'}</td>` : ''}
          <td class="b">${escapeHtml(u.descricao) || '—'}</td>
          <td>${escapeHtml(u.tipologia) || '—'}</td>
          <td>${areaFmt(u.area)}</td>
          <td class="c">${u.quant_quartos ?? '—'}</td>
          <td class="c">${u.quant_suites ?? '—'}</td>
          <td class="c">${u.quant_vagas ?? '—'}</td>
          <td><span class="st">${escapeHtml(u.status) || '—'}</span></td>
          <td class="v">${valor}</td>
        </tr>`;
    })
    .join('');

  const parcelas = (e.parcelamentos ?? [])
    .slice()
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((p) => {
      const pct = p.percentual != null ? `${(p.percentual * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—';
      const qtd = p.quant_parcelas != null ? `${p.quant_parcelas}x` : '';
      return `<li><strong>${escapeHtml(p.descricao) || 'Parcela'}</strong> — ${pct} ${qtd}</li>`;
    })
    .join('');

  const atualizacao = formatDate(new Date().toISOString());

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 24px; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #16161D; margin: 0; font-size: 11px;
  }
  .head { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #5457F0; padding-bottom: 12px; }
  .logo { width: 54px; height: 54px; object-fit: contain; border-radius: 8px; }
  .head h1 { margin: 0 0 2px; font-size: 19px; letter-spacing: -0.4px; }
  .head .sub { color: #4A4A57; font-size: 11px; }
  .head .emp { color: #5457F0; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; }
  .meta { margin: 12px 0 14px; display: flex; gap: 18px; color: #4A4A57; font-size: 10.5px; }
  .meta b { color: #16161D; }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: #F4F4FA; color: #4A4A57; text-align: left; font-size: 9px;
    text-transform: uppercase; letter-spacing: .4px; padding: 7px 6px;
    border-bottom: 1px solid #E7E7EF;
  }
  td { padding: 7px 6px; border-bottom: 1px solid #EDEDF3; }
  td.b { font-weight: 700; }
  td.c { text-align: center; }
  td.v { font-weight: 700; color: #5457F0; text-align: right; white-space: nowrap; }
  .st { background: #EEEEFC; color: #3A3DBF; border-radius: 20px; padding: 2px 8px; font-size: 9.5px; font-weight: 700; }
  h2 { font-size: 12px; margin: 18px 0 6px; }
  ul { margin: 0; padding-left: 16px; color: #4A4A57; }
  li { margin-bottom: 2px; }
  .foot { margin-top: 18px; border-top: 1px solid #E7E7EF; padding-top: 10px; color: #87878F; font-size: 9.5px; }
  .warn { color: #DC2626; font-style: italic; }
</style>
</head>
<body>
  <div class="head">
    ${logo ? `<img class="logo" src="${escapeHtml(logo)}" />` : ''}
    <div>
      <div class="emp">${escapeHtml(empresa)}</div>
      <h1>${escapeHtml(e.nome_empreendimento)}</h1>
      <div class="sub">${escapeHtml(endereco)}</div>
    </div>
  </div>

  <div class="meta">
    <div><b>${units.length}</b> unidades disponíveis</div>
    ${e.status ? `<div>Status da obra: <b>${escapeHtml(e.status)}</b></div>` : ''}
    ${e.final_construcao ? `<div>Entrega: <b>${escapeHtml(formatDate(e.final_construcao) ?? '')}</b></div>` : ''}
    <div>Atualizado em <b>${escapeHtml(atualizacao ?? '')}</b></div>
  </div>

  <table>
    <thead>
      <tr>
        ${hasBlocos ? '<th>Bloco</th>' : ''}
        <th>Unidade</th>
        <th>Tipologia</th>
        <th>Área</th>
        <th style="text-align:center">Qts</th>
        <th style="text-align:center">Suítes</th>
        <th style="text-align:center">Vagas</th>
        <th>Status</th>
        <th style="text-align:right">Valor</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  ${parcelas ? `<h2>Formas de pagamento</h2><ul>${parcelas}</ul>` : ''}

  <div class="foot">
    <p class="warn">* Valores sujeitos à aprovação da construtora responsável e disponibilidade no momento da reserva.</p>
    <p>Documento gerado pelo app Blow em ${escapeHtml(atualizacao ?? '')}.</p>
  </div>
</body>
</html>`;
}

// Nome de arquivo amigável — é o que o cliente vê ao receber no WhatsApp.
function nomeArquivo(nome: string): string {
  const slug = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `tabela-${slug || 'empreendimento'}-${mes}-${hoje.getFullYear()}.pdf`;
}

/**
 * Gera o PDF da tabela de vendas e abre a folha de compartilhamento nativa.
 * Exclui unidades vendidas (material de venda), como no PWA.
 */
export async function gerarPdfTabelaVendas(
  empreendimento: Empreendimento,
  unidades: UnidadeItem[]
): Promise<void> {
  const vendaveis = unidades.filter((u) => u.status !== 'Vendido');
  const html = buildHtml(empreendimento, vendaveis);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  // O expo-print grava num cache que o provider de compartilhamento não
  // consegue ler ("Not allowed to read file under given URL"). Copiamos para o
  // diretório do app — que também dá um nome de arquivo decente ao anexo.
  const origem = new File(uri);
  const destino = new File(Paths.document, nomeArquivo(empreendimento.nome_empreendimento));
  if (destino.exists) destino.delete();
  origem.copy(destino);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destino.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Tabela de vendas — ${empreendimento.nome_empreendimento}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

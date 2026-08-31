import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius } from '@/constants/theme';

// Lógica portada 1:1 do PWA (src/Pages/Empreendimento/Formik/selectOptions.js e
// Edit/Components/StatusStepper.jsx) — mesmos rótulos, mesmas regras:
//  - etapas: Pré-Lançamento, Lançamento, Em Construção, Pronto para Morar
//  - "Quase Pronto" é inserido na posição 4 quando faltam ≤ 3 meses pra entrega
//  - entrega já passada → etapa atual vira "Pronto para Morar"
//  - datas: Lançamento mostra data_lancamento; Pronto para Morar, final_construcao
//  - finalidade "comercial" troca "Pronto para Morar" por "Pronto"
// Layout: o vertical/empilhado do próprio PWA no breakpoint mobile (xs).

interface Etapa {
  label: string;
  value: string;
}

const ETAPAS_BASE: Etapa[] = [
  { label: 'Pré-Lançamento', value: 'pre-lancamento' },
  { label: 'Lançamento', value: 'Lançamento' },
  { label: 'Em Construção', value: 'Em Construção' },
  { label: 'Pronto para Morar', value: 'Pronto para Morar' },
];
const ETAPA_QUASE_PRONTO: Etapa = { label: 'Quase Pronto', value: 'Quase Pronto' };

function indiceBaseStatus(status?: string): number {
  if (!status) return -1;
  const s = String(status).toLowerCase().trim();
  if (
    s.includes('pré-lanç') ||
    s.includes('pre-lanc') ||
    s.includes('pré lanç') ||
    s.includes('pre lanc') ||
    s.includes('prelanc') ||
    s.includes('breve')
  ) {
    return 0;
  }
  if (s.includes('planta') || s.includes('lanç') || s.includes('lanc')) return 1;
  if (s.includes('constru')) return 2;
  if (s.includes('pronto') || s.includes('conclu') || s.includes('entregue')) return 3;
  return -1;
}

function getEtapasComStatus(
  status?: string,
  finalConstrucao?: string
): { etapas: Etapa[]; atual: number } {
  const atualBase = indiceBaseStatus(status);

  let entregaPassou = false;
  let quasePronto = false;
  if (finalConstrucao) {
    const entrega = new Date(finalConstrucao);
    if (!Number.isNaN(entrega.getTime())) {
      const hoje = new Date();
      if (entrega.getTime() <= hoje.getTime()) {
        entregaPassou = true;
      } else {
        const limite = new Date(hoje);
        limite.setMonth(limite.getMonth() + 3);
        if (entrega.getTime() <= limite.getTime()) quasePronto = true;
      }
    }
  }

  if (entregaPassou) {
    return { etapas: ETAPAS_BASE, atual: 3 };
  }
  if (quasePronto) {
    const etapas = [
      ETAPAS_BASE[0],
      ETAPAS_BASE[1],
      ETAPAS_BASE[2],
      ETAPA_QUASE_PRONTO,
      ETAPAS_BASE[3],
    ];
    return { etapas, atual: 3 };
  }
  return { etapas: ETAPAS_BASE, atual: atualBase };
}

function ajustarLabelPorFinalidade(label: string, finalidade?: string): string {
  const comercial = String(finalidade ?? '').toLowerCase().trim() === 'comercial';
  if (!comercial || !label) return label;
  const l = label.toLowerCase();
  if (l.includes('pronto para morar') || l.includes('conclu') || l.includes('entregue')) {
    return 'Pronto';
  }
  return label;
}

// "Ago de 2026" — mesmo formato do PWA.
function formatarData(data?: string): string {
  if (!data) return '';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    .replace('.', '')
    .replace(/^\w/, (c) => c.toUpperCase());
}

interface Props {
  status?: string;
  dataLancamento?: string;
  finalConstrucao?: string;
  finalidade?: string;
}

const NODE = 32;

export function StatusStepper({ status, dataLancamento, finalConstrucao, finalidade }: Props) {
  const { etapas, atual } = getEtapasComStatus(status, finalConstrucao);
  if (atual === -1) return null;

  function subLabelPara(label: string): string {
    if (label === 'Lançamento') return formatarData(dataLancamento);
    if (label === 'Pronto para Morar') return formatarData(finalConstrucao);
    return '';
  }

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Andamento da obra: ${ajustarLabelPorFinalidade(etapas[atual].label, finalidade)}`}>
      {etapas.map((etapa, index) => {
        const ativa = index <= atual;
        const isCurrent = index === atual;
        const concluida = index < atual;
        const linhaPreenchida = atual >= index + 1;
        const isUltima = index === etapas.length - 1;
        const sub = subLabelPara(etapa.label);

        return (
          <Fragment key={etapa.value}>
            <View style={styles.rowItem}>
              <View style={isCurrent ? styles.currentRing : null}>
                <View
                  style={[
                    styles.node,
                    ativa ? styles.nodeAtiva : styles.nodeFutura,
                  ]}
                >
                  {concluida ? (
                    <Ionicons name="checkmark" size={16} color={Palette.white} />
                  ) : (
                    <Text style={[styles.nodeNum, ativa ? styles.nodeNumAtiva : null]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.labels}>
                <Text
                  style={[
                    styles.label,
                    isCurrent
                      ? styles.labelCurrent
                      : ativa
                        ? styles.labelAtiva
                        : styles.labelFutura,
                  ]}
                >
                  {ajustarLabelPorFinalidade(etapa.label, finalidade)}
                </Text>
                {sub ? (
                  <Text style={[styles.sub, ativa ? styles.subAtiva : null]}>{sub}</Text>
                ) : null}
              </View>
            </View>

            {!isUltima && (
              <View style={styles.connectorTrack}>
                {linhaPreenchida && <View style={styles.connectorFill} />}
              </View>
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentRing: {
    borderRadius: Radius.full,
    // anel suave em volta da etapa atual (boxShadow 0 0 0 4px do PWA)
    borderWidth: 4,
    borderColor: Palette.primarySubtle,
    margin: -4,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeAtiva: {
    backgroundColor: Palette.primary,
    borderWidth: 2,
    borderColor: Palette.primary,
  },
  nodeFutura: {
    backgroundColor: Palette.white,
    borderWidth: 2,
    borderColor: '#E3E6EF',
  },
  nodeNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9DA4AE',
  },
  nodeNumAtiva: {
    color: Palette.white,
  },
  labels: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  labelCurrent: { color: Palette.primary, fontWeight: '700' },
  labelAtiva: { color: Palette.text },
  labelFutura: { color: Palette.textDisabled },
  sub: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
    marginTop: 2,
    color: Palette.textSecondary,
  },
  subAtiva: { color: Palette.primaryHover },

  // Conector vertical alinhado sob o centro do círculo (largura 4, altura 30)
  connectorTrack: {
    width: 4,
    height: 30,
    borderRadius: 3,
    backgroundColor: '#EAEDF6',
    marginLeft: NODE / 2 - 2,
    marginVertical: 8,
    overflow: 'hidden',
  },
  connectorFill: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.primary,
  },
});

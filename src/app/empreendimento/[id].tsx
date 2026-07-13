import { Image } from 'expo-image';
import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEmpreendimento } from '@/hooks/useEmpreendimentos';
import { postAcesso, registrarInteresse } from '@/services/empreendimentos';
import { StatusBadge } from '@/components/StatusBadge';
import { SalesTable } from '@/components/SalesTable';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { StatusStepper } from '@/components/StatusStepper';
import {
  formatCurrency,
  formatDate,
  formatAreaRange,
  formatQuartosRange,
  getAllPhotos,
  getPlantasPhotos,
  getDocumentos,
  getDocumentoLabel,
  getEmpresaLogo,
  getEmpresaNome,
  getMainImage,
} from '@/utils/format';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

function getYoutubeThumbnail(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

const ALL_TABS = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'photos', label: 'Fotos' },
  { key: 'plantas', label: 'Plantas' },
  { key: 'tabela', label: 'Tabela de Vendas' },
] as const;
type TabKey = (typeof ALL_TABS)[number]['key'];

function InfoCard({ icon, label, value }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={infoStyles.card}>
      <View style={infoStyles.iconWrap}>
        <Ionicons name={icon} size={18} color={Palette.primary} />
      </View>
      <View style={infoStyles.texts}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    flex: 1,
    minWidth: '47%',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  label: { fontSize: 11, color: Palette.textTertiary, fontWeight: '600' },
  value: { fontSize: 14, color: Palette.text, fontWeight: '700', marginTop: 2 },
});
export default function EmpreendimentoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [photoIndex, setPhotoIndex] = useState(0);
  const { data, isLoading, isError, refetch, isRefetching } = useEmpreendimento(id);
  const photosRef = useRef<FlatList>(null);
  const [interesseLoading, setInteresseLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [plantasLightboxIndex, setPlantasLightboxIndex] = useState(0);
  const [plantasLightboxVisible, setPlantasLightboxVisible] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxVisible(true);
  }

  function openPlantasLightbox(index: number) {
    setPlantasLightboxIndex(index);
    setPlantasLightboxVisible(true);
  }

  useEffect(() => {
    if (id) {
      postAcesso({
        tipo: 'Visualizar',
        descricao: 'Visualizou empreendimento',
        empreendimento_id: id,
      });
    }
  }, [id]);

  async function handleShare(nome: string, addr: string, valor?: string | number) {
    const e2 = data?.dados;
    const rawPhone = e2?.telefone_responsavel_empreendimento?.replace(/\D/g, '') ?? '';
    const waNum = rawPhone.length >= 10
      ? (rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`)
      : null;
    const parts = [
      nome,
      addr,
      valor ? `A partir de ${formatCurrency(valor)}` : null,
      e2?.status ? `Status: ${e2.status}` : null,
      e2?.unidades_quartos && formatQuartosRange(e2.unidades_quartos)
        ? `${formatQuartosRange(e2.unidades_quartos)} quartos` : null,
      e2?.unidades_area && formatAreaRange(e2.unidades_area)
        ? `Área: ${formatAreaRange(e2.unidades_area)}` : null,
      e2?.unidades_vagas && formatQuartosRange(e2.unidades_vagas)
        ? `${formatQuartosRange(e2.unidades_vagas)} vaga(s)` : null,
      e2?.unidades_disponiveis != null
        ? `${e2.unidades_disponiveis} unidades disponíveis` : null,
      waNum ? `Contato: https://wa.me/${waNum}` : null,
    ].filter(Boolean);
    await Share.share({ title: nome, message: parts.join('\n') });
  }

  function handleInteresse(empreendimentoId: string) {
    Alert.alert(
      'Registrar Interesse',
      'Deseja que entremos em contato sobre este empreendimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setInteresseLoading(true);
            try {
              await registrarInteresse(empreendimentoId);
              Alert.alert('Interesse registrado!', 'Nossa equipe entrará em contato em breve.');
            } catch {
              Alert.alert('Erro', 'Não foi possível registrar seu interesse. Tente novamente.');
            } finally {
              setInteresseLoading(false);
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.skeletonHero} />
        <View style={styles.skeletonBody}>
          <View style={[styles.skeletonLine, { width: '40%', height: 12 }]} />
          <View style={[styles.skeletonLine, { width: '85%', height: 22 }]} />
          <View style={[styles.skeletonLine, { width: '65%', height: 14 }]} />
          <View style={styles.skeletonRow}>
            <View style={[styles.skeletonChip]} />
            <View style={[styles.skeletonChip]} />
            <View style={[styles.skeletonChip]} />
          </View>
          <View style={[styles.skeletonLine, { width: '50%', height: 28, marginTop: 8 }]} />
        </View>
        <ActivityIndicator
          size="small"
          color={Palette.primary}
          style={{ position: 'absolute', bottom: 40, alignSelf: 'center' }}
        />
      </View>
    );
  }

  if (isError || (!isLoading && !data?.dados)) {
    return (
      <SafeAreaView style={styles.center}>
        <EmptyState
          icon="alert-circle-outline"
          title="Erro ao carregar"
          message="Não foi possível carregar os dados deste empreendimento."
          action={{ label: 'Tentar novamente', onPress: () => refetch() }}
        />
      </SafeAreaView>
    );
  }

  const e = data.dados;
  const photos = getAllPhotos(e);
  const plantas = getPlantasPhotos(e);
  const mainImage = getMainImage(e);
  const logoUrl = getEmpresaLogo(e.empresa);
  const empresaNome = getEmpresaNome(e.empresa);
  const isPreLancamento = ['pre-lancamento', 'Pré-Lançamento', 'pre lancamento'].includes(e.status ?? '');
  const hasCoords = !!(e.latitude && e.longitude);

  // Build contact list: up to 2 responsáveis from the property, fallback to empresa contacts
  type ContactInfo = { nome: string; phone: string };
  function buildContacts(): ContactInfo[] {
    const raw: Array<{ nome?: string; tel?: string }> = [
      { nome: e.nome_responsavel_empreendimento,   tel: e.telefone_responsavel_empreendimento },
      { nome: e.nome_responsavel_empreendimento_2, tel: e.telefone_responsavel_empreendimento_2 },
      { nome: e.empresa?.nome_do_responsavel,      tel: e.empresa?.telefone_do_responsavel },
      { nome: e.empresa?.nome_do_responsavel_2,    tel: e.empresa?.telefone_do_responsavel_2 },
    ];
    const seen = new Set<string>();
    const result: ContactInfo[] = [];
    for (const r of raw) {
      const p = r.tel?.replace(/\D/g, '') ?? '';
      if (p.length >= 10 && !seen.has(p)) {
        seen.add(p);
        result.push({ nome: r.nome ?? '', phone: p });
      }
      if (result.length >= 2) break;
    }
    return result;
  }
  const contacts = buildContacts();
  const phone = contacts[0]?.phone ?? '';
  const hasWhatsApp = contacts.length > 0;

  function handleMap() {
    if (!e.latitude || !e.longitude) return;
    const label = encodeURIComponent(e.nome_empreendimento);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${e.latitude},${e.longitude}`,
      android: `geo:${e.latitude},${e.longitude}?q=${e.latitude},${e.longitude}(${label})`,
      default: `https://www.google.com/maps?q=${e.latitude},${e.longitude}`,
    });
    Linking.openURL(url);
  }

  function handleWhatsApp() {
    const num = phone.startsWith('55') ? phone : `55${phone}`;
    const msg = encodeURIComponent(`Olá! Vi o empreendimento "${e.nome_empreendimento}" e gostaria de mais informações.`);
    Linking.openURL(`https://wa.me/${num}?text=${msg}`);
  }

  const address = [e.endereco, e.numero, e.bairro ?? e.bairro_comercial, e.cidade, e.uf]
    .filter(Boolean)
    .join(', ');

  const infoCards: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }[] = [
    e.unidades_quartos && formatQuartosRange(e.unidades_quartos)
      ? { icon: 'bed-outline', label: 'Quartos', value: `${formatQuartosRange(e.unidades_quartos)} quartos` }
      : null,
    e.unidades_area && formatAreaRange(e.unidades_area)
      ? { icon: 'expand-outline', label: 'Área', value: formatAreaRange(e.unidades_area)! }
      : null,
    e.unidades_vagas && formatQuartosRange(e.unidades_vagas)
      ? { icon: 'car-outline', label: 'Vagas', value: `${formatQuartosRange(e.unidades_vagas)} vaga(s)` }
      : null,
    e.unidades_banheiros && formatQuartosRange(e.unidades_banheiros)
      ? { icon: 'water-outline', label: 'Banheiros', value: `${formatQuartosRange(e.unidades_banheiros)} banheiro(s)` }
      : null,
    e.unidades_disponiveis != null
      ? { icon: 'home-outline', label: 'Disponíveis', value: `${e.unidades_disponiveis} un.` }
      : null,
    e.quant_unidades != null
      ? { icon: 'grid-outline', label: 'Total unidades', value: `${e.quant_unidades} un.` }
      : null,
    e.quant_andares
      ? { icon: 'layers-outline', label: 'Andares', value: `${e.quant_andares} andares` }
      : null,
    e.quant_elevadores
      ? { icon: 'arrow-up-outline', label: 'Elevadores', value: String(e.quant_elevadores) }
      : null,
    e.final_construcao
      ? { icon: 'calendar-outline', label: 'Previsão de entrega', value: formatDate(e.final_construcao) ?? e.final_construcao }
      : null,
    e.valor_condominio
      ? { icon: 'home-outline', label: 'Condomínio', value: formatCurrency(e.valor_condominio) }
      : null,
    e.taxa_enxoval
      ? { icon: 'cash-outline', label: 'Taxa de enxoval', value: formatCurrency(e.taxa_enxoval) }
      : null,
    e.finalidade
      ? { icon: 'business-outline', label: 'Finalidade', value: e.finalidade }
      : null,
    e.nome_construtora
      ? { icon: 'construct-outline', label: 'Construtora', value: e.nome_construtora }
      : null,
    e.nome_projetista
      ? { icon: 'pencil-outline', label: 'Projetista', value: e.nome_projetista }
      : null,
    e.previsao_na_planta
      ? { icon: 'calendar-outline', label: 'Prev. na planta', value: formatDate(e.previsao_na_planta) ?? e.previsao_na_planta }
      : null,
    e.unidades_por_andar
      ? { icon: 'layers-outline', label: 'Un. por andar', value: `${e.unidades_por_andar} un.` }
      : null,
    e.area_terreno
      ? { icon: 'map-outline', label: 'Área do terreno', value: `${Math.trunc(e.area_terreno).toLocaleString('pt-BR')}m²` }
      : null,
    e.instalacao_para_ar
      ? { icon: 'thermometer-outline', label: 'Ar condicionado', value: e.instalacao_para_ar }
      : null,
    e.aquecimento_chuveiro
      ? { icon: 'flame-outline', label: 'Aquecimento', value: e.aquecimento_chuveiro }
      : null,
    e.medidor_agua_ind != null
      ? { icon: 'water-outline', label: 'Med. água ind.', value: e.medidor_agua_ind ? 'Sim' : 'Não' }
      : null,
    e.medidor_gas_ind != null
      ? { icon: 'flame-outline', label: 'Med. gás ind.', value: e.medidor_gas_ind ? 'Sim' : 'Não' }
      : null,
    e.parcerias && e.parcerias.length > 0
      ? {
          icon: 'people-outline' as React.ComponentProps<typeof Ionicons>['name'],
          label: 'Parceria(s)',
          value: e.parcerias.map((p) => p.empresa.nome_mascara ?? p.empresa.nome_fantasia ?? p.empresa.razao_social ?? '').filter(Boolean).join(', '),
        }
      : null,
  ].filter(Boolean) as typeof infoCards;

  const documentos = getDocumentos(e);

  const unitCount = e.unidades?.length ?? 0;
  const visibleTabs = ALL_TABS.filter((t) => {
    if (t.key === 'photos') return photos.length > 0;
    if (t.key === 'plantas') return plantas.length > 0;
    if (t.key === 'tabela') return unitCount > 0;
    return true;
  });
  function tabLabel(tab: (typeof ALL_TABS)[number]): string {
    if (tab.key === 'photos') return `Fotos (${photos.length})`;
    if (tab.key === 'plantas') return `Plantas (${plantas.length})`;
    if (tab.key === 'tabela') return `Tabela (${unitCount})`;
    return tab.label;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
      >
        {/* ── Hero image ── */}
        <View style={styles.hero}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => photos.length > 0 ? openLightbox(0) : undefined}
            style={StyleSheet.absoluteFill}
          >
            {mainImage ? (
              <Image
                source={mainImage}
                style={styles.heroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]}>
                <Ionicons name="home-outline" size={60} color="#CBD5E1" />
              </View>
            )}
          </TouchableOpacity>
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity
            style={[styles.shareBtn, { top: insets.top + 8 }]}
            onPress={() => handleShare(e.nome_empreendimento, address, e.valor)}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Hero footer: status badges + photo count */}
          <View style={styles.heroFooter}>
            <View style={styles.heroBadgesLeft}>
              {e.status && <StatusBadge status={e.status} inverted />}
              {e.unidades_promocao && (
                <View style={styles.heroPill}>
                  <Ionicons name="pricetag" size={11} color="#fff" />
                  <Text style={styles.heroPillText}>Promoção</Text>
                </View>
              )}
            </View>
            <View style={styles.heroBadgesRight}>
              {(e.fracao_vendida ?? 0) >= 1 && (
                <View style={[styles.heroPill, { backgroundColor: Palette.textSecondary }]}>
                  <Text style={styles.heroPillText}>100% Vendido</Text>
                </View>
              )}
              {photos.length > 1 && (
                <View style={styles.photoPill}>
                  <Ionicons name="images-outline" size={13} color="#fff" />
                  <Text style={styles.photoPillText}>{photos.length} fotos</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Sticky Tabs (horizontal scroll for 4 tabs) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {visibleTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tabLabel(tab)}
              </Text>
              {activeTab === tab.key && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Content ── */}
        <View style={styles.content}>
          {/* Title block (always visible) */}
          <View style={styles.titleBlock}>
            <View style={styles.companyRow}>
              {logoUrl && (
                <Image
                  source={logoUrl}
                  style={styles.logo}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              )}
              <Text style={styles.companyName}>{empresaNome}</Text>
            </View>
            <Text style={styles.name}>{e.nome_empreendimento}</Text>
            {address ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-sharp" size={14} color={Palette.primary} />
                <Text style={styles.address}>{address}</Text>
              </View>
            ) : null}
            {e.empresa?.link_portal ? (
              <TouchableOpacity
                style={styles.portalLink}
                onPress={() => Linking.openURL(e.empresa.link_portal!)}
                activeOpacity={0.7}
              >
                <Ionicons name="globe-outline" size={13} color={Palette.primary} />
                <Text style={styles.portalLinkText}>Ver no site da construtora</Text>
                <Ionicons name="open-outline" size={11} color={Palette.primary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── TAB: Visão Geral ── */}
          {activeTab === 'overview' && (
            <View style={styles.tab_content}>
              {/* Photo strip — first 5 photos visible immediately */}
              {photos.length > 1 && (
                <View style={styles.photoStripWrapper}>
                  <TouchableOpacity
                    style={styles.photoStripHeader}
                    onPress={() => setActiveTab('photos')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.photoStripTitle}>Fotos ({photos.length})</Text>
                    <Text style={styles.photoStripSeeAll}>Ver galeria →</Text>
                  </TouchableOpacity>
                  <View style={styles.photoStrip}>
                  {photos.slice(0, 5).map((p, idx) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.photoStripItem,
                        idx === 4 && photos.length > 5 && styles.photoStripLast,
                      ]}
                      onPress={() => openLightbox(idx)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={p.link}
                        style={styles.photoStripImg}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                      {idx === 4 && photos.length > 5 && (
                        <View style={styles.photoStripMore}>
                          <Text style={styles.photoStripMoreText}>+{photos.length - 5}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  </View>
                </View>
              )}

              {/* Price highlight */}
              {e.valor && (
                <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>A partir de</Text>
                  <Text style={styles.priceValue}>{formatCurrency(e.valor)}</Text>
                  {e.fracao_vendida != null && e.fracao_vendida > 0 && (
                    <View style={styles.progressWrapper}>
                      <ProgressBar value={e.fracao_vendida} />
                    </View>
                  )}
                </View>
              )}

              {/* Status Stepper */}
              {e.status && (
                <View style={styles.stepperSection}>
                  <Text style={styles.sectionTitle}>Andamento da obra</Text>
                  <View style={styles.stepperCard}>
                    <StatusStepper status={e.status} />
                  </View>
                </View>
              )}

              {/* Info cards grid */}
              {infoCards.length > 0 && (
                <View style={styles.infoGrid}>
                  {infoCards.map((card) => (
                    <InfoCard key={card.label} {...card} />
                  ))}
                </View>
              )}

              {/* Description */}
              {e.descricao ? (() => {
                const raw = e.descricao.replace(/<[^>]+>/g, '').trim();
                const LIMIT = 200;
                const isLong = raw.length > LIMIT;
                const shown = !isLong || descExpanded ? raw : raw.slice(0, LIMIT) + '...';
                return (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descrição</Text>
                    <Text style={styles.description}>{shown}</Text>
                    {isLong && (
                      <TouchableOpacity
                        style={styles.descToggle}
                        onPress={() => setDescExpanded((v) => !v)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.descToggleText}>
                          {descExpanded ? 'Ver menos' : 'Ver mais'}
                        </Text>
                        <Ionicons
                          name={descExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color={Palette.primary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })() : null}

              {/* Comodidades */}
              {e.comodidade_empreendimentos && e.comodidade_empreendimentos.length > 0 && (() => {
                const byCategory: Record<string, string[]> = {};
                for (const c of e.comodidade_empreendimentos) {
                  const cat = c.comodidade.categoria ?? 'Outros';
                  if (!byCategory[cat]) byCategory[cat] = [];
                  byCategory[cat].push(c.comodidade.descricao);
                }
                const catIcon: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
                  'Esporte e Lazer': 'fitness-outline',
                  'Segurança':       'shield-checkmark-outline',
                  'Facilidades':     'star-outline',
                };
                return (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Comodidades ({e.comodidade_empreendimentos.length})
                    </Text>
                    {Object.entries(byCategory).map(([cat, items]) => (
                      <View key={cat} style={styles.comodidadeGroup}>
                        <View style={styles.comodidadeGroupHeader}>
                          <Ionicons name={catIcon[cat] ?? 'ellipse-outline'} size={14} color={Palette.primary} />
                          <Text style={styles.comodidadeGroupLabel}>{cat}</Text>
                        </View>
                        <View style={styles.comodidadeChips}>
                          {items.map((item) => (
                            <View key={item} style={styles.comodidadeChip}>
                              <Text style={styles.comodidadeChipText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })()}

              {/* Contact */}
              {contacts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Contato</Text>
                  <View style={styles.contactList}>
                    {contacts.map((c, idx) => {
                      const waNum = c.phone.startsWith('55') ? c.phone : `55${c.phone}`;
                      const fmtPhone = c.phone.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4');
                      const msg = encodeURIComponent(`Olá! Vi o empreendimento "${e.nome_empreendimento}" e gostaria de mais informações.`);
                      return (
                        <View key={idx} style={styles.contactCard}>
                          <View style={styles.contactAvatar}>
                            <Ionicons name="person" size={20} color={Palette.primary} />
                          </View>
                          <View style={styles.contactInfo}>
                            {c.nome ? <Text style={styles.contactName}>{c.nome}</Text> : null}
                            <Text style={styles.contactPhone}>{fmtPhone}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.contactWhatsApp}
                            onPress={() => Linking.openURL(`https://wa.me/${waNum}?text=${msg}`)}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Map */}
              {hasCoords && (
                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={handleMap}
                  activeOpacity={0.85}
                >
                  <View style={styles.mapIconWrap}>
                    <Ionicons name="map" size={20} color={Palette.primary} />
                  </View>
                  <View style={styles.mapBtnInfo}>
                    <Text style={styles.mapBtnTitle}>Ver localização</Text>
                    {address ? (
                      <Text style={styles.mapBtnAddr} numberOfLines={1}>{address}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="open-outline" size={16} color={Palette.textTertiary} />
                </TouchableOpacity>
              )}

              {/* Documents */}
              {documentos.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Documentos</Text>
                  <View style={styles.docsWrapper}>
                    {documentos.map((doc) => (
                      <TouchableOpacity
                        key={doc.id}
                        style={styles.docRow}
                        onPress={() => Linking.openURL(doc.link!)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.docIconWrap}>
                          <Ionicons name="document-text-outline" size={18} color={Palette.primary} />
                        </View>
                        <Text style={styles.docLabel} numberOfLines={1}>
                          {doc.descricao || getDocumentoLabel(doc.categoria)}
                        </Text>
                        <View style={styles.docOpenBtn}>
                          <Ionicons name="open-outline" size={14} color={Palette.primary} />
                          <Text style={styles.docOpenText}>Abrir</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Videos */}
              {e.videos && e.videos.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vídeos ({e.videos.length})</Text>
                  <View style={styles.videoList}>
                    {e.videos.map((v, idx) => {
                      const thumb = getYoutubeThumbnail(v.url_youtube);
                      const isYt = !!v.url_youtube;
                      return (
                        <TouchableOpacity
                          key={v.id}
                          style={styles.videoCard}
                          onPress={() => v.url_youtube && Linking.openURL(v.url_youtube)}
                          activeOpacity={0.88}
                        >
                          <View style={styles.videoThumbWrapper}>
                            {thumb ? (
                              <Image source={thumb} style={styles.videoThumb} contentFit="cover" />
                            ) : (
                              <View style={[styles.videoThumb, styles.videoThumbPlaceholder]}>
                                <Ionicons name="videocam-outline" size={40} color={Palette.textDisabled} />
                              </View>
                            )}
                            <LinearGradient
                              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
                              style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.videoPlayCenter}>
                              <View style={styles.videoPlayBtn}>
                                <Ionicons name="play" size={22} color="#fff" />
                              </View>
                            </View>
                            {isYt && (
                              <View style={styles.ytBadge}>
                                <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                                <Text style={styles.ytBadgeText}>YouTube</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.videoMeta}>
                            <View style={styles.videoMetaLeft}>
                              <Ionicons name="play-circle-outline" size={16} color={Palette.primary} />
                              <Text style={styles.videoMetaTitle} numberOfLines={1}>
                                {isYt ? `Vídeo ${idx + 1} — YouTube` : `Vídeo ${idx + 1}`}
                              </Text>
                            </View>
                            <View style={styles.videoAssistirBtn}>
                              <Text style={styles.videoAssistirText}>Assistir</Text>
                              <Ionicons name="open-outline" size={13} color={Palette.primary} />
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ── TAB: Fotos ── */}
          {activeTab === 'photos' && (
            <View style={styles.tab_content}>
              {photos.length === 0 ? (
                <EmptyState icon="images-outline" message="Nenhuma foto disponível" />
              ) : (
                <>
                  {/* Swipeable main photos */}
                  <View style={styles.mainPhotoWrapper}>
                    <FlatList
                      ref={photosRef}
                      horizontal
                      pagingEnabled
                      data={photos}
                      keyExtractor={(p) => p.id}
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(
                          e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                        );
                        setPhotoIndex(idx);
                      }}
                      renderItem={({ item, index }) => (
                        <TouchableOpacity
                          activeOpacity={0.95}
                          onPress={() => openLightbox(index)}
                        >
                          <Image
                            source={item.link}
                            style={styles.mainPhoto}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                          />
                        </TouchableOpacity>
                      )}
                    />
                    <View style={styles.photoCounter}>
                      <Text style={styles.photoCounterText}>
                        {photoIndex + 1} / {photos.length}
                      </Text>
                    </View>
                    <View style={styles.expandHint}>
                      <Ionicons name="expand-outline" size={13} color="#fff" />
                      <Text style={styles.expandHintText}>Toque para ampliar</Text>
                    </View>
                  </View>

                  {/* Thumbnails */}
                  <FlatList
                    horizontal
                    data={photos}
                    keyExtractor={(p) => p.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbList}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setPhotoIndex(index);
                          photosRef.current?.scrollToIndex({ index, animated: true });
                        }}
                        onLongPress={() => openLightbox(index)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={item.link}
                          style={[styles.thumb, index === photoIndex && styles.thumbActive]}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      </TouchableOpacity>
                    )}
                  />
                </>
              )}
            </View>
          )}

          {/* ── TAB: Plantas ── */}
          {activeTab === 'plantas' && (
            <View style={styles.tab_content}>
              {plantas.length === 0 ? (
                <EmptyState icon="document-outline" message="Nenhuma planta disponível" />
              ) : (
                <View style={styles.plantasGrid}>
                  {plantas.map((p, idx) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.plantaItem}
                      onPress={() => openPlantasLightbox(idx)}
                      activeOpacity={0.88}
                    >
                      <View style={styles.plantaImageWrap}>
                        <Image
                          source={p.link}
                          style={styles.plantaImage}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                        />
                        <View style={styles.plantaExpandHint}>
                          <Ionicons name="expand-outline" size={13} color="#fff" />
                        </View>
                      </View>
                      {p.descricao ? (
                        <Text style={styles.plantaLabel} numberOfLines={2}>{p.descricao}</Text>
                      ) : (
                        <Text style={styles.plantaLabel}>Planta {idx + 1}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── TAB: Tabela de Vendas ── */}
          {activeTab === 'tabela' && (
            <View style={styles.tab_content}>
              <SalesTable units={e.unidades ?? []} varios_blocos={e.varios_blocos} />
            </View>
          )}

        </View>
      </ScrollView>

      {/* Full-screen photo lightbox */}
      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        visible={lightboxVisible}
        onClose={() => setLightboxVisible(false)}
      />
      {/* Plantas lightbox */}
      <PhotoLightbox
        photos={plantas}
        initialIndex={plantasLightboxIndex}
        visible={plantasLightboxVisible}
        onClose={() => setPlantasLightboxVisible(false)}
      />

      {/* Floating CTA bar — WhatsApp + Interesse */}
      {(hasWhatsApp || isPreLancamento) && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.ctaContent}>
            {hasWhatsApp && (
              <TouchableOpacity
                style={styles.ctaWhatsApp}
                onPress={handleWhatsApp}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.ctaWhatsAppText}>WhatsApp</Text>
              </TouchableOpacity>
            )}
            {isPreLancamento && (
              <TouchableOpacity
                style={[styles.ctaBtn, !hasWhatsApp && styles.ctaBtnFull, interesseLoading && styles.ctaBtnDisabled]}
                onPress={() => handleInteresse(e.id)}
                disabled={interesseLoading}
                activeOpacity={0.85}
              >
                {interesseLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : (
                    <>
                      <Ionicons name="heart-outline" size={16} color="#fff" />
                      <Text style={styles.ctaBtnText}>Tenho Interesse</Text>
                    </>
                  )
                }
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  scroll: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.bg,
  },

  // Hero
  hero: {
    height: 300,
    position: 'relative',
    backgroundColor: Palette.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoPillText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  heroFooter: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroBadgesLeft: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  heroBadgesRight: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.unitPromocao,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Tabs
  tabBar: {
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.md,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    position: 'relative',
    minWidth: 90,
  },
  tabActive: {},
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  tabTextActive: {
    color: Palette.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: Palette.primary,
  },

  // Content
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: 40,
  },
  titleBlock: { gap: 6 },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Palette.borderLight,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: Palette.text,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  address: {
    fontSize: 13,
    color: Palette.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  portalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  portalLinkText: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '600',
  },

  // Tab content
  tab_content: { gap: Spacing.lg },
  photoStripWrapper: { gap: 10 },
  photoStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoStripTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.3,
  },
  photoStripSeeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
  photoStrip: {
    flexDirection: 'row',
    gap: 4,
    height: 80,
  },
  photoStripItem: {
    flex: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  photoStripLast: {},
  photoStripImg: {
    width: '100%',
    height: '100%',
    backgroundColor: Palette.borderLight,
  },
  photoStripMore: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoStripMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  priceCard: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Palette.primary,
    letterSpacing: -1,
  },
  progressWrapper: { marginTop: 4 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  section: { gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 22,
  },
  descToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  descToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
  },
  mapIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnInfo: { flex: 1, gap: 2 },
  mapBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
  },
  mapBtnAddr: {
    fontSize: 12,
    color: Palette.textTertiary,
  },
  contactList: { gap: 8 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1, gap: 3 },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
  },
  contactPhone: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  contactWhatsApp: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  // Comodidades
  comodidadeGroup: { gap: 8 },
  comodidadeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comodidadeGroupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  comodidadeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  comodidadeChip: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
  },
  comodidadeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primary,
  },

  stepperSection: { gap: 10 },
  stepperCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
  },

  // Documents
  docsWrapper: {
    gap: 6,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
  docOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.primary,
  },
  docOpenText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },

  // Videos
  videoList: { gap: 12 },
  videoCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.sm,
  },
  videoThumbWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Palette.border,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: Palette.border,
  },
  videoThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceVariant,
  },
  videoPlayCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ytBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ytBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF0000',
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  videoMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  videoMetaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
    flex: 1,
  },
  videoAssistirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.primary,
  },
  videoAssistirText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },

  // Plantas tab
  plantasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  plantaItem: {
    width: '47%',
    gap: 6,
  },
  plantaImageWrap: {
    position: 'relative',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  plantaImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Palette.surfaceVariant,
  },
  plantaExpandHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantaLabel: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Photos tab
  mainPhotoWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.sm,
  },
  mainPhoto: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    height: 240,
    backgroundColor: Palette.border,
  },
  photoCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoCounterText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  expandHint: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expandHintText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  thumbList: {
    gap: 8,
    paddingVertical: 2,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    backgroundColor: Palette.border,
    opacity: 0.6,
  },
  thumbActive: {
    opacity: 1,
    borderWidth: 2.5,
    borderColor: Palette.primary,
  },

  // Loading skeleton
  skeletonHero: {
    height: 300,
    backgroundColor: Palette.surfaceVariant,
  },
  skeletonBody: {
    padding: Spacing.lg,
    gap: 12,
  },
  skeletonLine: {
    borderRadius: Radius.full,
    backgroundColor: Palette.border,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  skeletonChip: {
    width: 72,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Palette.border,
  },

  // CTA bar
  ctaBar: {
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
    ...Shadow.lg,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: Radius.lg,
    paddingVertical: 13,
    ...Shadow.sm,
  },
  ctaWhatsAppText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingVertical: 13,
    ...Shadow.sm,
  },
  ctaBtnFull: {
    flex: 1,
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});

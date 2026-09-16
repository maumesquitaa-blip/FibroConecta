import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Paciente } from '@/types/database';
import { LOGO_SEMUS_BRASAO_BASE64, LACO_FIBRO_BASE64 } from './assets';

// Medidas exatas padrão PVC: 57mm x 86mm (161.57pt x 243.78pt)
const styles = StyleSheet.create({
  page: {
    width: 161.57,
    height: 243.78,
    padding: 7,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  
  // TOPO HARMONIOSO FRENTE
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#7C3AED',
    paddingBottom: 2.5,
    marginBottom: 2,
  },
  logoSemus: {
    width: 50,
    height: 20.8, // Proporção exata 437:182
    objectFit: 'contain',
  },
  headerTitlesBox: {
    flex: 1,
    paddingHorizontal: 3,
    alignItems: 'center',
  },
  titleHeader: {
    fontSize: 4.8,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#3B0764',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
  },
  subHeader: {
    fontSize: 3.5,
    textAlign: 'center',
    color: '#6D28D9',
    marginTop: 0.5,
    fontWeight: 'bold',
  },
  lacoHeader: {
    width: 14,
    height: 19.3, // Proporção exata 29:40
    objectFit: 'contain',
  },

  // FOTO & DADOS FRENTE
  photoContainer: {
    alignItems: 'center',
    marginVertical: 2.5,
  },
  photo: {
    width: 66,
    height: 86,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#7C3AED',
    objectFit: 'cover',
  },
  bodyFrente: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 1,
  },
  fieldGroup: {
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 3.8,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  fieldValue: {
    fontSize: 5.2,
    fontWeight: 'bold',
    color: '#111827',
  },
  cidBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderColor: '#C084FC',
    marginTop: 1,
  },
  cidBadgeText: {
    fontSize: 4.6,
    fontWeight: 'bold',
    color: '#581C87',
  },

  // RODAPÉ FRENTE
  footerFrente: {
    borderTopWidth: 0.8,
    borderTopColor: '#7C3AED',
    paddingTop: 2,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 3.8,
    fontWeight: 'bold',
    color: '#3B0764',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 3.2,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 0.5,
  },

  // VERSO
  versoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.8,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 2.5,
    marginBottom: 3,
  },
  versoLogoBox: {
    flex: 1,
    paddingRight: 3,
  },
  versoTitle: {
    fontSize: 5,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textTransform: 'uppercase',
  },
  versoSubtitle: {
    fontSize: 3.5,
    color: '#6B7280',
  },
  qrCodeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    width: 36,
    height: 36,
    borderRadius: 2,
  },
  versoFields: {
    flex: 1,
  },
  legalSection: {
    borderTopWidth: 0.5,
    borderTopColor: '#D1D5DB',
    paddingTop: 2,
    marginTop: 2,
  },
  legalTitle: {
    fontSize: 3.5,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 0.8,
  },
  legalText: {
    fontSize: 3.1,
    color: '#4B5563',
    textAlign: 'justify',
    lineHeight: 1.2,
    marginBottom: 1,
  },
});

export interface CarteiraPVCProps {
  paciente: Paciente;
  qrCodeUrl?: string;
  brasaoUrl?: string;
  lacoUrl?: string;
  qrCodeDataUrl?: string;
}

export const CarteiraPVC: React.FC<CarteiraPVCProps> = ({
  paciente,
  qrCodeUrl,
  brasaoUrl = LOGO_SEMUS_BRASAO_BASE64,
  lacoUrl = LACO_FIBRO_BASE64,
  qrCodeDataUrl,
}) => {
  const qr = qrCodeUrl || qrCodeDataUrl;

  return (
    <Document
      title={`Carteira_Fibro_${paciente.cpf?.replace(/\D/g, '') || 'CIPFIBRO'}`}
      author="SEMUS São José de Ribamar"
    >
      {/* FRENTE */}
      <Page size={[161.57, 243.78]} style={styles.page}>
        {/* CABEÇALHO HARMONIOSO COM LOGO SEMUS + TÍTULO + LAÇO ROXO */}
        <View style={styles.headerRow}>
          {brasaoUrl ? <Image style={styles.logoSemus} src={brasaoUrl} /> : null}
          <View style={styles.headerTitlesBox}>
            <Text style={styles.titleHeader}>CARTEIRA DE PRIORIDADE</Text>
            <Text style={styles.subHeader}>PESSOA COM FIBROMIALGIA</Text>
            <Text style={{ fontSize: 3, color: '#6B7280', marginTop: 0.5 }}>Lei Federal Nº 14.705/2023</Text>
          </View>
          {lacoUrl ? <Image style={styles.lacoHeader} src={lacoUrl} /> : null}
        </View>

        {/* FOTO 3X4 */}
        <View style={styles.photoContainer}>
          {paciente.foto_url ? (
            <Image style={styles.photo} src={paciente.foto_url} />
          ) : (
            <View style={[styles.photo, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 4, color: '#9CA3AF' }}>FOTO 3X4</Text>
            </View>
          )}
        </View>

        {/* DADOS PRINCIPAIS */}
        <View style={styles.bodyFrente}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nome Completo</Text>
            <Text style={styles.fieldValue}>{paciente.nome_completo?.toUpperCase() || '-'}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Cartão Nacional de Saúde (SUS)</Text>
            <Text style={styles.fieldValue}>{paciente.cartao_sus || '-'}</Text>
          </View>

          <View style={styles.cidBadge}>
            <Text style={styles.cidBadgeText}>CID-10: {paciente.cid10 || 'M79.7'}</Text>
          </View>
        </View>

        {/* RODAPÉ OFICIAL */}
        <View style={styles.footerFrente}>
          <Text style={styles.footerText}>PREFEITURA DE SÃO JOSÉ DE RIBAMAR</Text>
          <Text style={styles.footerSubtext}>SEMUS • VÁLIDO EM TODO O TERRITÓRIO NACIONAL</Text>
        </View>
      </Page>

      {/* VERSO */}
      <Page size={[161.57, 243.78]} style={styles.page}>
        {/* CABEÇALHO DO VERSO COM VALIDAÇÃO DIGITAL */}
        <View style={styles.versoHeader}>
          <View style={styles.versoLogoBox}>
            <Text style={styles.versoTitle}>DADOS DE REGISTRO</Text>
            <Text style={styles.versoSubtitle}>Validação Digital via QR Code</Text>
          </View>
          {qr ? (
            <View style={styles.qrCodeBox}>
              <Image style={styles.qrCode} src={qr} />
            </View>
          ) : null}
        </View>

        {/* CAMPOS OFICIAIS */}
        <View style={styles.versoFields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CPF</Text>
            <Text style={styles.fieldValue}>{paciente.cpf || '-'}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Data de Nascimento</Text>
            <Text style={styles.fieldValue}>{paciente.data_nascimento || '-'}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Contato de Emergência</Text>
            <Text style={styles.fieldValue}>{paciente.contato_emergencia || '-'}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Data de Emissão</Text>
            <Text style={styles.fieldValue}>
              {paciente.data_emissao || new Date().toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        {/* AMPARO LEGAL OFICIAL */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>SECRETARIA MUNICIPAL DE SAÚDE - SEMUS</Text>
          <Text style={styles.legalText}>
            AMPARO LEGAL: Confere atendimento preferencial em órgãos públicos e empresas privadas nos termos da Lei Federal Nº 14.705/2023 e Lei Municipal Nº 1.375, de 09 de maio de 2023.
          </Text>
          <Text style={{ fontSize: 2.8, color: '#9CA3AF', textAlign: 'center' }}>
            Autenticidade: {paciente.id || 'SEMUS-CIPFIBRO'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export const CarteiraFibroPDF = CarteiraPVC;

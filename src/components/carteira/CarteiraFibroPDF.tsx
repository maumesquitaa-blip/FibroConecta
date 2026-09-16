import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Paciente } from '@/types/database';
import { formatarDataBR } from '@/lib/utils';

// Medidas exatas padrão PVC: 57mm x 86mm
// 1mm ~ 2.83465 pt -> Largura: 161.57 pt | Altura: 243.78 pt
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
  headerBox: {
    backgroundColor: '#3B0764',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 3,
    marginBottom: 4,
    alignItems: 'center',
  },
  titleHeader: {
    fontSize: 5.5,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  subHeader: {
    fontSize: 4,
    textAlign: 'center',
    color: '#E9D5FF',
    marginTop: 1,
    fontWeight: 'bold',
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 2,
  },
  photo: {
    width: 65,
    height: 82,
    borderRadius: 3,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#7E22CE',
  },
  bodyFrente: {
    flex: 1,
    justifyContent: 'center',
  },
  fieldGroup: {
    marginBottom: 2.5,
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
    textTransform: 'uppercase',
  },
  badgeCID: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 1,
    paddingHorizontal: 3,
    borderRadius: 2,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderColor: '#C084FC',
    marginTop: 1,
  },
  badgeCIDText: {
    fontSize: 4.8,
    fontWeight: 'bold',
    color: '#6B21A8',
  },
  footerFrente: {
    borderTopWidth: 0.8,
    borderTopColor: '#7E22CE',
    paddingTop: 2,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 4,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.8,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 3,
    marginBottom: 4,
  },
  versoTitleBox: {
    flex: 1,
    paddingRight: 4,
  },
  versoTitle: {
    fontSize: 5,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textTransform: 'uppercase',
  },
  versoSubtitle: {
    fontSize: 3.6,
    color: '#6B7280',
  },
  qrCodeImage: {
    width: 32,
    height: 32,
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
    marginBottom: 1,
  },
  legalText: {
    fontSize: 3.2,
    color: '#4B5563',
    textAlign: 'justify',
    lineHeight: 1.2,
    marginBottom: 1.5,
  },
});

interface CarteiraFibroPDFProps {
  paciente: Paciente;
  qrCodeDataUrl?: string;
}

export const CarteiraFibroPDF: React.FC<CarteiraFibroPDFProps> = ({ paciente, qrCodeDataUrl }) => {
  return (
    <Document title={`Carteira_Fibro_${paciente.cpf.replace(/\D/g, '')}`} author="SEMUS São José de Ribamar">
      {/* FRENTE */}
      <Page size={[161.57, 243.78]} style={styles.page}>
        <View style={styles.headerBox}>
          <Text style={styles.titleHeader}>CARTEIRA DE PRIORIDADE DA PESSOA COM FIBROMIALGIA</Text>
          <Text style={styles.subHeader}>LEI FEDERAL Nº 14.705/2023</Text>
        </View>

        <View style={styles.photoContainer}>
          {paciente.foto_url ? (
            <Image style={styles.photo} src={paciente.foto_url} />
          ) : (
            <View style={[styles.photo, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 4, color: '#9CA3AF' }}>FOTO 3X4</Text>
            </View>
          )}
        </View>

        <View style={styles.bodyFrente}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nome Completo</Text>
            <Text style={styles.fieldValue}>{paciente.nome_completo || '-'}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Cartão Nacional de Saúde (SUS)</Text>
            <Text style={styles.fieldValue}>{paciente.cartao_sus || '-'}</Text>
          </View>

          <View style={styles.badgeCID}>
            <Text style={styles.badgeCIDText}>CID-10: {paciente.cid10 || 'M79.7'}</Text>
          </View>
        </View>

        <View style={styles.footerFrente}>
          <Text style={styles.footerText}>PREFEITURA DE SÃO JOSÉ DE RIBAMAR</Text>
          <Text style={styles.footerSubtext}>SEMUS • VÁLIDO EM TODO O TERRITÓRIO NACIONAL</Text>
        </View>
      </Page>

      {/* VERSO */}
      <Page size={[161.57, 243.78]} style={styles.page}>
        <View style={styles.versoHeader}>
          <View style={styles.versoTitleBox}>
            <Text style={styles.versoTitle}>DADOS OFICIAIS</Text>
            <Text style={styles.versoSubtitle}>Escaneie o QR Code para autenticidade</Text>
          </View>
          {qrCodeDataUrl && (
            <Image style={styles.qrCodeImage} src={qrCodeDataUrl} />
          )}
        </View>

        <View style={styles.versoFields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CPF</Text>
            <Text style={styles.fieldValue}>{paciente.cpf || '-'}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Data de Nascimento</Text>
            <Text style={styles.fieldValue}>{formatarDataBR(paciente.data_nascimento)}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Contato de Emergência</Text>
            <Text style={styles.fieldValue}>{paciente.contato_emergencia || '-'}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Data de Emissão</Text>
            <Text style={styles.fieldValue}>{formatarDataBR(paciente.data_emissao || new Date().toISOString())}</Text>
          </View>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>SECRETARIA MUNICIPAL DE SAÚDE - SEMUS</Text>
          <Text style={styles.legalText}>
            AMPARO LEGAL: Confere atendimento preferencial em órgãos públicos e empresas privadas nos termos da Lei Federal Nº 14.705/2023 e Lei Municipal Nº 1.375, de 09 de maio de 2023.
          </Text>
          <Text style={{ fontSize: 2.8, color: '#9CA3AF', textAlign: 'center' }}>
            ID Validação: {paciente.id || 'N/A'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

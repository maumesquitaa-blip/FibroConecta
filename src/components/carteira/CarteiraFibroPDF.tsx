import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Paciente } from '@/types/database';
import { BRASAO_BASE64, LACO_BASE64 } from './assets';

const styles = StyleSheet.create({
  page: {
    width: 161.57, // 57mm (161.57pt)
    height: 243.78, // 86mm (243.78pt)
    padding: 8,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#7C3AED',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
  },
  titleHeader: {
    fontSize: 5.5,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4C1D95',
    textTransform: 'uppercase',
  },
  subHeader: {
    fontSize: 4,
    textAlign: 'center',
    color: '#6D28D9',
    marginTop: 1,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  photo: {
    width: 68, // Proporção 3x4 (24mm x 32mm aprox)
    height: 90,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    objectFit: 'cover',
  },
  fieldLabel: {
    fontSize: 4,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  fieldValue: {
    fontSize: 5.5,
    fontWeight: 'bold',
    color: '#111827',
  },
  footerBrand: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
    paddingTop: 3,
  },
  footerText: {
    fontSize: 3.5,
    fontWeight: 'bold',
    color: '#4B5563',
    textAlign: 'center',
  },
  qrCodeBox: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  qrCode: {
    width: 45,
    height: 45,
  },
  legalSection: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    right: 8,
  },
  legalText: {
    fontSize: 3.2,
    color: '#4B5563',
    textAlign: 'justify',
    lineHeight: 1.2,
    marginTop: 2,
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
  brasaoUrl = BRASAO_BASE64,
  lacoUrl = LACO_BASE64,
  qrCodeDataUrl,
}) => {
  const qr = qrCodeUrl || qrCodeDataUrl;

  return (
    <Document title={`Carteira_Fibro_${paciente.cpf?.replace(/\D/g, '') || 'CIPFIBRO'}`} author="SEMUS São José de Ribamar">
      {/* FRENTE */}
      <Page size={[161.57, 243.78]} style={styles.page}>
        <View style={styles.headerBox}>
          <Text style={styles.titleHeader}>Carteira de Prioridade para Pessoas com Fibromialgia</Text>
          <Text style={styles.subHeader}>Lei Federal Nº 14.705/2023</Text>
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

        <Text style={styles.fieldLabel}>Nome Completo</Text>
        <Text style={styles.fieldValue}>{paciente.nome_completo?.toUpperCase() || '-'}</Text>

        <Text style={styles.fieldLabel}>Cartão SUS</Text>
        <Text style={styles.fieldValue}>{paciente.cartao_sus || '-'}</Text>

        <Text style={styles.fieldLabel}>CID-10</Text>
        <Text style={styles.fieldValue}>{paciente.cid10 || 'M79.7'}</Text>

        <View style={styles.footerBrand}>
          {brasaoUrl ? <Image src={brasaoUrl} style={{ width: 16, height: 16 }} /> : null}
          <Text style={styles.footerText}>SEMUS - VÁLIDO EM TODO TERRITÓRIO NACIONAL</Text>
          {lacoUrl ? <Image src={lacoUrl} style={{ width: 14, height: 18 }} /> : null}
        </View>
      </Page>

      {/* VERSO */}
      <Page size={[161.57, 243.78]} style={styles.page}>
        <View style={styles.qrCodeBox}>
          {qr ? <Image style={styles.qrCode} src={qr} /> : null}
        </View>

        <Text style={styles.fieldLabel}>CPF</Text>
        <Text style={styles.fieldValue}>{paciente.cpf || '-'}</Text>

        <Text style={styles.fieldLabel}>Data de Nascimento</Text>
        <Text style={styles.fieldValue}>{paciente.data_nascimento || '-'}</Text>

        <Text style={styles.fieldLabel}>Contato de Emergência</Text>
        <Text style={styles.fieldValue}>{paciente.contato_emergencia || '-'}</Text>

        <Text style={styles.fieldLabel}>Data de Emissão</Text>
        <Text style={styles.fieldValue}>
          {paciente.data_emissao || new Date().toLocaleDateString('pt-BR')}
        </Text>

        <View style={styles.legalSection}>
          <Text style={[styles.legalText, { fontWeight: 'bold' }]}>
            EMITIDO POR: SECRETARIA MUNICIPAL DE SÃO JOSÉ DE RIBAMAR - SEMUS
          </Text>
          <Text style={styles.legalText}>
            AMPARO LEGAL: Confere atendimento preferencial em órgãos públicos e empresas privadas nos termos da Lei Federal Nº 14.705/2023 e Lei Municipal Nº 1.375, de 09 de maio de 2023.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export const CarteiraFibroPDF = CarteiraPVC;

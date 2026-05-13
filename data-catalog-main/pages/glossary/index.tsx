import React from 'react';
import type { NextPage } from 'next';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../layout/SubHeader/SubHeader';
import Page from '../../layout/Page/Page';
import Card, {
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
} from '../../components/bootstrap/Card';
import Icon from '../../components/icon/Icon';
import Badge from '../../components/bootstrap/Badge';

const GLOSSARY_TERMS = [
	{ term: 'IKU', definition: 'Indikator Kinerja Utama — key performance indicator ITERA dari Renstra', category: 'Business' },
	{ term: 'MBKM', definition: 'Merdeka Belajar Kampus Merdeka — program kredit luar kampus ≥20 SKS', category: 'Academic' },
	{ term: 'Tridarma', definition: 'Tri Dharma Perguruan Tinggi: Pendidikan, Penelitian, Pengabdian Masyarakat', category: 'Academic' },
	{ term: 'SAKIP', definition: 'Sistem Akuntabilitas Kinerja Instansi Pemerintah', category: 'Governance' },
	{ term: 'PII', definition: 'Personally Identifiable Information — data sensitif seperti NIK, email, telepon', category: 'Security' },
	{ term: 'Medallion Architecture', definition: 'Arsitektur data lakehouse tiga layer: Bronze (raw), Silver (cleaned), Gold (curated)', category: 'Technical' },
	{ term: 'Star Schema', definition: 'Desain data warehouse dengan tabel fakta di pusat dan dimensi di sekitarnya', category: 'Technical' },
	{ term: 'Data Lineage', definition: 'Jejak asal-usul dan transformasi data dari sumber hingga tujuan', category: 'Governance' },
	{ term: 'Apache Iceberg', definition: 'Format tabel open untuk data lake yang mendukung ACID, time travel, schema evolution', category: 'Technical' },
	{ term: 'Apache Atlas', definition: 'Platform metadata management dan data governance open source', category: 'Technical' },
	{ term: 'Data Quality Score', definition: 'Skor kualitas data berdasarkan completeness. PASS ≥80%, QUARANTINE 60-79%, REJECT <60%', category: 'Quality' },
	{ term: 'Renstra', definition: 'Rencana Strategis ITERA 2020-2024 yang menjadi acuan target IKU', category: 'Business' },
	{ term: 'Prodi', definition: 'Program Studi — unit akademik pelaksana pendidikan tinggi', category: 'Academic' },
	{ term: 'NIDN', definition: 'Nomor Induk Dosen Nasional', category: 'Academic' },
	{ term: 'NIM', definition: 'Nomor Induk Mahasiswa', category: 'Academic' },
	{ term: 'Serdos', definition: 'Sertifikasi Dosen — sertifikat profesional pendidik', category: 'Academic' },
];

const GlossaryPage: NextPage = () => {
	const categories = [...new Set(GLOSSARY_TERMS.map((t) => t.category))].sort();
	const categoryColors: Record<string, string> = {
		Business: 'primary',
		Academic: 'info',
		Technical: 'success',
		Governance: 'warning',
		Security: 'danger',
		Quality: 'secondary',
	};

	return (
		<PageWrapper>
			<Head>
				<title>Glossary — Data Catalog</title>
			</Head>
			<SubHeader>
				<SubHeaderLeft>
					<Icon icon='MenuBook' size='2x' color='primary' />
					<span className='h4 mb-0 ms-2 fw-bold'>Business Glossary</span>
					<Badge color='primary' isLight className='ms-3'>
						{GLOSSARY_TERMS.length} terms
					</Badge>
				</SubHeaderLeft>
			</SubHeader>
			<Page>
				{categories.map((cat) => {
					const terms = GLOSSARY_TERMS.filter((t) => t.category === cat);
					return (
						<div key={cat} className='row mb-4'>
							<div className='col-12'>
								<Card shadow='sm'>
									<CardHeader>
										<CardLabel
											icon='BookmarkBorder'
											iconColor={(categoryColors[cat] || 'primary') as any}>
											<CardTitle>
												{cat}
												<Badge
													color={
														(categoryColors[cat] || 'primary') as any
													}
													isLight
													className='ms-2'>
													{terms.length}
												</Badge>
											</CardTitle>
										</CardLabel>
									</CardHeader>
									<CardBody>
										<div className='table-responsive'>
											<table className='table table-modern'>
												<thead>
													<tr>
														<th style={{ width: 200 }}>Term</th>
														<th>Definition</th>
													</tr>
												</thead>
												<tbody>
													{terms.map((t) => (
														<tr key={t.term}>
															<td>
																<strong>{t.term}</strong>
															</td>
															<td>{t.definition}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</CardBody>
								</Card>
							</div>
						</div>
					);
				})}
			</Page>
		</PageWrapper>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		// @ts-ignore
		...(await serverSideTranslations(locale, ['common', 'menu'])),
	},
});

export default GlossaryPage;

import React, { useCallback, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../layout/SubHeader/SubHeader';
import Page from '../../layout/Page/Page';
import Card, {
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	CardSubTitle,
	CardActions,
} from '../../components/bootstrap/Card';
import Icon from '../../components/icon/Icon';
import Badge from '../../components/bootstrap/Badge';
import Button from '../../components/bootstrap/Button';
import Spinner from '../../components/bootstrap/Spinner';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import Input from '../../components/bootstrap/forms/Input';
import Textarea from '../../components/bootstrap/forms/Textarea';

const FALLBACK_TERMS = [
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

interface GlossaryTerm {
	guid?: string;
	term: string;
	definition: string;
	category: string;
	source: 'atlas' | 'local';
}

const GlossaryPage: NextPage = () => {
	const [terms, setTerms] = useState<GlossaryTerm[]>([]);
	const [atlasGlossaries, setAtlasGlossaries] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [atlasConnected, setAtlasConnected] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [newTerm, setNewTerm] = useState({ term: '', definition: '', category: '' });

	const fetchGlossary = useCallback(async () => {
		setLoading(true);

		const localTerms: GlossaryTerm[] = FALLBACK_TERMS.map((t) => ({
			...t,
			source: 'local' as const,
		}));

		try {
			const res = await fetch('/api/atlas/glossary');
			if (res.ok) {
				const glossaries = await res.json();
				setAtlasGlossaries(glossaries);
				setAtlasConnected(true);

				const atlasTerms: GlossaryTerm[] = [];
				for (const g of glossaries) {
					if (g.terms) {
						for (const t of g.terms) {
							atlasTerms.push({
								guid: t.termGuid || t.guid,
								term: t.displayText || t.name,
								definition: t.shortDescription || t.longDescription || '',
								category: g.name || 'Atlas',
								source: 'atlas',
							});
						}
					}
				}

				if (atlasTerms.length > 0) {
					setTerms([...atlasTerms, ...localTerms]);
				} else {
					setTerms(localTerms);
				}
			} else {
				setTerms(localTerms);
			}
		} catch {
			setTerms(localTerms);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchGlossary();
	}, [fetchGlossary]);

	const handleAddTerm = async () => {
		if (!newTerm.term || !newTerm.definition) return;

		if (atlasConnected && atlasGlossaries.length > 0) {
			try {
				const glossaryGuid = atlasGlossaries[0].guid;
				await fetch(`/api/atlas/glossary/${glossaryGuid}/terms`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: newTerm.term,
						shortDescription: newTerm.definition,
						anchor: { glossaryGuid },
					}),
				});
			} catch {
				// Fall through to local add
			}
		}

		setTerms((prev) => [
			...prev,
			{
				term: newTerm.term,
				definition: newTerm.definition,
				category: newTerm.category || 'Custom',
				source: 'local',
			},
		]);
		setNewTerm({ term: '', definition: '', category: '' });
		setShowAddModal(false);
	};

	const categories = [...new Set(terms.map((t) => t.category))].sort();
	const categoryColors: Record<string, string> = {
		Business: 'primary',
		Academic: 'info',
		Technical: 'success',
		Governance: 'warning',
		Security: 'danger',
		Quality: 'secondary',
		Atlas: 'dark',
		Custom: 'primary',
	};

	return (
		<PageWrapper>
			<Head>
				<title>Business Glossary — Data Catalog</title>
			</Head>
			<SubHeader>
				<SubHeaderLeft>
					<Icon icon='MenuBook' size='2x' color='primary' />
					<span className='h4 mb-0 ms-2 fw-bold'>Business Glossary</span>
					<Badge color='primary' isLight className='ms-3'>
						{terms.length} terms
					</Badge>
					{atlasConnected ? (
						<Badge color='success' isLight className='ms-2'>
							<Icon icon='Cloud' className='me-1' />
							Atlas Connected
						</Badge>
					) : (
						<Badge color='secondary' isLight className='ms-2'>
							Local Glossary
						</Badge>
					)}
				</SubHeaderLeft>
				<SubHeaderRight>
					<Button
						color='primary'
						icon='Add'
						onClick={() => setShowAddModal(true)}>
						Add Term
					</Button>
				</SubHeaderRight>
			</SubHeader>
			<Page>
				{/* Lifecycle stage indicator */}
				<div className='row mb-4'>
					<div className='col-12'>
						<Card shadow='sm' className='bg-l10-info'>
							<CardBody className='py-3'>
								<div className='d-flex align-items-center'>
									<Icon icon='Info' color='info' size='lg' className='me-2' />
									<small>
										<strong>Lifecycle Stage 6 — Glossary Terms:</strong>{' '}
										Glossary terms memperkaya konteks bisnis aset data.
										Terms dari Atlas Glossary API ditampilkan bersama definisi lokal.
										Pada <strong>Stage 9</strong>, enrichment ini dilakukan via Atlas REST API.
									</small>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>

				{loading ? (
					<div className='text-center py-5'>
						<Spinner color='primary' size='3rem' />
					</div>
				) : (
					categories.map((cat) => {
						const catTerms = terms.filter((t) => t.category === cat);
						return (
							<div key={cat} className='row mb-4'>
								<div className='col-12'>
									<Card shadow='sm'>
										<CardHeader>
											<CardLabel
												icon='BookmarkBorder'
												iconColor={
													(categoryColors[cat] || 'primary') as any
												}>
												<CardTitle>
													{cat}
													<Badge
														color={
															(categoryColors[cat] ||
																'primary') as any
														}
														isLight
														className='ms-2'>
														{catTerms.length}
													</Badge>
												</CardTitle>
											</CardLabel>
										</CardHeader>
										<CardBody>
											<div className='table-responsive'>
												<table className='table table-modern'>
													<thead>
														<tr>
															<th style={{ width: 200 }}>
																Term
															</th>
															<th>Definition</th>
															<th style={{ width: 100 }}>
																Source
															</th>
														</tr>
													</thead>
													<tbody>
														{catTerms.map((t) => (
															<tr key={t.term}>
																<td>
																	<strong>{t.term}</strong>
																</td>
																<td>{t.definition}</td>
																<td>
																	<Badge
																		color={
																			t.source === 'atlas'
																				? 'success'
																				: ('secondary' as any)
																		}
																		isLight>
																		{t.source === 'atlas'
																			? 'Atlas'
																			: 'Local'}
																	</Badge>
																</td>
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
					})
				)}

				{/* Add Term Modal */}
				<Modal
					isOpen={showAddModal}
					setIsOpen={setShowAddModal}
					titleId='add-glossary-term'>
					<ModalHeader setIsOpen={setShowAddModal}>
						<ModalTitle id='add-glossary-term'>Add Glossary Term</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<div className='mb-3'>
							<label className='form-label'>Term</label>
							<Input
								value={newTerm.term}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setNewTerm({ ...newTerm, term: e.target.value })
								}
								placeholder='e.g. Data Steward'
							/>
						</div>
						<div className='mb-3'>
							<label className='form-label'>Definition</label>
							<Textarea
								value={newTerm.definition}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
									setNewTerm({ ...newTerm, definition: e.target.value })
								}
								placeholder='Definition of the term...'
								rows={3}
							/>
						</div>
						<div className='mb-3'>
							<label className='form-label'>Category</label>
							<Input
								value={newTerm.category}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setNewTerm({ ...newTerm, category: e.target.value })
								}
								placeholder='e.g. Governance'
							/>
						</div>
						{atlasConnected && (
							<div className='p-2 bg-l10-success rounded-2'>
								<small>
									<Icon icon='Cloud' className='me-1' color='success' />
									Term will also be added to Atlas Glossary API
								</small>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setShowAddModal(false)}>
							Cancel
						</Button>
						<Button
							color='primary'
							icon='Add'
							onClick={handleAddTerm}
							isDisable={!newTerm.term || !newTerm.definition}>
							Add Term
						</Button>
					</ModalFooter>
				</Modal>
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

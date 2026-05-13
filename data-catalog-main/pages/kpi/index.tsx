import React, { useCallback, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../layout/SubHeader/SubHeader';
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
import Progress from '../../components/bootstrap/Progress';
import Spinner from '../../components/bootstrap/Spinner';

const IKU_DEFINITIONS = [
	{
		code: 'IKU-1',
		name: 'Lulusan bekerja/studi/wirausaha',
		icon: 'School',
		color: 'primary',
		target2024: 78,
		fact: 'fact_iku1_lulusan',
	},
	{
		code: 'IKU-2',
		name: 'Mahasiswa MBKM / prestasi nasional',
		icon: 'EmojiEvents',
		color: 'success',
		target2024: 35,
		fact: 'fact_iku2_mbkm',
	},
	{
		code: 'IKU-3',
		name: 'Dosen tridarma luar/praktisi',
		icon: 'Groups',
		color: 'info',
		target2024: 25,
		fact: 'fact_iku3_dosen_tridarma',
	},
	{
		code: 'IKU-4',
		name: 'Dosen S3/sertifikat/praktisi',
		icon: 'WorkspacePremium',
		color: 'warning',
		target2024: 50,
		fact: 'fact_iku4_kualifikasi_dosen',
	},
	{
		code: 'IKU-5',
		name: 'Rasio output penelitian intl per dosen',
		icon: 'Science',
		color: 'danger',
		target2024: 0.25,
		fact: 'fact_iku5_penelitian_pkm',
	},
	{
		code: 'IKU-6',
		name: 'Prodi bekerjasama mitra',
		icon: 'Handshake',
		color: 'primary',
		target2024: 60,
		fact: 'fact_iku6_kerjasama_prodi',
	},
	{
		code: 'IKU-7',
		name: 'MK case method / team-based',
		icon: 'AutoStories',
		color: 'info',
		target2024: 40,
		fact: 'fact_iku7_metode_pembelajaran',
	},
	{
		code: 'IKU-8',
		name: 'Prodi akreditasi internasional',
		icon: 'Public',
		color: 'success',
		target2024: 3.0,
		fact: 'fact_iku8_akreditasi_internasional',
	},
];

const KpiDashboard: NextPage = () => {
	const router = useRouter();
	const [kpiEntities, setKpiEntities] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [goldCount, setGoldCount] = useState(0);

	const fetchKpiData = useCallback(async () => {
		setLoading(true);
		try {
			const [kpiRes, goldRes] = await Promise.all([
				fetch('/api/atlas/search?typeName=lakehouse_dataset&classification=KPI_Metric&limit=50'),
				fetch('/api/atlas/search?typeName=lakehouse_dataset&classification=Gold_Layer&limit=1'),
			]);
			const kpiData = await kpiRes.json();
			const goldData = await goldRes.json();
			setKpiEntities(kpiData.entities || []);
			setGoldCount(goldData.approximateCount || 0);
		} catch {
			setKpiEntities([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchKpiData();
	}, [fetchKpiData]);

	return (
		<PageWrapper>
			<Head>
				<title>KPI Dashboard — Data Catalog</title>
			</Head>
			<SubHeader>
				<SubHeaderLeft>
					<Icon icon='BarChart' size='2x' color='primary' />
					<span className='h4 mb-0 ms-2 fw-bold'>KPI Dashboard — IKU ITERA</span>
					<Badge color='success' isLight className='ms-3'>
						Gold Layer Star Schema
					</Badge>
				</SubHeaderLeft>
			</SubHeader>
			<Page>
				{/* Summary cards */}
				<div className='row mb-4'>
					<div className='col-md-3'>
						<Card shadow='sm'>
							<CardBody className='text-center py-4'>
								<Icon icon='Star' size='3x' color='success' />
								<h2 className='mt-3 mb-1 fw-bold'>{goldCount}</h2>
								<p className='text-muted mb-0'>Gold Tables</p>
							</CardBody>
						</Card>
					</div>
					<div className='col-md-3'>
						<Card shadow='sm'>
							<CardBody className='text-center py-4'>
								<Icon icon='BarChart' size='3x' color='primary' />
								<h2 className='mt-3 mb-1 fw-bold'>8</h2>
								<p className='text-muted mb-0'>IKU Metrics</p>
							</CardBody>
						</Card>
					</div>
					<div className='col-md-3'>
						<Card shadow='sm'>
							<CardBody className='text-center py-4'>
								<Icon icon='ViewColumn' size='3x' color='info' />
								<h2 className='mt-3 mb-1 fw-bold'>5</h2>
								<p className='text-muted mb-0'>Dimensions</p>
							</CardBody>
						</Card>
					</div>
					<div className='col-md-3'>
						<Card shadow='sm'>
							<CardBody className='text-center py-4'>
								<Icon icon='TableChart' size='3x' color='warning' />
								<h2 className='mt-3 mb-1 fw-bold'>10</h2>
								<p className='text-muted mb-0'>Fact Tables</p>
							</CardBody>
						</Card>
					</div>
				</div>

				{/* IKU Cards */}
				<div className='row mb-4'>
					<div className='col-12'>
						<Card shadow='sm'>
							<CardHeader>
								<CardLabel icon='Assessment' iconColor='primary'>
									<CardTitle>Indikator Kinerja Utama (IKU)</CardTitle>
									<CardSubTitle>
										Target Renstra ITERA 2020-2024 — Fact tables di Gold
										layer
									</CardSubTitle>
								</CardLabel>
								<CardActions>
									<Button
										color='primary'
										isLight
										icon='Refresh'
										onClick={fetchKpiData}
										isDisable={loading}>
										Refresh
									</Button>
								</CardActions>
							</CardHeader>
							<CardBody>
								{loading ? (
									<div className='text-center py-5'>
										<Spinner color='primary' size='3rem' />
									</div>
								) : (
									<div className='row'>
										{IKU_DEFINITIONS.map((iku) => {
											const matched = kpiEntities.find(
												(e) =>
													e.attributes?.name === iku.fact,
											);
											const profiling = (() => {
												try {
													return JSON.parse(
														matched?.attributes?.profiling ||
															'{}',
													);
												} catch {
													return {};
												}
											})();
											const kpiMeta = profiling.kpi || {};
											const consumption =
												profiling.consumption || {};
											const rowCount =
												matched?.attributes?.row_count || 0;

											return (
												<div
													key={iku.code}
													className='col-md-6 col-lg-3 mb-3'>
													<Card
														shadow='none'
														borderSize={1}
														borderColor={iku.color as any}
														className='h-100'>
														<CardBody>
															<div className='d-flex align-items-center mb-2'>
																<Icon
																	icon={iku.icon as any}
																	size='2x'
																	color={
																		iku.color as any
																	}
																/>
																<div className='ms-2'>
																	<Badge
																		color={
																			iku.color as any
																		}>
																		{iku.code}
																	</Badge>
																</div>
															</div>

															<h6 className='mb-3'>
																{iku.name}
															</h6>

															<div className='mb-2'>
																<div className='d-flex justify-content-between'>
																	<small className='text-muted'>
																		Target 2024
																	</small>
																	<strong>
																		{iku.code === 'IKU-5'
																			? iku.target2024
																			: `${iku.target2024}%`}
																	</strong>
																</div>
																<Progress
																	value={Math.min(
																		iku.code === 'IKU-5'
																			? iku.target2024 *
																				100
																			: iku.target2024,
																		100,
																	)}
																	color={
																		iku.color as any
																	}
																	height={6}
																/>
															</div>

															{kpiMeta.formula && (
																<div className='mb-2'>
																	<small className='text-muted d-block'>
																		Formula
																	</small>
																	<code className='small'>
																		{kpiMeta.formula}
																	</code>
																</div>
															)}

															<div className='d-flex justify-content-between align-items-center mt-3'>
																<small className='text-muted'>
																	{rowCount
																		? `${Number(
																				rowCount,
																			).toLocaleString()} rows`
																		: 'No data'}
																</small>
																{matched && (
																	<Button
																		color={
																			iku.color as any
																		}
																		isLight
																		size='sm'
																		onClick={() =>
																			router.push(
																				`/catalog/${encodeURIComponent(
																					matched
																						.attributes
																						?.qualifiedName,
																				)}`,
																			)
																		}>
																		Detail
																	</Button>
																)}
															</div>
														</CardBody>
													</Card>
												</div>
											);
										})}
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</div>

				{/* Star Schema overview */}
				<div className='row'>
					<div className='col-md-6 mb-4'>
						<Card shadow='sm' stretch>
							<CardHeader>
								<CardLabel icon='Star' iconColor='success'>
									<CardTitle>Star Schema Design</CardTitle>
								</CardLabel>
							</CardHeader>
							<CardBody>
								<div className='p-3 bg-l10-success rounded-3 text-center'>
									<h6 className='mb-3'>Gold Layer Architecture</h6>
									<div className='d-flex justify-content-center gap-2 flex-wrap mb-3'>
										{[
											'dim_waktu',
											'dim_prodi',
											'dim_dosen',
											'dim_mahasiswa',
											'dim_topik',
										].map((dim) => (
											<Badge
												key={dim}
												color='info'
												isLight
												className='px-3 py-2'>
												<Icon icon='ViewColumn' className='me-1' />
												{dim}
											</Badge>
										))}
									</div>
									<Icon
										icon='ArrowDownward'
										size='2x'
										className='my-2'
										color='success'
									/>
									<div className='d-flex justify-content-center gap-2 flex-wrap'>
										{IKU_DEFINITIONS.map((iku) => (
											<Badge
												key={iku.code}
												color={iku.color as any}
												isLight
												className='px-2 py-1'>
												{iku.code}
											</Badge>
										))}
										<Badge color='dark' isLight className='px-2 py-1'>
											SAKIP
										</Badge>
										<Badge color='dark' isLight className='px-2 py-1'>
											Rekap
										</Badge>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>

					<div className='col-md-6 mb-4'>
						<Card shadow='sm' stretch>
							<CardHeader>
								<CardLabel icon='People' iconColor='primary'>
									<CardTitle>Dashboard Consumers</CardTitle>
								</CardLabel>
							</CardHeader>
							<CardBody>
								{[
									{
										role: 'Rektor',
										desc: 'Executive summary all IKU',
										icon: 'Person',
									},
									{
										role: 'Wakil Rektor I',
										desc: 'IKU-1, IKU-2, IKU-7 (Akademik)',
										icon: 'School',
									},
									{
										role: 'Wakil Rektor II',
										desc: 'IKU-3, IKU-4, IKU-5 (SDM & Riset)',
										icon: 'Science',
									},
									{
										role: 'Wakil Rektor III',
										desc: 'SAKIP & Anggaran',
										icon: 'AccountBalance',
									},
									{
										role: 'Wakil Rektor IV',
										desc: 'IKU-6 (Kerjasama)',
										icon: 'Handshake',
									},
									{
										role: 'LP3M',
										desc: 'IKU-8 (Akreditasi)',
										icon: 'VerifiedUser',
									},
									{
										role: 'LPPM',
										desc: 'IKU-5 (Penelitian & PkM)',
										icon: 'Biotech',
									},
									{
										role: 'Senat & Kemenristekdikti',
										desc: 'Rekap IKU institusi',
										icon: 'AccountTree',
									},
								].map((consumer) => (
									<div
										key={consumer.role}
										className='d-flex align-items-center py-2 border-bottom'>
										<Icon
											icon={consumer.icon as any}
											color='primary'
											className='me-3'
										/>
										<div>
											<strong>{consumer.role}</strong>
											<br />
											<small className='text-muted'>
												{consumer.desc}
											</small>
										</div>
									</div>
								))}
							</CardBody>
						</Card>
					</div>
				</div>
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

export default KpiDashboard;

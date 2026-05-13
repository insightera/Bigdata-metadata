import React, { useCallback, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
import { layerFromQualifiedName, layerColor, classificationColor } from '../../helpers/atlasApi';

const DatasetDetailPage: NextPage = () => {
	const router = useRouter();
	const { qualifiedName } = router.query;
	const qn = decodeURIComponent((qualifiedName as string) || '');

	const [entity, setEntity] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const fetchEntity = useCallback(async () => {
		if (!qn) return;
		setLoading(true);
		try {
			const res = await fetch(
				`/api/atlas/search?typeName=lakehouse_dataset&query=${encodeURIComponent(qn)}&limit=10`,
			);
			const data = await res.json();
			const match = (data.entities || []).find(
				(e: any) => e.attributes?.qualifiedName === qn,
			);
			if (match) {
				const detailRes = await fetch(`/api/atlas/entity/${match.guid}`);
				const detailData = await detailRes.json();
				setEntity(detailData.entity || match);
			} else {
				setError('Entity not found in Atlas');
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [qn]);

	useEffect(() => {
		fetchEntity();
	}, [fetchEntity]);

	if (loading) {
		return (
			<PageWrapper>
				<Page>
					<div className='text-center py-5'>
						<Spinner color='primary' size='3rem' />
						<p className='mt-3 text-muted'>Loading entity from Atlas...</p>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	if (error || !entity) {
		return (
			<PageWrapper>
				<Page>
					<Card shadow='sm'>
						<CardBody className='text-center py-5'>
							<Icon icon='Error' size='4x' color='danger' />
							<h4 className='mt-3'>Entity Not Found</h4>
							<p className='text-muted'>{error || `Could not find: ${qn}`}</p>
							<Button color='primary' onClick={() => router.push('/catalog')}>
								Back to Catalog
							</Button>
						</CardBody>
					</Card>
				</Page>
			</PageWrapper>
		);
	}

	const attrs = entity.attributes || {};
	const layer = layerFromQualifiedName(qn);
	const lColor = layerColor(layer);
	const classifications = entity.classifications || [];
	const schema = (() => {
		try {
			return JSON.parse(attrs.schema_def || '{}');
		} catch {
			return {};
		}
	})();
	const profiling = (() => {
		try {
			return JSON.parse(attrs.profiling || '{}');
		} catch {
			return {};
		}
	})();
	const piiColumns = (() => {
		try {
			return JSON.parse(attrs.pii_columns || '[]');
		} catch {
			return [];
		}
	})();
	const kpiMeta = profiling.kpi || {};
	const consumptionMeta = profiling.consumption || {};
	const aiMeta = profiling.ai_metadata || {};
	const starSchema = profiling.star_schema || {};

	return (
		<PageWrapper>
			<Head>
				<title>{attrs.name} — Data Catalog</title>
			</Head>
			<SubHeader>
				<SubHeaderLeft>
					<Button
						color='light'
						icon='ArrowBack'
						onClick={() => router.push('/catalog')}>
						Back
					</Button>
					<Icon icon='TableChart' size='2x' color={lColor as any} className='ms-3' />
					<span className='h4 mb-0 ms-2 fw-bold'>{attrs.name}</span>
					<Badge color={lColor as any} className='ms-3'>
						{layer.toUpperCase()}
					</Badge>
				</SubHeaderLeft>
				<SubHeaderRight>
					{entity.guid && (
						<Button
							color='info'
							isLight
							icon='AccountTree'
							onClick={() => router.push(`/lineage/${entity.guid}`)}>
							View Lineage
						</Button>
					)}
				</SubHeaderRight>
			</SubHeader>
			<Page>
				<div className='row'>
					{/* Overview */}
					<div className='col-md-8 mb-4'>
						<Card shadow='sm'>
							<CardHeader>
								<CardLabel icon='Info' iconColor='primary'>
									<CardTitle>Dataset Overview</CardTitle>
									<CardSubTitle>{qn}</CardSubTitle>
								</CardLabel>
							</CardHeader>
							<CardBody>
								{attrs.description && (
									<div className='mb-3'>
										<h6>Description</h6>
										<p>{attrs.description}</p>
									</div>
								)}

								<div className='row'>
									<div className='col-md-3 mb-3'>
										<small className='text-muted d-block'>Format</small>
										<strong>{attrs.format || 'iceberg'}</strong>
									</div>
									<div className='col-md-3 mb-3'>
										<small className='text-muted d-block'>Row Count</small>
										<strong>
											{attrs.row_count
												? Number(attrs.row_count).toLocaleString()
												: '—'}
										</strong>
									</div>
									<div className='col-md-3 mb-3'>
										<small className='text-muted d-block'>Columns</small>
										<strong>{attrs.column_count || '—'}</strong>
									</div>
									<div className='col-md-3 mb-3'>
										<small className='text-muted d-block'>Layer</small>
										<Badge color={lColor as any} isLight>
											{attrs.layer || layer}
										</Badge>
									</div>
								</div>

								{attrs.location && (
									<div className='mb-3'>
										<small className='text-muted d-block'>Location</small>
										<code>{attrs.location}</code>
									</div>
								)}

								{attrs.ingested_at && (
									<div className='mb-3'>
										<small className='text-muted d-block'>Ingested At</small>
										<span>{new Date(attrs.ingested_at).toLocaleString()}</span>
									</div>
								)}
							</CardBody>
						</Card>
					</div>

					{/* Classifications & Tags */}
					<div className='col-md-4 mb-4'>
						<Card shadow='sm' stretch>
							<CardHeader>
								<CardLabel icon='Label' iconColor='warning'>
									<CardTitle>Classifications</CardTitle>
								</CardLabel>
							</CardHeader>
							<CardBody>
								{classifications.length > 0 ? (
									<div className='d-flex flex-wrap gap-2'>
										{classifications.map((c: any) => (
											<Badge
												key={c.typeName}
												color={classificationColor(c.typeName) as any}
												className='px-3 py-2'>
												<Icon icon='Label' className='me-1' />
												{c.typeName.replace(/_/g, ' ')}
											</Badge>
										))}
									</div>
								) : (
									<p className='text-muted'>No classifications assigned</p>
								)}

								{piiColumns.length > 0 && (
									<div className='mt-4'>
										<h6>
											<Icon icon='Security' color='danger' className='me-1' />
											PII Columns
										</h6>
										<div className='d-flex flex-wrap gap-1'>
											{piiColumns.map((col: string) => (
												<Badge key={col} color='danger' isLight>
													{col}
												</Badge>
											))}
										</div>
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</div>

				{/* Schema */}
				{Object.keys(schema).length > 0 && (
					<div className='row mb-4'>
						<div className='col-12'>
							<Card shadow='sm'>
								<CardHeader>
									<CardLabel icon='ViewColumn' iconColor='info'>
										<CardTitle>Schema</CardTitle>
										<CardSubTitle>
											{Object.keys(schema).length} columns
										</CardSubTitle>
									</CardLabel>
								</CardHeader>
								<CardBody>
									<div className='table-responsive'>
										<table className='table table-modern table-hover'>
											<thead>
												<tr>
													<th>#</th>
													<th>Column Name</th>
													<th>Data Type</th>
													<th>Tags</th>
												</tr>
											</thead>
											<tbody>
												{Object.entries(schema).map(
													([col, dtype], i) => (
														<tr key={col}>
															<td>{i + 1}</td>
															<td>
																<code>{col}</code>
															</td>
															<td>
																<Badge color='light'>
																	{dtype as string}
																</Badge>
															</td>
															<td>
																{piiColumns.includes(col) && (
																	<Badge
																		color='danger'
																		isLight>
																		PII
																	</Badge>
																)}
															</td>
														</tr>
													),
												)}
											</tbody>
										</table>
									</div>
								</CardBody>
							</Card>
						</div>
					</div>
				)}

				{/* KPI & Business Metadata (Gold layer) */}
				{(kpiMeta.iku_code || starSchema.table_type) && (
					<div className='row mb-4'>
						{kpiMeta.iku_code && (
							<div className='col-md-6 mb-4'>
								<Card shadow='sm' stretch>
									<CardHeader>
										<CardLabel icon='BarChart' iconColor='primary'>
											<CardTitle>KPI Metadata</CardTitle>
											<CardSubTitle>{kpiMeta.iku_code}</CardSubTitle>
										</CardLabel>
									</CardHeader>
									<CardBody>
										<div className='mb-2'>
											<small className='text-muted d-block'>IKU Name</small>
											<strong>{kpiMeta.iku_nama}</strong>
										</div>
										<div className='mb-2'>
											<small className='text-muted d-block'>Formula</small>
											<code>{kpiMeta.formula}</code>
										</div>
										<div className='mb-2'>
											<small className='text-muted d-block'>Unit</small>
											<span>{kpiMeta.satuan}</span>
										</div>
										<div className='mb-2'>
											<small className='text-muted d-block'>
												Renstra Source
											</small>
											<span>{kpiMeta.sumber_renstra}</span>
										</div>
									</CardBody>
								</Card>
							</div>
						)}

						<div className='col-md-6 mb-4'>
							<Card shadow='sm' stretch>
								<CardHeader>
									<CardLabel icon='Star' iconColor='success'>
										<CardTitle>Star Schema & Consumption</CardTitle>
									</CardLabel>
								</CardHeader>
								<CardBody>
									{starSchema.table_type && (
										<div className='mb-2'>
											<small className='text-muted d-block'>
												Table Type
											</small>
											<Badge
												color={
													starSchema.table_type === 'fact'
														? 'primary'
														: 'info'
												}>
												{starSchema.table_type === 'fact'
													? 'Fact Table'
													: 'Dimension Table'}
											</Badge>
										</div>
									)}
									{starSchema.olap_role && (
										<div className='mb-2'>
											<small className='text-muted d-block'>OLAP Role</small>
											<span>{starSchema.olap_role}</span>
										</div>
									)}
									{consumptionMeta.consumers?.length > 0 && (
										<div className='mb-2'>
											<small className='text-muted d-block'>Consumers</small>
											<div className='d-flex flex-wrap gap-1'>
												{consumptionMeta.consumers.map((c: string) => (
													<Badge key={c} color='primary' isLight>
														{c}
													</Badge>
												))}
											</div>
										</div>
									)}
									{consumptionMeta.dashboard_panel && (
										<div className='mb-2'>
											<small className='text-muted d-block'>
												Dashboard Panel
											</small>
											<span>{consumptionMeta.dashboard_panel}</span>
										</div>
									)}
									{aiMeta.ml_ready != null && (
										<div className='mb-2'>
											<small className='text-muted d-block'>
												AI / ML Ready
											</small>
											<Badge
												color={aiMeta.ml_ready ? 'success' : 'secondary'}
												isLight>
												{aiMeta.ml_ready ? 'Yes' : 'No'}
											</Badge>
											{aiMeta.suggested_models?.length > 0 && (
												<div className='mt-1'>
													{aiMeta.suggested_models.map((m: string) => (
														<Badge
															key={m}
															color='info'
															isLight
															className='me-1'>
															{m}
														</Badge>
													))}
												</div>
											)}
										</div>
									)}
								</CardBody>
							</Card>
						</div>
					</div>
				)}
			</Page>
		</PageWrapper>
	);
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
	props: {
		// @ts-ignore
		...(await serverSideTranslations(locale || 'en', ['common', 'menu'])),
	},
});

export default DatasetDetailPage;

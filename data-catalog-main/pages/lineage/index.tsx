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
} from '../../components/bootstrap/Card';
import Icon from '../../components/icon/Icon';
import Badge from '../../components/bootstrap/Badge';
import Button from '../../components/bootstrap/Button';
import Spinner from '../../components/bootstrap/Spinner';
import { layerFromQualifiedName, layerColor } from '../../helpers/atlasApi';

const LineageIndexPage: NextPage = () => {
	const router = useRouter();
	const [datasets, setDatasets] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchDatasets = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/atlas/search?typeName=lakehouse_dataset&limit=100');
			const data = await res.json();
			setDatasets(data.entities || []);
		} catch {
			setDatasets([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDatasets();
	}, [fetchDatasets]);

	const grouped: Record<string, any[]> = {};
	datasets.forEach((e) => {
		const layer = layerFromQualifiedName(e.attributes?.qualifiedName || '');
		if (!grouped[layer]) grouped[layer] = [];
		grouped[layer].push(e);
	});

	const layerOrder = ['staging', 'bronze', 'silver', 'gold'];

	return (
		<PageWrapper>
			<Head>
				<title>Data Lineage — Data Catalog</title>
			</Head>
			<SubHeader>
				<SubHeaderLeft>
					<Icon icon='AccountTree' size='2x' color='primary' />
					<span className='h4 mb-0 ms-2 fw-bold'>Data Lineage</span>
					<Badge color='info' isLight className='ms-3'>
						Select an entity to explore lineage
					</Badge>
				</SubHeaderLeft>
			</SubHeader>
			<Page>
				{/* Full pipeline lineage diagram */}
				<div className='row mb-4'>
					<div className='col-12'>
						<Card shadow='sm'>
							<CardHeader>
								<CardLabel icon='AccountTree' iconColor='primary'>
									<CardTitle>End-to-End Pipeline Lineage</CardTitle>
									<CardSubTitle>
										Staging → Bronze → Silver → Gold
									</CardSubTitle>
								</CardLabel>
							</CardHeader>
							<CardBody>
								<div className='p-3 bg-l10-primary rounded-3'>
									<div className='d-flex align-items-start justify-content-between flex-wrap'>
										{layerOrder.map((layer, i) => {
											const items = grouped[layer] || [];
											const lColor = layerColor(layer);
											return (
												<React.Fragment key={layer}>
													{i > 0 && (
														<div className='d-flex align-items-center py-4'>
															<Icon
																icon='ArrowForward'
																size='2x'
																color='primary'
															/>
															<div className='mx-1'>
																<small className='text-muted'>
																	ETL
																</small>
															</div>
															<Icon
																icon='ArrowForward'
																size='2x'
																color='primary'
															/>
														</div>
													)}
													<div
														className='text-center p-3 rounded-3'
														style={{
															minWidth: 160,
															backgroundColor: `var(--bs-${lColor}-bg-subtle, var(--bs-light))`,
															border: `2px solid var(--bs-${lColor})`,
														}}>
														<Badge
															color={lColor as any}
															className='mb-2 px-3'>
															{layer.toUpperCase()}
														</Badge>
														<div className='fw-bold h4 mb-1'>
															{items.length}
														</div>
														<small className='text-muted'>
															datasets
														</small>
														<div className='mt-2'>
															{items.slice(0, 3).map((item) => (
																<div key={item.guid}>
																	<Button
																		color={lColor as any}
																		isLight
																		size='sm'
																		className='mb-1 w-100 text-truncate'
																		onClick={() =>
																			router.push(
																				`/lineage/${item.guid}`,
																			)
																		}>
																		{item.attributes?.name}
																	</Button>
																</div>
															))}
															{items.length > 3 && (
																<small className='text-muted'>
																	+{items.length - 3} more
																</small>
															)}
														</div>
													</div>
												</React.Fragment>
											);
										})}
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>

				{/* Entity list for lineage */}
				{loading ? (
					<div className='text-center py-5'>
						<Spinner color='primary' size='3rem' />
					</div>
				) : (
					<div className='row'>
						{layerOrder.map((layer) => {
							const items = grouped[layer] || [];
							if (items.length === 0) return null;
							return (
								<div key={layer} className='col-md-3 mb-4'>
									<Card shadow='sm' stretch>
										<CardHeader>
											<CardLabel
												icon={
													layer === 'staging'
														? 'CloudUpload'
														: layer === 'bronze'
															? 'Storage'
															: layer === 'silver'
																? 'AutoFixHigh'
																: ('Star' as any)
												}
												iconColor={layerColor(layer) as any}>
												<CardTitle>
													{layer.charAt(0).toUpperCase() +
														layer.slice(1)}
												</CardTitle>
											</CardLabel>
										</CardHeader>
										<CardBody>
											{items.map((item) => (
												<Button
													key={item.guid}
													color={layerColor(layer) as any}
													isLight
													size='sm'
													className='w-100 mb-2 text-start'
													icon='AccountTree'
													onClick={() =>
														router.push(`/lineage/${item.guid}`)
													}>
													{item.attributes?.name}
												</Button>
											))}
										</CardBody>
									</Card>
								</div>
							);
						})}
					</div>
				)}
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

export default LineageIndexPage;

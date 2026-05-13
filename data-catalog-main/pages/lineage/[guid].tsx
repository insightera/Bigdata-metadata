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
} from '../../components/bootstrap/Card';
import Icon from '../../components/icon/Icon';
import Badge from '../../components/bootstrap/Badge';
import Button from '../../components/bootstrap/Button';
import Spinner from '../../components/bootstrap/Spinner';
import { layerFromQualifiedName, layerColor, classificationColor } from '../../helpers/atlasApi';

interface LineageNode {
	guid: string;
	name: string;
	typeName: string;
	qualifiedName: string;
	layer: string;
}

interface LineageEdge {
	from: string;
	to: string;
}

const LineageDetailPage: NextPage = () => {
	const router = useRouter();
	const { guid } = router.query;

	const [baseEntity, setBaseEntity] = useState<any>(null);
	const [nodes, setNodes] = useState<LineageNode[]>([]);
	const [edges, setEdges] = useState<LineageEdge[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const fetchLineage = useCallback(async () => {
		if (!guid) return;
		setLoading(true);
		try {
			const [entityRes, lineageRes] = await Promise.all([
				fetch(`/api/atlas/entity/${guid}`),
				fetch(`/api/atlas/lineage/${guid}?depth=5&direction=BOTH`),
			]);
			const entityData = await entityRes.json();
			const lineageData = await lineageRes.json();

			setBaseEntity(entityData.entity);

			const nodeMap = lineageData.guidEntityMap || {};
			const parsedNodes: LineageNode[] = Object.entries(nodeMap).map(
				([g, e]: [string, any]) => ({
					guid: g,
					name: e.attributes?.name || e.attributes?.qualifiedName || g,
					typeName: e.typeName,
					qualifiedName: e.attributes?.qualifiedName || '',
					layer: layerFromQualifiedName(e.attributes?.qualifiedName || ''),
				}),
			);

			const parsedEdges: LineageEdge[] = (lineageData.relations || []).map(
				(r: any) => ({
					from: r.fromEntityId,
					to: r.toEntityId,
				}),
			);

			setNodes(parsedNodes);
			setEdges(parsedEdges);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [guid]);

	useEffect(() => {
		fetchLineage();
	}, [fetchLineage]);

	if (loading) {
		return (
			<PageWrapper>
				<Page>
					<div className='text-center py-5'>
						<Spinner color='primary' size='3rem' />
						<p className='mt-3 text-muted'>Loading lineage from Atlas...</p>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	const baseName = baseEntity?.attributes?.name || guid;
	const baseQn = baseEntity?.attributes?.qualifiedName || '';
	const baseLayer = layerFromQualifiedName(baseQn);

	const inputNodes = new Set<string>();
	const outputNodes = new Set<string>();
	edges.forEach((e) => {
		if (e.to === guid) inputNodes.add(e.from);
		if (e.from === guid) outputNodes.add(e.to);
	});

	const layerGroups: Record<string, LineageNode[]> = {};
	nodes.forEach((n) => {
		const key = n.typeName === 'lakehouse_etl_process' ? 'process' : n.layer;
		if (!layerGroups[key]) layerGroups[key] = [];
		layerGroups[key].push(n);
	});

	const displayOrder = ['staging', 'bronze', 'process', 'silver', 'gold'];

	return (
		<PageWrapper>
			<Head>
				<title>Lineage: {baseName} — Data Catalog</title>
			</Head>
			<SubHeader>
				<SubHeaderLeft>
					<Button
						color='light'
						icon='ArrowBack'
						onClick={() => router.push('/lineage')}>
						Back
					</Button>
					<Icon
						icon='AccountTree'
						size='2x'
						color={layerColor(baseLayer) as any}
						className='ms-3'
					/>
					<span className='h4 mb-0 ms-2 fw-bold'>Lineage: {baseName}</span>
					<Badge color={layerColor(baseLayer) as any} className='ms-2'>
						{baseLayer.toUpperCase()}
					</Badge>
				</SubHeaderLeft>
				<SubHeaderRight>
					<Badge color='info' isLight className='px-3 py-2'>
						{nodes.length} entities · {edges.length} relations
					</Badge>
				</SubHeaderRight>
			</SubHeader>
			<Page>
				{error && (
					<Card shadow='sm' className='mb-4'>
						<CardBody className='text-center py-4'>
							<Icon icon='Warning' size='3x' color='warning' />
							<h5 className='mt-2'>Lineage data unavailable</h5>
							<p className='text-muted'>{error}</p>
						</CardBody>
					</Card>
				)}

				{/* Visual lineage flow */}
				<Card shadow='sm' className='mb-4'>
					<CardHeader>
						<CardLabel icon='AccountTree' iconColor='primary'>
							<CardTitle>Lineage Graph</CardTitle>
							<CardSubTitle>
								{nodes.length} entities, {edges.length} relationships
							</CardSubTitle>
						</CardLabel>
					</CardHeader>
					<CardBody>
						<div className='d-flex align-items-start justify-content-center flex-wrap gap-3 p-3'>
							{displayOrder.map((layerKey) => {
								const layerNodes = layerGroups[layerKey] || [];
								if (layerNodes.length === 0) return null;

								const isProcess = layerKey === 'process';
								const lColor = isProcess
									? 'dark'
									: layerColor(layerKey);

								return (
									<React.Fragment key={layerKey}>
										<div
											className='text-center p-3 rounded-3'
											style={{
												minWidth: 180,
												backgroundColor: isProcess
													? 'var(--bs-gray-100)'
													: `var(--bs-${lColor}-bg-subtle, var(--bs-light))`,
												border: `2px solid var(--bs-${lColor})`,
											}}>
											<Badge
												color={lColor as any}
												className='mb-3 px-3'>
												{isProcess
													? 'ETL PROCESS'
													: layerKey.toUpperCase()}
											</Badge>
											{layerNodes.map((node) => {
												const isBase = node.guid === guid;
												const isInput = inputNodes.has(node.guid);
												const isOutput = outputNodes.has(node.guid);
												return (
													<div
														key={node.guid}
														className={`p-2 mb-2 rounded-2 border ${
															isBase
																? 'border-primary bg-l25-primary'
																: isInput
																	? 'border-info bg-l10-info'
																	: isOutput
																		? 'border-success bg-l10-success'
																		: 'bg-white'
														}`}>
														<div className='d-flex align-items-center'>
															<Icon
																icon={
																	isProcess
																		? 'Transform'
																		: ('TableChart' as any)
																}
																size='sm'
																color={lColor as any}
																className='me-1'
															/>
															<small
																className='fw-bold text-truncate'
																style={{
																	maxWidth: 140,
																}}>
																{node.name}
															</small>
														</div>
														{isBase && (
															<Badge
																color='primary'
																className='mt-1'>
																CURRENT
															</Badge>
														)}
														{!isProcess && (
															<div className='mt-1'>
																<Button
																	color={lColor as any}
																	isLight
																	size='sm'
																	onClick={() =>
																		router.push(
																			`/lineage/${node.guid}`,
																		)
																	}>
																	Explore
																</Button>
															</div>
														)}
													</div>
												);
											})}
										</div>
										{layerKey !== 'gold' && (
											<div className='d-flex align-items-center'>
												<Icon
													icon='ArrowForward'
													size='2x'
													color='primary'
												/>
											</div>
										)}
									</React.Fragment>
								);
							})}
						</div>
					</CardBody>
				</Card>

				{/* Relations table */}
				{edges.length > 0 && (
					<Card shadow='sm'>
						<CardHeader>
							<CardLabel icon='Link' iconColor='info'>
								<CardTitle>Lineage Relations</CardTitle>
							</CardLabel>
						</CardHeader>
						<CardBody>
							<div className='table-responsive'>
								<table className='table table-modern'>
									<thead>
										<tr>
											<th>From</th>
											<th />
											<th>To</th>
										</tr>
									</thead>
									<tbody>
										{edges.map((edge, i) => {
											const fromNode = nodes.find(
												(n) => n.guid === edge.from,
											);
											const toNode = nodes.find(
												(n) => n.guid === edge.to,
											);
											return (
												<tr key={i}>
													<td>
														<Badge
															color={
																layerColor(
																	fromNode?.layer || '',
																) as any
															}
															isLight
															className='me-2'>
															{fromNode?.layer}
														</Badge>
														{fromNode?.name || edge.from}
													</td>
													<td className='text-center'>
														<Icon
															icon='ArrowForward'
															color='primary'
														/>
													</td>
													<td>
														<Badge
															color={
																layerColor(
																	toNode?.layer || '',
																) as any
															}
															isLight
															className='me-2'>
															{toNode?.layer}
														</Badge>
														{toNode?.name || edge.to}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</CardBody>
					</Card>
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

export default LineageDetailPage;

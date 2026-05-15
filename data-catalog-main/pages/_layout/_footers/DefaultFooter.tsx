import React from 'react';
import Link from 'next/link';
import Footer from '../../../layout/Footer/Footer';
import Logo from '../../../components/Logo';
import Icon from '../../../components/icon/Icon';
import { catalogMenu, governanceMenu, pipelineMenu } from '../../../menu';

type MenuItem = { path?: string; text?: string };

const collectLinks = (menu: Record<string, MenuItem>) =>
	Object.values(menu).filter((item) => item.path && item.text) as Required<MenuItem>[];

const CATALOG_LINKS = collectLinks(catalogMenu);
const GOVERNANCE_LINKS = collectLinks(governanceMenu);
const PIPELINE_LINKS = collectLinks(pipelineMenu);

const menuHref = (path: string) => (path === '/' ? '/' : `/${path.replace(/^\//, '')}`);

const DefaultFooter = () => {
	const year = new Date().getFullYear();
	const atlasUrl = process.env.NEXT_PUBLIC_ATLAS_URL || 'http://localhost:21000';

	return (
		<Footer>
			<div className='container-fluid footer-catalog'>
				<div className='row g-3 py-3 align-items-start'>
					<div className='col-12 col-lg-4'>
						<Link
							href='/'
							className='footer-catalog-brand text-decoration-none text-primary d-inline-block'>
							<Logo height={28} />
						</Link>
						<p className='footer-catalog-tagline small text-muted mb-0 mt-2'>
							Portal katalog metadata untuk arsitektur lakehouse Medallion — terhubung ke
							Apache Atlas.
						</p>
					</div>

					<div className='col-6 col-md-4 col-lg-2'>
						<div className='footer-catalog-heading'>Catalog</div>
						<ul className='footer-catalog-links list-unstyled mb-0'>
							{CATALOG_LINKS.map((item) => (
								<li key={item.path}>
									<Link href={menuHref(item.path)} className='footer-catalog-link'>
										{item.text}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className='col-6 col-md-4 col-lg-2'>
						<div className='footer-catalog-heading'>Governance</div>
						<ul className='footer-catalog-links list-unstyled mb-0'>
							{GOVERNANCE_LINKS.map((item) => (
								<li key={item.path}>
									<Link href={menuHref(item.path)} className='footer-catalog-link'>
										{item.text}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className='col-6 col-md-4 col-lg-2'>
						<div className='footer-catalog-heading'>Pipeline</div>
						<ul className='footer-catalog-links list-unstyled mb-0'>
							{PIPELINE_LINKS.map((item) => (
								<li key={item.path}>
									<Link href={menuHref(item.path)} className='footer-catalog-link'>
										{item.text}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className='col-12 col-lg-2'>
						<div className='footer-catalog-heading'>Layanan</div>
						<ul className='footer-catalog-links list-unstyled mb-0'>
							<li>
								<a
									href={atlasUrl}
									target='_blank'
									rel='noopener noreferrer'
									className='footer-catalog-link d-inline-flex align-items-center gap-1'>
									<Icon icon='OpenInNew' size='sm' />
									Atlas API
								</a>
							</li>
						</ul>
						<p className='small text-muted mb-0 mt-3'>
							&copy; {year} Data Lakehouse Metadata
						</p>
					</div>
				</div>
			</div>
		</Footer>
	);
};

export default DefaultFooter;

import React, { Suspense } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { useScrollTopOnChange } from '@magento/peregrine/lib/hooks/useScrollTopOnChange';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import MagentoRoute from '@magento/venia-ui/lib/components/MagentoRoute';
import HomePage from '../HomePage';

/**
 * MoonCart override — same structure as venia-ui's stock Routes.js,
 * except MagentoRoute is skipped on "/" specifically. Stock Routes
 * renders MagentoRoute (which resolves the URL and renders the "home"
 * CMS page's own content — just a plain title placeholder in this
 * project) *and* <HomePage/> together on the homepage; here <HomePage/>
 * (our CMS-block-driven MoonCart sections, see ../HomePage/homePage.js)
 * is the whole homepage, so the default CMS page content would just be
 * unwanted noise above/behind it.
 */
const Routes = () => {
    const { pathname } = useLocation();
    useScrollTopOnChange(pathname);
    const isHomePage = pathname === '/';

    return (
        <Suspense fallback={fullPageLoadingIndicator}>
            <Switch>
                {/*
                 * Client-side routes are injected by BabelRouteInjectionPlugin here.
                 * Venia's are defined in packages/venia-ui/lib/targets/venia-ui-intercept.js
                 */}
                <Route>
                    {!isHomePage && <MagentoRoute />}
                    {/*
                     * The Route below is purposefully nested with the MagentoRoute above.
                     * On every other route MagentoRoute renders the CMS/product/category
                     * page; on "/" it's skipped and HomePage is the entire page instead.
                     */}
                    <Route exact path="/">
                        <HomePage />
                    </Route>
                </Route>
            </Switch>
        </Suspense>
    );
};

export default Routes;
const availableRoutes = [];
export { availableRoutes };

import React, { Suspense } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import { useScrollTopOnChange } from '@magento/peregrine/lib/hooks/useScrollTopOnChange';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import MagentoRoute from '@magento/venia-ui/lib/components/MagentoRoute';
import HeliosHomePage from '../HomePage';

const Routes = () => {
    const { pathname } = useLocation();
    useScrollTopOnChange(pathname);

    return (
        <Suspense fallback={fullPageLoadingIndicator}>
            <Switch>
                {/* Static Helios homepage — no Magento CMS call for "/" */}
                <Route exact path="/">
                    <HeliosHomePage />
                </Route>
                {/* All other paths resolved by Magento backend */}
                <Route>
                    <MagentoRoute />
                </Route>
            </Switch>
        </Suspense>
    );
};

export default Routes;
const availableRoutes = [];
export { availableRoutes };
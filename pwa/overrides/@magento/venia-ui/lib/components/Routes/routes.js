import React, { Suspense } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { useScrollTopOnChange } from '@magento/peregrine/lib/hooks/useScrollTopOnChange';
import { fullPageLoadingIndicator } from '@magento/venia-ui/lib/components/LoadingIndicator';
import MagentoRoute from '@magento/venia-ui/lib/components/MagentoRoute';
import AuthRoute from '@magento/venia-ui/lib/components/Routes/authRoute';
import HomePage from '../HomePage';
import ComparePage from '../../../../../../src/moonCartTheme/ComparePage';

// Stock Venia never hand-writes these — @magento/venia-ui's own
// targets/makeRoutesTarget.js normally injects one <Route> per entry
// in its defaultRoutes.json via @magento/pwa-buildpack's Targetables
// (source-string-matching against the literal text
// "const availableRoutes = [];" below, plus a "Switch" JSX prependJSX
// call), keyed to venia-ui's OWN un-aliased routes.js file path.
// Because webpack.config.js aliases '@magento/venia-ui/lib/components/
// Routes' (and Main's relative '../Routes' import) straight to *this*
// file, Targetables' transform still runs against the original
// node_modules copy — which is then never bundled at all — so none of
// its injected routes (/cart, /checkout, /wishlist, ...) ever reached
// this file. Hence "/cart" (and every other default route) 404ing via
// MagentoRoute below. Replicated by hand here instead, pointing at the
// exact same real venia-ui page components defaultRoutes.json would
// have used. "/search.html" is the one default route NOT listed here —
// MagentoRoute's own urlResolver already special-cases that path.
const CartPage = React.lazy(() => import('@magento/venia-ui/lib/components/CartPage'));
const CheckoutPage = React.lazy(() => import('@magento/venia-ui/lib/components/CheckoutPage'));
const AccountInformationPage = React.lazy(() =>
    import('@magento/venia-ui/lib/components/AccountInformationPage')
);
const AddressBookPage = React.lazy(() =>
    import('@magento/venia-ui/lib/components/AddressBookPage')
);
const CommunicationsPage = React.lazy(() =>
    import('@magento/venia-ui/lib/components/CommunicationsPage')
);
const ContactPage = React.lazy(() => import('@magento/venia-ui/lib/components/ContactPage'));
const CreateAccountPage = React.lazy(() =>
    import('@magento/venia-ui/lib/components/CreateAccountPage')
);
const ForgotPasswordPage = React.lazy(() =>
    import('@magento/venia-ui/lib/components/ForgotPasswordPage')
);
const OrderConfirmationPage = React.lazy(() =>
    import('@magento/venia-ui/lib/components/CheckoutPage/OrderConfirmationPage')
);
const OrderHistoryPage = React.lazy(() =>
    import('@magento/venia-ui/lib/components/OrderHistoryPage')
);
const ResetPassword = React.lazy(() =>
    import('@magento/venia-ui/lib/components/MyAccount/ResetPassword')
);
const SavedPaymentsPage = React.lazy(() =>
    import('@magento/venia-ui/lib/components/SavedPaymentsPage')
);
const SignInPage = React.lazy(() => import('@magento/venia-ui/lib/components/SignInPage'));
const WishlistPage = React.lazy(() => import('@magento/venia-ui/lib/components/WishlistPage'));

/**
 * MoonCart override — same structure as venia-ui's stock Routes.js,
 * except MagentoRoute is skipped on "/" and "/compare" specifically.
 * Stock Routes renders MagentoRoute (which resolves the URL and
 * renders the "home" CMS page's own content — just a plain title
 * placeholder in this project) *and* <HomePage/> together on the
 * homepage; here <HomePage/> (our CMS-block-driven MoonCart sections,
 * see ../HomePage/homePage.js) is the whole homepage, so the default
 * CMS page content would just be unwanted noise above/behind it.
 * "/compare" is a plain client-side page (no Magento URL/CMS entity
 * behind it — see ComparePage.js), so MagentoRoute would otherwise
 * 404 it via urlResolver. The account/cart/checkout routes below are
 * real venia-ui pages that need the exact same treatment — see the
 * long comment above for why they were missing entirely.
 */
const Routes = () => {
    const { pathname } = useLocation();
    useScrollTopOnChange(pathname);
    const isHomePage = pathname === '/';
    const isComparePage = pathname === '/compare';

    return (
        <Suspense fallback={fullPageLoadingIndicator}>
            <Switch>
                <Route exact path="/cart">
                    <CartPage />
                </Route>
                <Route exact path="/checkout">
                    <CheckoutPage />
                </Route>
                <Route exact path="/order-confirmation">
                    <OrderConfirmationPage />
                </Route>
                <Route exact path="/contact-us">
                    <ContactPage />
                </Route>
                <Route exact path="/create-account">
                    <CreateAccountPage />
                </Route>
                <Route exact path="/forgot-password">
                    <ForgotPasswordPage />
                </Route>
                <Route exact path="/sign-in">
                    <SignInPage />
                </Route>
                <Route exact path="/customer/account/createPassword">
                    <ResetPassword />
                </Route>
                <AuthRoute exact path="/account-information" redirectTo="/sign-in">
                    <AccountInformationPage />
                </AuthRoute>
                <AuthRoute exact path="/address-book" redirectTo="/sign-in">
                    <AddressBookPage />
                </AuthRoute>
                <AuthRoute exact path="/communications" redirectTo="/sign-in">
                    <CommunicationsPage />
                </AuthRoute>
                <AuthRoute exact path="/order-history" redirectTo="/sign-in">
                    <OrderHistoryPage />
                </AuthRoute>
                <AuthRoute exact path="/saved-payments" redirectTo="/sign-in">
                    <SavedPaymentsPage />
                </AuthRoute>
                <AuthRoute exact path="/wishlist" redirectTo="/sign-in">
                    <WishlistPage />
                </AuthRoute>
                {/*
                 * Client-side routes are injected by BabelRouteInjectionPlugin here.
                 * Venia's are defined in packages/venia-ui/lib/targets/venia-ui-intercept.js
                 */}
                <Route>
                    {!isHomePage && !isComparePage && <MagentoRoute />}
                    {/*
                     * The Routes below are purposefully nested with the MagentoRoute above.
                     * On every other route MagentoRoute renders the CMS/product/category
                     * page; on "/" and "/compare" it's skipped and these are the entire
                     * page instead.
                     */}
                    <Route exact path="/">
                        <HomePage />
                    </Route>
                    <Route exact path="/compare">
                        <ComparePage />
                    </Route>
                </Route>
            </Switch>
        </Suspense>
    );
};

export default Routes;
const availableRoutes = [];
export { availableRoutes };

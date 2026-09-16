import { useCallback, useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';

const storage = new BrowserPersistence();
const STORAGE_KEY = 'moonCartCompareListUid';

// Real Magento Compare List (Magento_CompareListGraphQl — a core
// module, not something we're bolting on) — persists a guest-safe
// list uid the same way cart id is persisted, so add/remove/state
// survive reloads and are shared between the category grid and the
// standalone Compare page.
//
// Gotcha found while testing this: the schema types every mutation's
// `products` input as `[ID!]` — which reads like it wants the GraphQL
// `uid` (base64) products already carry elsewhere — but the actual
// resolvers (Magento\CompareListGraphQl\Model\Service\AddToCompareList
// and RemoveFromCompareList) cast each value with PHP's `(int)` and
// look it up as a legacy numeric product id. Passing a base64 `uid`
// silently `(int)`-casts to 0, so the mutation "succeeds" (no GraphQL
// error) but adds nothing. So every add/remove here takes the whole
// product object and sends `product.id` (the legacy int, already
// fetched by category.js's own product query) rather than `product.uid`.
const COMPARE_LIST_FRAGMENT = gql`
    fragment MoonCartCompareListFragment on CompareList {
        uid
        item_count
        items {
            uid
            product {
                id
                uid
                sku
                name
                url_key
                stock_status
                rating_summary
                __typename
                small_image {
                    url
                }
                price_range {
                    maximum_price {
                        final_price {
                            value
                            currency
                        }
                        regular_price {
                            value
                            currency
                        }
                        discount {
                            amount_off
                        }
                    }
                }
            }
        }
    }
`;

const GET_COMPARE_LIST = gql`
    query getMoonCartCompareList($uid: ID!) {
        compareList(uid: $uid) {
            ...MoonCartCompareListFragment
        }
    }
    ${COMPARE_LIST_FRAGMENT}
`;

const CREATE_COMPARE_LIST = gql`
    mutation createMoonCartCompareList($productId: ID!) {
        createCompareList(input: { products: [$productId] }) {
            ...MoonCartCompareListFragment
        }
    }
    ${COMPARE_LIST_FRAGMENT}
`;

const ADD_TO_COMPARE_LIST = gql`
    mutation addMoonCartCompareListItem($uid: ID!, $productId: ID!) {
        addProductsToCompareList(input: { uid: $uid, products: [$productId] }) {
            ...MoonCartCompareListFragment
        }
    }
    ${COMPARE_LIST_FRAGMENT}
`;

const REMOVE_FROM_COMPARE_LIST = gql`
    mutation removeMoonCartCompareListItem($uid: ID!, $productId: ID!) {
        removeProductsFromCompareList(
            input: { uid: $uid, products: [$productId] }
        ) {
            ...MoonCartCompareListFragment
        }
    }
    ${COMPARE_LIST_FRAGMENT}
`;

/**
 * Not implemented here (flagging rather than faking):
 *  - Merging a guest's compare list into their account on login —
 *    `assignCompareListToCustomer` exists in the schema but isn't
 *    wired up; each browser just keeps its own guest list.
 *  - Any max-items cap — Magento's admin-configurable limit
 *    (catalog/product_compare/list_limit) isn't exposed over GraphQL.
 *
 * `isInCompare` is keyed by the product's `uid` (the id already used
 * everywhere else in this project — wishlist, cards, ...); add/
 * remove/toggle take the full product object so they have `id`
 * available for the mutations (see the gotcha above) without every
 * call site needing to know that detail.
 */
export const useCompareList = () => {
    const [compareListUid, setCompareListUid] = useState(
        () => storage.getItem(STORAGE_KEY) || null
    );

    const { data, refetch } = useQuery(GET_COMPARE_LIST, {
        variables: { uid: compareListUid },
        skip: !compareListUid,
        fetchPolicy: 'cache-and-network'
    });

    const [createCompareList] = useMutation(CREATE_COMPARE_LIST);
    const [addProductsToCompareList] = useMutation(ADD_TO_COMPARE_LIST);
    const [removeProductsFromCompareList] = useMutation(REMOVE_FROM_COMPARE_LIST);

    const compareList = data?.compareList || null;
    const items = compareList?.items || [];
    const productUids = useMemo(
        () => new Set(items.map(item => item.product.uid)),
        [items]
    );

    const isInCompare = useCallback(
        uid => productUids.has(uid),
        [productUids]
    );

    const addToCompare = useCallback(
        async product => {
            try {
                if (!compareListUid) {
                    const { data } = await createCompareList({
                        variables: { productId: String(product.id) }
                    });
                    const newUid = data?.createCompareList?.uid;
                    if (newUid) {
                        storage.setItem(STORAGE_KEY, newUid);
                        setCompareListUid(newUid);
                    }
                } else {
                    await addProductsToCompareList({
                        variables: {
                            uid: compareListUid,
                            productId: String(product.id)
                        }
                    });
                    refetch();
                }
            } catch (e) {
                // Error surfaced via Apollo's error link toast.
            }
        },
        [compareListUid, createCompareList, addProductsToCompareList, refetch]
    );

    const removeFromCompare = useCallback(
        async product => {
            if (!compareListUid) return;
            try {
                await removeProductsFromCompareList({
                    variables: {
                        uid: compareListUid,
                        productId: String(product.id)
                    }
                });
                refetch();
            } catch (e) {
                // Error surfaced via Apollo's error link toast.
            }
        },
        [compareListUid, removeProductsFromCompareList, refetch]
    );

    const toggleCompare = useCallback(
        product => {
            if (isInCompare(product.uid)) {
                removeFromCompare(product);
            } else {
                addToCompare(product);
            }
        },
        [isInCompare, addToCompare, removeFromCompare]
    );

    return {
        items,
        itemCount: compareList?.item_count || 0,
        isInCompare,
        toggleCompare,
        removeFromCompare
    };
};

export default useCompareList;

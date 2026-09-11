/**
 * Magic MultiWishlist — Popup Knockout component.
 *
 * Initialised globally via x-magento-init (selector "*").
 * Intercepts every .action.towishlist click, shows a modal for wishlist
 * selection, and POSTs to multiwishlist/index/additem.
 */
define(['jquery', 'ko', 'mage/cookies'], function ($, ko, cookies) {
    'use strict';

    // ── helpers ──────────────────────────────────────────────────────────────

    function extractProductId($btn) {
        // Magento standard data-post attribute
        var post = $btn.data('post');
        if (post && post.data && post.data.product) {
            return String(post.data.product);
        }
        // Href pattern: /wishlist/index/add/product/123/
        var href  = $btn.attr('href') || '';
        var match = href.match(/\/product\/(\d+)/);
        if (match) { return match[1]; }
        // Custom data attribute
        return $btn.data('product-id') ? String($btn.data('product-id')) : null;
    }

    function extractProductName($btn) {
        var $scope = $btn.closest('.product-item, .product-info-main, .product-info-wrapper');
        if ($scope.length) {
            return $scope.find('.product-item-name a, h1.page-title .base').first().text().trim();
        }
        return '';
    }

    // ── module entry point ────────────────────────────────────────────────────

    return function (config) {
        var vm = {
            // State
            isOpen:        ko.observable(false),
            isLoading:     ko.observable(false),
            productId:     ko.observable(null),
            productName:   ko.observable(''),
            wishlists:     ko.observableArray(config.wishlists || []),
            newName:       ko.observable(''),
            showCreate:    ko.observable(false),
            searchQ:       ko.observable(''),
            searchResults: ko.observableArray([]),
            msg:           ko.observable(''),
            msgType:       ko.observable(''),

            // ── public methods ────────────────────────────────────────────

            open: function (productId, productName) {
                vm.productId(productId);
                vm.productName(productName || '');
                vm.msg('');
                vm.msgType('');
                vm.newName('');
                vm.showCreate(false);
                vm.searchQ('');
                vm.searchResults([]);
                vm.isOpen(true);
                $('body').addClass('mwl-modal-open');
            },

            close: function () {
                vm.isOpen(false);
                $('body').removeClass('mwl-modal-open');
            },

            toggleCreate: function () {
                vm.showCreate(!vm.showCreate());
            },

            addToWishlist: function (wishlistId) {
                if (!vm.productId() || vm.isLoading()) { return; }
                vm.isLoading(true);
                vm.msg('');

                $.post(config.addItemUrl, {
                    wishlist_id: wishlistId,
                    product_id:  vm.productId(),
                    qty:         1,
                    form_key:    cookies.get('form_key')
                }).done(function (resp) {
                    vm.msg(resp.message || '');
                    vm.msgType(resp.success ? 'success' : 'error');
                    if (resp.success) {
                        setTimeout(function () { vm.close(); }, 1400);
                    }
                }).fail(function () {
                    vm.msg('Request failed. Please try again.');
                    vm.msgType('error');
                }).always(function () {
                    vm.isLoading(false);
                });
            },

            createAndAdd: function () {
                var name = vm.newName().trim();
                if (!name || vm.isLoading()) { return; }
                vm.isLoading(true);
                vm.msg('');

                $.post(config.createUrl, {
                    wishlist_name: name,
                    form_key:      cookies.get('form_key')
                }).done(function (resp) {
                    if (resp.success) {
                        vm.wishlists.push({
                            wishlist_id:   resp.wishlist_id,
                            wishlist_name: resp.wishlist_name,
                            is_default:    0
                        });
                        vm.newName('');
                        vm.showCreate(false);
                        vm.addToWishlist(resp.wishlist_id);
                    } else {
                        vm.msg(resp.message || 'Could not create wishlist.');
                        vm.msgType('error');
                        vm.isLoading(false);
                    }
                }).fail(function () {
                    vm.msg('Request failed.');
                    vm.msgType('error');
                    vm.isLoading(false);
                });
            },

            doSearch: function () {
                var q = vm.searchQ().trim();
                if (q.length < 2) { vm.searchResults([]); return; }

                $.get(config.searchUrl, { q: q, form_key: cookies.get('form_key') })
                    .done(function (resp) {
                        if (resp.success) { vm.searchResults(resp.items || []); }
                    });
            },

            selectProduct: function (item) {
                vm.productId(String(item.product_id));
                vm.productName(item.name);
                vm.searchQ('');
                vm.searchResults([]);
            }
        };

        // Apply KO bindings to the popup root element
        var popupEl = document.getElementById('mwl-popup');
        if (popupEl) {
            ko.applyBindings(vm, popupEl);
        }

        // Debounced search
        var searchTimer = null;
        vm.searchQ.subscribe(function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () { vm.doSearch(); }, 380);
        });

        // Close on overlay background click
        $(document).on('click', '#mwl-popup', function (e) {
            if ($(e.target).is('#mwl-popup')) {
                vm.close();
            }
        });

        // Close on Esc key
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && vm.isOpen()) { vm.close(); }
        });

        // ── Intercept every "Add to Wishlist" button on the page ─────────
        $(document).on('click', '.action.towishlist', function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var productId   = extractProductId($(this));
            var productName = extractProductName($(this));

            if (productId) {
                vm.open(productId, productName);
            }
        });
    };
});

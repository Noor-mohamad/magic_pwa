define(['jquery', 'mage/cookies'], function ($) {
    'use strict';

    $.widget('magic.wishlistActions', {
        options: {
            wishlistId:    null,
            indexUrl:      '',
            moveItemUrl:   '',
            copyItemUrl:   '',
            moveAllUrl:    '',
            copyAllUrl:    '',
            updateItemUrl: ''
        },

        _create: function () {
            this._bindEvents();
        },

        _bindEvents: function () {
            var self = this;

            // Toggle inline edit mode
            this.element.on('click', '.mwl-edit-toggle', function (e) {
                e.preventDefault();
                var row = $(this).closest('.mwl-item-row');
                row.find('.mwl-display').hide();
                row.find('.mwl-edit-field').show();
                row.find('.mwl-normal-actions').hide();
                row.find('.mwl-edit-actions').show();
            });

            // Cancel inline edit
            this.element.on('click', '.mwl-cancel-edit', function (e) {
                e.preventDefault();
                var row = $(this).closest('.mwl-item-row');
                row.find('.mwl-display').show();
                row.find('.mwl-edit-field').hide();
                row.find('.mwl-normal-actions').show();
                row.find('.mwl-edit-actions').hide();
            });

            // Save item (qty + comment)
            this.element.on('click', '.mwl-save-edit', function (e) {
                e.preventDefault();
                var row    = $(this).closest('.mwl-item-row');
                var itemId = row.data('item-id');
                var qty    = row.find('.mwl-qty-input').val();
                var comment = row.find('.mwl-comment-input').val();
                self._post(self.options.updateItemUrl, {
                    item_id: itemId,
                    qty:     qty,
                    comment: comment
                }, function (resp) {
                    if (resp.success) {
                        window.location.reload();
                    } else {
                        alert(resp.message || 'Error updating item.');
                    }
                });
            });

            // Move single item
            this.element.on('click', '.mwl-move-btn', function () {
                var btn      = $(this);
                var targetId = btn.siblings('.mwl-move-select').val();
                var itemId   = btn.data('item-id');
                if (!targetId) { return; }
                self._post(self.options.moveItemUrl, {
                    item_id:          itemId,
                    target_wishlist_id: targetId
                }, function (resp) {
                    if (resp.success) { window.location.reload(); }
                    else { alert(resp.message || 'Error moving item.'); }
                });
            });

            // Copy single item
            this.element.on('click', '.mwl-copy-btn', function () {
                var btn      = $(this);
                var targetId = btn.siblings('.mwl-copy-select').val();
                var itemId   = btn.data('item-id');
                if (!targetId) { return; }
                self._post(self.options.copyItemUrl, {
                    item_id:          itemId,
                    target_wishlist_id: targetId
                }, function (resp) {
                    if (resp.success) { window.location.reload(); }
                    else { alert(resp.message || 'Error copying item.'); }
                });
            });

            // Move all items to another wishlist
            this.element.on('click', '#mwl-move-all-btn', function () {
                var targetId = $('#mwl-move-all-select').val();
                if (!targetId) { return; }
                if (!confirm('Move all items to the selected wishlist?')) { return; }
                self._post(self.options.moveAllUrl, {
                    source_wishlist_id: self.options.wishlistId,
                    target_wishlist_id: targetId
                }, function (resp) {
                    if (resp.success) { window.location.href = self.options.indexUrl; }
                    else { alert(resp.message || 'Error moving items.'); }
                });
            });

            // Copy all items to another wishlist
            this.element.on('click', '#mwl-copy-all-btn', function () {
                var targetId = $('#mwl-copy-all-select').val();
                if (!targetId) { return; }
                self._post(self.options.copyAllUrl, {
                    source_wishlist_id: self.options.wishlistId,
                    target_wishlist_id: targetId
                }, function (resp) {
                    if (resp.success) { window.location.reload(); }
                    else { alert(resp.message || 'Error copying items.'); }
                });
            });
        },

        _post: function (actionUrl, data, callback) {
            data.form_key = $.mage.cookies.get('form_key');
            $.post(actionUrl, data)
                .done(callback)
                .fail(function () {
                    alert('Request failed. Please try again.');
                });
        }
    });

    return $.magic.wishlistActions;
});

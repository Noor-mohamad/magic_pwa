<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Model\ResourceModel\WishlistItem;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;
use Magic\MultiWishlist\Model\WishlistItem;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem as WishlistItemResource;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'item_id';

    protected function _construct(): void
    {
        $this->_init(WishlistItem::class, WishlistItemResource::class);
    }
}

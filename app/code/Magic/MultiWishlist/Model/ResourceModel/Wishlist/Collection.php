<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Model\ResourceModel\Wishlist;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;
use Magic\MultiWishlist\Model\Wishlist;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'wishlist_id';

    protected function _construct(): void
    {
        $this->_init(Wishlist::class, WishlistResource::class);
    }
}

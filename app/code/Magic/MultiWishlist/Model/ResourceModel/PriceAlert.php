<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class PriceAlert extends AbstractDb
{
    protected function _construct(): void
    {
        $this->_init('magic_wishlist_price_alert', 'alert_id');
    }
}

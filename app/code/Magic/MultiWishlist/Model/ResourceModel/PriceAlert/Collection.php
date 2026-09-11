<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Model\ResourceModel\PriceAlert;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;
use Magic\MultiWishlist\Model\PriceAlert;
use Magic\MultiWishlist\Model\ResourceModel\PriceAlert as PriceAlertResource;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'alert_id';

    protected function _construct(): void
    {
        $this->_init(PriceAlert::class, PriceAlertResource::class);
    }
}

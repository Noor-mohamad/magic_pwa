<?php

namespace Indglobal\SilentOffer\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuInterface;

class SilentOfferSku extends AbstractDb
{
    /**
     * Define main table and primary key
     */
    protected function _construct()
    {
        $this->_init(SilentOfferSkuInterface::TABLE_NAME, SilentOfferSkuInterface::ENTITY_ID);
    }
}

<?php

namespace Indglobal\SilentOffer\Model\ResourceModel\SilentOfferSku;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;
use Indglobal\SilentOffer\Model\SilentOfferSku;
use Indglobal\SilentOffer\Model\ResourceModel\SilentOfferSku as SilentOfferSkuResource;

class Collection extends AbstractCollection
{
    /**
     * Initialize collection
     */
    protected function _construct()
    {
        $this->_init(SilentOfferSku::class, SilentOfferSkuResource::class);
    }
}

<?php

namespace Indglobal\SilentOffer\Model;

use Magento\Framework\Model\AbstractModel;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuInterface;

class SilentOfferSku extends AbstractModel implements SilentOfferSkuInterface
{
    /**
     * Define resource model
     */
    protected function _construct()
    {
        $this->_init(\Indglobal\SilentOffer\Model\ResourceModel\SilentOfferSku::class);
    }

    public function getEntityId()
    {
        return $this->getData(self::ENTITY_ID);
    }

    public function setEntityId($entityId)
    {
        return $this->setData(self::ENTITY_ID, $entityId);
    }

    public function getBrandTitle()
    {
        return $this->getData(self::BRAND_TITLE);
    }

    public function setBrandTitle($brandTitle)
    {
        return $this->setData(self::BRAND_TITLE, $brandTitle);
    }

    public function getSku()
    {
        return $this->getData(self::SKU);
    }

    public function setSku($sku)
    {
        return $this->setData(self::SKU, $sku);
    }

    public function getDateFrom()
    {
        return $this->getData(self::DATE_FROM);
    }

    public function setDateFrom($dateFrom)
    {
        return $this->setData(self::DATE_FROM, $dateFrom);
    }

    public function getDateTo()
    {
        return $this->getData(self::DATE_TO);
    }

    public function setDateTo($dateTo)
    {
        return $this->setData(self::DATE_TO, $dateTo);
    }

    public function getCreatedAt()
    {
        return $this->getData(self::CREATED_AT);
    }

    public function setCreatedAt($createdAt)
    {
        return $this->setData(self::CREATED_AT, $createdAt);
    }

    public function getUpdatedAt()
    {
        return $this->getData(self::UPDATED_AT);
    }

    public function setUpdatedAt($updatedAt)
    {
        return $this->setData(self::UPDATED_AT, $updatedAt);
    }
}

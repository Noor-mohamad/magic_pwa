<?php

namespace Magic\ParentChildMapping\Model;

use Magic\ParentChildMapping\Api\Data\ParentChildInterface;
use Magento\Framework\Model\AbstractModel;

class ParentChild extends AbstractModel implements ParentChildInterface
{
    protected function _construct()
    {
        $this->_init(\Magic\ParentChildMapping\Model\ResourceModel\ParentChild::class);
    }

    public function getParentSku()
    {
        return $this->getData(self::PARENT_SKU);
    }

    public function setParentSku($v)
    {
        return $this->setData(self::PARENT_SKU, $v);
    }

    public function getChildSku()
    {
        return $this->getData(self::CHILD_SKU);
    }

    public function setChildSku($v)
    {
        return $this->setData(self::CHILD_SKU, $v);
    }

    public function getSpecialPrice()
    {
        return $this->getData(self::SPECIAL_PRICE);
    }

    public function setSpecialPrice($v)
    {
        return $this->setData(self::SPECIAL_PRICE, $v);
    }

    public function getFromDate()
    {
        return $this->getData(self::FROM_DATE);
    }

    public function setFromDate($v)
    {
        return $this->setData(self::FROM_DATE, $v);
    }

    public function getToDate()
    {
        return $this->getData(self::TO_DATE);
    }

    public function setToDate($v)
    {
        return $this->setData(self::TO_DATE, $v);
    }

    public function getUpdatePriceFlag()
    {
        return $this->getData(self::UPDATE_PRICE_FLAG);
    }

    public function setUpdatePriceFlag($v)
    {
        return $this->setData(self::UPDATE_PRICE_FLAG, $v);
    }

    public function getCreatedAt()
    {
        return $this->getData(self::CREATED_AT);
    }

    public function getUpdatedAt()
    {
        return $this->getData(self::UPDATED_AT);
    }
}

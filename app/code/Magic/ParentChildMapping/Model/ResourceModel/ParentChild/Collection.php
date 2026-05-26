<?php
namespace Magic\ParentChildMapping\Model\ResourceModel\ParentChild;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;
use Magic\ParentChildMapping\Model\ParentChild;
use Magic\ParentChildMapping\Model\ResourceModel\ParentChild as ParentChildResource;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'id';

    protected function _construct()
    {
        $this->_init(ParentChild::class, ParentChildResource::class);
    }
}

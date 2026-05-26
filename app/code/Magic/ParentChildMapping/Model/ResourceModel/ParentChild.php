<?php
namespace Magic\ParentChildMapping\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class ParentChild extends AbstractDb
{
    protected function _construct()
    {
        $this->_init('childsku_mapping', 'id');
    }
}

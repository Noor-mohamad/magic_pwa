<?php
namespace Magic\ParentChildMapping\Controller\Adminhtml\Index;

use Magic\ParentChildMapping\Controller\Adminhtml\AbstractController;

class Index extends AbstractController
{
    public function execute()
    {
        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('Magic_ParentChildMapping::parentchild');
        $resultPage->getConfig()->getTitle()->prepend(__('Parent Child SKU Mapping'));
        return $resultPage;
    }
}

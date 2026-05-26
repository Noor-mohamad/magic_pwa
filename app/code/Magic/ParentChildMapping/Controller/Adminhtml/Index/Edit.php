<?php
namespace Magic\ParentChildMapping\Controller\Adminhtml\Index;

use Magic\ParentChildMapping\Controller\Adminhtml\AbstractController;

class Edit extends AbstractController
{
    public function execute()
    {
        $id         = $this->getRequest()->getParam('id');
        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('Magic_ParentChildMapping::parentchild');

        if ($id) {
            $resultPage->getConfig()->getTitle()->prepend(__('Edit Mapping #%1', $id));
        } else {
            $resultPage->getConfig()->getTitle()->prepend(__('New Mapping'));
        }

        return $resultPage;
    }
}

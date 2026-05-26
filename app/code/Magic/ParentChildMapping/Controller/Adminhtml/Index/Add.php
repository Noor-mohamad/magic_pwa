<?php
namespace Magic\ParentChildMapping\Controller\Adminhtml\Index;

use Magic\ParentChildMapping\Controller\Adminhtml\AbstractController;

class Add extends AbstractController
{
    public function execute()
    {
        return $this->resultForwardFactory->create()->forward('edit');
    }
}

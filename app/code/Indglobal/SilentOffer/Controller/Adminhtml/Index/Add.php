<?php

namespace Indglobal\SilentOffer\Controller\Adminhtml\Index;

use Magento\Backend\Model\View\Result\Forward;
use Indglobal\SilentOffer\Controller\Adminhtml\AbstractSilentOfferSku;

/**
 * Class Add
 * @package Indglobal\SilentOffer\Controller\Adminhtml\Index
 */
class Add extends AbstractSilentOfferSku
{
    /**
     * Forward to edit
     *
     * @return Forward
     */
    public function execute()
    {
        $resultForward = $this->resultForwardFactory->create();
        return $resultForward->forward('edit');
    }
}

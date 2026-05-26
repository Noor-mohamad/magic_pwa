<?php

namespace Indglobal\SilentOffer\Controller\Adminhtml\Index;

use Magento\Framework\View\Result\Page;
use Indglobal\SilentOffer\Controller\Adminhtml\AbstractSilentOfferSku;

/**
 * Class Index
 * @package Indglobal\SilentOffer\Controller\Adminhtml\Index
 */
class Index extends AbstractSilentOfferSku
{
    /**
     * @return Page
     */
    public function execute()
    {
        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('Indglobal_SilentOffer::silentoffer')
            ->addBreadcrumb(__('Silent Offer Sku'), __('Silent Offer Sku'))
            ->addBreadcrumb(__('Manage Silent Offer Sku'), __('Manage Silent Offer Sku'));
        $resultPage->getConfig()->getTitle()->prepend(
            __("Silent Offer Sku")
        );
        return $resultPage;
    }
}

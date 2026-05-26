<?php

namespace Indglobal\SilentOffer\Controller\Adminhtml\Index;

use Magento\Framework\View\Result\Page;
use Indglobal\SilentOffer\Controller\Adminhtml\AbstractSilentOfferSku;

/**
 * Class Edit
 * @package Indglobal\SilentOffer\Controller\Adminhtml\Index
 */
class Edit extends AbstractSilentOfferSku
{
    /**
     * @return Page
     */
    public function execute()
    {
        $dataId = $this->getRequest()->getParam('id');
        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('Indglobal_SilentOffer::silentoffer')
            ->addBreadcrumb(__('Silent Offer Sku'), __('Silent Offer Sku'))
            ->addBreadcrumb(__('Manage Silent Offer Sku'), __('Manage Silent Offer Sku'));

        if ($dataId === null) {
            $resultPage->addBreadcrumb(__('New Silent Offer Sku'), __('New Silent Offer Sku'));
            $resultPage->getConfig()->getTitle()->prepend(__('New Silent Offer Sku'));
        } else {
            $resultPage->addBreadcrumb(__('Edit Silent Offer Sku'), __('Edit Silent Offer Sku'));
            $resultPage->getConfig()->getTitle()->prepend(
                $this->dataRepository->getById($dataId)->getBrandTitle()
            );
        }
        return $resultPage;
    }
}

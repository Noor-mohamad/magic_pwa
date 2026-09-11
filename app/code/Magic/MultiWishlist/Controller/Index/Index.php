<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\View\Result\Page;
use Magento\Framework\View\Result\PageFactory;

class Index extends AbstractAction
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly PageFactory $pageFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Page
    {
        $page = $this->pageFactory->create();
        $page->getConfig()->getTitle()->set(__('My Wishlists'));
        return $page;
    }
}

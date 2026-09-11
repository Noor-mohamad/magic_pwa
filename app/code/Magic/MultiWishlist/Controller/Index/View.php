<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\View\Result\Page;
use Magento\Framework\View\Result\PageFactory;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\WishlistFactory;

class View extends AbstractAction
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly PageFactory $pageFactory,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Page|Redirect
    {
        $wishlistId = (int) $this->getRequest()->getParam('wishlist_id');
        $wishlist   = $this->wishlistFactory->create();
        $this->wishlistResource->load($wishlist, $wishlistId);

        if (!$wishlist->getId() || $wishlist->getCustomerId() !== $this->getCustomerId()) {
            $this->messageManager->addErrorMessage(__('Wishlist not found.'));
            return $this->resultRedirectFactory->create()->setPath('multiwishlist');
        }

        $page = $this->pageFactory->create();
        $page->getConfig()->getTitle()->set(__($wishlist->getWishlistName()));
        return $page;
    }
}

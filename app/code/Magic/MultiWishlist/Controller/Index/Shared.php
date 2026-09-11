<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Controller\Result\RedirectFactory;
use Magento\Framework\Message\ManagerInterface as MessageManager;
use Magento\Framework\View\Result\Page;
use Magento\Framework\View\Result\PageFactory;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\CollectionFactory as WishlistCollectionFactory;

class Shared implements HttpGetActionInterface
{
    public function __construct(
        private readonly RequestInterface $request,
        private readonly PageFactory $pageFactory,
        private readonly RedirectFactory $redirectFactory,
        private readonly MessageManager $messageManager,
        private readonly WishlistCollectionFactory $wishlistCollectionFactory
    ) {}

    public function execute(): Page|Redirect
    {
        $code = trim((string) $this->request->getParam('code'));

        if ($code === '') {
            return $this->notFound();
        }

        $collection = $this->wishlistCollectionFactory->create()
            ->addFieldToFilter('sharing_code', $code)
            ->addFieldToFilter('shared', 1)
            ->setPageSize(1);

        if ($collection->getSize() === 0) {
            return $this->notFound();
        }

        $wishlist = $collection->getFirstItem();
        $page     = $this->pageFactory->create();
        $page->getConfig()->getTitle()->set(__('Shared Wishlist: %1', $wishlist->getWishlistName()));
        return $page;
    }

    private function notFound(): Redirect
    {
        $this->messageManager->addErrorMessage(__('This shared wishlist is no longer available.'));
        return $this->redirectFactory->create()->setPath('/');
    }
}

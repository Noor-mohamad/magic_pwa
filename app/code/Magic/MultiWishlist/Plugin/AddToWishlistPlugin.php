<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Plugin;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Controller\Result\RedirectFactory;
use Magento\Framework\Message\ManagerInterface as MessageManager;
use Magento\Framework\UrlInterface;
use Magento\Wishlist\Controller\Index\Add as CoreAdd;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\CollectionFactory as WishlistCollectionFactory;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem as WishlistItemResource;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem\CollectionFactory as ItemCollectionFactory;
use Magic\MultiWishlist\Model\WishlistItemFactory;

/**
 * Intercepts core "Add to Wishlist" so non-JS requests add to the customer's
 * default multi-wishlist instead of Magento's built-in single wishlist.
 * JS-triggered requests are handled client-side by wishlist-popup.js.
 */
class AddToWishlistPlugin
{
    public function __construct(
        private readonly CustomerSession $customerSession,
        private readonly WishlistCollectionFactory $collectionFactory,
        private readonly WishlistItemFactory $itemFactory,
        private readonly WishlistItemResource $itemResource,
        private readonly ItemCollectionFactory $itemCollectionFactory,
        private readonly RedirectFactory $redirectFactory,
        private readonly MessageManager $messageManager,
        private readonly UrlInterface $urlBuilder
    ) {}

    public function aroundExecute(CoreAdd $subject, callable $proceed): Redirect
    {
        // Let core handle unauthenticated requests (will redirect to login)
        if (!$this->customerSession->isLoggedIn()) {
            return $proceed();
        }

        $productId = (int) $subject->getRequest()->getParam('product');
        if (!$productId) {
            return $proceed();
        }

        // Find customer's default multi-wishlist
        $defaultWishlist = $this->collectionFactory->create()
            ->addFieldToFilter('customer_id', $this->customerSession->getCustomerId())
            ->addFieldToFilter('is_default', 1)
            ->setPageSize(1)
            ->getFirstItem();

        if (!$defaultWishlist->getId()) {
            // Default wishlist doesn't exist yet — let core handle this edge case
            return $proceed();
        }

        $wishlistId = (int) $defaultWishlist->getId();

        // Prevent duplicate entries in the same wishlist
        $existing = $this->itemCollectionFactory->create()
            ->addFieldToFilter('wishlist_id', $wishlistId)
            ->addFieldToFilter('product_id', $productId)
            ->setPageSize(1);

        if ($existing->getSize() > 0) {
            $this->messageManager->addNoticeMessage(
                __('This product is already in your wishlist.')
            );
        } else {
            try {
                $item = $this->itemFactory->create();
                $item->setWishlistId($wishlistId);
                $item->setProductId($productId);
                $item->setQty(1.0);
                $this->itemResource->save($item);
                $this->messageManager->addSuccessMessage(
                    __('Product has been added to your wishlist.')
                );
            } catch (\Exception) {
                $this->messageManager->addErrorMessage(
                    __('Could not add product to wishlist.')
                );
            }
        }

        // Redirect back to referring page (product page, category, etc.)
        $referer = $subject->getRequest()->getHeader('Referer');
        $redirectUrl = $referer ?: $this->urlBuilder->getUrl('multiwishlist');

        return $this->redirectFactory->create()->setUrl($redirectUrl);
    }
}

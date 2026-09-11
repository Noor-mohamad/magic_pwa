<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\Result\Redirect;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem as WishlistItemResource;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem\CollectionFactory as ItemCollectionFactory;
use Magic\MultiWishlist\Model\WishlistFactory;

class Delete extends AbstractAction
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly ItemCollectionFactory $itemCollectionFactory,
        private readonly WishlistItemResource $itemResource,
        private readonly JsonFactory $jsonFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json|Redirect
    {
        $wishlistId = (int) $this->getRequest()->getParam('wishlist_id');
        $wishlist   = $this->wishlistFactory->create();
        $this->wishlistResource->load($wishlist, $wishlistId);

        if (!$wishlist->getId() || $wishlist->getCustomerId() !== $this->getCustomerId()) {
            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData(['success' => false, 'message' => (string) __('Wishlist not found.')]);
            }
            $this->messageManager->addErrorMessage(__('Wishlist not found.'));
            return $this->resultRedirectFactory->create()->setPath('multiwishlist');
        }

        if ($wishlist->getIsDefault()) {
            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData(['success' => false, 'message' => (string) __('Cannot delete your default wishlist.')]);
            }
            $this->messageManager->addErrorMessage(__('Cannot delete your default wishlist.'));
            return $this->resultRedirectFactory->create()->setPath('multiwishlist');
        }

        try {
            $items = $this->itemCollectionFactory->create()->addFieldToFilter('wishlist_id', $wishlistId);
            foreach ($items as $item) {
                $this->itemResource->delete($item);
            }
            $this->wishlistResource->delete($wishlist);

            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData(['success' => true, 'message' => (string) __('Wishlist deleted.')]);
            }
            $this->messageManager->addSuccessMessage(__('Wishlist has been deleted.'));
        } catch (\Exception) {
            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData(['success' => false, 'message' => (string) __('Could not delete wishlist.')]);
            }
            $this->messageManager->addErrorMessage(__('Could not delete wishlist.'));
        }

        return $this->resultRedirectFactory->create()->setPath('multiwishlist');
    }
}

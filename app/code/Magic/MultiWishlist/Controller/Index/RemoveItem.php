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
use Magic\MultiWishlist\Model\WishlistFactory;
use Magic\MultiWishlist\Model\WishlistItemFactory;

class RemoveItem extends AbstractAction
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistItemFactory $itemFactory,
        private readonly WishlistItemResource $itemResource,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly JsonFactory $jsonFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json|Redirect
    {
        $itemId = (int) $this->getRequest()->getParam('item_id');

        $item = $this->itemFactory->create();
        $this->itemResource->load($item, $itemId);

        if (!$item->getId()) {
            return $this->errorResponse('Item not found.', null);
        }

        // Verify the item's wishlist belongs to this customer
        $wishlist = $this->wishlistFactory->create();
        $this->wishlistResource->load($wishlist, $item->getWishlistId());

        if (!$wishlist->getId() || $wishlist->getCustomerId() !== $this->getCustomerId()) {
            return $this->errorResponse('Item not found.', null);
        }

        $wishlistId = $wishlist->getId();

        try {
            $this->itemResource->delete($item);

            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData([
                    'success' => true,
                    'message' => (string) __('Item has been removed.'),
                ]);
            }
            $this->messageManager->addSuccessMessage(__('Item has been removed from your wishlist.'));
        } catch (\Exception) {
            return $this->errorResponse('Could not remove item.', $wishlistId);
        }

        return $this->resultRedirectFactory->create()->setPath(
            'multiwishlist/index/view',
            ['wishlist_id' => $wishlistId]
        );
    }

    private function errorResponse(string $message, ?int $wishlistId): Json|Redirect
    {
        if ($this->getRequest()->isAjax()) {
            return $this->jsonFactory->create()->setData(['success' => false, 'message' => (string) __($message)]);
        }
        $this->messageManager->addErrorMessage(__($message));
        $path = $wishlistId
            ? ['multiwishlist/index/view', ['wishlist_id' => $wishlistId]]
            : ['multiwishlist'];
        return $this->resultRedirectFactory->create()->setPath(...$path);
    }
}

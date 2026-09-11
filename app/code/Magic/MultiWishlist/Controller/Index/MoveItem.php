<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\Result\Redirect;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem as WishlistItemResource;
use Magic\MultiWishlist\Model\WishlistFactory;
use Magic\MultiWishlist\Model\WishlistItemFactory;

class MoveItem extends AbstractAction implements HttpPostActionInterface
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
        $itemId         = (int) $this->getRequest()->getParam('item_id');
        $targetWishlistId = (int) $this->getRequest()->getParam('target_wishlist_id');

        $item = $this->itemFactory->create();
        $this->itemResource->load($item, $itemId);

        if (!$item->getId()) {
            return $this->jsonResponse(false, 'Item not found.');
        }

        // Verify source wishlist ownership
        $source = $this->wishlistFactory->create();
        $this->wishlistResource->load($source, $item->getWishlistId());
        if (!$source->getId() || $source->getCustomerId() !== $this->getCustomerId()) {
            return $this->jsonResponse(false, 'Item not found.');
        }

        // Verify target wishlist ownership
        $target = $this->wishlistFactory->create();
        $this->wishlistResource->load($target, $targetWishlistId);
        if (!$target->getId() || $target->getCustomerId() !== $this->getCustomerId()) {
            return $this->jsonResponse(false, 'Target wishlist not found.');
        }

        if ($source->getId() === $target->getId()) {
            return $this->jsonResponse(false, 'Source and target wishlists are the same.');
        }

        try {
            // Create copy in target
            $newItem = $this->itemFactory->create();
            $newItem->setWishlistId((int) $target->getId());
            $newItem->setProductId($item->getProductId());
            $newItem->setQty($item->getQty());
            $newItem->setComment($item->getComment());
            $this->itemResource->save($newItem);

            // Delete from source
            $this->itemResource->delete($item);

            if ($this->getRequest()->isAjax()) {
                return $this->jsonResponse(true, 'Item moved successfully.');
            }
            $this->messageManager->addSuccessMessage(__('Item has been moved.'));
        } catch (\Exception) {
            return $this->jsonResponse(false, 'Could not move item.');
        }

        return $this->resultRedirectFactory->create()->setPath(
            'multiwishlist/index/view',
            ['wishlist_id' => $source->getId()]
        );
    }

    private function jsonResponse(bool $success, string $message): Json
    {
        return $this->jsonFactory->create()->setData([
            'success' => $success,
            'message' => (string) __($message),
        ]);
    }
}

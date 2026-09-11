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
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem\CollectionFactory as ItemCollectionFactory;
use Magic\MultiWishlist\Model\WishlistFactory;
use Magic\MultiWishlist\Model\WishlistItemFactory;

class CopyAll extends AbstractAction implements HttpPostActionInterface
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly WishlistItemFactory $itemFactory,
        private readonly WishlistItemResource $itemResource,
        private readonly ItemCollectionFactory $itemCollectionFactory,
        private readonly JsonFactory $jsonFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json|Redirect
    {
        $sourceId = (int) $this->getRequest()->getParam('source_wishlist_id');
        $targetId = (int) $this->getRequest()->getParam('target_wishlist_id');

        $source = $this->wishlistFactory->create();
        $this->wishlistResource->load($source, $sourceId);
        if (!$source->getId() || $source->getCustomerId() !== $this->getCustomerId()) {
            return $this->jsonResponse(false, 'Source wishlist not found.');
        }

        $target = $this->wishlistFactory->create();
        $this->wishlistResource->load($target, $targetId);
        if (!$target->getId() || $target->getCustomerId() !== $this->getCustomerId()) {
            return $this->jsonResponse(false, 'Target wishlist not found.');
        }

        if ($sourceId === $targetId) {
            return $this->jsonResponse(false, 'Source and target wishlists are the same.');
        }

        try {
            // Load existing product IDs in target to skip duplicates
            $targetItems      = $this->itemCollectionFactory->create()->addFieldToFilter('wishlist_id', $targetId);
            $existingInTarget = [];
            foreach ($targetItems as $ti) {
                $existingInTarget[$ti->getProductId()] = true;
            }

            $sourceItems = $this->itemCollectionFactory->create()->addFieldToFilter('wishlist_id', $sourceId);
            foreach ($sourceItems as $item) {
                if (isset($existingInTarget[$item->getProductId()])) {
                    continue;
                }
                $newItem = $this->itemFactory->create();
                $newItem->setWishlistId($targetId);
                $newItem->setProductId($item->getProductId());
                $newItem->setQty($item->getQty());
                $newItem->setComment($item->getComment());
                $this->itemResource->save($newItem);
            }

            if ($this->getRequest()->isAjax()) {
                return $this->jsonResponse(true, 'All items copied successfully.');
            }
            $this->messageManager->addSuccessMessage(__('All items have been copied.'));
        } catch (\Exception) {
            return $this->jsonResponse(false, 'Could not copy items.');
        }

        return $this->resultRedirectFactory->create()->setPath(
            'multiwishlist/index/view',
            ['wishlist_id' => $sourceId]
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
